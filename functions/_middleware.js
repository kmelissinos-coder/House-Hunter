/**
 * House Hunter — link previews for WhatsApp, Viber, Messenger, Slack.
 *
 * WHY THIS EXISTS: the app is one static HTML file that renders everything with
 * JavaScript. A chat app's link crawler does NOT run JavaScript — it reads the
 * raw HTML, finds no <meta property="og:*">, and shows a bare link with no
 * picture. That is why pasting https://vresto.pages.dev/?house=1191 into
 * WhatsApp showed no thumbnail.
 *
 * WHAT IT DOES: when a request carries ?house=<id>, this Cloudflare Pages
 * middleware asks Supabase for that house, then streams the normal page through
 * HTMLRewriter and injects the Open Graph tags into <head>. The browser is
 * unaffected — same page, same JavaScript — only the crawler sees the extra tags.
 *
 * Everything is wrapped in try/catch: if Supabase is slow or the id is unknown,
 * the untouched page is served.
 */

const SB = 'https://ofvanbbujgcqhbiyihgy.supabase.co/rest/v1';
const AK = 'sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Cloudinary can crop to the 1.91:1 box the chat apps want, so we never ship a
   4 MB original into a preview. Non-Cloudinary urls are passed through. */
function ogImage(url) {
  if (!url) return null;
  const u = String(url);
  if (u.indexOf('/image/upload/') < 0) return u;
  return u.replace('/image/upload/', '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
}

function money(n) {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return null;
  return '€' + v.toLocaleString('el-GR');
}

class HeadInjector {
  constructor(html) { this.html = html; this.done = false; }
  element(el) {
    if (this.done) return;
    this.done = true;
    el.append(this.html, { html: true });
  }
}

export async function onRequest(context) {
  const { request, next } = context;
  const res = await next();

  try {
    const url = new URL(request.url);
    const house = url.searchParams.get('house');
    if (!house || !/^[0-9]{1,8}$/.test(house)) return res;

    const ct = res.headers.get('content-type') || '';
    if (ct.indexOf('text/html') < 0) return res;

    const q = SB + '/listings'
      + '?select=house_id,location,price,sqm,rooms,type,image_url,description,platform,agency,deleted'
      + '&project=eq.Rent'
      + '&house_id=eq.' + encodeURIComponent(house)
      + '&order=deleted.asc,price.asc'
      + '&limit=25';

    const r = await fetch(q, { headers: { apikey: AK, Authorization: 'Bearer ' + AK } });
    if (!r.ok) return res;
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return res;

    const live = rows.filter((x) => !x.deleted);
    const base = (live.length ? live : rows)[0];

    const prices = rows.map((x) => Number(x.price)).filter((v) => isFinite(v) && v > 0);
    const lo = prices.length ? Math.min.apply(null, prices) : null;
    const hi = prices.length ? Math.max.apply(null, prices) : null;
    const priceTxt = lo == null ? null : (lo === hi ? money(lo) : (money(lo) + ' – ' + money(hi)));

    const bits = [];
    if (priceTxt) bits.push(priceTxt + '/μήνα');
    if (base.sqm) bits.push(base.sqm + ' τ.μ.');
    if (base.rooms) bits.push(base.rooms + ' υπνοδωμάτια');

    const title = (base.location || 'Κατοικία') + (base.type ? ' · ' + base.type : '')
      + ' — #' + house;

    let desc = bits.join(' · ');
    const extra = [];
    if (rows.length > 1) extra.push(rows.length + ' αγγελίες');
    const platforms = Array.from(new Set(rows.map((x) => x.platform).filter(Boolean)));
    if (platforms.length) extra.push(platforms.join(', '));
    if (extra.length) desc += (desc ? ' · ' : '') + extra.join(' · ');
    if (!desc) desc = 'House Hunter — Αθήνα Βόρεια';

    const img = ogImage((live.find((x) => x.image_url) || rows.find((x) => x.image_url) || {}).image_url);

    let tags = ''
      + '<meta property="og:site_name" content="House Hunter">'
      + '<meta property="og:type" content="website">'
      + '<meta property="og:url" content="' + esc(url.href) + '">'
      + '<meta property="og:title" content="' + esc(title) + '">'
      + '<meta property="og:description" content="' + esc(desc) + '">'
      + '<meta property="og:locale" content="el_GR">'
      + '<meta name="twitter:title" content="' + esc(title) + '">'
      + '<meta name="twitter:description" content="' + esc(desc) + '">';

    if (img) {
      tags += '<meta property="og:image" content="' + esc(img) + '">'
            + '<meta property="og:image:width" content="1200">'
            + '<meta property="og:image:height" content="630">'
            + '<meta property="og:image:alt" content="' + esc(title) + '">'
            + '<meta name="twitter:card" content="summary_large_image">'
            + '<meta name="twitter:image" content="' + esc(img) + '">';
    } else {
      tags += '<meta name="twitter:card" content="summary">';
    }

    return new HTMLRewriter()
      .on('head', new HeadInjector(tags))
      .transform(res);
  } catch (e) {
    return res;
  }
}
