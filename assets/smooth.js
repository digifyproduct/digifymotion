// Gulir lembut untuk semua tautan ke bagian di halaman yang sama (href="#…").
// Pakai easing sendiri agar halus & konsisten di semua browser (tidak "blink"/lompat).
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let anim = 0;
  const stop = () => { cancelAnimationFrame(anim); anim = 0; };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, stop, { passive: true }));

  function smoothTo(el) {
    const off = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    // posisi tujuan dihitung ulang tiap frame → tidak "loncat" bila tata letak berubah di tengah jalan
    const target = () => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, el.getBoundingClientRect().top + scrollY - off));
    let to = target();
    const from = scrollY, dist = to - from;
    if (reduce || Math.abs(dist) < 2) { scrollTo(0, to); return; }
    const dur = Math.min(1200, Math.max(550, Math.abs(dist) * .45));
    const root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';           // cegah bentrok dengan smooth bawaan
    stop();
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      to = target();
      scrollTo(0, from + (to - from) * ease(p));
      if (p < 1) anim = requestAnimationFrame(step); else { anim = 0; root.style.scrollBehavior = prev; }
    };
    anim = requestAnimationFrame(step);
    // pengaman: bila frame tertahan (tab di latar belakang), tetap sampai tujuan
    setTimeout(() => { if (anim) { stop(); scrollTo(0, to); root.style.scrollBehavior = prev; } }, dur + 400);
  }
  window.smoothTo = smoothTo;

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank' || a.hasAttribute('data-ig-dm')) return;
    const url = new URL(a.href, location.href);
    if (url.pathname.replace(/\.html$/, '') !== location.pathname.replace(/\.html$/, '') || url.origin !== location.origin) return;
    const id = decodeURIComponent(url.hash.slice(1));
    const el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    smoothTo(el);
  });
})();
