export const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>短链管理</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 2rem;
      background: #f7f7f7;
    }
    h1 {
      margin-bottom: 1rem;
    }
    form {
      margin-bottom: 2rem;
    }
    input[type="text"], input[type="url"] {
      padding: 0.5rem;
      margin-right: 0.5rem;
      width: 250px;
      max-width: 100%;
      box-sizing: border-box;
    }
    button {
      padding: 0.5rem 1rem;
      margin-left: 0.5rem;
      cursor: pointer;
    }
    .entry {
      background: white;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ccc;
      user-select: none;
    }
    .details {
      margin-top: 0.5rem;
      display: none;
    }
    .entry.open .details {
      display: block;
    }
    .actions {
      margin-top: 0.5rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .code-url {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-url span {
      font-weight: bold;
    }
    .code-url button {
      margin-left: 1rem;
    }
    .edit-url {
      flex-grow: 1;
      min-width: 200px;
      padding: 0.5rem;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <h1>短链管理</h1>

  <form id="createForm">
    <input type="text" name="code" placeholder="短码，如: abc123" required />
    <input type="url" name="url" placeholder="目标链接，如: https://example.com" required />
    <button type="submit">创建</button>
  </form>

  <h2>需要二维码？请复制短链接地址，然后访问 <a href="https://qr.ioi.tw/zh-cn/" target="_blank" rel="noopener noreferrer">二维码生成器</a> 粘贴生成二维码。</h2>

  <div id="list"></div>

  <script>
    async function fetchList() {
      const res = await fetch('/api/list')
      const items = await res.json()
      const list = document.getElementById('list')
      list.innerHTML = ''

      items.forEach(({ code, url }) => {
        const div = document.createElement('div')
        div.className = 'entry'
        div.innerHTML = \`
          <div class="code-url">
            <span>短码：<a href="/\${code}" target="_blank" rel="noopener noreferrer">https://qr.hanli.dpdns.org/\${code}</a></span>
            <div>
              <button class="delete-btn">删除</button>
            </div>
          </div>
          <div class="details">
            <div>
              当前链接：<a href="\${url}" target="_blank" rel="noopener noreferrer">\${url}</a>
            </div>
            <div class="actions">
              <input type="url" placeholder="修改后的链接" class="edit-url" value="\${url}" />
              <button class="update-btn">保存修改</button>
            </div>
          </div>
        \`

        // 点击整个条目展开/收起，输入框和按钮点击阻止展开
        div.addEventListener('click', (e) => {
          if (
            e.target.classList.contains('delete-btn') ||
            e.target.classList.contains('update-btn') ||
            e.target.tagName === 'A' ||
            e.target.classList.contains('edit-url') ||
            e.target.tagName === 'INPUT'
          ) {
            return
          }
          div.classList.toggle('open')
        })

        div.querySelector('.delete-btn').onclick = (e) => {
          e.stopPropagation()
          deleteCode(code)
        }

        div.querySelector('.update-btn').onclick = (e) => {
          e.stopPropagation()
          const newUrl = div.querySelector('.edit-url').value
          updateUrl(code, newUrl)
        }

        list.appendChild(div)
      })
    }

    async function deleteCode(code) {
      const form = new FormData()
      form.append('code', code)
      await fetch('/api/delete', { method: 'POST', body: form })
      fetchList()
    }

    async function updateUrl(code, newUrl) {
      const form = new FormData()
      form.append('code', code)
      form.append('url', newUrl)
      await fetch('/api/update', { method: 'POST', body: form })
      fetchList()
    }

    document.getElementById('createForm').addEventListener('submit', async e => {
      e.preventDefault()
      const form = new FormData(e.target)
      const res = await fetch('/api/create', { method: 'POST', body: form })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || '创建失败')
        return
      }

      e.target.reset()
      fetchList()
    })

    fetchList()
  </script>
</body>
</html>
`
