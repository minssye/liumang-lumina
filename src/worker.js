const COOKIE = 'lumina_auth';
const SESSION_TTL = 60 * 60 * 24 * 14;
const DATA_KEY = 'nav:data';
const ICON_PREFIX = 'nav:icon:';
const SESSION_PREFIX = 'nav:session:';
const ICON_MAX_BYTES = 80 * 1024;

const DEFAULT_DATA = {
  categories: [
    { id: 1, name: '常用', icon: '🧰', sites: [
      { id: 1, title: 'Google', url: 'https://www.google.com', description: '全球搜索' },
      { id: 2, title: 'GitHub', url: 'https://github.com', description: '代码托管' },
      { id: 3, title: 'Bilibili', url: 'https://www.bilibili.com', description: '视频社区' },
      { id: 4, title: '知乎', url: 'https://www.zhihu.com', description: '问答社区' },
      { id: 5, title: '微博', url: 'https://weibo.com', description: '社交资讯' },
      { id: 6, title: 'Notion', url: 'https://www.notion.so', description: '笔记协作' },
      { id: 7, title: '飞书', url: 'https://www.feishu.cn', description: '协作办公' },
      { id: 8, title: '翻译', url: 'https://translate.google.com', description: '在线翻译' }
    ]},
    { id: 2, name: 'AI', icon: '🧠', sites: [
      { id: 11, title: 'ChatGPT', url: 'https://chatgpt.com', description: '对话助手' },
      { id: 12, title: 'Claude', url: 'https://claude.ai', description: 'Anthropic' },
      { id: 13, title: 'Gemini', url: 'https://gemini.google.com', description: 'Google AI' },
      { id: 14, title: 'Perplexity', url: 'https://www.perplexity.ai', description: 'AI 搜索' },
      { id: 15, title: 'Hugging Face', url: 'https://huggingface.co', description: '模型社区' },
      { id: 16, title: 'Poe', url: 'https://poe.com', description: '多模型对话' }
    ]},
    { id: 3, name: '开发', icon: '💻', sites: [
      { id: 21, title: 'GitHub', url: 'https://github.com', description: '代码托管' },
      { id: 22, title: 'Stack Overflow', url: 'https://stackoverflow.com', description: '技术问答' },
      { id: 23, title: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 文档' },
      { id: 24, title: 'Vercel', url: 'https://vercel.com', description: '前端部署' },
      { id: 25, title: 'npm', url: 'https://www.npmjs.com', description: '包管理' },
      { id: 26, title: 'CodePen', url: 'https://codepen.io', description: '前端沙盒' }
    ]},
    { id: 4, name: '设计', icon: '🎨', sites: [
      { id: 31, title: 'Figma', url: 'https://www.figma.com', description: '界面设计' },
      { id: 32, title: 'Dribbble', url: 'https://dribbble.com', description: '灵感社区' },
      { id: 33, title: 'Behance', url: 'https://www.behance.net', description: '作品集' },
      { id: 34, title: 'Pinterest', url: 'https://www.pinterest.com', description: '视觉收藏' },
      { id: 35, title: 'Unsplash', url: 'https://unsplash.com', description: '免费摄影' },
      { id: 36, title: 'Coolors', url: 'https://coolors.co', description: '配色工具' }
    ]},
    { id: 5, name: '影视', icon: '🎬', sites: [
      { id: 41, title: 'Bilibili', url: 'https://www.bilibili.com', description: '弹幕视频' },
      { id: 42, title: 'YouTube', url: 'https://www.youtube.com', description: '视频平台' },
      { id: 43, title: 'Netflix', url: 'https://www.netflix.com', description: '流媒体' },
      { id: 44, title: '豆瓣', url: 'https://www.douban.com', description: '影评书评' }
    ]},
    { id: 6, name: '资讯', icon: '📰', sites: [
      { id: 51, title: '少数派', url: 'https://sspai.com', description: '效率与数字生活' },
      { id: 52, title: 'Hacker News', url: 'https://news.ycombinator.com', description: '科技新闻' },
      { id: 53, title: '36氪', url: 'https://36kr.com', description: '创业资讯' },
      { id: 54, title: 'V2EX', url: 'https://www.v2ex.com', description: '创意工作者社区' }
    ]}
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ ok: false, message: err.message || 'server error' }, 500);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  if (path === '/api/nav/bing' && method === 'GET') return bing(url);
  if (path === '/api/nav/icon' && method === 'GET') return iconProxy(url, env);
  if (path === '/api/nav/data' && method === 'GET') return getData(env);
  if (path === '/api/auth/check' && method === 'GET') return json({ ok: true, authed: await isAuthed(request, env) });
  if (path === '/api/auth/login' && method === 'POST') return login(request, env);
  if (path === '/api/auth/logout' && method === 'POST') return logout(request, env);

  const authed = await isAuthed(request, env);
  if (!authed) return json({ ok: false, message: '需要先登录' }, 401);

  if (path === '/api/nav/data' && method === 'PUT') return putData(request, env);
  if (path === '/api/nav/import' && method === 'POST') return importData(request, env);
  if (path === '/api/nav/category' && method === 'POST') return saveCategory(request, env, null);
  if (path.startsWith('/api/nav/category/') && method === 'PUT') return saveCategory(request, env, num(path.split('/').pop()));
  if (path.startsWith('/api/nav/category/') && method === 'DELETE') return deleteCategory(env, num(path.split('/').pop()));
  if (path === '/api/nav/site' && method === 'POST') return saveSite(request, env, null);
  if (path.startsWith('/api/nav/site/') && method === 'PUT') return saveSite(request, env, num(path.split('/').pop()));
  if (path.startsWith('/api/nav/site/') && method === 'DELETE') return deleteSite(env, num(path.split('/').pop()));
  if (path === '/api/nav/reorder' && method === 'POST') return reorder(request, env);

  return json({ ok: false, message: 'not found' }, 404);
}

