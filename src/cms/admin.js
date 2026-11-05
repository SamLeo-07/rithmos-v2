/**
 * RITHMOS admin - "Website content" editor.
 * Pick a page, edit its text, replace its pictures and PDF documents, watch the page preview update,
 * then press Publish: the changes go live for every visitor on their next page load.
 */
import './admin.css';
import { API, PAGES, scanText, scanAssets, cssBackgroundSelectors, remapText } from './core.js';

const PW_KEY = 'rithmos_cms_pw';
const root = document.getElementById('cms-root');
const submissionsView = document.getElementById('view-submissions');
const contentView = document.getElementById('view-content');
const switchBtns = document.querySelectorAll('[data-admin-view]');

const state = {
  page: 'home',
  tab: 'text',
  search: '',
  device: 'desktop',
  published: {},
  edits: {},
  items: [],
  images: [],
  docs: [],
  bgSel: {},
  updatedAt: null,
  v: 0,
  ready: false,
  busy: false
};

const clone = (o) => JSON.parse(JSON.stringify(o || {}));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const pageEdits = (key = state.page) => {
  if (!state.edits[key]) state.edits[key] = { text: {}, assets: {} };
  return state.edits[key];
};
const iframeEl = () => root.querySelector('iframe');
const cms = () => {
  const f = iframeEl();
  return f && f.contentWindow && f.contentWindow.__cms ? f.contentWindow.__cms : null;
};

// ------------------------------------------------------------------ small UI helpers
function toast(msg, kind = '') {
  let t = document.querySelector('.cms-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'cms-toast';
    document.body.appendChild(t);
  }
  t.className = `cms-toast show ${kind}`;
  t.textContent = msg;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 4200);
}

