// V150 i18n: Chinese / English switch for every UI string.
// Classic script, loaded (deferred) right after i18n-en.js and before boot.js.
// Source language is Chinese: keys of the dictionary ARE the Chinese strings, so a
// missing key simply falls back to Chinese (listed with ?i18ndebug=1 → __bcI18n.missing()).
// DOM text is translated by one MutationObserver (text nodes + aria-label/title/placeholder/alt),
// so hard-coded HTML in any module is covered without touching that module. Canvas-drawn text
// calls globalThis.BCi18n.t(zh) at its draw site. Text baked into textures (signs, brands,
// price boards) is world content and is never translated.
(() => {
  'use strict';
  const KEY = 'bumpercrop.lang';
  const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/;
  const DICT = Object.assign({}, globalThis.BC_I18N_EN || {});
  const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE']);
  const debug = /[?&]i18ndebug=1/.test(location.search);
  const missing = new Map();
  const listeners = new Set();
  let lang = 'zh';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem(KEY);
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'zh';
    lang = (q === 'en' || q === 'zh') ? q : (saved === 'en' || saved === 'zh') ? saved : (/^zh/i.test(nav) ? 'zh' : 'en');
  } catch {}

  // ---- string translation -------------------------------------------------
  const PUNCT = { '。': '. ', '，': ', ', '、': ', ', '：': ': ', '；': '; ', '！': '! ', '？': '? ', '（': ' (', '）': ') ', '「': '"', '」': '"', '『': '"', '』': '"', '《': '"', '》': '"', '…': '…', '　': ' ', '～': '~', '／': '/', '－': '-', '＋': '+', '％': '%', '·': '·' };
  let patterns = null, masked = null;
  function compile() {
    patterns = []; masked = new Map();
    for (const [k, v] of Object.entries(DICT)) {
      if (k.includes('{}')) {
        const re = new RegExp('^' + k.split('{}').map(s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&')).join('(.+?)') + '$', 's');
        patterns.push([re, v]);
      }
      if (/\d/.test(k)) masked.set(k.replace(/\d+(?:\.\d+)?/g, '#'), [k, v]);
    }
    patterns.sort((a, b) => b[0].source.length - a[0].source.length);
  }
  const cache = new Map();
  function miss(s) { if (debug && !missing.has(s)) { missing.set(s, 1); console.debug('[i18n] missing:', s); } }
  function tr(src, depth = 0) {
    if (lang === 'zh' || !src || !CJK.test(src)) return src;
    const lead = src.match(/^\s*/)[0], tail = src.match(/\s*$/)[0];
    const s = src.trim();
    if (!s) return src;
    let hit = cache.get(s);
    if (hit === undefined) { hit = lookup(s, depth); cache.set(s, hit); }
    return lead + hit + tail;
  }
  function lookup(s, depth) {
    if (Object.prototype.hasOwnProperty.call(DICT, s)) return DICT[s];
    if (!patterns) compile();
    // numbers masked: "剩余 3 个" matches the key "剩余 1 个"
    if (/\d/.test(s)) {
      const nums = s.match(/\d+(?:\.\d+)?/g); const m = masked.get(s.replace(/\d+(?:\.\d+)?/g, '#'));
      if (m) { let i = 0; return m[1].replace(/\d+(?:\.\d+)?/g, () => nums[i++] ?? ''); }
    }
    for (const [re, v] of patterns) {
      const m = s.match(re);
      if (m) { let i = 1; return v.replace(/\{\}/g, () => depth < 4 ? tr(m[i++] || '', depth + 1) : (m[i++] || '')); }
    }
    if (depth > 5) { miss(s); return s; }
    // split on separators and translate every piece
    // coarse separators first (keeps "名称（说明）" pieces whole for exact keys), then punctuation
    let parts = s.split(/(\s*[·•|\/\n]\s*|\s+-\s+|\s+—\s+)/);
    if (parts.length < 2) parts = s.split(/([。，、：；！？（）「」『』《》…\u3000])/);
    if (parts.length > 1) {
      let out = '';
      for (const p of parts) {
        if (!p) continue;
        if (Object.prototype.hasOwnProperty.call(PUNCT, p)) out += PUNCT[p];
        else if (/^\s*[·•|\/\n]\s*$|^\s+[-—]\s+$/.test(p)) out += p;
        else out += tr(p, depth + 1);
      }
      return out.replace(/ {2,}/g, ' ').replace(/ ([,.:;!?)])/g, '$1').replace(/\( /g, '(').trim();
    }
    // CJK word next to latin/digits ("背包 Tab", "约 503 m")
    const runs = s.split(/(\s+)/);
    if (runs.length > 1) return runs.map(r => /\s/.test(r) ? r : tr(r, depth + 1)).join('');
    miss(s); return s;
  }
  function t(zh, vars) {
    let out = tr(String(zh ?? ''));
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return out;
  }

  // ---- DOM translation ------------------------------------------------------
  const textSrc = new WeakMap();   // Text node -> {src, out}
  const attrSrc = new WeakMap();   // Element -> {attr: {src, out}}
  let busy = false;
  function skipEl(el) {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (SKIP.has(e.tagName) || e.hasAttribute('data-noi18n')) return true;
    }
    return false;
  }
  function doText(n) {
    const v = n.nodeValue; if (v == null) return;
    let rec = textSrc.get(n);
    if (!rec || v !== rec.out) { if (!CJK.test(v) && !rec) return; rec = { src: v, out: v }; textSrc.set(n, rec); }
    const out = tr(rec.src);
    if (out !== n.nodeValue) { rec.out = out; n.nodeValue = out; } else rec.out = out;
  }
  function doAttr(el, a) {
    const v = el.getAttribute(a); if (v == null) return;
    let m = attrSrc.get(el); let rec = m && m[a];
    if (!rec || v !== rec.out) { if (!CJK.test(v) && !rec) return; rec = { src: v, out: v }; if (!m) attrSrc.set(el, m = {}); m[a] = rec; }
    const out = tr(rec.src);
    rec.out = out; if (out !== v) el.setAttribute(a, out);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skipEl(root.parentElement)) doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && skipEl(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: n => (n.nodeType === 1 && (SKIP.has(n.tagName) || n.hasAttribute('data-noi18n'))) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    if (root.nodeType === 1) for (const a of ATTRS) doAttr(root, a);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) doText(n); else for (const a of ATTRS) if (n.hasAttribute(a)) doAttr(n, a);
    }
  }
  const titleRec = { src: '', out: '' };
  function doTitle() {
    const v = document.title;
    if (v !== titleRec.out) titleRec.src = v;
    const out = tr(titleRec.src); titleRec.out = out; if (out !== v) document.title = out;
  }
  function applyAll() {
    busy = true;
    try { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; document.documentElement.dataset.lang = lang; doTitle(); walk(document.body || document.documentElement); syncSelect(); }
    finally { busy = false; }
  }
  const mo = new MutationObserver(list => {
    if (busy) return;
    busy = true;
    try {
      for (const r of list) {
        if (r.type === 'characterData') { if (!skipEl(r.target.parentElement)) doText(r.target); }
        else if (r.type === 'attributes') { if (!skipEl(r.target)) doAttr(r.target, r.attributeName); }
        else for (const n of r.addedNodes) walk(n);
      }
      if (document.title !== titleRec.out) doTitle();
    } finally { busy = false; }
  });

  // ---- settings row (main menu + pause both open #settings) ------------------
  const LABEL = { zh: '语言 / Language', en: 'Language / 语言' };
  function syncSelect() {
    const s = document.getElementById('bc-lang'); if (s && s.value !== lang) s.value = lang;
  }
  function injectSetting() {
    const panel = document.querySelector('#settings .panel'); if (!panel || document.getElementById('bc-lang')) return;
    const row = document.createElement('label');
    row.className = 'setting bc-lang-row';
    row.setAttribute('data-noi18n', '');
    row.innerHTML = '<span>语言 / Language<small>中文 · English</small></span><select id="bc-lang"><option value="zh">中文</option><option value="en">English</option></select>';
    const header = panel.querySelector('.panel-header');
    header ? header.after(row) : panel.prepend(row);
    const sel = row.querySelector('select'); sel.value = lang;
    sel.addEventListener('change', () => setLang(sel.value));
    sel.addEventListener('keydown', e => e.stopPropagation());
  }
  function setLang(next) {
    next = next === 'en' ? 'en' : 'zh';
    if (next === lang) return;
    lang = next; cache.clear();
    try { localStorage.setItem(KEY, lang); } catch {}
    applyAll();
    for (const fn of listeners) { try { fn(lang); } catch (e) { console.warn('i18n listener', e); } }
    try { window.dispatchEvent(new CustomEvent('bc-lang', { detail: { lang } })); } catch {}
  }
  // CSS-generated text (::before/::after content) cannot be reached from the DOM
  const CSS_EN = `html[data-lang=en] #menu .bottomline:after{content:'SHUT DOWN…?'}
html[data-lang=en] #settings .panel:after,html[data-lang=en] #journal .panel:after,html[data-lang=en] #controls .panel:after{content:'BACK OS™ 4.0.011 · M.E.G. TERMINAL\\3000\\3000 ESC CLOSE'}
${globalThis.BC_I18N_CSS_EN || ''}`;
  function start() {
    const st = document.createElement('style'); st.id = 'bc-i18n-css'; st.textContent = CSS_EN; document.head.appendChild(st);
    applyAll();
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const tick = () => injectSetting();
    new MutationObserver(tick).observe(document.body, { childList: true, subtree: false });
    const gm = document.getElementById('game'); if (gm) new MutationObserver(tick).observe(gm, { childList: true });
    tick();
  }
  globalThis.BCi18n = {
    t, setLang,
    get lang() { return lang; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    add(dict) { Object.assign(DICT, dict); patterns = null; cache.clear(); if (lang !== 'zh') applyAll(); },
    missing() { return [...missing.keys()]; },
    refresh: applyAll
  };
  globalThis.__bcI18n = globalThis.BCi18n;
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
