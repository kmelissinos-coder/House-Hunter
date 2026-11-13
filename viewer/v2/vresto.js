/* House Hunter v2 — one data store, one renderer. Built on kit.js (shared base). */
import { esc, $, $$, num, createStore, saved, makeI18n, applyTheme, toast, pagerHTML, lightbox, debounce, fold, matchWords } from './kit.js?v=2';

const BUILD = 'v2.002';
const SB = 'https://ofvanbbujgcqhbiyihgy.supabase.co';
const AK = 'sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr'; // public key, same as the current site
const PER_PAGE = 50, MAP_PER_PAGE = 20;

/* ---------- words ---------- */
const DICT = {
  el: {
    login_title: 'Σύνδεση', user: 'Όνομα χρήστη ή email', pass: 'Κωδικός', login: 'Είσοδος', login_bad: 'Λάθος στοιχεία', remember: 'Να με θυμάσαι',
    hold: 'Ο λογαριασμός σου περιμένει έγκριση.', no_projects: 'Δεν έχεις ακόμα πρόσβαση σε καμία αναζήτηση.',
    search_ph: 'Περιοχή, κωδικός, τηλέφωνο, μεσιτικό, #αριθμός…', filters: 'Φίλτρα', clear: 'Καθαρισμός', homes: 'σπίτια', home1: 'σπίτι', ads: 'αγγελίες', ad1: 'αγγελία',
    grid: 'Κάρτες', list: 'Λίστα', map: 'Χάρτης', logout: 'Έξοδος', old_site: 'Παλιό site', loading: 'Φόρτωση…',
    sort_new: 'Νεότερα πρώτα', sort_p_asc: 'Τιμή ↑', sort_p_desc: 'Τιμή ↓', sort_sqm: 'τ.μ. ↓', sort_ppm: '€/τ.μ. ↑', sort_rate: 'Βαθμολογία ↓', sort_ads: 'Αγγελίες ↓',
    price: 'Τιμή (€)', sqm: 'Εμβαδόν (τ.μ.)', beds: 'Υπνοδωμάτια', from: 'από', to: 'έως', any: 'Όλα', platform: 'Πλατφόρμα', type: 'Τύπος',
    status: 'Κατάσταση', st_live: 'Ενεργά', st_gone: 'Αφαιρέθηκαν', st_all: 'Όλα',
    hidden: 'Κρυμμένα 👎', hid_no: 'Χωρίς', hid_all: 'Μαζί', hid_only: 'Μόνο',
    seen: '«Το είδαμε»', only_priv: 'Μόνο ιδιώτες', only_rated: 'Μόνο με βαθμολογία', only_new: 'Νέα (7 ημέρες)', only_drop: 'Με πτώση τιμής', only_multi: '2+ αγγελίες',
    private: 'ΙΔΙΩΤΗΣ', removed: 'Αφαιρέθηκε', new: 'ΝΕΟ', mo: '/μήνα', bed: 'υ/δ', bath: 'μπ.', page_of: '{a}–{b} από {n}', none: 'Κανένα σπίτι με αυτά τα φίλτρα.',
    in_view: '{n} σπίτια στον χάρτη που βλέπεις', no_pin: '{n} χωρίς θέση στον χάρτη',
    pin_conf: 'Επιβεβαιωμένη θέση', pin_addr: 'Διεύθυνση από αγγελία', pin_approx: 'Κατά προσέγγιση',
    summary: 'Περίληψη', agencies: 'Αγγελίες του σπιτιού', price_hist: 'Ιστορικό τιμών', where: 'Θέση', ratings: 'Βαθμολογίες', notes: 'Σημειώσεις', my_note: 'Η σημείωσή μου…', save: 'Αποθήκευση', saved: 'Αποθηκεύτηκε',
    hide: 'Δεν μας αρέσει', unhide: 'Επαναφορά', mark_seen: 'Το είδαμε', share: 'Αντιγραφή link', copied: 'Το link αντιγράφηκε', open_ad: 'Άνοιγμα', code: 'Κωδ.', descr: 'Περιγραφές αγγελιών',
    floor: 'Όροφος', year: 'Έτος', energy: 'Ενεργειακή', heating: 'Θέρμανση', first_seen: 'Στο αρχείο από', gone_n: '{n} από {m} αγγελίες έχουν αφαιρεθεί', all_gone: 'Όλες οι αγγελίες έχουν αφαιρεθεί',
    no_write: 'Δεν έχεις δικαίωμα αλλαγής εδώ', err: 'Κάτι δεν πήγε καλά — δοκίμασε ξανά', session_end: 'Η σύνδεση έληξε — μπες ξανά',
    video: 'Βίντεο', photos: 'φωτογραφίες', theme: 'Θέμα', from_price: 'από',
  },
  en: {
    login_title: 'Sign in', user: 'Username or email', pass: 'Password', login: 'Sign in', login_bad: 'Wrong username or password', remember: 'Remember me',
    hold: 'Your account is waiting for approval.', no_projects: 'You have no access to any search yet.',
    search_ph: 'Area, code, phone, agency, #number…', filters: 'Filters', clear: 'Clear', homes: 'homes', home1: 'home', ads: 'ads', ad1: 'ad',
    grid: 'Cards', list: 'List', map: 'Map', logout: 'Sign out', old_site: 'Old site', loading: 'Loading…',
    sort_new: 'Newest first', sort_p_asc: 'Price ↑', sort_p_desc: 'Price ↓', sort_sqm: 'm² ↓', sort_ppm: '€/m² ↑', sort_rate: 'Rating ↓', sort_ads: 'Ads ↓',
    price: 'Price (€)', sqm: 'Size (m²)', beds: 'Bedrooms', from: 'from', to: 'to', any: 'Any', platform: 'Platform', type: 'Type',
    status: 'Status', st_live: 'Active', st_gone: 'Removed', st_all: 'All',
    hidden: 'Hidden 👎', hid_no: 'Without', hid_all: 'Include', hid_only: 'Only',
    seen: '"We viewed it"', only_priv: 'Private owners only', only_rated: 'Rated only', only_new: 'New (7 days)', only_drop: 'Price dropped', only_multi: '2+ ads',
    private: 'OWNER', removed: 'Removed', new: 'NEW', mo: '/mo', bed: 'bed', bath: 'bath', page_of: '{a}–{b} of {n}', none: 'No homes match these filters.',
    in_view: '{n} homes in the map area you see', no_pin: '{n} without a map position',
    pin_conf: 'Confirmed position', pin_addr: 'Address from the ad', pin_approx: 'Approximate',
    summary: 'Summary', agencies: 'Ads of this home', price_hist: 'Price history', where: 'Location', ratings: 'Ratings', notes: 'Notes', my_note: 'My note…', save: 'Save', saved: 'Saved',
    hide: 'Not for us', unhide: 'Restore', mark_seen: 'We viewed it', share: 'Copy link', copied: 'Link copied', open_ad: 'Open', code: 'Code', descr: 'Ad descriptions',
    floor: 'Floor', year: 'Year', energy: 'Energy', heating: 'Heating', first_seen: 'In the archive since', gone_n: '{n} of {m} ads have been removed', all_gone: 'All ads have been removed',
    no_write: 'You cannot change this', err: 'Something went wrong — try again', session_end: 'Session ended — sign in again',
    video: 'Video', photos: 'photos', theme: 'Theme', from_price: 'from',
  },
};
const t = makeI18n(DICT, saved.get('hh2_lang', 'el'));
const N = (n) => num(n, t.lang);