function modal(html) {
  const wrap = document.createElement('div');
  wrap.className = 'cms-modal';
  wrap.innerHTML = `<div class="cms-modal-box">${html}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
  document.body.appendChild(wrap);
  return wrap;
}

function askPassword(message) {
  return new Promise((resolve) => {
    const m = modal(`
      <h3>Publishing password</h3>
      <p>${esc(message || 'Enter the publishing password to save changes to the live website.')}</p>
      <input type="password" id="cms-pw-input" autocomplete="current-password" placeholder="Publishing password">
      <div class="cms-modal-actions"><button class="cms-btn" data-no>Cancel</button><button class="cms-btn primary" data-yes>Continue</button></div>`);
    const input = m.querySelector('input');
    input.focus();
    const done = (v) => { m.remove(); resolve(v); };
    m.querySelector('[data-no]').onclick = () => done(null);
    m.querySelector('[data-yes]').onclick = () => done(input.value);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(input.value); });
  });
}

// ------------------------------------------------------------------ server calls
async function api(path, options = {}, retry = true) {
  const headers = { ...(options.headers || {}), 'x-admin-password': sessionStorage.getItem(PW_KEY) || '' };
  const res = await fetch(path, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (res.status === 401 && retry) {
    const pw = await askPassword(sessionStorage.getItem(PW_KEY) ? 'That password was not accepted. Try again.' : '');
    if (pw === null) throw new Error('Cancelled');
    sessionStorage.setItem(PW_KEY, pw);
    return api(path, options, true);
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function loadPublished() {
  const res = await fetch(`${API}?fresh=1`, { cache: 'no-store' });
  const data = res.ok ? await res.json() : { pages: {} };
  state.published = data.pages || {};
  state.updatedAt = data.updatedAt || null;
  state.v = data.v || 0;
  state.edits = clone(state.published);
}

// ------------------------------------------------------------------ diff helpers
function cleaned(edits) {
  const out = {};
  Object.keys(edits || {}).forEach((k) => {
    const t = edits[k].text || {};
    const a = edits[k].assets || {};
    if (Object.keys(t).length || Object.keys(a).length) out[k] = { text: t, assets: a };
  });
  return out;
}

function countChanges(key) {
  const now = state.edits[key] || { text: {}, assets: {} };
  const was = state.published[key] || { text: {}, assets: {} };
  let n = 0;
  ['text', 'assets'].forEach((kind) => {
    const ids = new Set([...Object.keys(now[kind] || {}), ...Object.keys(was[kind] || {})]);
    ids.forEach((id) => {
      if (JSON.stringify((now[kind] || {})[id]) !== JSON.stringify((was[kind] || {})[id])) n += 1;
    });
  });
  return n;
}

const totalChanges = () => PAGES.reduce((sum, p) => sum + countChanges(p.key), 0);

function refreshStatus() {
  const total = totalChanges();
  const status = root.querySelector('.cms-status');
  if (status) {
    status.textContent = total ? `${total} unpublished change${total > 1 ? 's' : ''} - press PUBLISH CHANGES to make ${total > 1 ? 'them' : 'it'} live` : (state.updatedAt ? `Live version saved ${new Date(state.updatedAt).toLocaleString()}` : 'No edits published yet');
    status.classList.toggle('dirty', total > 0);
  }
  root.querySelector('[data-publish]').disabled = state.busy || total === 0;
  root.querySelector('[data-discard]').disabled = total === 0;
  PAGES.forEach((p) => {
    const b = root.querySelector(`[data-page="${p.key}"] .n`);
    if (b) b.textContent = countChanges(p.key) ? `● ${countChanges(p.key)}` : '';
  });
}

// ------------------------------------------------------------------ preview sync
let previewTimer = null;
function syncPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const c = cms();
    if (c) c.apply(cleaned(state.edits)[state.page] || null);
  }, 90);
}

// ------------------------------------------------------------------ rendering
function render() {
  root.innerHTML = `
    <div class="cms-toolbar">
      <div class="cms-pages">${PAGES.map((p) => `<button data-page="${p.key}" class="${p.key === state.page ? 'active' : ''}">${p.label}<span class="n"></span></button>`).join('')}</div>
      <div class="cms-actions">
        <span class="cms-status"></span>
        <button class="cms-btn" data-history>VERSION HISTORY</button>
        <button class="cms-btn" data-discard>DISCARD CHANGES</button>
        <button class="cms-btn primary" data-publish>PUBLISH CHANGES</button>
      </div>
    </div>
    <div class="cms-body">
      <div class="cms-panel">
        <div class="cms-subtabs">
          <button data-tab="text" class="${state.tab === 'text' ? 'active' : ''}">TEXT</button>
          <button data-tab="images" class="${state.tab === 'images' ? 'active' : ''}">PICTURES</button>
          <button data-tab="docs" class="${state.tab === 'docs' ? 'active' : ''}">PDF DOCUMENTS</button>
        </div>
        <div class="cms-search"><input type="search" placeholder="Search this page..." value="${esc(state.search)}"></div>
        <div class="cms-list"></div>
      </div>
      <div class="cms-preview">
        <div class="cms-preview-bar">
          <span class="lbl">LIVE PREVIEW &middot; click any text or picture to edit it</span>
          <span>
            <button class="cms-btn small" data-device="desktop">DESKTOP</button>
            <button class="cms-btn small" data-device="mobile">PHONE</button>
            <a class="cms-btn small" data-open target="_blank" rel="noopener" style="text-decoration:none">OPEN LIVE SITE &#8599;</a>
          </span>
        </div>
        <div class="cms-frame-wrap ${state.device}"><iframe title="Page preview"></iframe></div>
      </div>
    </div>`;

  root.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => openPage(b.dataset.page)));
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; renderPanel(); markTabs(); }));
  root.querySelector('.cms-search input').addEventListener('input', (e) => { state.search = e.target.value; renderPanel(); });
  root.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => {
    state.device = b.dataset.device;
    root.querySelector('.cms-frame-wrap').className = `cms-frame-wrap ${state.device}`;
  }));
  root.querySelector('[data-publish]').addEventListener('click', publish);
  root.querySelector('[data-discard]').addEventListener('click', discard);
  root.querySelector('[data-history]').addEventListener('click', showHistory);
  const pg = PAGES.find((p) => p.key === state.page);
  root.querySelector('[data-open]').href = pg.url;
  refreshStatus();
}

function markTabs() {
  root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
}

function groupTitle(id) {
  const t = String(id).replace(/[-_]+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function renderPanel() {
  const list = root.querySelector('.cms-list');
  const q = state.search.trim().toLowerCase();
  if (state.tab === 'text') renderText(list, q);
  else if (state.tab === 'images') renderImages(list, q);
  else renderDocs(list, q);
}

function renderText(list, q) {
  const edits = pageEdits().text;
  const groups = new Map();
  state.items.forEach((it) => {
    const shown = edits[it.id] ? edits[it.id].v : flat(it.orig);
    if (q && !flat(it.orig).toLowerCase().includes(q) && !shown.toLowerCase().includes(q)) return;
    if (!groups.has(it.group)) groups.set(it.group, []);
    groups.get(it.group).push(it);
  });
  if (!groups.size) { list.innerHTML = '<div class="cms-empty">No text found.</div>'; return; }
  list.innerHTML = '<div class="cms-hint">Change any text and the preview updates straight away. Nothing goes live until you press Publish changes.</div>'
    + [...groups].map(([g, items]) => `<div class="cms-group"><h4>${esc(groupTitle(g))}</h4>${items.map((it) => {
      const val = edits[it.id] ? edits[it.id].v : flat(it.orig);
      const rows = Math.min(9, Math.max(1, Math.ceil(val.length / 38)));
      return `<div class="cms-item ${edits[it.id] ? 'edited' : ''}" data-id="${esc(it.id)}">
        <div class="cms-item-head"><span>${esc(it.tag)}</span><button class="cms-btn small" data-reset style="${edits[it.id] ? '' : 'display:none'}">RESET</button></div>
        <textarea rows="${rows}">${esc(val)}</textarea></div>`;
    }).join('')}</div>`).join('');

  list.querySelectorAll('.cms-item').forEach((box) => {
    const id = box.dataset.id;
    const it = state.items.find((x) => x.id === id);
    const ta = box.querySelector('textarea');
    ta.addEventListener('input', () => {
      const e = pageEdits().text;
      if (ta.value === flat(it.orig)) delete e[id];
      else e[id] = { o: it.orig, v: ta.value };
      box.classList.toggle('edited', !!e[id]);
      box.querySelector('[data-reset]').style.display = e[id] ? '' : 'none';
      syncPreview();
      refreshStatus();
    });
    box.querySelector('[data-reset]').addEventListener('click', () => {
      delete pageEdits().text[id];
      ta.value = flat(it.orig);
      box.classList.remove('edited');
      box.querySelector('[data-reset]').style.display = 'none';
      syncPreview();
      refreshStatus();
    });
    ta.addEventListener('focus', () => {
      const c = cms();
      const el = c && c.locate(id);
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(el); }
    });
  });
}

function currentUrl(orig) {
  const rec = pageEdits().assets[orig];
  return rec ? rec.v : orig;
}

function renderImages(list, q) {
  const items = state.images.filter((a) => !q || a.url.toLowerCase().includes(q) || (a.alt || '').toLowerCase().includes(q));
  if (!items.length) { list.innerHTML = '<div class="cms-empty">No pictures found.</div>'; return; }
  list.innerHTML = '<div class="cms-hint">Replace a picture with a new one of a similar shape. JPG, PNG, WebP or GIF; large photos are resized automatically.</div>'
    + items.map((a) => {
      const edited = !!pageEdits().assets[a.url];
      return `<div class="cms-asset ${edited ? 'edited' : ''}" data-url="${esc(a.url)}">
        <div class="cms-thumb" style="background-image:url('${esc(currentUrl(a.url))}')"></div>
        <div>
          <div class="cms-asset-name">${esc(a.url.split('/').pop())}</div>
          <div class="cms-asset-meta">${a.alt ? esc(flat(a.alt)).slice(0, 60) + ' &middot; ' : ''}used ${a.uses}&times;<span class="dim"></span></div>
          <div class="cms-asset-actions">
            <label class="cms-btn small primary" style="cursor:pointer">REPLACE PICTURE<input type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
            <button class="cms-btn small" data-reset style="${edited ? '' : 'display:none'}">RESET</button>
          </div></div></div>`;
    }).join('');
  bindAssets(list, 'image');
  list.querySelectorAll('.cms-asset').forEach((box) => {
    const probe = new Image();
    probe.onload = () => { const d = box.querySelector('.dim'); if (d) d.textContent = ` · ${probe.naturalWidth}×${probe.naturalHeight}px`; };
    probe.src = currentUrl(box.dataset.url);
  });
}

function renderDocs(list, q) {
  const items = state.docs.filter((a) => !q || a.url.toLowerCase().includes(q) || (a.label || '').toLowerCase().includes(q));
  if (!items.length) { list.innerHTML = '<div class="cms-empty">No PDF documents are linked from this page.</div>'; return; }
  list.innerHTML = '<div class="cms-hint">Upload a new PDF to replace the file visitors download from this page (up to 4 MB).</div>'
    + items.map((a) => {
      const edited = !!pageEdits().assets[a.url];
      return `<div class="cms-asset ${edited ? 'edited' : ''}" data-url="${esc(a.url)}">
        <div class="cms-thumb">PDF</div>
        <div>
          <div class="cms-asset-name">${esc(a.label || a.url.split('/').pop())}</div>
          <div class="cms-asset-meta">${esc(currentUrl(a.url).split('/').pop())} &middot; linked ${a.uses}&times;</div>
          <div class="cms-asset-actions">
            <label class="cms-btn small primary" style="cursor:pointer">REPLACE PDF<input type="file" accept="application/pdf"></label>
            <a class="cms-btn small" target="_blank" rel="noopener" href="${esc(currentUrl(a.url))}" style="text-decoration:none">VIEW CURRENT</a>
            <button class="cms-btn small" data-reset style="${edited ? '' : 'display:none'}">RESET</button>
          </div></div></div>`;
    }).join('');
  bindAssets(list, 'doc');
}

function bindAssets(list, kind) {
  list.querySelectorAll('.cms-asset').forEach((box) => {
    const orig = box.dataset.url;
    box.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        toast('Uploading...');
        const prepared = kind === 'image' ? await prepareImage(file) : file;
        const url = await upload(prepared);
        pageEdits().assets[orig] = { v: url, sel: state.bgSel[orig] || [] };
        syncPreview();
        refreshStatus();
        renderPanel();
        toast('Uploaded. Press Publish changes to make it live.', 'ok');
      } catch (err) {
        if (err.message !== 'Cancelled') toast(err.message, 'err');
      }
    });
    box.querySelector('[data-reset]').addEventListener('click', () => {
      delete pageEdits().assets[orig];
      syncPreview();
      refreshStatus();
      renderPanel();
    });
  });
}

// ------------------------------------------------------------------ uploads
function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(blob);
  });
}

async function prepareImage(file) {
  if (file.type === 'image/gif' || (file.size <= 3 * 1024 * 1024 && file.type !== 'image/png')) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  if (file.type === 'image/png' && file.size <= 3 * 1024 * 1024 && scale === 1) return file;
  for (const q of [0.92, 0.82, 0.7]) {
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', q));
    if (blob && blob.size <= 3.8 * 1024 * 1024) return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  }
  throw new Error('That picture is too large even after resizing. Please use a smaller one.');
}

async function upload(file) {
  if (file.size > 4 * 1024 * 1024) throw new Error('That file is larger than 4 MB. Please compress it and try again.');
  const data = await toBase64(file);
  const out = await api(`${API}?action=upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type: file.type, data })
  });
  return out.url;
}

