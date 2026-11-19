// ====== HASIL KARYA DI HOMEPAGE (Scene 03 · Ruang Putar) ======
// Tambah karya baru: tempel link YouTube-nya di daftar yang sesuai (satu baris satu link).
// Judul & gambar sampul diambil otomatis dari YouTube. Urutan di sini = urutan di website.
window.KARYA = {
  // Video 16:9 → tampil di layar besar + daftar di sampingnya
  video: [
    "https://youtu.be/4QIZWzNW0hU",
    "https://youtu.be/NWHG-tE-rhw",
  ],
  // Shorts 9:16 → tampil di film strip yang berjalan
  shorts: [
    "https://youtube.com/shorts/w6uPqYqbSv8",
    "https://youtube.com/shorts/HewaQ7GXloI",
    "https://youtube.com/shorts/NVebMedytuY",
    "https://youtube.com/shorts/oTSx1Z4EvBM",
    "https://youtube.com/shorts/30BK5EyCCrc",
    "https://youtube.com/shorts/RIgt7iYi3eQ",
    "https://youtube.com/shorts/HzOSZtuP500",
    "https://youtube.com/shorts/Xz3am7u3YmI",
  ],
};

// ---------- tampilan (tidak perlu diubah) ----------
(() => {
  const K = window.KARYA, $ = id => document.getElementById(id);
  const idOf = u => (String(u).match(/(?:youtu\.be\/|shorts\/|embed\/|[?&]v=)([\w-]{11})/) || [])[1];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clean = t => String(t || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
  const vids = (K.video || []).map(idOf).filter(Boolean), shorts = (K.shorts || []).map(idOf).filter(Boolean);
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

  // Film strip Shorts (diputar di pop-up 9:16 dari player.js)
  const film = $('film');
  if (film && shorts.length) {
    const fr = id => `<button type="button" class="frame" data-yt="${id}" aria-label="Putar video"><div class="im"><img loading="lazy" src="https://i.ytimg.com/vi/${id}/oar2.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" alt=""><span class="play" aria-hidden="true"></span></div><p data-tt="${id}">&nbsp;</p></button>`;
    const one = shorts.map(fr).join('');
    film.innerHTML = one + one;   // dua kali agar berjalan tanpa putus
    film.style.animationDuration = Math.max(30, shorts.length * 7) + 's';
  }

  [...new Set([...vids, ...shorts])].forEach(title);
})();