/* ---------- session (same storage key as the current site, so one login serves both) ---------- */
const auth = {
  s: null,
  load() {
    for (const st of [localStorage, sessionStorage]) {
      try { const a = JSON.parse(st.getItem('hh_auth') || 'null'); if (a && a.access_token && (!this.s || (a.expires_at || 0) > (this.s.expires_at || 0))) { this.s = a; this.st = st; } } catch (e) {}
    }
    return this.s;
  },
  keep(o, remember) {
    this.s = { access_token: o.access_token, refresh_token: o.refresh_token, expires_at: Date.now() + (o.expires_in || 3600) * 1000, user: o.user || (this.s && this.s.user), remember };
    this.st = remember ? localStorage : sessionStorage;
    try { this.st.setItem('hh_auth', JSON.stringify(this.s)); } catch (e) {}
  },
  clear() { this.s = null; try { localStorage.removeItem('hh_auth'); sessionStorage.removeItem('hh_auth'); } catch (e) {} },
  async refresh() {
    if (!this.s || !this.s.refresh_token) return false;
    if (!this._fl) this._fl = fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: AK, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: this.s.refresh_token }) })
      .then(async (r) => { if (!r.ok) return false; const d = await r.json(); this.keep(d, this.s.remember !== false); return true; })
      .catch(() => false).finally(() => { this._fl = null; });
    return this._fl;
  },
  async login(handle, pass, remember) {
    let email = handle.trim();
    if (!email.includes('@')) {
      const r = await fetch(SB + '/rest/v1/rpc/username_to_email', { method: 'POST', headers: { apikey: AK, 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: email }) });
      const d = r.ok ? await r.json() : null; if (!d) return false; email = d;
    }
    const r = await fetch(SB + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: AK, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
    if (!r.ok) return false; this.keep(await r.json(), remember); return true;
  },
};

