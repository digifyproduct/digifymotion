// Checkout Digify Motion Course (Storefront API Scalev): formulir, metode bayar, QRIS/VA langsung di halaman.
// Dipakai di halaman jual (motion-course.html, bagian #daftar). Butuh: config.js, mascot.js, qrcodejs, assets/checkout.css,
// dan markup dengan id: steps, title, form, nm, em, wa, pm, more, bPrice, bFee..., go, err, pay, done, doneEmail, fallback, frame, altLink.
(() => {
const S = window.SITE, $ = id => document.getElementById(id);
document.querySelectorAll('[data-price]').forEach(e => e.textContent = S.harga);
document.querySelectorAll('[data-coret]').forEach(e => e.textContent = S.hargaCoret || '');
const step = n => document.querySelectorAll('#steps span').forEach(s => s.classList.toggle('on', +s.dataset.s <= n));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Mode pratinjau desain (?demo): data contoh, tidak membuat pesanan ----------
const DEMO = /[?&]demo\b/.test(location.search);
// ---------- Cadangan: tanam Checkout Flow Scalev ----------
if (!DEMO && (!S.scalevStoreId || !S.scalevStorefrontKey)) {
  const url = S.linkCheckout || S.linkBeli;
  $('fallback').hidden = false; $('altLink').href = url;
  const f = document.createElement('iframe'); f.src = url; f.title = 'Formulir pembayaran'; f.allow = 'payment; clipboard-write';
  $('frame').appendChild(f);
  return;
}

// ---------- Storefront API Scalev ----------
const API = `https://api.scalev.com/v3/stores/${S.scalevStoreId}/public`;
const KEY_SLUG = 'dmc-order';
const DEMO_FEE = { qris: 1403, va_bca: 2800, va_bni: 2800, va_bri: 2800, va_mandiri: 3330, dana: 3370 };
async function api(path, opt = {}) {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 300));
    if (path === '/payment-methods') return ['qris', 'va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'dana', 'va_permata', 'va_cimb'].map(c => ({ code: c, enabled: true }));
    if (path === '/checkout/summary') { const m = JSON.parse(opt.body).payment_method, f = DEMO_FEE[m] ?? 2800;
      return { product_price: '199000.00', other_income: '0', service_fee: String(f), gross_revenue: String(199000 + f) }; }
    if (path === '/checkout') return { secret_slug: 'demo' };
    const m = (JSON.parse(localStorage.getItem(KEY_SLUG) || '{}').method) || 'qris', f = DEMO_FEE[m] ?? 2800;
    const exp = new Date(Date.now() + 864e5).toISOString();
    return { gross_revenue: String(199000 + f), payment_status: 'unpaid', pg_payment_info: m === 'qris'
      ? { doku_qris: { qr_content: '00020101021226550012DEMO-DIGIFY-MOTION-COURSE' }, expired_at: exp }
      : { doku_va: { virtual_account_no: '8808 1234 5678 9012' }, expired_at: exp } };
  }
  const r = await fetch(API + path, { ...opt, headers: { 'Content-Type': 'application/json', 'X-Scalev-Storefront-Api-Key': S.scalevStorefrontKey, ...(opt.headers || {}) } });
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok) { const m = j && (j.error?.message || j.message || j.errors && JSON.stringify(j.errors)); throw new Error(m || ('HTTP ' + r.status)); }
  return j && j.data !== undefined ? j.data : j;
}

