/**
 * RITHMOS content runtime - runs on every public page.
 * Loads the edits published from /admin and applies them to the page, so a change made in the
 * admin is live for every visitor on their next page load (no rebuild needed).
 *
 * The text map is built before any other script touches the page, so ids always match the
 * original HTML that /admin scanned.
 */
import { API, pageKeyFromPath, scanText, remapText } from './core.js';

const CACHE_KEY = 'rithmos-cms-v1';
const params = new URLSearchParams(window.location.search);
const preview = params.get('cms') === 'off'; // the admin preview scans the untouched page
const page = pageKeyFromPath(window.location.pathname);

const textItems = new Map(); // id -> { node, orig, full }
const changedAttrs = []; // { el, attr, value }
const changedText = new Set();
let styleEl = null;

function build() {
  if (!page) return;
  scanText(document).forEach((it) => textItems.set(it.id, { node: it.node, orig: it.orig, full: it.node.nodeValue }));
}

function revert() {
  changedText.forEach((id) => {
    const t = textItems.get(id);
    if (t) t.node.nodeValue = t.full;
  });
  changedText.clear();
  changedAttrs.splice(0).forEach(({ el, attr, value }) => {
    if (value === null) el.removeAttribute(attr);
    else el.setAttribute(attr, value);
  });
  if (styleEl) {
    styleEl.remove();
    styleEl = null;
  }
}

function setAttr(el, attr, value) {
  changedAttrs.push({ el, attr, value: el.getAttribute(attr) });
  el.setAttribute(attr, value);
}

export function apply(edits) {
  revert();
  if (!edits) return;

  const items = [...textItems].map(([id, t]) => ({ id, orig: t.orig }));
  const text = remapText(edits.text || {}, items);
  Object.keys(text).forEach((id) => {
    const t = textItems.get(id);
    const rec = text[id];
    if (!t || !rec || t.orig !== rec.o) return; // the page text changed since this edit was made
    const lead = t.full.match(/^\s*/)[0];
    const trail = t.full.match(/\s*$/)[0];
    t.node.nodeValue = lead + rec.v + trail;
    changedText.add(id);
  });

  const assets = edits.assets || {};
  const css = [];
  Object.keys(assets).forEach((orig) => {
    const rec = assets[orig];
    if (!rec || !rec.v) return;
    document.querySelectorAll('img[src]').forEach((img) => {
      if (img.getAttribute('src') === orig) {
        setAttr(img, 'src', rec.v);
        if (img.hasAttribute('srcset')) setAttr(img, 'srcset', '');
      }
    });
    document.querySelectorAll('a[href]').forEach((a) => {
      if (a.getAttribute('href') === orig) setAttr(a, 'href', rec.v);
    });
    document.querySelectorAll('[style*="url("]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      if (style.includes(orig)) setAttr(el, 'style', style.split(orig).join(rec.v));
    });
    (rec.sel || []).forEach((sel) => css.push(`${sel}{background-image:url("${rec.v}") !important;}`));
  });
  if (css.length) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-cms', '');
    styleEl.textContent = css.join('\n');
    document.head.appendChild(styleEl);
  }
}

/** For the admin preview: which text id was clicked, and where is an id on screen. */
function pick(target) {
  let el = target;
  for (let depth = 0; el && depth < 4; depth += 1, el = el.parentElement) {
    for (const [id, t] of textItems) {
      if (t.node.parentElement === el) return id;
    }
  }
  return null;
}

function locate(id) {
  const t = textItems.get(id);
  return t && t.node.parentElement;
}

function boot() {
  build();
  window.__cms = { apply, pick, locate, page };
  if (preview || !page) return Promise.resolve();

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && cached.pages) apply(cached.pages[page]);
  } catch (e) { /* no cache */ }

  // no timeout on purpose: nothing waits for this, and on a busy phone a short timeout dropped the edits
  return fetch(API)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || !data.pages) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* storage full */ }
      apply(data.pages[page]);
    })
    .catch(() => { /* offline: the cached edits stay applied */ });
}

window.__cmsReady = boot();
