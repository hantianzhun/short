// API 处理函数
async function handleApi(request, env) {
  try {
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
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // 检查是否存在
      const result = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
        .bind(code)
        .all()

      if (result.results && result.results.length > 0) {
        return new Response(JSON.stringify({ error: '短码已存在，请使用 update 接口修改' }), {
          status: 409,
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      await env.DB.prepare('INSERT INTO links (code, url) VALUES (?, ?)').bind(code, targetUrl).run()

      return new Response(JSON.stringify({ code, url: targetUrl }), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
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
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const result = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
        .bind(code)
        .all()

      if (!result.results || result.results.length === 0) {
        return new Response(JSON.stringify({ error: '短码不存在，无法更新' }), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      await env.DB.prepare('UPDATE links SET url = ? WHERE code = ?').bind(newUrl, code).run()

      return new Response(JSON.stringify({ code, url: newUrl }), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ========== 删除 ==========
    if (request.method === 'POST' && pathname === '/api/delete') {
      const form = await request.formData()
      const code = form.get('code')?.trim()

      if (!code) {
        return new Response(JSON.stringify({ error: '缺少短码' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      await env.DB.prepare('DELETE FROM links WHERE code = ?').bind(code).run()

      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ========== 查询全部 ==========
    if (request.method === 'GET' && pathname === '/api/list') {
      const result = await env.DB.prepare('SELECT * FROM links ORDER BY code ASC').all()
      return new Response(JSON.stringify(result.results || []), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // 未匹配的 API 路径
    return new Response(JSON.stringify({ error: 'API 路径不存在' }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: '服务器错误: ' + error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// 短码跳转处理函数
async function handleRedirect(request, env) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    const code = pathname.slice(1) // 移除开头的 /

    if (!code) {
      return new Response('路径不存在', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const result = await env.DB.prepare('SELECT url FROM links WHERE code = ?')
      .bind(code)
      .all()

    if (result.results && result.results.length > 0) {
      return Response.redirect(result.results[0].url, 302)
    } else {
      return new Response('短码不存在', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  } catch (error) {
    console.error('Redirect Error:', error)
    return new Response('服务器错误: ' + error.message, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

export default {
  async fetch(request, env) {
    try {
      // 检查数据库绑定
      if (!env.DB) {
        console.error('DB binding not found')
        return new Response('数据库未配置', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      const url = new URL(request.url)
      const pathname = url.pathname

      // API 路由
      if (pathname.startsWith('/api/')) {
        return await handleApi(request, env)
      }

      // 首页：重定向到 ui.html
      if (pathname === '/' || pathname === '') {
        return Response.redirect('/ui.html', 302)
      }

      // 静态文件路径，让 Cloudflare assets 自动处理
      // 如果路径包含文件扩展名（如 .html, .css, .js），不当作短码处理
      if (pathname.includes('.') && !pathname.startsWith('/api/')) {
        // 让 Cloudflare 的 assets 配置处理，如果文件不存在会继续执行到这里
        // 这里返回 404，让 assets 处理失败时能明确提示
        return new Response('静态文件未找到', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      // 短码跳转处理
      return await handleRedirect(request, env)
    } catch (error) {
      console.error('Main Error:', error)
      return new Response('服务器错误: ' + error.message, {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  },
}