// ---------- Logo metode pembayaran (SVG ringan, warna khas tiap brand) ----------
const FONT = 'font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900"';
const T = (t, c, x, y, s, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" ${FONT} font-size="${s}" fill="${c}" ${extra}>${t}</text>`;
const SV = inner => `<svg viewBox="0 0 80 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
const LOGO = {
  qris: SV(`<rect x="3" y="5" width="17" height="17" rx="2.5" fill="none" stroke="#111" stroke-width="2.6"/><rect x="8" y="10" width="7" height="7" fill="#E21F26"/>` + T('QRIS', '#111', 51, 20.5, 16, 'letter-spacing=".5"')),
  va_bca: SV(T('BCA', '#0060AF', 40, 22, 22, 'font-style="italic" letter-spacing="1"')),
  va_bni: SV(`<path d="M7 5h10l-6 18H1z" fill="#F15A23"/>` + T('BNI', '#006885', 48, 21.5, 20)),
  va_bri: SV(`<text x="20" y="17.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="8" fill="#00529C">BANK</text>` + T('BRI', '#00529C', 53, 21.5, 20)),
  va_mandiri: SV(`<path d="M46 8.5c6-5 15-5 23 0" fill="none" stroke="#FFB700" stroke-width="3.4" stroke-linecap="round"/>` + T('mandiri', '#003D79', 40, 24, 15)),
  dana: SV(`<circle cx="12" cy="14" r="8.5" fill="#118EEA"/><path d="M8.3 14h7.4M12 10.3v7.4" stroke="#fff" stroke-width="2.2"/>` + T('DANA', '#118EEA', 50, 20.5, 16)),
  gopay: SV(T('gopay', '#00AED6', 40, 20, 17)), ovo: SV(T('OVO', '#4C3494', 40, 21, 19)),
  shopeepay: SV(T('ShopeePay', '#EE4D2D', 40, 19, 12)), linkaja: SV(T('LinkAja', '#E82127', 40, 19.5, 14))
};
const bankName = code => {
  const k = code.replace(/^va_/, '');
  const map = { bca: 'BCA', bni: 'BNI', bri: 'BRI', mandiri: 'Mandiri', permata: 'Permata', cimb: 'CIMB Niaga', bsi: 'BSI', btn: 'BTN', danamon: 'Danamon', maybank: 'Maybank', muamalat: 'Muamalat', ocbc: 'OCBC NISP', bnc: 'Neo Commerce', sampoerna: 'Sahabat Sampoerna', bjb: 'BJB' };
  return map[k] || k.toUpperCase();
};
const WALLET = { dana: 'DANA', gopay: 'GoPay', ovo: 'OVO', shopeepay: 'ShopeePay', linkaja: 'LinkAja' };
// logo resmi (gambar) untuk metode utama
const IMG = { qris: 'qris', dana: 'dana', va_bca: 'bca', va_bni: 'bni', va_bri: 'bri', va_mandiri: 'mandiri' };
const logo = code => IMG[code] ? `<img src="assets/img/pay/${IMG[code]}.webp" alt="" draggable="false">` : LOGO[code] || SV(T(esc((code.startsWith('va_') ? bankName(code).split(' ')[0] : code).toUpperCase().slice(0, 8)), '#2a0b00', 40, 19, 13));
const label = code => code === 'qris' ? ['QRIS', 'Scan pakai e-wallet / m-banking apa saja']
  : code.startsWith('va_') ? ['Virtual Account ' + bankName(code), 'Transfer ke nomor VA']
  : WALLET[code] ? [WALLET[code], 'Bayar lewat aplikasi ' + WALLET[code]] : [code.toUpperCase(), ''];
const MAIN = ['qris', 'va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'dana'];
let methods = [], picked = 'qris', variantId = S.scalevVariantId || null;

// ---------- Angka bergerak ----------
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const shown = new Map();
function tween(el, to) {
  const from = shown.has(el) ? shown.get(el) : to; shown.set(el, to);
  cancelAnimationFrame(el._raf);
  if (from === to) { el.textContent = rp(to); return; }
  const t0 = performance.now(), dur = 700, ease = t => 1 - Math.pow(1 - t, 3);
  const tick = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = rp(from + (to - from) * ease(p)); if (p < 1) el._raf = requestAnimationFrame(tick); };
  el._raf = requestAnimationFrame(tick);
}

// ---------- Rincian harga per metode (dihitung Scalev) ----------
const sumCache = {};
const getSummary = m => sumCache[m] || (sumCache[m] = api('/checkout/summary', { method: 'POST', body: JSON.stringify({
  items: [{ type: 'variant', variant_id: variantId, quantity: 1 }], payment_method: m }) }).catch(e => { delete sumCache[m]; throw e; }));
async function showBill() {
  const m = picked; let s;
  try { s = await getSummary(m); } catch (e) { return; }
  if (m !== picked) return;
  const fee = +s.service_fee || 0, other = +s.other_income || 0;
  tween($('bPrice'), +s.product_price || 0);
  tween($('bFee'), fee);
  $('bFeeLbl').textContent = 'Biaya layanan (' + label(m)[0].replace('Virtual Account ', 'VA ') + ')';
  $('bOtherRow').hidden = !other; if (other) { $('bOtherLbl').textContent = s.other_income_name || 'Biaya lainnya'; tween($('bOther'), other); }
  tween($('bTotal'), +s.gross_revenue || 0);
  const row = $('bFeeRow'); row.classList.remove('bump'); void row.offsetWidth; row.classList.add('bump'); setTimeout(() => row.classList.remove('bump'), 800);
}
function showFees() {
  document.querySelectorAll('#pm .opt').forEach(b => getSummary(b.dataset.m).then(s => {
    const el = b.querySelector('.fee'); if (el) el.textContent = '+ ' + rp(+s.service_fee || 0); }).catch(() => {}));
}

