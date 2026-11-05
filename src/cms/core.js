/**
 * RITHMOS content editor - shared helpers.
 * Used by the public pages (runtime.js) and by /admin (admin.js), so both address the same
 * text, pictures and documents with the same ids.
 *
 * An edit is stored per page:
 *   text:   { "<element path>@<text index>": { o: "original text", v: "new text" } }
 *   assets: { "<original url>": { v: "new url", sel: ["css selectors using it as a background"] } }
 */

export const API = '/.netlify/functions/cms';

export const PAGES = [
  { key: 'home', label: 'Home', url: '/' },
  { key: 'about', label: 'About', url: '/about/' },
  { key: 'competition', label: 'Competition', url: '/competition/' },
  { key: 'sponsors', label: 'Sponsors', url: '/sponsors/' },
  { key: 'contact', label: 'Contact', url: '/contact/' }
];

export function pageKeyFromPath(pathname) {
  const p = (pathname || '/').replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  const hit = PAGES.find((pg) => (pg.url.replace(/\/+$/, '') || '/') === p);
  return hit ? hit.key : null;
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'TEMPLATE', 'OPTION', 'SELECT', 'TEXTAREA', 'CODE', 'TITLE', 'HEAD', 'CANVAS']);

function isSkipped(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName.toUpperCase()) || n.hasAttribute('data-cms-skip')) return true;
  }
  return false;
}

export function elementPath(el, body) {
  const idx = [];
  let cur = el;
  while (cur && cur !== body) {
    const parent = cur.parentElement;
    if (!parent) return null;
    idx.push(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return idx.reverse().join('.');
}

/** Every visible piece of text on a page, in document order. */
export function scanText(doc) {
  const body = doc.body;
  const out = [];
  const counters = new Map();
  const walker = doc.createTreeWalker(body, 4 /* NodeFilter.SHOW_TEXT */);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    if (!raw.trim() || !/[\p{L}\p{N}]/u.test(raw)) continue;
    const parent = node.parentElement;
    if (!parent || isSkipped(parent)) continue;
    const k = counters.get(parent) || 0;
    counters.set(parent, k + 1);
    const path = elementPath(parent, body);
    if (path === null) continue;
    const holder = parent.closest('section[id], header, footer, nav, aside, main');
    out.push({
      id: `${path}@${k}`,
      node,
      orig: raw.trim(),
      tag: parent.tagName.toLowerCase(),
      group: holder ? (holder.id || holder.tagName.toLowerCase()) : 'page'
    });
  }
  return out;
}

const IMG_EXT = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i;
const PDF_EXT = /\.pdf(\?.*)?$/i;

/** Pictures and PDF links used by a page's HTML (CSS backgrounds are added by the admin from the live page). */
export function scanAssets(doc) {
  const images = new Map();
  const docs = new Map();
  const bump = (map, url, extra) => {
    if (!map.has(url)) map.set(url, { url, uses: 0, ...extra });
    map.get(url).uses += 1;
  };
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) bump(images, src, { alt: img.getAttribute('alt') || '' });
  });
  doc.querySelectorAll('[style*="url("]').forEach((el) => {
    const m = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(el.getAttribute('style') || '');
    if (m && IMG_EXT.test(m[1])) bump(images, m[1], { alt: 'background' });
  });
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && PDF_EXT.test(href)) bump(docs, href, { label: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) });
  });
  return { images: [...images.values()], docs: [...docs.values()] };
}

/** Selectors of CSS rules that use `url` as a background (same-origin stylesheets only). */
export function cssBackgroundSelectors(doc) {
  const found = new Map();
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) visit(rule.cssRules);
      if (!rule.selectorText || !rule.style) continue;
      const bg = `${rule.style.backgroundImage || ''} ${rule.style.background || ''}`;
      const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
      let m;
      while ((m = re.exec(bg))) {
        const url = m[1];
        if (!IMG_EXT.test(url)) continue;
        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(rule.selectorText);
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try { visit(sheet.cssRules); } catch (e) { /* cross-origin sheet */ }
  }
  return found;
}