function json(body, status) {
  return cors(new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  }));
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cookieVal(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function cookieSet(token, request) {
  const secure = request && new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

function cookieClear() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function isAuthed(request, env) {
  const token = cookieVal(request, COOKIE);
  if (!token) return false;
  const rec = await env.NAV_KV.get(SESSION_PREFIX + token, { type: 'json' });
  return !!(rec && rec.exp && rec.exp > Date.now());
}

async function login(request, env) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');
  const expected = env.NAV_PASSWORD;
  if (!expected) return json({ ok: false, message: '未配置 NAV_PASSWORD' }, 503);
  if (!password || (await sha256(password)) !== (await sha256(expected))) {
    return json({ ok: false, message: '密码不正确' }, 401);
  }
  const token = randomToken();
  await env.NAV_KV.put(SESSION_PREFIX + token, JSON.stringify({ exp: Date.now() + SESSION_TTL * 1000 }), {
    expirationTtl: SESSION_TTL
  });
  const res = json({ ok: true, authed: true });
  res.headers.append('Set-Cookie', cookieSet(token, request));
  return res;
}

async function logout(request, env) {
  const token = cookieVal(request, COOKIE);
  if (token) await env.NAV_KV.delete(SESSION_PREFIX + token);
  const res = json({ ok: true, authed: false });
  res.headers.append('Set-Cookie', cookieClear());
  return res;
}

function nextId(data) {
  let max = 0;
  for (const c of data.categories || []) {
    if (c.id > max) max = c.id;
    for (const s of c.sites || []) if (s.id > max) max = s.id;
  }
  return max + 1;
}

async function readData(env) {
  const data = await env.NAV_KV.get(DATA_KEY, { type: 'json' });
  if (data && Array.isArray(data.categories)) return data;
  const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
  await env.NAV_KV.put(DATA_KEY, JSON.stringify(fresh));
  return fresh;
}

async function writeData(env, data) {
  await env.NAV_KV.put(DATA_KEY, JSON.stringify(data));
  return data;
}

async function getData(env) {
  const data = await readData(env);
  return json({ ok: true, categories: data.categories || [] });
}

async function putData(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.categories)) return json({ ok: false, message: '缺少 categories' }, 400);
  const data = { categories: sanitizeCategories(body.categories) };
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