async function api(path, { method = 'GET', body, prefer } = {}, retry = true) {
  if (auth.s && auth.s.expires_at && auth.s.expires_at < Date.now() + 30000) await auth.refresh();
  const headers = { apikey: AK, Authorization: 'Bearer ' + (auth.s ? auth.s.access_token : AK) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(SB + '/rest/v1/' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (r.status === 401 && retry) {
    if (await auth.refresh()) return api(path, { method, body, prefer }, false);
    auth.clear(); toast(t('session_end'), 'bad'); store.set({ screen: 'login' }); throw new Error('401');
  }
  if (!r.ok) throw new Error(path.split('?')[0] + ' ' + r.status);
  const txt = await r.text(); return txt ? JSON.parse(txt) : null;
}
const rpc = (fn, args = {}) => api('rpc/' + fn, { method: 'POST', body: args });

/* ---------- state ---------- */
const F0 = { pmin: '', pmax: '', smin: '', smax: '', beds: '', pf: [], ty: [], status: 'live', hid: 'no', seen: 'all', priv: false, rated: false, fresh: false, drop: false, multi: false };
const store = createStore({
  screen: 'boot', status: null, projects: [], project: saved.get('hh2_project', ''), homes: [], loading: false,
  view: saved.get('hh2_view', 'grid'), sort: saved.get('hh2_sort', 'new'), page: 1, mpage: 1, q: '', f: { ...F0 }, showFilters: false,
  theme: saved.get('hh2_theme', 'auto'), open: null,
});
const S = () => store.get();

/* ---------- helpers ---------- */
const thumb = (u, size = 400) => (u && u.includes('/hh-photos/') && !/_t\d+\.jpg$/i.test(u)) ? u.replace(/\.[a-z0-9]+$/i, '') + '_t' + size + '.jpg' : u;
const imgTag = (u, cls, size) => u ? `<img class="${cls}" loading="lazy" decoding="async" src="${esc(thumb(u, size))}" data-full="${esc(u)}" onerror="if(this.src!==this.dataset.full){this.src=this.dataset.full}else{this.classList.add('broken')}" alt="">` : `<div class="${cls} noimg">🏠</div>`;
const range = (a, b, unit = '') => a == null ? '' : (b != null && b !== a ? `${N(a)}–${N(b)}${unit}` : `${N(a)}${unit}`);
const isRental = (h) => (h.p1 || h.p0 || 0) < 20000;
const priceHTML = (h) => {
  if (!h.p0) return '<span class="price muted">—</span>';
  const mo = isRental(h) ? `<small>${t('mo')}</small>` : '';
  return `<span class="price">€${h.p1 && h.p1 !== h.p0 ? N(h.p0) + '–' + N(h.p1) : N(h.p0)}${mo}</span>`;
};
const ppm = (h) => (h.p0 && h.s0) ? h.p0 / h.s0 : null;
const daysAgo = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : 9999;
const dmy = (d) => { if (!d) return ''; const [y, m, dd] = String(d).slice(0, 10).split('-'); return `${dd}/${m}/${y}`; };
const PFC = { 'Spitogatos': '#2b6cb0', 'Indomio': '#c05621', 'xe.gr': '#b7791f', 'plot.gr': '#2f855a', 'Rentola': '#805ad5', 'tospitimou': '#b83280', 'spiti24': '#2c7a7b' };
const pfChips = (pf) => (pf || []).map((p) => `<span class="pf" style="--c:${PFC[p] || '#718096'}">${esc(p)}</span>`).join('');
const stars = (val, hid, cls = '') => `<span class="stars ${cls}" data-h="${esc(hid)}">${[1, 2, 3, 4, 5].map((i) => `<button class="star${i <= (val || 0) ? ' on' : ''}" data-act="rate" data-v="${i}" aria-label="${i}">★</button>`).join('')}</span>`;

function prep(homes) {
  for (const h of homes) h._s = fold([h.loc, h.ty, h.q, '#' + h.h, (h.ids || []).map((i) => '#' + i).join(' '), (h.pf || []).join(' ')].join(' '));
  return homes;
}

function visible(st) {
  const f = st.f, q = st.q.trim();
  const n = (v) => v === '' || v == null ? null : +v;
  const pmin = n(f.pmin), pmax = n(f.pmax), smin = n(f.smin), smax = n(f.smax), beds = n(f.beds);
  let out = st.homes.filter((h) => {
    if (q) { if (!matchWords(h._s, q)) return false; return true; } // a search looks everywhere in the category
    if (f.status === 'live' && h.gone) return false;
    if (f.status === 'gone' && !h.gone) return false;
    if (f.hid === 'no' && h.hid) return false;
    if (f.hid === 'only' && !h.hid) return false;
    if (pmin != null && (h.p1 ?? h.p0 ?? 0) < pmin) return false;
    if (pmax != null && (h.p0 ?? Infinity) > pmax) return false;
    if (smin != null && (h.s1 ?? 0) < smin) return false;
    if (smax != null && (h.s0 ?? Infinity) > smax) return false;
    if (beds != null && (h.b1 ?? 0) < beds) return false;
    if (f.pf.length && !(h.pf || []).some((p) => f.pf.includes(p))) return false;
    if (f.ty.length && !f.ty.includes(h.ty)) return false;
    if (f.seen === 'hide' && h.seen) return false;
    if (f.seen === 'only' && !h.seen) return false;
    if (f.priv && !h.priv) return false;
    if (f.rated && !h.ravg) return false;
    if (f.fresh && daysAgo(h.c0) > 7) return false;
    if (f.drop && !(h.chg && +h.chg[1] < +h.chg[0])) return false;
    if (f.multi && h.n < 2) return false;
    return true;
  });
  const by = {
    new: (a, b) => (b.c1 || '').localeCompare(a.c1 || '') || String(b.h).localeCompare(String(a.h), undefined, { numeric: true }),
    p_asc: (a, b) => (a.p0 ?? 9e15) - (b.p0 ?? 9e15), p_desc: (a, b) => (b.p1 ?? b.p0 ?? 0) - (a.p1 ?? a.p0 ?? 0),
    sqm: (a, b) => (b.s1 ?? 0) - (a.s1 ?? 0), ppm: (a, b) => (ppm(a) ?? 9e15) - (ppm(b) ?? 9e15),
    rate: (a, b) => (b.ravg ?? 0) - (a.ravg ?? 0) || (b.c1 || '').localeCompare(a.c1 || ''), ads: (a, b) => b.n - a.n,
  }[st.sort];
  return by ? out.sort(by) : out;
}
const activeFilters = (f) => Object.keys(F0).filter((k) => JSON.stringify(f[k]) !== JSON.stringify(F0[k])).length;

/* ---------- card ---------- */
function cardHTML(h, compact = false) {
  const badges = [
    `<span class="bd id">#${esc(h.h)}</span>`,
    h.n > 1 ? `<span class="bd n">${h.n} ${t('ads')}</span>` : '',
    h.priv ? `<span class="bd priv">${t('private')}</span>` : '',
    h.gone ? `<span class="bd gone">${t('removed')}${h.goneat ? ' ' + dmy(h.goneat) : ''}</span>` : (daysAgo(h.c0) <= 7 && !h.seen ? `<span class="bd new">${t('new')}</span>` : ''),
  ].join('');
  const chg = h.chg && +h.chg[0] !== +h.chg[1] ? `<span class="chg ${+h.chg[1] < +h.chg[0] ? 'down' : 'up'}" title="${dmy(h.chg[2])}">${+h.chg[1] < +h.chg[0] ? '▼' : '▲'} ${t('from_price')} €${N(h.chg[0])}</span>` : '';
  const pp = ppm(h);
  const chips = [
    h.s0 ? `<span>${range(h.s0, h.s1)} m²</span>` : '', h.b0 != null ? `<span>${range(h.b0, h.b1)} ${t('bed')}</span>` : '',
    h.ba ? `<span>${h.ba} ${t('bath')}</span>` : '', h.fl ? `<span>${esc(h.fl)}</span>` : '', h.yr ? `<span>${h.yr}</span>` : '', h.en ? `<span>${esc(h.en)}</span>` : '',
  ].join('');
  return `<article class="card${h.gone ? ' is-gone' : ''}${h.hid ? ' is-hid' : ''}${h.seen ? ' is-seen' : ''}${compact ? ' compact' : ''}" data-h="${esc(h.h)}" tabindex="0">
    <div class="ph">${imgTag(h.img, 'ph-img', 400)}<div class="badges">${badges}</div></div>
    <div class="cb">
      <div class="row1"><h3 class="loc">${esc(h.loc || '—')}</h3>${priceHTML(h)}</div>
      <div class="row2"><span class="ty">${esc(h.ty || '')}</span><span class="ppm">${chg}${pp ? ` €${pp < 100 ? pp.toFixed(1).replace('.', ',') : N(pp)}/m²` : ''}</span></div>
      <div class="chips">${chips}</div>
      <div class="row3"><div class="pfs">${pfChips(h.pf)}</div>
        <div class="acts">${stars(h.rme || 0, h.h)}${h.ravg && h.ravg !== h.rme ? `<span class="avg" title="avg">${String(h.ravg).replace('.', ',')}</span>` : ''}
          <button class="ib${h.seen ? ' on' : ''}" data-act="seen" title="${t('mark_seen')}">👁</button>
          <button class="ib${h.hid ? ' on' : ''}" data-act="hide" title="${h.hid ? t('unhide') : t('hide')}">👎</button></div></div>
    </div></article>`;
}

/* ---------- screens ---------- */
const app = $('#app');
function renderLogin(msg = '') {
  app.innerHTML = `<div class="login"><form class="login-box" id="lf">
    <div class="brand big"><span class="logo">⌂</span> House Hunter</div><h1>${t('login_title')}</h1>
    <input id="lu" autocomplete="username" placeholder="${t('user')}" required><input id="lp" type="password" autocomplete="current-password" placeholder="${t('pass')}" required>
    <label class="chk"><input type="checkbox" id="lr" checked> ${t('remember')}</label>
    <div class="login-err">${esc(msg)}</div><button class="btn primary" id="lb">${t('login')}</button></form></div>`;
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = $('#lb'); b.disabled = true; b.textContent = '…';
    const ok = await auth.login($('#lu').value, $('#lp').value, $('#lr').checked).catch(() => false);
    if (ok) start(); else renderLogin(t('login_bad'));
  });
}

