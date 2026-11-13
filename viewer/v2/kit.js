/* Board kit — the shared base for the "collect listings → one card per item" sites
   (House Hunter first; the machinery boards plug in the same way).
   Nothing in this file knows about houses: a site passes its own data and card template. */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const num = (n, lang = 'el') => (n == null || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString(lang === 'el' ? 'el-GR' : 'en-GB', { maximumFractionDigits: 0 });

/* --- tiny store: one state object, one render per change --- */
export function createStore(initial) {
  let state = initial, subs = [], queued = false;
  const flush = () => { queued = false; subs.forEach((f) => f(state)); };
  return {
    get: () => state,
    set(patch) { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; if (!queued) { queued = true; queueMicrotask(flush); } },
    sub(f) { subs.push(f); },
  };
}

/* --- saved settings (per browser) --- */
export const saved = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* --- language --- */
export function makeI18n(dict, lang) {
  const t = (k, vars) => {
    let s = (dict[t.lang] && dict[t.lang][k]) ?? dict.el[k] ?? k;
    if (vars) for (const v in vars) s = s.replaceAll('{' + v + '}', vars[v]);
    return s;
  };
  t.lang = lang;
  return t;
}

/* --- theme --- */
export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

/* --- toast --- */
export function toast(msg, kind = '') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg; box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

/* --- pager: page buttons, used above AND below every list --- */
export function pagerHTML(page, pages, total, label) {
  if (pages <= 1) return `<div class="pager"><span class="pager-info">${esc(label)}</span></div>`;
  const want = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1]);
  const list = [...want].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  let out = '', prev = 0;
  for (const p of list) {
    if (p - prev > 1) out += '<span class="pager-gap">…</span>';
    out += `<button class="pg${p === page ? ' on' : ''}" data-page="${p}">${p}</button>`; prev = p;
  }
  return `<div class="pager"><span class="pager-info">${esc(label)}</span>
    <div class="pager-btns"><button class="pg nav" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>${out}<button class="pg nav" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button></div></div>`;
}

/* --- full-screen photo viewer --- */
export function lightbox(urls, start = 0) {
  if (!urls || !urls.length) return;
  let i = start;
  const box = document.createElement('div'); box.className = 'lb';
  box.innerHTML = `<button class="lb-x" aria-label="close">✕</button><button class="lb-nav prev">‹</button><img class="lb-img" alt=""><button class="lb-nav next">›</button><div class="lb-count"></div>`;
  const img = $('.lb-img', box), cnt = $('.lb-count', box);
  const show = () => { img.src = urls[i]; cnt.textContent = (i + 1) + ' / ' + urls.length; };
  const go = (d) => { i = (i + d + urls.length) % urls.length; show(); };
  const close = () => { document.removeEventListener('keydown', key, true); box.remove(); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
  box.addEventListener('click', (e) => {
    if (e.target.closest('.prev')) go(-1); else if (e.target.closest('.next')) go(1);
    else if (e.target.closest('.lb-x') || e.target === box) close();
  });
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); x0 = null; });
  document.addEventListener('keydown', key, true);
  document.body.appendChild(box); show();
}

/* --- debounce --- */
export const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

/* --- text search: every typed word must be found (accents and case ignored) --- */
export const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ');
export function matchWords(haystack, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
}