function sanitizeCategories(cats) {
  let id = 1;
  return (cats || []).map((c) => ({
    id: Number.isFinite(Number(c.id)) ? Number(c.id) : id++,
    name: String(c.name || '未命名').slice(0, 40),
    icon: String(c.icon || '📁').slice(0, 8),
    sites: (c.sites || []).map((s) => ({
      id: Number.isFinite(Number(s.id)) ? Number(s.id) : id++,
      title: String(s.title || s.url || '未命名').slice(0, 80),
      url: String(s.url || ''),
      icon: String(s.icon || ''),
      description: String(s.description || '').slice(0, 120)
    })).filter((s) => s.url)
  }));
}

async function saveCategory(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const data = await readData(env);
  if (id == null) {
    const created = { id: nextId(data), name: String(body.name || '未命名').slice(0, 40), icon: String(body.icon || '📁').slice(0, 8), sites: [] };
    data.categories.push(created);
  } else {
    const cat = data.categories.find((c) => c.id === id);
    if (!cat) return json({ ok: false, message: '分类不存在' }, 404);
    if (body.name != null) cat.name = String(body.name).slice(0, 40);
    if (body.icon != null) cat.icon = String(body.icon).slice(0, 8);
  }
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

async function deleteCategory(env, id) {
  const data = await readData(env);
  data.categories = data.categories.filter((c) => c.id !== id);
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

async function saveSite(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const data = await readData(env);
  let url = String(body.url || '').trim();
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  const title = String(body.title || url).slice(0, 80);
  const description = String(body.description || '').slice(0, 120);
  let icon = String(body.icon || '');

  if (id == null) {
    const cat = data.categories.find((c) => c.id === Number(body.categoryId));
    if (!cat) return json({ ok: false, message: '分类不存在' }, 404);
    if (!url) return json({ ok: false, message: '缺少网址' }, 400);
    if (!icon) icon = await captureIcon(env, url);
    cat.sites.push({ id: nextId(data), title, url, icon, description });
  } else {
    let site = null;
    for (const c of data.categories) {
      site = (c.sites || []).find((s) => s.id === id);
      if (site) break;
    }
    if (!site) return json({ ok: false, message: '网站不存在' }, 404);
    if (body.title != null) site.title = title;
    if (body.url != null) site.url = url;
    if (body.description != null) site.description = description;
    if (body.icon) site.icon = icon;
    else if (body.icon === '' || (body.url && body.url !== site.url)) site.icon = await captureIcon(env, site.url);
  }
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

async function deleteSite(env, id) {
  const data = await readData(env);
  for (const c of data.categories) c.sites = (c.sites || []).filter((s) => s.id !== id);
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

async function reorder(request, env) {
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  const data = await readData(env);
  if (body.type === 'category') {
    const map = new Map(data.categories.map((c) => [c.id, c]));
    data.categories = ids.map((id) => map.get(id)).filter(Boolean);
  } else if (body.type === 'site') {
    const cat = data.categories.find((c) => c.id === Number(body.categoryId));
    if (cat) {
      const map = new Map((cat.sites || []).map((s) => [s.id, s]));
      cat.sites = ids.map((id) => map.get(id)).filter(Boolean);
    }
  }
  await writeData(env, data);
  return json({ ok: true, categories: data.categories });
}

async function importData(request, env) {
  const body = await request.json().catch(() => null);
  const cats = body && (body.categories || (body.data && body.data.categories));
  if (!Array.isArray(cats)) return json({ ok: false, message: '文件里没有 categories 数组' }, 400);
  const data = { categories: sanitizeCategories(cats) };
  for (const c of data.categories) {
    for (const s of c.sites) {
      if (!s.icon || !s.icon.startsWith('data:')) s.icon = await captureIcon(env, s.url);
    }
  }
  await writeData(env, data);
  const siteCount = data.categories.reduce((n, c) => n + c.sites.length, 0);
  return json({ ok: true, categories: data.categories.length, sites: siteCount, data });
}

function hostOf(raw) {
  try { return new URL(raw).hostname; } catch { return ''; }
}

async function captureIcon(env, siteUrl) {
  const host = hostOf(siteUrl);
  if (!host) return '';
  const cached = await env.NAV_KV.get(ICON_PREFIX + host);
  if (cached) return cached;
  const dataUrl = await fetchFaviconDataUrl(host, siteUrl);
  if (dataUrl) {
    await env.NAV_KV.put(ICON_PREFIX + host, dataUrl, { expirationTtl: 60 * 60 * 24 * 30 });
    return dataUrl;
  }
  return '';
}

async function iconProxy(url, env) {
  const host = String(url.searchParams.get('host') || '').trim().toLowerCase();
  if (!host || !/^[a-z0-9.-]+$/.test(host)) return json({ ok: false, message: 'invalid host' }, 400);
  const cached = await env.NAV_KV.get(ICON_PREFIX + host);
  if (cached && cached.startsWith('data:')) {
    const comma = cached.indexOf(',');
    const meta = cached.slice(5, comma);
    const [mime] = meta.split(';');
    const bin = Uint8Array.from(atob(cached.slice(comma + 1)), (c) => c.charCodeAt(0));
    return cors(new Response(bin, {
      headers: { 'Content-Type': mime || 'image/png', 'Cache-Control': 'public, max-age=604800' }
    }));
  }
  const dataUrl = await fetchFaviconDataUrl(host, 'https://' + host);
  if (!dataUrl) return new Response('', { status: 404 });
  await env.NAV_KV.put(ICON_PREFIX + host, dataUrl, { expirationTtl: 60 * 60 * 24 * 30 });
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma);
  const [mime] = meta.split(';');
  const bin = Uint8Array.from(atob(dataUrl.slice(comma + 1)), (c) => c.charCodeAt(0));
  return cors(new Response(bin, {
    headers: { 'Content-Type': mime || 'image/png', 'Cache-Control': 'public, max-age=604800' }
  }));
}

async function fetchFaviconDataUrl(host, pageUrl) {
  const candidates = [
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`,
    `https://${host}/favicon.ico`
  ];
  if (pageUrl) {
    try {
      const htmlRes = await fetch(pageUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 LUMINA-NAV' },
        cf: { cacheTtl: 86400 }
      });
      if (htmlRes.ok) {
        const html = (await htmlRes.text()).slice(0, 80_000);
        const m = html.match(/<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/i);
        if (m) {
          const href = (m[0].match(/href=["']([^"']+)["']/i) || [])[1];
          if (href) candidates.unshift(new URL(href, htmlRes.url).href);
        }
      }
    } catch {}
  }
  for (const src of candidates) {
    try {
      const r = await fetch(src, { redirect: 'follow', cf: { cacheTtl: 86400 } });
      if (!r.ok) continue;
      const buf = new Uint8Array(await r.arrayBuffer());
      if (!buf.byteLength || buf.byteLength > ICON_MAX_BYTES) continue;
      const mime = (r.headers.get('content-type') || 'image/png').split(';')[0];
      if (!mime.startsWith('image/') && mime !== 'application/octet-stream') continue;
      let binary = '';
      for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
      return `data:${mime.startsWith('image/') ? mime : 'image/png'};base64,${btoa(binary)}`;
    } catch {}
  }
  return '';
}

async function bing(url) {
  const n = Math.min(8, Math.max(1, Number(url.searchParams.get('n')) || 8));
  const mkt = url.searchParams.get('mkt') || 'zh-CN';
  const endpoints = [
    `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=${n}&mkt=${encodeURIComponent(mkt)}`,
    `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=${n}&mkt=${encodeURIComponent(mkt)}`
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, { cf: { cacheTtl: 3600 } });
      if (!r.ok) continue;
      const data = await r.json();
      const images = (data.images || []).map((img) => {
        const base = img.urlbase ? 'https://www.bing.com' + img.urlbase : '';
        return {
          full: base ? base + '_1920x1080.jpg' : 'https://www.bing.com' + (img.url || ''),
          uhd: base ? base + '_UHD.jpg' : '',
          copyright: img.copyright || img.title || '',
          title: img.title || ''
        };
      }).filter((x) => x.full);
      if (images.length) return json({ ok: true, images, mkt });
    } catch {}
  }
  return json({ ok: false, message: 'bing unavailable', images: [] }, 502);
}
