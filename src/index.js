export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // ========== 创建（新增短码） ==========
    if (request.method === 'POST' && pathname === '/api/create') {
      const form = await request.formData()
      const code = form.get('code')?.trim()
      const targetUrl = form.get('url')?.trim()

      if (!code || !targetUrl) {
        return new Response(JSON.stringify({ error: '短码和URL不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // 检查是否存在
      const { results } = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
        .bind(code)
        .all()

      if (results.length > 0) {
        return new Response(JSON.stringify({ error: '短码已存在，请使用 update 接口修改' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await env.DB.prepare('INSERT INTO links (code, url) VALUES (?, ?)').bind(code, targetUrl).run()

      return new Response(JSON.stringify({ code, url: targetUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ========== 更新（修改已有短码对应链接） ==========
    if (request.method === 'POST' && pathname === '/api/update') {
      const form = await request.formData()
      const code = form.get('code')?.trim()
      const newUrl = form.get('url')?.trim()

      if (!code || !newUrl) {
        return new Response(JSON.stringify({ error: '短码和新 URL 不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const { results } = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
        .bind(code)
        .all()

      if (results.length === 0) {
        return new Response(JSON.stringify({ error: '短码不存在，无法更新' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await env.DB.prepare('UPDATE links SET url = ? WHERE code = ?').bind(newUrl, code).run()

      return new Response(JSON.stringify({ code, url: newUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ========== 删除 ==========
    if (request.method === 'POST' && pathname === '/api/delete') {
      const form = await request.formData()
      const code = form.get('code')?.trim()

      if (!code) {
        return new Response(JSON.stringify({ error: '缺少短码' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await env.DB.prepare('DELETE FROM links WHERE code = ?').bind(code).run()

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ========== 查询全部 ==========
    if (request.method === 'GET' && pathname === '/api/list') {
      const { results } = await env.DB.prepare('SELECT * FROM links ORDER BY code ASC').all()
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 访问首页 → 返回 ui.html
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(url.origin + '/ui.html'))
    }

    // ========== 跳转短码 ==========
    const code = pathname.slice(1)
    if (code) {
      const { results } = await env.DB.prepare('SELECT url FROM links WHERE code = ?')
        .bind(code)
        .all()

      if (results.length > 0) {
        return Response.redirect(results[0].url, 302)
      } else {
        return new Response('短码不存在', { status: 404 })
      }
    }

    return new Response('Bad Request', { status: 400 })
  },
}
