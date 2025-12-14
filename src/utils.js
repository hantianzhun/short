export const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>短链管理</title>
  <style>
    /* ---------- 主题变量 ---------- */
    :root {
      --primary: #2f80ed;
      --primary-dark: #1b6acb;
      --danger: #eb5757;
      --danger-dark: #d73c3c;
      --success: #27ae60;
      --bg: #f6f8fa;
      --card: #ffffff;
      --text1: #24292e;
      --text2: #586069;
      --border: #e1e4e8;
      --radius: 8px;
      --shadow: 0 2px 8px rgba(0, 0, 0, .08);
    }

    /* ---------- 全局 ---------- */
    * {
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background: var(--bg);
      color: var(--text1);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    .subtitle {
      font-size: 14px;
      color: var(--text2);
      margin-bottom: 24px;
    }
    .subtitle a {
      color: var(--primary);
      text-decoration: none;
    }

    /* ---------- 表单 ---------- */
    #createForm {
      width: 100%;
      max-width: 560px;
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }
    input[type=text],
    input[type=url] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 15px;
      transition: border .2s;
    }
    input[type=text]:focus,
    input[type=url]:focus {
      border-color: var(--primary);
      outline: none;
    }
    button {
      cursor: pointer;
      border: none;
      border-radius: var(--radius);
      font-size: 15px;
      font-weight: 500;
      padding: 10px 16px;
      transition: background .2s;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--primary-dark);
    }

    /* ---------- 列表 ---------- */
    #list {
      width: 100%;
      max-width: 560px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .entry {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform .2s;
    }
    .entry:hover {
      transform: translateY(-2px);
    }
    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-left a {
      color: var(--primary);
      font-weight: 500;
      text-decoration: none;
    }
    .summary-right {
      display: flex;
      gap: 8px;
    }
    .btn-icon {
      padding: 6px 10px;
      font-size: 13px;
    }
    .btn-danger {
      background: var(--danger);
      color: #fff;
    }
    .btn-danger:hover {
      background: var(--danger-dark);
    }

    /* 展开区域 */
    .details {
      display: none;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .entry.open .details {
      display: flex;
    }
    .edit-area {
      display: flex;
      gap: 8px;
    }
    .edit-area input {
      flex: 1;
    }
    .btn-success {
      background: var(--success);
      color: #fff;
    }

    /* ---------- 响应式 ---------- */
    @media (max-width: 600px) {
      body {
        padding: 16px 12px;
      }
      .summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .edit-area {
        flex-direction: column;
      }
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <h1>短链管理</h1>
  <p class="subtitle">
    需要二维码？复制短链后去 <a href="https://qr.ioi.tw/zh-cn/" target="_blank" rel="noopener">二维码生成器</a> 粘贴即可。
  </p>

  <form id="createForm">
    <input type="text" name="code" placeholder="短码，如 abc123" required autocomplete="off"/>
    <input type="url" name="url" placeholder="目标链接，如 https://example.com" required autocomplete="off"/>
    <button type="submit" class="btn-primary">创 建</button>
  </form>

  <div id="list"></div>

  <script>
    const $ = q => document.querySelector(q)
    const $list = $('#list')

    /* -------------- 数据层 -------------- */
    async function api(url, body) {
      const res = await fetch(url, { method: 'POST', body })
      if (!res.ok) throw await res.json()
      return res
    }
    async function getList() {
      const res = await fetch('/api/list')
      return res.json()
    }
    async function createLink(code, url) {
      const fd = new FormData()
      fd.append('code', code)
      fd.append('url', url)
      return api('/api/create', fd)
    }
    async function updateLink(code, url) {
      const fd = new FormData()
      fd.append('code', code)
      fd.append('url', url)
      return api('/api/update', fd)
    }
    async function deleteLink(code) {
      const fd = new FormData()
      fd.append('code', code)
      return api('/api/delete', fd)
    }

    /* -------------- 渲染 -------------- */
    function makeEntry({ code, url }) {
      const div = document.createElement('div')
      div.className = 'entry'
      div.innerHTML = `
        <div class="summary">
          <div class="summary-left">
            短码：<a href="/${code}" target="_blank" rel="noopener">https://qr.hanli.dpdns.org/${code}</a>
          </div>
          <div class="summary-right">
            <button class="btn-icon btn-danger" data-action="del">删除</button>
          </div>
        </div>
        <div class="details">
          <div>当前链接：<a href="${url}" target="_blank" rel="noopener">${url}</a></div>
          <div class="edit-area">
            <input type="url" class="edit-url" value="${url}">
            <button class="btn-icon btn-success" data-action="save">保存修改</button>
          </div>
        </div>
      `
      /* 展开 / 收起 */
      div.addEventListener('click', e => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
        div.classList.toggle('open')
        if (div.classList.contains('open')) div.querySelector('.edit-url').focus()
      })
      /* 按钮事件 */
      div.querySelector('[data-action=del]').onclick = async e => {
        e.stopPropagation()
        if (!confirm(`确定删除短码 “${code}” ？`)) return
        await deleteLink(code)
        load()
      }
      div.querySelector('[data-action=save]').onclick = async e => {
        e.stopPropagation()
        const newUrl = div.querySelector('.edit-url').value.trim()
        if (!newUrl) return alert('链接不能为空')
        await updateLink(code, newUrl)
        load()
      }
      return div
    }

    async function load() {
      const items = await getList()
      $list.innerHTML = ''
      items.forEach(d => $list.appendChild(makeEntry(d)))
      /* 新建成功后滚动到最新卡片 */
      if (items.length) $list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    /* -------------- 初始化 -------------- */
    $('#createForm').addEventListener('submit', async e => {
      e.preventDefault()
      const code = e.target.code.value.trim()
      const url = e.target.url.value.trim()
      if (!code || !url) return
      try {
        await createLink(code, url)
        e.target.reset()
        load()
      } catch (err) {
        alert(err.error || '创建失败')
      }
    })

    load()
  </script>
</body>
</html>`
