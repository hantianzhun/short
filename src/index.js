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

      // 检查是否为保留路径（与静态文件或 API 路径冲突）
      const reservedPaths = ['ui', 'api', 'ui.html', 'error', 'error.html']
      if (reservedPaths.includes(code.toLowerCase())) {
        return new Response(JSON.stringify({ error: `短码 "${code}" 为保留路径，无法使用。请使用其他短码。` }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // 检查是否包含特殊字符或扩展名（可能与静态文件冲突）
      if (code.includes('.') || code.includes('/') || code.includes('\\')) {
        return new Response(JSON.stringify({ error: '短码不能包含 . / \\ 等特殊字符' }), {
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
      // 重定向到错误页面，传递短码参数
      const errorUrl = new URL('/error.html', request.url)
      errorUrl.searchParams.set('code', code)
      return Response.redirect(errorUrl.toString(), 302)
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
      return env.ASSETS.fetch(
        new Request(new URL('/ui.html', request.url))
      )
    }

      // 静态文件路径（包含扩展名的路径）
      // 如果静态文件存在，Cloudflare assets 会自动处理，Worker 不会执行到这里
      // 如果静态文件不存在，请求会传递到 Worker，这里返回 404
      if (pathname.includes('.')) {
        return new Response('文件不存在', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      // 短码跳转处理（只有不匹配 API 和静态文件的路径才会到这里）
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