function shellHTML(st) {
  const nf = activeFilters(st.f);
  return `<header class="top">
    <a class="brand" href="./"><span class="logo">⌂</span><span class="bt">House Hunter</span></a>
    <select id="proj" class="sel strong">${st.projects.map((p) => `<option${p === st.project ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select>
    <div class="search"><span>⌕</span><input id="q" type="search" placeholder="${t('search_ph')}" value="${esc(st.q)}"></div>
    <button class="btn${nf ? ' has' : ''}" id="fbtn">☰ ${t('filters')}${nf ? ` <b>${nf}</b>` : ''}</button>
    <select id="sort" class="sel">${['new', 'p_asc', 'p_desc', 'sqm', 'ppm', 'rate', 'ads'].map((k) => `<option value="${k}"${k === st.sort ? ' selected' : ''}>${t('sort_' + k)}</option>`).join('')}</select>
    <div class="seg" id="views">${[['grid', '▦'], ['list', '☰'], ['map', '🗺']].map(([v, i]) => `<button data-view="${v}" class="${st.view === v ? 'on' : ''}" title="${t(v)}">${i}<span> ${t(v)}</span></button>`).join('')}</div>
    <div class="spacer"></div>
    <button class="ib" id="lang" title="EL / EN">${t.lang === 'el' ? 'EN' : 'ΕΛ'}</button>
    <button class="ib" id="theme" title="${t('theme')}">◐</button>
    <details class="um"><summary>${esc(st.nick || '👤')}</summary><div class="um-box"><a href="../">${t('old_site')}</a><button id="logout">${t('logout')}</button><small>${BUILD}</small></div></details>
  </header>
  <aside class="filters${st.showFilters ? ' open' : ''}" id="fp"></aside>
  <main id="main"></main>`;
}

function filtersHTML(st) {
  const f = st.f, pfs = [...new Set(st.homes.flatMap((h) => h.pf || []))].sort(), tys = [...new Set(st.homes.map((h) => h.ty).filter(Boolean))].sort();
  const seg = (k, opts) => `<div class="seg small" data-seg="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${f[k] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const tog = (k, l) => `<label class="chk"><input type="checkbox" data-f="${k}"${f[k] ? ' checked' : ''}> ${l}</label>`;
  const multi = (k, opts) => `<div class="pills" data-multi="${k}">${opts.map((o) => `<button data-v="${esc(o)}" class="${f[k].includes(o) ? 'on' : ''}">${esc(o)}</button>`).join('')}</div>`;
  const rng = (a, b) => `<div class="rng"><input type="number" inputmode="numeric" data-f="${a}" placeholder="${t('from')}" value="${esc(f[a])}"><span>–</span><input type="number" inputmode="numeric" data-f="${b}" placeholder="${t('to')}" value="${esc(f[b])}"></div>`;
  return `<div class="fh"><b>${t('filters')}</b><button class="link" id="fclear">${t('clear')}</button><button class="ib" id="fclose">✕</button></div>
    <div class="fg"><label>${t('status')}</label>${seg('status', [['live', t('st_live')], ['gone', t('st_gone')], ['all', t('st_all')]])}</div>
    <div class="fg"><label>${t('price')}</label>${rng('pmin', 'pmax')}</div>
    <div class="fg"><label>${t('sqm')}</label>${rng('smin', 'smax')}</div>
    <div class="fg"><label>${t('beds')}</label>${seg('beds', [['', t('any')], ['2', '2+'], ['3', '3+'], ['4', '4+'], ['5', '5+']])}</div>
    <div class="fg"><label>${t('platform')}</label>${multi('pf', pfs)}</div>
    <div class="fg"><label>${t('type')}</label>${multi('ty', tys)}</div>
    <div class="fg"><label>${t('hidden')}</label>${seg('hid', [['no', t('hid_no')], ['all', t('hid_all')], ['only', t('hid_only')]])}</div>
    <div class="fg"><label>${t('seen')}</label>${seg('seen', [['all', t('any')], ['hide', t('hid_no')], ['only', t('hid_only')]])}</div>
    <div class="fg col">${tog('priv', t('only_priv'))}${tog('multi', t('only_multi'))}${tog('fresh', t('only_new'))}${tog('drop', t('only_drop'))}${tog('rated', t('only_rated'))}</div>`;
}

let lastShellKey = '', map = null, markers = null, markerById = new Map(), lastMarkerKey = '';
function render(st) {
  applyTheme(st.theme);
  document.documentElement.lang = t.lang;
  if (st.screen === 'boot') { app.innerHTML = `<div class="center"><div class="spin"></div></div>`; return; }
  if (st.screen === 'login') { if (!$('.login')) renderLogin(); lastShellKey = ''; return; }
  if (st.screen === 'msg') { app.innerHTML = `<div class="center"><p>${esc(st.msg)}</p><button class="btn" id="logout">${t('logout')}</button></div>`; $('#logout').onclick = logout; lastShellKey = ''; return; }
  const shellKey = [t.lang, st.project, st.projects.join(), st.view, st.sort, st.nick].join('|');
  if (shellKey !== lastShellKey) {
    const hadFocus = document.activeElement && document.activeElement.id === 'q';
    const keepMap = map && st.view === 'map' && $('#mapbox');
    const mapEl = keepMap ? $('#mapwrap') : null;
    app.innerHTML = shellHTML(st); lastShellKey = shellKey;
    if (!keepMap && map) { map.remove(); map = null; markers = null; lastMarkerKey = ''; }
    $('#main').dataset.view = st.view;
    if (mapEl) { $('#main').innerHTML = ''; $('#main').appendChild(mapEl); }
    if (hadFocus) { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  const nf = activeFilters(st.f), fb = $('#fbtn'), fp = $('#fp'), ae = document.activeElement;
  fb.classList.toggle('has', !!nf); fb.innerHTML = '☰ ' + t('filters') + (nf ? ' <b>' + nf + '</b>' : '');
  fp.classList.toggle('open', st.showFilters); document.body.classList.toggle('with-filters', st.showFilters);
  if (!(ae && ae.type === 'number' && fp.contains(ae))) fp.innerHTML = filtersHTML(st);
  const list = visible(st);
  if (st.loading) { $('#main').innerHTML = `<div class="center"><div class="spin"></div><p>${t('loading')}</p></div>`; if (map) { map.remove(); map = null; markers = null; lastMarkerKey = ''; } return; }
  if (st.view === 'map') renderMap(st, list); else renderList(st, list);
}

function renderList(st, list) {
  if (map) { map.remove(); map = null; markers = null; lastMarkerKey = ''; }
  const main = $('#main'), pages = Math.max(1, Math.ceil(list.length / PER_PAGE)), page = Math.min(st.page, pages);
  const slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const nAds = list.reduce((a, h) => a + h.n, 0);
  const label = `${N(list.length)} ${list.length === 1 ? t('home1') : t('homes')} · ${N(nAds)} ${t('ads')}` + (list.length ? ' · ' + t('page_of', { a: (page - 1) * PER_PAGE + 1, b: (page - 1) * PER_PAGE + slice.length, n: N(list.length) }) : '');
  const pg = pagerHTML(page, pages, list.length, label);
  main.dataset.view = st.view;
  main.innerHTML = pg + (slice.length ? `<div class="${st.view === 'list' ? 'rows' : 'grid'}">${slice.map((h) => cardHTML(h, st.view === 'list')).join('')}</div>` + pagerHTML(page, pages, list.length, '') : `<div class="center"><p>${t('none')}</p></div>`);
}

function renderMap(st, list) {
  const main = $('#main'); main.dataset.view = 'map';
  if (!$('#mapwrap')) {
    main.innerHTML = `<div id="mapwrap"><div id="mlist"></div><div id="mapside"><div id="mapbox"></div><div class="legend"><span><i style="background:var(--ok)"></i>${t('pin_conf')}</span><span><i style="background:var(--blue)"></i>${t('pin_addr')}</span><span><i style="background:var(--warn)"></i>${t('pin_approx')}</span></div></div></div>`;
    if (innerWidth > 900) $('#mapwrap').style.height = (innerHeight - $('.top').offsetHeight) + 'px';
    map = L.map('mapbox', { preferCanvas: true, zoomControl: true }).setView([38.07, 23.82], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    markers = L.layerGroup().addTo(map); lastMarkerKey = '';
    map.on('moveend', () => { store.set({ mpage: 1 }); });
  }
  const withPin = list.filter((h) => h.pin);
  const key = st.project + '|' + withPin.length + '|' + withPin.slice(0, 40).map((h) => h.h).join(',') + '|' + st.q;
  if (key !== lastMarkerKey) {
    lastMarkerKey = key; markers.clearLayers(); markerById.clear();
    const css = getComputedStyle(document.documentElement), col = [css.getPropertyValue('--warn').trim(), css.getPropertyValue('--blue').trim(), css.getPropertyValue('--ok').trim()];
    for (const h of withPin) {
      const m = L.circleMarker([h.pin[0], h.pin[1]], { radius: 7, weight: 1.5, color: '#fff', fillColor: col[h.pin[2]] || col[0], fillOpacity: h.gone ? 0.35 : 0.95 });
      m.bindTooltip(`#${h.h} · ${h.p0 ? '€' + N(h.p0) : ''} · ${h.s0 ? N(h.s0) + ' m²' : ''}`, { direction: 'top' });
      m.on('click', () => openHome(h.h)); m.addTo(markers); markerById.set(String(h.h), m);
    }
    if (withPin.length) { try { map.fitBounds(L.latLngBounds(withPin.map((h) => [h.pin[0], h.pin[1]])).pad(0.05), { animate: false }); } catch (e) {} }
  }
  const b = map.getBounds(), inView = withPin.filter((h) => b.contains([h.pin[0], h.pin[1]]));
  const pages = Math.max(1, Math.ceil(inView.length / MAP_PER_PAGE)), page = Math.min(st.mpage, pages);
  const slice = inView.slice((page - 1) * MAP_PER_PAGE, page * MAP_PER_PAGE);
  const noPin = list.length - withPin.length;
  const label = t('in_view', { n: N(inView.length) }) + (noPin ? ' · ' + t('no_pin', { n: N(noPin) }) : '');
  $('#mlist').innerHTML = pagerHTML(page, pages, inView.length, label) + `<div class="mcards">${slice.map((h) => cardHTML(h)).join('')}</div>` + pagerHTML(page, pages, inView.length, '');
  $('#mlist').dataset.mp = '1';
}

/* ---------- home overlay ---------- */
async function openHome(hid, push = true) {
  const st = S(), h = st.homes.find((x) => String(x.h) === String(hid));
  if (push) history.pushState({ h: hid }, '', '#p=' + encodeURIComponent(st.project) + '&h=' + encodeURIComponent(hid));
  let ov = $('#ov'); if (!ov) { ov = document.createElement('div'); ov.id = 'ov'; document.body.appendChild(ov); }
  document.body.classList.add('noscroll');
  ov.innerHTML = `<div class="ov-box"><button class="ov-x" data-act="close">✕</button><div class="center"><div class="spin"></div></div></div>`;
  ov.dataset.h = hid;
  try {
    const d = await rpc('hh2_home', { p_project: st.project, p_hid: String(hid) });
    if (ov.dataset.h !== String(hid) || !$('#ov')) return;
    ov.innerHTML = homeHTML(h, d); ov._d = d;
    const pins = d.ads.filter((a) => a.lat && a.lng);
    if (pins.length) {
      const m = L.map($('#ov-map'), { scrollWheelZoom: false }).setView([pins[0].lat, pins[0].lng], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      const css = getComputedStyle(document.documentElement);
      pins.forEach((a) => L.circleMarker([a.lat, a.lng], { radius: 7, weight: 1.5, color: '#fff', fillOpacity: 0.9, fillColor: css.getPropertyValue(a.conf ? '--ok' : (a.addr || (a.rad != null && a.rad <= 60)) ? '--blue' : '--warn').trim() }).bindTooltip(`#${a.no} ${a.pf || ''}`).addTo(m));
      if (pins.length > 1) m.fitBounds(L.latLngBounds(pins.map((a) => [a.lat, a.lng])).pad(0.3), { maxZoom: 16 });
      ov._map = m;
    }
    if (h && !h.seenOpen) h.seenOpen = true;
  } catch (e) { $('.ov-box', ov).innerHTML = `<button class="ov-x" data-act="close">✕</button><div class="center"><p>${t('err')}</p></div>`; }
}
function closeHome(pop = false) {
  const ov = $('#ov'); if (!ov) return; if (ov._map) ov._map.remove(); ov.remove(); document.body.classList.remove('noscroll');
  if (!pop) history.pushState({}, '', location.pathname + location.search);
}

function homeHTML(h, d) {
  const ads = d.ads || [], live = ads.filter((a) => !a.del), imgs = d.imgs || [];
  h = h || { h: d.h, n: ads.length, pf: [...new Set(ads.map((a) => a.pf))] };
  const u = (k) => [...new Set(ads.map((a) => a[k]).filter((v) => v != null && v !== ''))];
  const field = (label, vals) => vals.length ? `<div class="fld"><small>${label}</small><b>${vals.map(esc).join(' · ')}</b></div>` : '';
  const goneN = ads.length - live.length;
  const myNote = (d.notes || []).find((n) => n.me), others = (d.notes || []).filter((n) => !n.me);
  const tel = (s) => String(s || '').split(/[,;|\s]+/).filter((x) => x.replace(/\D/g, '').length >= 10).map((x) => `<a href="tel:${esc(x.replace(/[^\d+]/g, ''))}">${esc(x)}</a>`).join(' ');
  const descs = ads.filter((a) => a.desc && a.desc.trim().length > 20);
  return `<div class="ov-box"><button class="ov-x" data-act="close">✕</button>
  <div class="ov-head"><div><div class="badges inl"><span class="bd id">#${esc(h.h)}</span>${h.priv ? `<span class="bd priv">${t('private')}</span>` : ''}${pfChips(h.pf)}</div>
    <h2>${esc(h.loc || (ads[0] && ads[0].loc) || '')} <span class="ty">${esc(h.ty || '')}</span></h2></div>
    <div class="ov-price">${h.p0 !== undefined ? priceHTML(h) : ''}<div class="ov-acts">${stars(h.rme || 0, h.h, 'big')}
      <button class="btn sm${h.seen ? ' on' : ''}" data-act="seen" data-h="${esc(h.h)}">👁 ${t('mark_seen')}</button>
      <button class="btn sm${h.hid ? ' on' : ''}" data-act="hide" data-h="${esc(h.h)}">👎 ${h.hid ? t('unhide') : t('hide')}</button>
      <button class="btn sm" data-act="share">🔗 ${t('share')}</button></div></div></div>
  ${goneN ? `<div class="banner bad">⛔ ${goneN === ads.length ? t('all_gone') : t('gone_n', { n: goneN, m: ads.length })}</div>` : ''}
  <div class="gal">${imgs.length ? `<div class="gal-main" data-act="lb" data-i="0">${imgTag(imgs[0], 'gm', 900)}<span class="gal-n">${imgs.length} ${t('photos')}</span></div>
    <div class="gal-strip">${imgs.slice(1, 60).map((x, i) => `<button data-act="lb" data-i="${i + 1}">${imgTag(x, 'gt', 400)}</button>`).join('')}</div>` : `<div class="gal-main"><div class="gm noimg">🏠</div></div>`}</div>
  <div class="flds">${h.s0 ? `<div class="fld"><small>m²</small><b>${range(h.s0, h.s1)}</b></div>` : ''}${h.b0 != null ? `<div class="fld"><small>${t('beds')}</small><b>${range(h.b0, h.b1)}</b></div>` : ''}
    ${field(t('floor'), u('fl'))}${field(t('year'), u('yr'))}${field(t('energy'), u('en'))}${field(t('heating'), u('he').slice(0, 3))}${h.c0 ? `<div class="fld"><small>${t('first_seen')}</small><b>${dmy(h.c0)}</b></div>` : ''}</div>
  ${d.summary ? `<section><h4>${t('summary')}</h4><p class="sum">${esc(d.summary)}</p></section>` : ''}
  <section><h4>${t('agencies')} (${ads.length})</h4><div class="offers">${ads.map((a) => `<div class="offer${a.del ? ' del' : ''}">
      <div class="of-a"><b>${esc(a.ag || '—')}</b><small>${pfChips([a.pf])} #${a.no}${a.agnr ? ` · ${t('code')} ${esc(a.agnr)}` : ''}${a.del ? ` · ⛔ ${t('removed')} ${dmy(a.goneat)}` : ''}</small></div>
      <div class="of-b">${a.price ? '€' + N(a.price) : '—'}<small>${[a.sqm ? N(a.sqm) + ' m²' : '', a.beds ? esc(a.beds) + ' ' + t('bed') : '', a.fl ? esc(a.fl) : ''].filter(Boolean).join(' · ')}</small></div>
      <div class="of-c">${tel(a.tel)}${a.vid ? `<a href="${esc(a.vid)}" target="_blank" rel="noopener">▶ ${t('video')}</a>` : ''}<a class="btn sm" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${t('open_ad')} ↗</a></div></div>`).join('')}</div></section>
  ${(d.prices || []).length ? `<section><h4>${t('price_hist')}</h4><div class="ph-list">${d.prices.map((p) => `<div><span>${dmy(p.at)}</span><span>${esc(p.ag || p.pf || '')} #${p.no}</span><b class="${+p.new < +p.old ? 'down' : 'up'}">€${N(p.old)} → €${N(p.new)}</b></div>`).join('')}</div></section>` : ''}
  <section class="two"><div><h4>${t('where')}</h4>${ads.some((a) => a.lat) ? `<div id="ov-map"></div>` : '<p class="muted">—</p>'}${u('addr').length ? `<p class="muted">${u('addr').map(esc).join(' · ')}</p>` : ''}</div>
    <div><h4>${t('ratings')} & ${t('notes')}</h4>
      <div class="rt">${(d.ratings || []).map((r) => `<span class="rt-i"><b>${esc(r.u)}</b> ${'★'.repeat(r.r)}</span>`).join('') || ''}</div>
      ${others.map((n) => `<div class="note"><b>${esc(n.u)}</b> <small>${dmy(n.at)}</small><p>${esc(n.t)}</p></div>`).join('')}
      <textarea id="note" rows="3" placeholder="${t('my_note')}">${esc(myNote ? myNote.t : '')}</textarea><button class="btn sm primary" data-act="note" data-h="${esc(h.h)}">${t('save')}</button></div></section>
  ${descs.length ? `<section><h4>${t('descr')}</h4>${descs.map((a) => `<details class="desc"><summary>${esc(a.ag || a.pf || '')} · #${a.no}</summary><p>${esc(a.desc)}</p></details>`).join('')}</section>` : ''}
  </div>`;
}

/* ---------- saves ---------- */
const homeById = (hid) => S().homes.find((x) => String(x.h) === String(hid));
const touch = () => store.set({ homes: S().homes });
async function act(kind, hid, v) {
  const h = homeById(hid), uid = auth.s && auth.s.user && auth.s.user.id; if (!h || !uid) return;
  try {
    if (kind === 'rate') {
      const val = h.rme === v ? 0 : v; h.rme = val || undefined; touch();
      if (val) await api('user_ratings?on_conflict=user_id,house_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { user_id: uid, house_id: String(hid), rating: val } });
      else await api(`user_ratings?user_id=eq.${uid}&house_id=eq.${encodeURIComponent(hid)}`, { method: 'DELETE' });
    } else if (kind === 'seen') {
      h.seen = !h.seen; touch();
      if (h.seen) await api('user_seen?on_conflict=user_id,house_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { user_id: uid, house_id: String(hid) } });
      else await api(`user_seen?user_id=eq.${uid}&house_id=eq.${encodeURIComponent(hid)}`, { method: 'DELETE' });
    } else if (kind === 'hide') {
      const to = !h.hid, key = String(hid).startsWith('L') ? `hhl_id=eq.${String(hid).slice(1)}` : `house_id=eq.${encodeURIComponent(hid)}`;
      const rows = await api(`listings?project=eq.${encodeURIComponent(S().project)}&${key}&select=id`, { method: 'PATCH', prefer: 'return=representation', body: { hidden: to } });
      if (!rows || !rows.length) { toast(t('no_write'), 'bad'); return; }
      h.hid = to || undefined; touch();
    } else if (kind === 'note') {
      await api('user_notes?on_conflict=user_id,house_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { user_id: uid, house_id: String(hid), note_text: v } });
      toast(t('saved'), 'ok');
    }
    const ov = $('#ov'); // keep the open home in step
    if (ov && ov.dataset.h === String(hid) && kind !== 'note') {
      $$('[data-act="seen"]', ov).forEach((b) => b.classList.toggle('on', !!h.seen));
      $$('[data-act="hide"]', ov).forEach((b) => { b.classList.toggle('on', !!h.hid); b.innerHTML = '👎 ' + (h.hid ? t('unhide') : t('hide')); });
      $$('.stars .star', ov).forEach((b) => b.classList.toggle('on', +b.dataset.v <= (h.rme || 0)));
    }
  } catch (e) { if (e.message !== '401') toast(t('err'), 'bad'); }
}

/* ---------- events (one listener for the whole page) ---------- */
document.addEventListener('click', (e) => {
  const st = S(), a = e.target.closest('[data-act]');
  if (a) {
    const hid = a.dataset.h || (a.closest('[data-h]') || {}).dataset?.h, k = a.dataset.act;
    if (k === 'close') return closeHome();
    if (k === 'lb') { const d = $('#ov')._d; return lightbox(d.imgs, +a.dataset.i); }
    if (k === 'share') { navigator.clipboard.writeText(location.href).then(() => toast(t('copied'), 'ok')); return; }
    if (k === 'note') return act('note', hid, $('#note').value);
    if (k === 'rate') { e.stopPropagation(); return act('rate', hid, +a.dataset.v); }
    e.stopPropagation(); return act(k, hid);
  }
  if (e.target.id === 'ov') return closeHome();
  const pg = e.target.closest('.pg[data-page]');
  if (pg && !pg.disabled) { const inMap = pg.closest('#mlist'); store.set(inMap ? { mpage: +pg.dataset.page } : { page: +pg.dataset.page }); (inMap ? $('#mlist') : window).scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const card = e.target.closest('.card'); if (card && !e.target.closest('a,button')) return openHome(card.dataset.h);
  const vb = e.target.closest('#views button'); if (vb) { saved.set('hh2_view', vb.dataset.view); return store.set({ view: vb.dataset.view, page: 1, mpage: 1 }); }
  if (e.target.closest('#fbtn')) return store.set({ showFilters: !st.showFilters });
  if (e.target.closest('#fclose')) return store.set({ showFilters: false });
  if (e.target.closest('#fclear')) return store.set({ f: { ...F0 }, page: 1, mpage: 1 });
  const sg = e.target.closest('[data-seg] button'); if (sg) return store.set({ f: { ...st.f, [sg.parentNode.dataset.seg]: sg.dataset.v }, page: 1, mpage: 1 });
  const ml = e.target.closest('[data-multi] button'); if (ml) { const k = ml.parentNode.dataset.multi, v = ml.dataset.v, cur = st.f[k]; return store.set({ f: { ...st.f, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }, page: 1, mpage: 1 }); }
  if (e.target.closest('#lang')) { t.lang = t.lang === 'el' ? 'en' : 'el'; saved.set('hh2_lang', t.lang); lastMarkerKey = ''; return store.set({}); }
  if (e.target.closest('#theme')) { const cur = document.documentElement.dataset.theme, nx = cur === 'dark' ? 'light' : 'dark'; saved.set('hh2_theme', nx); lastMarkerKey = ''; return store.set({ theme: nx }); }
  if (e.target.closest('#logout')) return logout();
});
document.addEventListener('change', (e) => {
  const st = S(), el = e.target;
  if (el.id === 'proj') { saved.set('hh2_project', el.value); store.set({ project: el.value, f: { ...F0 }, q: '', page: 1, mpage: 1 }); return loadHomes(); }
  if (el.id === 'sort') { saved.set('hh2_sort', el.value); return store.set({ sort: el.value, page: 1, mpage: 1 }); }
  if (el.dataset.f && el.type === 'checkbox') return store.set({ f: { ...st.f, [el.dataset.f]: el.checked }, page: 1, mpage: 1 });
});
const typed = debounce((el) => {
  const st = S();
  if (el.id === 'q') store.set({ q: el.value, page: 1, mpage: 1 });
  else if (el.dataset.f) { st.f[el.dataset.f] = el.value; store.set({ page: 1, mpage: 1 }); }
}, 250);
document.addEventListener('input', (e) => { if (e.target.id === 'q' || (e.target.dataset.f && e.target.type === 'number')) typed(e.target); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#ov') && !$('.lb')) closeHome();
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('card')) openHome(e.target.dataset.h);
});
window.addEventListener('popstate', route);

/* ---------- start ---------- */
function hashArgs() { const o = {}; location.hash.replace(/^#/, '').split('&').forEach((p) => { const [k, v] = p.split('='); if (k) o[k] = decodeURIComponent(v || ''); }); return o; }
function route() { const a = hashArgs(); if (a.h && S().homes.length) openHome(a.h, false); else closeHome(true); }
function logout() { auth.clear(); closeHome(true); store.set({ screen: 'login', homes: [] }); }

async function loadHomes() {
  const p = S().project; store.set({ loading: true });
  try {
    const t0 = performance.now(), homes = prep(await rpc('hh2_homes', { p_project: p }));
    if (S().project !== p) return;
    console.info('[hh2] ' + p + ': ' + homes.length + ' homes in ' + Math.round(performance.now() - t0) + ' ms');
    store.set({ homes, loading: false }); queueMicrotask(route);
  } catch (e) { if (e.message !== '401') { toast(t('err'), 'bad'); store.set({ loading: false }); } }
}

async function start() {
  store.set({ screen: 'boot' });
  if (!auth.load()) return store.set({ screen: 'login' });
  try {
    const status = await rpc('hh_my_status');
    const projects = status.projects || [];
    if (status.hold) return store.set({ screen: 'msg', msg: t('hold') });
    if (!projects.length) return store.set({ screen: 'msg', msg: t('no_projects') });
    const a = hashArgs(); let project = a.p && projects.includes(a.p) ? a.p : S().project; if (!projects.includes(project)) project = projects[0];
    store.set({ screen: 'app', status, projects, project, nick: (auth.s.user && auth.s.user.email || '').split('@')[0] });
    api('profiles?id=eq.' + auth.s.user.id + '&select=username').then((d) => { if (d && d[0] && d[0].username) store.set({ nick: d[0].username }); }).catch(() => {});
    loadHomes();
  } catch (e) { if (e.message !== '401') store.set({ screen: 'login' }); }
}
store.sub(render);
applyTheme(S().theme);
start();
