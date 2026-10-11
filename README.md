# 榴芒启航 LUMINA

一个沉浸式开始页：全屏 Bing 壁纸、大时钟、搜索、分类收藏。

前端静态页面由 Cloudflare Workers 静态资源托管，收藏数据存在 Workers KV。同一 Worker 提供登录、图标代理和 Bing 壁纸接口。

## 功能

- 全屏 Bing 壁纸：先加载 1920×1080，后台再换成 UHD
- 大时钟与日期
- 必应 / Google / 百度搜索，支持 `!g` / `!b` / `!d`
- 底部分类 Dock，点击展开收藏
- 收藏图标可在正圆与圆角之间切换
- 服务端抓取 favicon，转成 base64 写入 KV，国内也能显示
- 设置面板：登录后才能增删改；JSON 导入导出含图标

## 本地用法

```bash
python3 -m http.server 8000
```

静态预览没有 API。完整功能用 Wrangler：

```bash
npm install -g wrangler
cp .dev.vars.example .dev.vars
```

在 `.dev.vars` 里填写 `NAV_PASSWORD`。然后：

```bash
wrangler kv namespace create NAV_KV
```

把返回的 id 填进 `wrangler.toml` 的 `id` 字段。

```bash
wrangler dev
```

浏览器访问 Wrangler 给出的本地地址。

## 用法

| 操作 | 说明 |
| --- | --- |
| 回车 | 搜索；输入关键词也可筛选收藏 |
| `!g` / `!b` / `!d` | 指定 Google、必应、百度；中文 `！` 同样可用 |
| 只输入 `!d` | 切换默认引擎，不开新标签 |
| 点击底部分类 | 展开该分类的收藏 |
| 右键空白处 | 隐藏或显示收藏 |
| `/` | 聚焦搜索框 |
| 右下角 ⟳ | 换壁纸 |
| 右下角 ⚙ | 管理收藏（登录后可编辑） |

## 架构

```text
浏览器
  -> Workers 静态资源（index.html / favicon.svg）
  -> /api/* 由同一 Worker 处理
       NAV_KV
         nav:data              全部分类与网站（网站 icon 为 data URL）
         nav:icon:<host>       抓取后的 favicon，30 天 TTL
         nav:session:<token>   登录会话，14 天 TTL
```

KV 是全球最终一致的键值存储，适合高频读取、低频写入的收藏数据。单 key 最大 25MB；本项目把整份导航树放在 `nav:data`，图标按域名另存，避免重复抓取。

保存网站时 Worker 会：

1. 读取页面 `<link rel="icon">`
2. 依次尝试 DuckDuckGo、Google s2、`/favicon.ico`
3. 转成 `data:image/...;base64,` 写入该网站记录，并缓存到 `nav:icon:<host>`

之后前端直接用 data URL 显示，不再请求 Google。

## 部署到 Cloudflare Workers

Workers 静态资源绑定同时承担 Pages 的托管角色：同一项目既有边缘函数，也有全球静态分发。

### 1. 准备账号

安装 Wrangler 并登录：

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 KV 命名空间

```bash
wrangler kv namespace create NAV_KV
```

把输出里的 id 写入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "NAV_KV"
id = "粘贴这里的 id"
```

### 3. 设置登录密码

```bash
wrangler secret put NAV_PASSWORD
```

按提示输入访问密码。这是设置面板增删改的唯一凭据。

### 4. 发布

```bash
wrangler deploy
```

完成后会得到 `https://liumang-lumina.<你的子域>.workers.dev`。把该地址设为浏览器主页即可。

自定义域名：Cloudflare Dashboard → Workers & Pages → liumang-lumina → Settings → Domains & Routes。

### 5. 更新

改完代码后再次执行：

```bash
wrangler deploy
```

KV 里的收藏不会被覆盖，除非你在设置里导入/恢复默认。

## 文件

- `public/index.html` — 页面、样式与交互
- `public/favicon.svg` — 站点图标
- `src/worker.js` — API：KV、登录、图标代理、Bing 壁纸
- `wrangler.toml` — Worker 名称、静态资源、KV 绑定
- `.dev.vars.example` — 本地密码模板

最近访问、默认搜索引擎、图标形状仍写在浏览器 `localStorage`。收藏与图标以 KV 为准。
