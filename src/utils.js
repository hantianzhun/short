export const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>短链管理</title>
  <style>
    /* 全局样式 */
    html, body {
      height: 100%;
      margin: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f4f7fa;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    body {
      flex-direction: column;
      gap: 2rem;
      width: 100%;
    }

    h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      text-align: center;
      margin: 0;
    }

    h2 {
      font-size: 1.2rem;
      color: #7f8c8d;
      text-align: center;
      margin: 0;
    }

    /* 表单样式 */
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 600px;
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    input[type="text"],
    input[type="url"] {
      padding: 0.8rem;
      width: 100%;
      max-width: 100%;
      border-radius: 10px;
      border: 1px solid #ddd;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.3s;
    }

    input[type="text"]:focus,
    input[type="url"]:focus {
      border-color: #3498db;
    }

    button {
      padding: 0.8rem 1.2rem;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: #2980b9;
    }

    /* 列表样式 */
    #list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 600px;
    }

    .entry {
      background-color: #ffffff;
      border-radius: 10px;
      border: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      transition: transform 0.3s ease-in-out;
      cursor: pointer;
    }

    .entry:hover {
      transform: translateY(-5px);
    }

    .code-url {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .code-url a {
      color: #3498db;
      text-decoration: none;
    }

    .code-url button {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .code-url button:hover {
      background-color: #c0392b;
    }

    .details {
      display: none;
      margin-top: 1rem;
      background-color: #ecf0f1;
      padding: 1rem;
      border-radius: 6px;
    }

    .entry.open .details {
      display: block;
    }

    .edit-url {
      width: 100%;
      padding: 0.8rem;
      margin-right: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .actions button {
      background-color: #2ecc71;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .actions button:hover {
      background-color: #27ae60;
    }

    .actions .update-btn {
      background-color: #f39c12;
    }

    .actions .update-btn:hover {
      background-color: #e67e22;
    }

    /* 响应式设计：针对小屏设备优化 */
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }

      input[type="text"], input[type="url"] {
        width: 100%;
        max-width: 100%;
      }

      button {
        width: 100%;
      }

      .entry {
        padding: 1rem;
      }

      .code-url {
        flex-direction: column;
        text-align: center;
      }

      .details {
        margin-top: 1rem;
      }

      h1 {
        font-size: 1.8rem;
      }

      h2 {
        font-size: 1rem;
      }
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
            <span>短码：<a href="/\${code}" target="_blank" rel="noopener noreferrer">https://qr.hanli.dpdns.org/ \${code}</a></span>
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
</html>`;
