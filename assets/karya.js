// ====== HASIL KARYA DI HOMEPAGE (Scene 03 · Ruang Putar) ======
// Tambah karya baru: tempel link YouTube-nya di daftar yang sesuai (satu baris satu link).
// Judul video & sampul (cover asli) diambil otomatis dari YouTube. Urutan di sini = urutan di website.
window.KARYA = {
  // Video 16:9 → tampil di layar besar + daftar di sampingnya
  video: [
    "https://youtu.be/4QIZWzNW0hU",
    "https://youtu.be/NWHG-tE-rhw",
  ],
  // Shorts 9:16 → tampil di film strip (bisa digeser). Format: ["link", "Nama style"]
  shorts: [
    ["https://youtube.com/shorts/w6uPqYqbSv8", "Watercolour Style"],
    ["https://youtube.com/shorts/HewaQ7GXloI", "Ink Painting Style"],
    ["https://youtube.com/shorts/NVebMedytuY", "Cinematic 3D Style"],
    ["https://youtube.com/shorts/oTSx1Z4EvBM", "Cross-Section Style"],
    ["https://youtube.com/shorts/30BK5EyCCrc", "Anime Painterly Style"],
    ["https://youtube.com/shorts/RIgt7iYi3eQ", "3D Relief Map Style"],
    ["https://youtube.com/shorts/HzOSZtuP500", "Isometric Breakdown Style"],
    ["https://youtube.com/shorts/Xz3am7u3YmI", "Anime Illustration Style"],
  ],
};

// ---------- tampilan (tidak perlu diubah) ----------
(() => {
  const K = window.KARYA, $ = id => document.getElementById(id);
  const idOf = u => (String(u).match(/(?:youtu\.be\/|shorts\/|embed\/|[?&]v=)([\w-]{11})/) || [])[1];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clean = t => String(t || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
  const vids = (K.video || []).map(idOf).filter(Boolean), shorts = (K.shorts || []).map(x => Array.isArray(x) ? { id: idOf(x[0]), style: x[1] || '' } : { id: idOf(x), style: '' }).filter(x => x.id);
  // cover asli Shorts = maxresdefault (frame 9:16 di tengah gambar 16:9)
  const cover = id => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  window.KARYA_COVER = cover;
  const titles = {};
  const title = id => fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`)
    .then(r => r.ok ? r.json() : null).then(j => { if (j && j.title) { titles[id] = clean(j.title); document.querySelectorAll(`[data-tt="${id}"]`).forEach(e => e.textContent = titles[id]); } }).catch(() => {});
  const thumb16 = id => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const fb16 = `this.onerror=null;this.src=this.src.replace('maxresdefault','hqdefault')`;

  // Layar besar + daftar video
  const tv = $('tv'), eps = $('eps');
  let cur = 0;
  function showTv(i, play) {
    cur = i; const id = vids[i]; if (!tv || !id) return;
    tv.innerHTML = play
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="${esc(titles[id] || 'Video Digify')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<button type="button" class="tv-play" aria-label="Putar video"><img src="${thumb16(id)}" onerror="${fb16}" alt=""><span class="big-play" aria-hidden="true"></span>
         <div class="hud"><span data-tt="${id}">${esc(titles[id] || 'Video Digify')}</span><span class="pb"><i></i></span><span>16:9</span></div></button>`;
    eps && eps.querySelectorAll('.ep').forEach((e, j) => e.classList.toggle('on', j === i));
    // garis durasi penuh → tampilkan video berikutnya (tidak diputar sampai tombol play ditekan)
    const bar = !play && vids.length > 1 && tv.querySelector('.pb i');
    if (bar) { bar.style.animation = 'pb 7s linear 1 forwards'; bar.addEventListener('animationend', () => showTv((cur + 1) % vids.length, false), { once: true }); }
  }
  if (tv && vids.length) {
    tv.addEventListener('click', e => { if (e.target.closest('.tv-play')) showTv(cur, true); });
    if (eps) {
      eps.innerHTML = vids.map((id, i) => `<button type="button" class="ep" data-i="${i}"><img loading="lazy" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt=""><b data-tt="${id}">Memuat judul…</b></button>`).join('');
      eps.hidden = vids.length < 2;
      eps.addEventListener('click', e => { const b = e.target.closest('.ep'); if (b) showTv(+b.dataset.i, true); });
    }
    showTv(0, false);
  }

  // Film strip Shorts: berjalan sendiri, bisa digeser (sentuh / seret mouse / tombol panah).
  const film = $('film');
  if (film && shorts.length) {
    const fr = x => `<button type="button" class="frame" data-yt="${x.id}" aria-label="Putar ${esc(x.style || 'video')}"><div class="im"><img loading="lazy" draggable="false" src="${cover(x.id)}" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${x.id}/hqdefault.jpg'" alt=""><span class="play" aria-hidden="true"></span></div><p class="sty">${esc(x.style)}</p></button>`;
    const one = shorts.map(fr).join('');
    film.innerHTML = one + one;   // dua kali agar bisa berputar tanpa ujung
    const box = film.parentElement, sc = document.createElement('div');
    sc.className = 'film-scroll'; box.insertBefore(sc, film); sc.appendChild(film); box.classList.add('manual');
    box.insertAdjacentHTML('afterend', '<div class="film-navs"><button type="button" class="film-nav l" aria-label="Geser ke kiri">‹</button><button type="button" class="film-nav r" aria-label="Geser ke kanan">›</button></div>');
    const half = () => film.scrollWidth / 2;
    let pos = 0, idleUntil = 0, drag = null, moved = false, vis = true;
    const hold = (ms = 2500) => { idleUntil = performance.now() + ms; };
    const wrap = () => { const h = half(); if (h <= 0) return; if (sc.scrollLeft >= h) sc.scrollLeft -= h; else if (sc.scrollLeft <= 0) sc.scrollLeft += h; };
    sc.addEventListener('scroll', () => { if (performance.now() < idleUntil || drag) { wrap(); pos = sc.scrollLeft; } }, { passive: true });
    ['touchstart', 'wheel'].forEach(ev => sc.addEventListener(ev, () => hold(), { passive: true }));
    sc.addEventListener('pointerdown', e => { hold(); if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, s: sc.scrollLeft }; moved = false; box.classList.add('dragging'); });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) moved = true; sc.scrollLeft = drag.s - dx; wrap(); hold(); });
    addEventListener('pointerup', () => { if (drag) { drag = null; box.classList.remove('dragging'); hold(); } });
    sc.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    box.nextElementSibling.querySelectorAll('.film-nav').forEach(b => b.addEventListener('click', () => {
      hold(3500); const step = (film.firstElementChild?.offsetWidth || 150) + 12;
      if (b.classList.contains('l') && sc.scrollLeft < step) sc.scrollLeft += half();
      sc.scrollBy({ left: b.classList.contains('l') ? -step * 2 : step * 2, behavior: 'smooth' });
    }));
    new IntersectionObserver(e => vis = e[0].isIntersecting).observe(box);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    const tick = now => { const dt = Math.min(64, now - last); last = now;
      if (!reduce && vis && !drag && now >= idleUntil) { pos += dt * 0.035; if (pos >= half()) pos -= half(); sc.scrollLeft = pos; }
      requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  [...new Set(vids)].forEach(title);
})();