// ------------------------------------------------------------------ actions
async function publish() {
  state.busy = true;
  refreshStatus();
  try {
    const pages = cleaned(state.edits);
    const out = await api(`${API}?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages, base: state.v })
    });
    state.published = clone(pages);
    state.edits = clone(pages);
    state.updatedAt = out.updatedAt;
    state.v = out.v;
    toast('Published. The live website now shows these changes.', 'ok');
  } catch (err) {
    if (err.status === 409) staleNotice();
    else if (err.message !== 'Cancelled') failNotice(err.message);
  }
  state.busy = false;
  refreshStatus();
  renderPanel();
}

function failNotice(message) {
  const m = modal(`<h3>Not published</h3><p>${esc(message)}</p><p>Your edits are still here, nothing was lost. Fix the problem above and press PUBLISH CHANGES again.</p>
    <div class="cms-modal-actions"><button class="cms-btn primary" data-ok>OK</button></div>`);
  m.querySelector('[data-ok]').onclick = () => m.remove();
}

function staleNotice() {
  const m = modal(`<h3>Newer version online</h3><p>The website was updated after you opened this editor, so publishing now could overwrite those changes. Reload the latest version to continue (your unpublished edits here will be lost).</p>
    <div class="cms-modal-actions"><button class="cms-btn" data-no>Keep editing</button><button class="cms-btn primary" data-yes>Reload latest</button></div>`);
  m.querySelector('[data-no]').onclick = () => m.remove();
  m.querySelector('[data-yes]').onclick = async () => {
    m.remove();
    await loadPublished();
    await openPage(state.page, true);
    toast('Loaded the latest published version.');
  };
}

function discard() {
  state.edits = clone(state.published);
  syncPreview();
  refreshStatus();
  renderPanel();
  toast('Unpublished changes discarded.');
}

async function showHistory() {
  try {
    const out = await api(`${API}?history=1`);
    const m = modal(`<h3>Version history</h3><p>Every publish is kept. Restoring a version makes it live straight away.</p>
      ${out.items.length ? out.items.map((v) => `<div class="cms-version"><div>${new Date(v.savedAt).toLocaleString()}<small>${v.pages.length ? v.pages.join(', ') : 'original website (no edits)'}</small></div><button class="cms-btn small" data-restore="${esc(v.id)}">RESTORE</button></div>`).join('') : '<p>No versions yet.</p>'}
      <div class="cms-modal-actions" style="margin-top:14px"><button class="cms-btn" data-close>Close</button></div>`);
    m.querySelector('[data-close]').onclick = () => m.remove();
    m.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', async () => {
      try {
        await api(`${API}?action=restore`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.dataset.restore }) });
        m.remove();
        await loadPublished();
        await openPage(state.page, true);
        toast('Version restored and live.', 'ok');
      } catch (err) { toast(err.message, 'err'); }
    }));
  } catch (err) {
    if (err.message !== 'Cancelled') toast(err.message, 'err');
  }
}

// ------------------------------------------------------------------ page loading
function flash(el) {
  if (!el || !el.style) return;
  const prev = el.style.outline;
  el.style.outline = '3px solid #ff1c36';
  el.style.outlineOffset = '3px';
  setTimeout(() => { el.style.outline = prev; }, 1200);
}

function focusItem(selector, attr, value) {
  const box = [...root.querySelectorAll(selector)].find((b) => b.dataset[attr] === value);
  if (!box) return;
  root.querySelectorAll('.focus').forEach((x) => x.classList.remove('focus'));
  box.classList.add('focus');
  box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const ta = box.querySelector('textarea');
  if (ta) ta.focus({ preventScroll: true });
}

function wirePreview() {
  const f = iframeEl();
  const win = f.contentWindow;
  const doc = f.contentDocument;
  if (!doc || !win.__cms) return;

  // pictures that are CSS backgrounds
  const bg = cssBackgroundSelectors(doc);
  bg.forEach((sels, url) => {
    state.bgSel[url] = [...sels];
    if (!state.images.find((a) => a.url === url)) state.images.push({ url, uses: sels.size, alt: 'background' });
  });
  if (state.tab === 'images') renderPanel();

  const hint = doc.createElement('style');
  hint.textContent = '[data-cms-hover]{outline:2px dashed #ff1c36 !important;outline-offset:2px;cursor:pointer !important}';
  doc.head.appendChild(hint);
  let hovered = null;
  doc.addEventListener('mouseover', (e) => {
    if (hovered) hovered.removeAttribute('data-cms-hover');
    const id = win.__cms.pick(e.target);
    const el = id ? win.__cms.locate(id) : (e.target.closest('img') || null);
    hovered = el;
    if (el) el.setAttribute('data-cms-hover', '');
  });
  doc.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = win.__cms.pick(e.target);
    if (id) {
      state.tab = 'text';
      state.search = '';
      root.querySelector('.cms-search input').value = '';
      markTabs();
      renderPanel();
      focusItem('.cms-item', 'id', id);
      return;
    }
    const img = e.target.closest('img');
    if (img) {
      const src = img.getAttribute('src');
      state.tab = 'images';
      markTabs();
      renderPanel();
      const orig = Object.keys(pageEdits().assets).find((k) => pageEdits().assets[k].v === src) || src;
      focusItem('.cms-asset', 'url', orig);
    }
  }, true);
  win.__cms.apply(cleaned(state.edits)[state.page] || null);
}

async function openPage(key, force = false) {
  if (key === state.page && state.ready && !force) return;
  state.page = key;
  state.search = '';
  state.bgSel = {};
  render();
  const list = root.querySelector('.cms-list');
  list.innerHTML = '<div class="cms-empty">Loading page...</div>';
  const pg = PAGES.find((p) => p.key === key);
  try {
    const html = await (await fetch(pg.url, { cache: 'no-store' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    state.items = scanText(doc);
    [state.edits, state.published].forEach((m) => { if (m[key]) m[key].text = remapText(m[key].text, state.items); });
    const found = scanAssets(doc);
    state.images = found.images;
    state.docs = found.docs;
    state.ready = true;
    renderPanel();
    const f = iframeEl();
    f.addEventListener('load', wirePreview);
    f.src = `${pg.url}?cms=off`;
  } catch (err) {
    list.innerHTML = `<div class="cms-empty">Could not load this page (${esc(err.message)}).</div>`;
  }
}

// ------------------------------------------------------------------ view switching
let started = false;
async function showView(name) {
  switchBtns.forEach((b) => b.classList.toggle('active', b.dataset.adminView === name));
  submissionsView.style.display = name === 'submissions' ? '' : 'none';
  contentView.style.display = name === 'content' ? '' : 'none';
  if (name === 'content' && !started) {
    started = true;
    root.innerHTML = '<div class="cms-empty">Loading website content...</div>';
    try {
      await loadPublished();
    } catch (e) {
      state.published = {};
      state.edits = {};
    }
    await openPage(state.page, true);
  }
}

switchBtns.forEach((b) => b.addEventListener('click', () => showView(b.dataset.adminView)));
// coming back to this tab: pick up newer publishes automatically when there is nothing unpublished here
window.addEventListener('focus', async () => {
  if (!started || state.busy || totalChanges() > 0) return;
  try {
    const res = await fetch(`${API}?fresh=1`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : null;
    if (data && (data.v || 0) !== state.v) {
      await loadPublished();
      await openPage(state.page, true);
      toast('Updated to the latest published version.');
    }
  } catch (e) { /* offline */ }
});

window.addEventListener('beforeunload', (e) => {
  if (started && totalChanges() > 0) { e.preventDefault(); e.returnValue = ''; }
});
