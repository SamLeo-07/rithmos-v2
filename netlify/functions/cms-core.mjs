/**
 * RITHMOS content API - one handler shared by the Netlify function (production, Netlify Blobs)
 * and the Vite dev server (localhost, files in .cms-data/).
 *
 *   GET  /api                      public: the published edits (JSON)
 *   GET  /api?media=<id>           public: an uploaded picture or PDF
 *   GET  /api?history=1            admin:  saved versions
 *   POST /api?action=save          admin:  publish { pages }
 *   POST /api?action=upload        admin:  { name, type, data(base64) } -> { url }
 *   POST /api?action=restore       admin:  { id } -> makes an older version live again
 *
 * "admin" calls need the header x-admin-password to match the ADMIN_PASSWORD environment variable.
 */
import { timingSafeEqual } from 'node:crypto';

const PAGES = ['home', 'about', 'competition', 'sponsors', 'contact'];
const MAX_MEDIA_BYTES = 4 * 1024 * 1024; // the function request limit is ~6 MB including base64
const KEEP_VERSIONS = 25;
const MEDIA_TYPES = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  'image/png': { ext: 'png', magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  'image/webp': { ext: 'webp', magic: (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
  'image/gif': { ext: 'gif', magic: (b) => b.slice(0, 3).toString() === 'GIF' },
  'application/pdf': { ext: 'pdf', magic: (b) => b.slice(0, 4).toString() === '%PDF' }
};

const json = (status, obj, extra = {}) => ({
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  body: JSON.stringify(obj)
});

function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

const URL_OK = /^(\/cms-media\/[a-z0-9._-]{1,140}|\/assets\/[\w./-]{1,200}|https:\/\/[^\s"'<>\\]{1,300})$/i;
const SELECTOR_OK = /^[\w\s.#>+~:\-[\]="'*(),^$|]{1,200}$/;
const TEXT_ID_OK = /^[0-9.]*@[0-9]{1,3}$/;

/** Keeps only well-formed edits so nothing odd can be saved. */
export function cleanContent(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const page of PAGES) {
    const src = input[page];
    if (!src || typeof src !== 'object') continue;
    const text = {};
    let n = 0;
    for (const [id, rec] of Object.entries(src.text || {})) {
      if (n >= 2000) break;
      if (!TEXT_ID_OK.test(id) || !rec || typeof rec.o !== 'string' || typeof rec.v !== 'string') continue;
      if (rec.o.length > 6000 || rec.v.length > 6000 || rec.o === rec.v) continue;
      text[id] = { o: rec.o, v: rec.v };
      n += 1;
    }
    const assets = {};
    for (const [orig, rec] of Object.entries(src.assets || {})) {
      if (orig.length > 400 || !/^(\/|https:\/\/)/.test(orig) || !rec || !URL_OK.test(String(rec.v || ''))) continue;
      const sel = Array.isArray(rec.sel) ? rec.sel.filter((s) => typeof s === 'string' && SELECTOR_OK.test(s)).slice(0, 12) : [];
      assets[orig] = { v: rec.v, sel };
    }
    if (Object.keys(text).length || Object.keys(assets).length) out[page] = { text, assets };
  }
  return out;
}

export async function handle(req, store, env) {
  const { method, query = {}, headers = {}, body } = req;
  const header = (k) => headers[k] || headers[k.toLowerCase()] || '';
  const isAdmin = () => !!env.ADMIN_PASSWORD && sameSecret(header('x-admin-password'), env.ADMIN_PASSWORD);
  const needAdmin = () => {
    if (!env.ADMIN_PASSWORD) {
      return json(503, { error: 'Publishing is not set up yet. Add an ADMIN_PASSWORD environment variable in Netlify (Site settings > Environment variables), then redeploy.' });
    }
    return isAdmin() ? null : json(401, { error: 'Wrong publishing password.' });
  };

  // ------------------------------------------------------------ public reads
  if (method === 'GET' && query.media) {
    if (!/^[a-z0-9._-]{1,140}$/i.test(query.media)) return json(400, { error: 'Bad id' });
    const file = await store.getBin(`media/${query.media}`);
    if (!file) return json(404, { error: 'Not found' });
    return {
      status: 200,
      headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
      body: file.data
    };
  }

  if (method === 'GET' && query.history) {
    const denied = needAdmin();
    if (denied) return denied;
    const keys = (await store.list('history/')).sort().reverse().slice(0, KEEP_VERSIONS);
    const items = [];
    for (const key of keys) {
      const rec = await store.getJSON(key);
      if (rec) items.push({ id: key.slice('history/'.length), savedAt: rec.savedAt, pages: Object.keys(rec.pages || {}) });
    }
    return json(200, { items });
  }

  if (method === 'GET') {
    const content = (await store.getJSON('content')) || { v: 0, updatedAt: null, pages: {} };
    const cache = 'no-cache'; // always revalidate, so a publish reaches every visitor on their next page load
    return json(200, content, { 'Cache-Control': cache });
  }

  // ------------------------------------------------------------ admin writes
  if (method !== 'POST') return json(405, { error: 'Method not allowed' });
  const denied = needAdmin();
  if (denied) return denied;

  let data;
  try {
    data = JSON.parse(Buffer.from(body || '').toString('utf8') || '{}');
  } catch (e) {
    return json(400, { error: 'Bad JSON' });
  }

  const publish = async (pages) => {
    const prev = (await store.getJSON('content')) || { v: 0 };
    const now = new Date().toISOString();
    const content = { v: (prev.v || 0) + 1, updatedAt: now, pages };
    await store.setJSON('content', content);
    await store.setJSON(`history/${now.replace(/[:.]/g, '-')}`, { savedAt: now, pages });
    const old = (await store.list('history/')).sort().reverse().slice(KEEP_VERSIONS);
    for (const k of old) await store.del(k);
    return content;
  };

  if (query.action === 'save') {
    // a stale admin tab must not overwrite a newer publish
    const live = (await store.getJSON('content')) || { v: 0 };
    if (typeof data.base === 'number' && data.base !== (live.v || 0)) {
      return json(409, { error: 'The website was updated since you opened this editor. Reload to see the latest version.', stale: true });
    }
    const content = await publish(cleanContent(data.pages));
    return json(200, { ok: true, v: content.v, updatedAt: content.updatedAt });
  }

  if (query.action === 'restore') {
    if (!/^[\w-]{10,40}$/.test(String(data.id || ''))) return json(400, { error: 'Bad id' });
    const rec = await store.getJSON(`history/${data.id}`);
    if (!rec) return json(404, { error: 'Version not found' });
    const content = await publish(cleanContent(rec.pages));
    return json(200, { ok: true, v: content.v, updatedAt: content.updatedAt, pages: content.pages });
  }

  if (query.action === 'upload') {
    const kind = MEDIA_TYPES[data.type];
    if (!kind) return json(415, { error: 'Only JPG, PNG, WebP, GIF pictures and PDF documents can be uploaded.' });
    const buf = Buffer.from(String(data.data || ''), 'base64');
    if (!buf.length) return json(400, { error: 'Empty file' });
    if (buf.length > MAX_MEDIA_BYTES) return json(413, { error: 'That file is larger than 4 MB. Please compress it and try again.' });
    if (!kind.magic(buf)) return json(415, { error: 'The file contents do not match its type.' });
    const slug = String(data.name || 'file').replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${slug}.${kind.ext}`;
    await store.setBin(`media/${id}`, buf, data.type);
    return json(200, { ok: true, url: `/cms-media/${id}` });
  }

  return json(400, { error: 'Unknown action' });
}
