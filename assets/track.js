// Meta Pixel + relay Conversions API lewat Storefront API Scalev (dok: scalevcom/dev-docs → storefront-api-advertising-conversion-events).
// Muat di <head> SEBELUM skrip lain. Event browser & server memakai event ID yang sama (deduplikasi Meta).
// Pakai: DMTrack.viewContent() · DMTrack.initiateCheckout() · DMTrack.purchase(order, buyer) · DMTrack.utm()
(() => {
  const PIXEL = '1865650091289894';
  const LOKAL = /^(localhost|127\.|\[::1\])/.test(location.hostname);

  // ---------- Pixel browser (kode resmi Meta) ----------
  // uji lokal: jangan kirim apa pun ke Meta, cukup catat di console
  if (LOKAL) window.fbq = (...a) => console.log('[fbq]', ...a);
  else !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL);

  // ---------- Atribusi: fbclid → _fbc, _fbp, dan UTM (7 hari) ----------
  const getCookie = n => { const r = document.cookie.split('; ').find(x => x.startsWith(n + '=')); return r ? decodeURIComponent(r.split('=')[1]) : ''; };
  const setCookie = (n, v, days) => { if (!v) return; document.cookie = [`${n}=${encodeURIComponent(v)}`, `Max-Age=${days * 864e2}`, 'Path=/', 'SameSite=Lax', location.protocol === 'https:' ? 'Secure' : ''].filter(Boolean).join('; '); };
  const q = new URLSearchParams(location.search), now = Date.now();
  if (q.get('fbclid')) setCookie('_fbc', `fb.1.${now}.${q.get('fbclid')}`, 90);
  if (!getCookie('_fbp')) setCookie('_fbp', `fb.1.${now}.${Math.floor(Math.random() * 1e10)}`, 90);
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  const KEY_UTM = 'dmc-utm';
  if (UTM_KEYS.some(k => q.get(k))) {   // kunjungan iklan terbaru menimpa yang lama (last touch)
    const u = { t: now }; UTM_KEYS.forEach(k => { if (q.get(k)) u[k] = q.get(k).slice(0, 500); });
    try { localStorage.setItem(KEY_UTM, JSON.stringify(u)); } catch (e) {}
  }
  const utm = () => { try { const u = JSON.parse(localStorage.getItem(KEY_UTM) || 'null'); if (u && now - u.t < 7 * 864e5) { const { t, ...r } = u; return r; } } catch (e) {} return {}; };

  // ---------- Relay server: Scalev meneruskan ke CAPI Meta ----------
  const site = () => window.SITE || {};
  let produk = null;   // { unique_id, price, name } varian kelas (untuk payload item Scalev)
  async function varian() {
    if (produk) return produk;
    const S = site(); if (!S.scalevStoreId || !S.scalevStorefrontKey) return null;
    try {
      const r = await fetch(`https://api.scalev.com/v3/stores/${S.scalevStoreId}/public/products/${encodeURIComponent(S.scalevProductSlug || 'digify-motion-course')}`,
        { credentials: 'omit', headers: { 'X-Scalev-Storefront-Api-Key': S.scalevStorefrontKey } });
      const j = await r.json(), p = j.data || j, v = (p.variants || p.product?.variants || []).find(x => !S.scalevVariantId || x.id == S.scalevVariantId) || (p.variants || [])[0];
      if (v) produk = { unique_id: v.unique_id, price: Math.round(+v.price || 0), name: v.fullname || v.name || p.name || 'Digify Motion Course' };
    } catch (e) {}
    return produk;
  }
  async function kirim(eventName, eventId, parameters, userData = {}) {
    const S = site(), v = await varian();
    if (!S.scalevStoreId || !S.scalevStorefrontKey) return;
    const body = {
      event_source_url: location.href.split('#')[0], referrer_url: document.referrer || undefined,
      user_data: { country: 'id', fbc: getCookie('_fbc') || undefined, fbp: getCookie('_fbp') || undefined, ...userData },
      events: [{ event_id: eventId, event_name: eventName, parameters }],
      ...(v ? { variants: [{ variant_unique_id: v.unique_id, quantity: 1 }] } : {})
    };
    if (LOKAL) { console.log('[scalev-relay]', JSON.stringify(body)); return; }
    try {   // gagal kirim tidak boleh mengganggu pembeli
      await fetch(`https://api.scalev.com/v3/stores/${S.scalevStoreId}/public/analytics/meta/events`, { method: 'POST', credentials: 'omit',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Scalev-Storefront-Api-Key': S.scalevStorefrontKey }, body: JSON.stringify(body) });
    } catch (e) {}
  }
  const idAcak = p => `${p}_${crypto.randomUUID ? crypto.randomUUID() : now + '_' + Math.random().toString(36).slice(2)}`;
  async function params(value) {
    /* cadangan bila API produk gagal: "Rp 199rb" di config.js → 199000 */
    const dariConfig = () => { const m = String(site().harga || '').toLowerCase().match(/([\d.,]+)\s*(rb|k|jt)?/); if (!m) return 0;
      const n = +m[1].replace(/[.,]/g, ''); return m[2] === 'jt' ? n * 1e6 : m[2] ? n * 1e3 : n; };
    const v = await varian(), harga = Math.round(+value || (v && v.price) || dariConfig());
    return { content_ids: v ? [v.unique_id] : [], content_type: 'product', content_name: v ? v.name : 'Digify Motion Course',
      contents: v ? [{ id: v.unique_id, quantity: 1, item_price: harga }] : [], value: harga, currency: 'IDR', num_items: 1 };
  }
  async function lacak(eventName, eventId, value, userData) {
    const p = await params(value);
    fbq('track', eventName, p, { eventID: eventId });
    kirim(eventName, eventId, p, userData);
  }
  const sekali = new Set();
  const pecahNama = n => { const s = String(n || '').trim().split(/\s+/); return { fn: s[0] || undefined, ln: s.length > 1 ? s.slice(1).join(' ') : undefined }; };

  fbq('track', 'PageView');
  window.DMTrack = {
    utm,
    viewContent() { if (sekali.has('vc')) return; sekali.add('vc'); lacak('ViewContent', idAcak('view_content')); },
    initiateCheckout() { if (sekali.has('ic')) return; sekali.add('ic'); lacak('InitiateCheckout', idAcak('initiate_checkout')); },
    // dipanggil SETELAH pembayaran lunas; ID tetap per pesanan supaya reload/cek ulang tidak menggandakan
    purchase(order, buyer = {}) {
      const oid = order && (order.order_id || order.id || order.secret_slug); if (!oid) return;
      const KEY = 'dmc-purchase-sent'; let sent = []; try { sent = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
      if (sent.includes(String(oid))) return;
      try { localStorage.setItem(KEY, JSON.stringify([...sent, String(oid)].slice(-20))); } catch (e) {}
      lacak('Purchase', `${oid}-Purchase-FORM`, order.product_price || order.gross_revenue, {
        em: buyer.email || undefined, ph: buyer.phone || undefined, ...pecahNama(buyer.name) });
    }
  };
})();