function renderPM(all) {
  const list = all ? methods : methods.filter(m => MAIN.includes(m));
  $('pm').innerHTML = list.map(m => { const [n] = label(m);
    return `<button type="button" class="opt ${m === picked ? 'on' : ''}" data-m="${esc(m)}"><span class="dot"></span><span class="txt"><b>${esc(n)}</b><span class="fee"></span></span><span class="tag">${logo(m)}</span></button>`; }).join('');
  $('more').hidden = all || methods.length <= list.length;
  showFees();
}
$('pm').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || b.dataset.m === picked) return; picked = b.dataset.m; $('pm').querySelectorAll('.opt').forEach(o => o.classList.toggle('on', o === b)); showBill(); });
$('more').addEventListener('click', () => renderPM(true));

async function findVariant() {
  if (variantId) return variantId;
  const p = await api('/products/' + encodeURIComponent(S.scalevProductSlug || 'digify-motion-course'));
  const v = (p.variants || p.product?.variants || [])[0];
  variantId = v && (v.id || v.variant_id);
  if (!variantId) throw new Error('Produk tidak ditemukan');
  return variantId;
}

async function init() {
  if (window.DMTrack && !DEMO) { DMTrack.viewContent(); $('form').addEventListener('focusin', () => DMTrack.initiateCheckout(), { once: true }); }
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY_SLUG) || 'null'); } catch (e) { return null; } })();
  if (saved && saved.slug) return showPayment(saved.slug, saved.method, saved.email);
  $('form').hidden = false;
  try {
    await findVariant();
    const pm = await api('/payment-methods');
    methods = (Array.isArray(pm) ? pm : (pm.payment_methods || pm.items || [])).filter(x => typeof x === 'string' || x.enabled !== false)
      .map(x => typeof x === 'string' ? x : (x.code || x.payment_method || x.id)).filter(Boolean);
    methods.sort((a, b) => (MAIN.indexOf(a) + 1 || 99) - (MAIN.indexOf(b) + 1 || 99));
    if (!methods.includes(picked)) picked = methods[0];
    renderPM(false); showBill();
  } catch (e) { $('pm').innerHTML = `<div class="err">Gagal memuat metode pembayaran (${esc(e.message)}).</div>`; }
}

$('form').addEventListener('submit', async e => {
  e.preventDefault(); $('err').hidden = true;
  const name = $('nm').value.trim(), email = $('em').value.trim().toLowerCase(), wa = $('wa').value.replace(/\D/g, '').replace(/^0+/, '').replace(/^62/, '');
  const bad = !name ? 'Isi nama lengkap.' : !/^\S+@\S+\.\S+$/.test(email) ? 'Email belum benar.' : wa.length < 8 ? 'No. WhatsApp belum benar.' : !picked ? 'Pilih metode pembayaran.' : '';
  if (bad) { $('err').textContent = bad; $('err').hidden = false; return; }
  const b = $('go'); b.disabled = true; b.textContent = 'Membuat pesanan…';
  try {
    const order = await api('/checkout', { method: 'POST', body: JSON.stringify({
      items: [{ type: 'variant', variant_id: await findVariant(), quantity: 1 }],
      customer_name: name, customer_email: email, customer_phone: '62' + wa, payment_method: picked,
      metadata: window.DMTrack ? DMTrack.utm() : undefined }) });   // UTM iklan ikut dicatat (best effort)
    const slug = order.secret_slug || order.order?.secret_slug;
    if (!slug) throw new Error('Pesanan tidak terbentuk');
    try { localStorage.setItem(KEY_SLUG, JSON.stringify({ slug, method: picked, email, name, phone: '62' + wa })); } catch (e) {}
    showPayment(slug, picked, email);
    setTimeout(() => window.smoothTo ? smoothTo($('pay')) : $('pay').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  } catch (err) {
    $('err').textContent = 'Gagal membuat pesanan: ' + err.message; $('err').hidden = false;
    b.disabled = false; b.textContent = 'Bayar sekarang';
  }
});

// ---------- Baca instruksi bayar (DOKU atau Xendit) ----------
const pick = (o, paths) => { for (const p of paths) { const v = p.split('.').reduce((a, k) => a && a[k], o); if (v) return v; } return null; };
function deep(o, test, d = 0) {   // nilai string pertama yang nama kuncinya cocok, di objek bersarang
  if (!o || typeof o !== 'object' || d > 6) return null;
  for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && v && test(k)) return v;
  for (const v of Object.values(o)) { const r = deep(v, test, d + 1); if (r) return r; }
  return null;
}
const qrOf = info => pick(info, ['doku_qris.qr_content', 'qr_string', 'payment_method.qr_code.channel_properties.qr_string'])
  || deep(info, k => /^(qr_?content|qr_?string|qris_?content)$/i.test(k));
const vaOf = info => pick(info, ['payment_method.virtual_account.channel_properties.virtual_account_number', 'payment_method.over_the_counter.channel_properties.payment_code', 'va_number', 'virtual_account_number'])
  || deep(info, k => /^(virtual_?account_?(no|num|number)|va_?(no|number)|payment_?code)$/i.test(k));
const urlOf = info => {
  const acts = info && info.actions;
  if (Array.isArray(acts) && acts.length) { const pref = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? ['WEB', 'DEEPLINK', 'MOBILE'] : ['WEB', 'MOBILE', 'DEEPLINK'];
    for (const t of pref) { const a = acts.find(x => String(x.url_type || x.type || '').toUpperCase() === t && x.url); if (a) return a.url; } }
  return pick(info, ['invoice_url', 'redirect_url', 'payment_url', 'checkout_url', 'web_redirect_url']) || deep(info, k => /(redirect|checkout|web|payment|invoice|app)_?url$/i.test(k));
};
let pollT = 0, cdT = 0;
function countdown(at) {
  clearInterval(cdT); const el = $('exp'); if (!el) return;
  const end = at ? new Date(at).getTime() : 0; if (!end) { el.hidden = true; return; }
  const p2 = n => String(n).padStart(2, '0');
  const run = () => { const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    el.textContent = s ? `Bayar dalam ${p2(Math.floor(s / 3600))}:${p2(Math.floor(s % 3600 / 60))}:${p2(s % 60)}` : 'Waktu bayar habis, buat pesanan baru';
    if (!s) clearInterval(cdT); };
  run(); cdT = setInterval(run, 1000);
}
async function showPayment(slug, method, email) {
  step(2); $('form').hidden = true; ($('title') || {}).innerHTML = 'Selesaikan<br><span class="hl">pembayaran</span>';
  const box = $('pay'); box.hidden = false; box.innerHTML = '<span class="masc ok-m" data-act="type"></span><div class="wait"><i></i>Menyiapkan instruksi pembayaran…</div>';
  window.Mascot && Mascot.scan(box);
  let o = null, qr = null, va = null, url = null;
  for (let i = 0; i < 15; i++) {   // instruksi dari gateway bisa belum siap: coba ulang seperti halaman resmi Scalev
    try { o = await api(`/orders/${encodeURIComponent(slug)}/payment`, { method: 'POST' }); } catch (e) {}
    if (o && isPaid(o)) return done(email, o);
    const info = (o && o.pg_payment_info) || {};
    qr = qrOf(info); va = vaOf(info); url = urlOf(info);
    if (qr || va || url) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  if (!o) { box.innerHTML = `<div class="err">Instruksi pembayaran belum tersedia. Coba muat ulang halaman ini.</div>${resetBtn()}`; return; }
  const info = o.pg_payment_info || {};
  const amount = +pick(o, ['gross_revenue', 'total', 'amount']) || 0;
  const total = amount ? rp(amount) : S.harga;
  const exp = pick(info, ['expired_at', 'expiry_date', 'expiration_date']) || o.payment_expiration_at;
  const head = `<div class="paylogo">${logo(method)}</div>`;
  if (qr) {
    box.innerHTML = `${head}<h2 style="justify-content:center">Scan QRIS untuk bayar</h2><div class="qr" id="qr"></div>
      <div class="amount">${esc(total)}</div><span class="exp" id="exp"></span>
      <p class="hint">Buka aplikasi m-banking atau e-wallet (GoPay, OVO, DANA, ShopeePay, BCA mobile, dll.), pilih <b>Scan / QRIS</b>, lalu arahkan ke kode ini.</p>
      <button type="button" class="btn btn-line btn-sm dl" id="dlQr">Simpan gambar QR</button>
      <div class="wait"><i></i>Menunggu pembayaran… otomatis lanjut setelah lunas</div>
      <button type="button" class="btn btn-line btn-sm" id="checkNow">Saya sudah bayar, cek status</button>${resetBtn()}`;
    new QRCode($('qr'), { text: qr, width: 512, height: 512, correctLevel: QRCode.CorrectLevel.M });
    $('dlQr').onclick = () => { const c = $('qr').querySelector('canvas'); if (!c) return;
      const a = document.createElement('a'); a.download = 'QRIS-Digify-Motion-Course.png'; a.href = c.toDataURL('image/png'); a.click(); };
  } else if (va) {
    box.innerHTML = `${head}<h2 style="justify-content:center">Transfer ke Virtual Account</h2>
      <div class="va"><small>${esc(bankName(method))} Virtual Account</small><b id="vaNum">${esc(va)}</b>
      <button type="button" class="btn btn-line btn-sm" id="copyVa">Salin nomor</button></div>
      <div class="amount">${esc(total)}</div><span class="exp" id="exp"></span>
      <ol class="how"><li>Buka m-banking / ATM ${esc(bankName(method))}.</li><li>Pilih <b>Transfer → Virtual Account</b>.</li><li>Masukkan nomor di atas, pastikan nominalnya sama, lalu bayar.</li></ol>
      <div class="wait"><i></i>Menunggu pembayaran…</div>
      <button type="button" class="btn btn-line btn-sm" id="checkNow">Saya sudah bayar, cek status</button>${resetBtn()}`;
    $('copyVa').onclick = async () => { try { await navigator.clipboard.writeText(va.replace(/\s/g, '')); $('copyVa').textContent = 'Tersalin ✓'; } catch (e) {} };
  } else {
    const go = url || o.redirect_url || o.public_order_url;
    if (!go) { box.innerHTML = `<div class="err">Instruksi pembayaran tidak ditemukan.</div>${resetBtn()}`; return; }
    box.innerHTML = `${head}<h2 style="justify-content:center">Lanjutkan di ${esc(label(method)[0])}</h2><div class="amount">${esc(total)}</div><span class="exp" id="exp"></span>
      <p class="hint">Klik tombol di bawah untuk membayar. Setelah selesai, kembali ke halaman ini.</p>
      <a class="btn btn-or go" href="${esc(go)}" target="_blank" rel="noopener">Bayar dengan ${esc(label(method)[0])}</a><div class="wait"><i></i>Menunggu pembayaran…</div>${resetBtn()}`;
  }
  countdown(exp);
  const cn = $('checkNow'); if (cn) cn.onclick = () => checkStatus(slug, email, true);
  clearInterval(pollT); pollT = setInterval(() => checkStatus(slug, email), 5000);
}
const isPaid = o => ['paid', 'settled'].includes(String(o && (o.payment_status || o.order?.payment_status) || '').toLowerCase());
async function checkStatus(slug, email, manual) {
  try { const o = await api(`/orders/${encodeURIComponent(slug)}`); if (isPaid(o)) return done(email, o);
    if (manual) alert('Pembayaran belum terdeteksi. Tunggu 1–2 menit lalu cek lagi.'); } catch (e) {}
}
function done(email, o) {
  clearInterval(pollT); clearInterval(cdT);
  let b = {}; try { b = JSON.parse(localStorage.getItem(KEY_SLUG) || '{}'); } catch (e) {}
  if (o && !DEMO && window.DMTrack) DMTrack.purchase(o.order || o, { email: email || b.email, phone: b.phone, name: b.name });   // Purchase = setelah lunas
  try { localStorage.removeItem(KEY_SLUG); } catch (e) {}
  step(3); $('pay').hidden = true; $('form').hidden = true; $('done').hidden = false; $('doneEmail').textContent = email || 'emailmu';
  ($('title') || {}).innerHTML = 'Selamat datang<br><span class="hl">di kelas!</span>';
}
const resetBtn = () => `<p class="alt"><a href="#" onclick="localStorage.removeItem('${KEY_SLUG}');location.reload();return false">Ganti metode / buat pesanan baru</a></p>`;
init();
})();
