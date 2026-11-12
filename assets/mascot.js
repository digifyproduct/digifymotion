// Maskot siluet Digify: SVG + kedip acak + mata mengikuti kursor + aktivitas.
// Pakai: <span class="masc" data-m="full|head" data-act="type|clap|camera|reel|think|mega|wave"></span>
(() => {
  let n = 0;
  const OL = '#D97A42', BODY = '#8F3A0C', DARK = '#24140b';
  // lengan: garis tebal ber-outline + tangan bulat
  // tanpa lengan: hanya tangan bulat yang melayang (gaya maskot siluet)
  const arm = () => '';
  const hand = (x, y, cls = '') => `<circle class="${cls}" cx="${x}" cy="${y}" r="14" fill="#B54A12" stroke="${OL}" stroke-opacity=".85" stroke-width="4"/>`;
  const g = (cls, ox, oy, inner) => `<g class="m-a ${cls}" style="transform-origin:${ox}px ${oy}px">${inner}</g>`;

  const ACTS = {
    // mengetik di laptop
    type: {
      // tangan di BELAKANG layar laptop: hanya tepinya yang mengintip di kiri-kanan layar
      front: `${hand(48, 236, 'm-tapL')}${hand(152, 236, 'm-tapR')}
        <rect x="46" y="194" width="108" height="62" rx="8" fill="${DARK}" stroke="${OL}" stroke-width="4"/>
        <path d="M100 214l14 8-14 8-14-8z" fill="#F26A21"/>
        <rect x="26" y="254" width="148" height="12" rx="5" fill="#33200f" stroke="${OL}" stroke-width="4"/>`,
    },
    // memegang papan klapper
    clap: {
      front: `
        ${arm(160, 204, 200, 152)}
        <rect x="186" y="132" width="78" height="56" rx="5" fill="#1f1209" stroke="${OL}" stroke-width="4"/>
        <path d="M194 152h62M194 166h62" stroke="#cdb3a2" stroke-width="2.5" opacity=".7"/>
        ${g('m-clap', 186, 132, `<rect x="186" y="116" width="78" height="16" rx="3" fill="#1f1209" stroke="${OL}" stroke-width="4"/>
          <path d="M196 116l10 16h12l-10-16zM222 116l10 16h12l-10-16z" fill="#F26A21"/>`)}
        ${hand(200, 152)}`,
    },
    // merekam dengan kamera
    camera: {
      front: `${arm(40, 206, 40, 232)}${arm(160, 206, 140, 226)}
        ${g('m-pan', 86, 220, `<rect x="56" y="174" width="30" height="16" rx="4" fill="#33200f" stroke="${OL}" stroke-width="3"/>
          <rect x="34" y="186" width="104" height="66" rx="11" fill="#1f1209" stroke="${OL}" stroke-width="4"/>
          <circle cx="82" cy="219" r="24" fill="#33200f" stroke="${OL}" stroke-width="3"/>
          <circle cx="82" cy="219" r="12" fill="#F26A21"/><circle cx="77" cy="214" r="4" fill="#FFE3CC"/>
          <circle class="m-rec" cx="124" cy="198" r="5" fill="#ff3b30"/>`)}
        ${hand(38, 234)}${hand(140, 228)}`,
    },
    // membawa gulungan film
    reel: {
      front: `
        ${arm(160, 206, 192, 238)}
        <path d="M206 270c-10-10-26-8-40 0" stroke="#33200f" stroke-width="10" fill="none"/>
        ${g('m-roll', 210, 236, `<circle cx="210" cy="236" r="32" fill="${DARK}" stroke="${OL}" stroke-width="4"/>
          ${[0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180; return `<circle cx="${(210 + Math.cos(r) * 17).toFixed(1)}" cy="${(236 + Math.sin(r) * 17).toFixed(1)}" r="6.5" fill="#120904"/>`; }).join('')}
          <circle cx="210" cy="236" r="6" fill="#F26A21"/>`)}
        ${hand(194, 238)}`,
    },
    // berpikir dengan tanda tanya
    think: {
      front: `
        ${arm(160, 206, 138, 166)}${hand(136, 160)}
        <g class="m-a m-q" style="transform-origin:212px 52px"><circle cx="212" cy="52" r="26" fill="#fff"/>
          <circle cx="182" cy="84" r="6" fill="#fff"/><circle cx="170" cy="100" r="3.5" fill="#fff"/>
          <text x="212" y="63" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="32" fill="#F26A21">?</text></g>`,
      head: 'm-tilt',
    },
    // berteriak pakai megafon
    mega: {
      front: `
        ${arm(160, 206, 170, 140)}
        ${g('m-shout', 150, 112, `<path d="M146 100l78-26v76l-78-26z" fill="#F26A21" stroke="#FFB27A" stroke-width="4" stroke-linejoin="round"/>
          <rect x="136" y="98" width="14" height="28" rx="4" fill="#33200f" stroke="#FFB27A" stroke-width="3"/>
          <g class="m-waves" fill="none" stroke="#FFB27A" stroke-width="5" stroke-linecap="round"><path d="M238 92q12 20 0 40"/><path d="M252 82q18 30 0 60"/></g>`)}
        ${hand(168, 134)}`,
    },
    // melambai
    wave: {
      front: `
        ${g('m-wave', 160, 204, arm(160, 204, 198, 142) + hand(200, 138))}`,
    },
  };

  function svg(kind, act) {
    const id = 'mg' + (n++);
    const defs = `<defs>
      <radialGradient id="${id}h" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#C9561C"/><stop offset="1" stop-color="#A2420F"/></radialGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A3D0B"/><stop offset="1" stop-color="#7E3108"/></linearGradient></defs>`;
    const A = ACTS[act];
    const head = `<g class="m-head m-a ${A && A.head || ''}" style="transform-origin:100px 146px"><circle cx="100" cy="86" r="60" fill="url(#${id}h)" stroke="${OL}" stroke-opacity=".85" stroke-width="5"/>
      <g class="m-eyes"><ellipse cx="79" cy="86" rx="13" ry="6.5" fill="#FFF6EE"/><ellipse cx="121" cy="86" rx="13" ry="6.5" fill="#FFF6EE"/></g></g>`;
    if (kind === 'head') return `<svg viewBox="34 20 132 132" aria-hidden="true">${defs}${head}</svg>`;
    // "tall": badan diperpanjang ke luar kotak supaya ujung bawahnya tidak pernah terlihat (untuk maskot yang mengintip)
    const yb = kind === 'tall' ? 640 : 270;
    const body = `<path d="M28 ${yb}V214C28 168 58 150 100 150S172 168 172 214V${yb}Z" fill="url(#${id}b)"/>
      <path d="M30.5 ${yb}V214C30.5 170 59 152.5 100 152.5S169.5 170 169.5 214V${yb}" fill="none" stroke="${OL}" stroke-opacity=".85" stroke-width="5"/>`;
    const vb = A ? '-6 0 276 274' : '0 0 200 270';
    return `<svg viewBox="${vb}" aria-hidden="true">${defs}${body}${head}${A ? A.front : ''}</svg>`;
  }

  const all = [];
  function mount(el) {
    if (el._m) return; el._m = 1;
    el.innerHTML = svg(el.dataset.m || 'full', el.dataset.act);
    if (el.dataset.act) el.classList.add('act-' + el.dataset.act);
    const eyes = el.querySelector('.m-eyes');
    all.push({ el, eyes });
    const blink = () => { eyes.classList.add('blink'); setTimeout(() => eyes.classList.remove('blink'), 160);
      setTimeout(blink, 2200 + Math.random() * 3800); };
    setTimeout(blink, 600 + Math.random() * 2500);
  }
  function scan(root = document) { root.querySelectorAll('.masc').forEach(mount); }
  let px = innerWidth / 2, py = innerHeight / 3, raf = 0;
  function look() {
    raf = 0;
    for (const { el, eyes } of all) {
      if (el.dataset.act === 'type') { eyes.style.transform = 'translate(0,7px)'; continue; } // menatap layar
      const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const cx = r.left + r.width * (el.dataset.act ? .37 : .5), cy = r.top + r.height * (el.dataset.m === 'head' ? .5 : .32);
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 300);
      eyes.style.transform = `translate(${(dx / d) * 9 * k}px,${(dy / d) * 6 * k}px)`;
    }
  }
  const q = () => { if (!raf) raf = requestAnimationFrame(look); };
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; q(); }, { passive: true });
  addEventListener('scroll', q, { passive: true });
  if (matchMedia('(hover:none)').matches) {
    let t = 0; setInterval(() => { t++; px = innerWidth * (t % 2 ? .2 : .8); py = innerHeight * .4; q(); }, 2600);
  }
  const css = document.createElement('style');
  css.textContent = `.masc{display:inline-block;line-height:0}.masc svg{width:100%;height:auto;overflow:visible}
  .m-eyes{transition:transform .25s ease-out;transform-box:fill-box}
  .m-eyes ellipse{transform-box:fill-box;transform-origin:center;transition:transform .08s}
  .m-eyes.blink ellipse{transform:scaleY(.1)}
  .m-a{transform-box:view-box}
  .m-tapL,.m-tapR{transform-box:fill-box;animation:mTap .28s ease-in-out infinite alternate}.m-tapR{animation-delay:.14s}
  @keyframes mTap{to{transform:translateY(-7px)}}
  .m-glow{animation:mGlow 1.6s ease-in-out infinite}@keyframes mGlow{50%{opacity:.3}}
  .m-clap{animation:mClap 2.4s ease-in-out infinite}@keyframes mClap{0%,55%,100%{transform:rotate(-28deg)}65%{transform:rotate(0)}72%{transform:rotate(-10deg)}80%{transform:rotate(0)}}
  .m-pan{animation:mPan 4s ease-in-out infinite}@keyframes mPan{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
  .m-rec{animation:mRec 1s steps(1) infinite}@keyframes mRec{50%{opacity:.15}}
  .m-roll{animation:mRoll 2.2s linear infinite}@keyframes mRoll{to{transform:rotate(360deg)}}
  .m-swing{animation:mSwing .9s ease-in-out infinite alternate}@keyframes mSwing{from{transform:rotate(12deg)}to{transform:rotate(-14deg)}}
  .m-tilt{animation:mTilt 3s ease-in-out infinite}@keyframes mTilt{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(4deg)}}
  .m-q{animation:mQ 2.2s ease-in-out infinite}@keyframes mQ{50%{transform:translateY(-8px) rotate(6deg)}}
  .m-shout{animation:mShout 1.8s ease-in-out infinite}@keyframes mShout{0%,100%{transform:rotate(0)}20%{transform:rotate(-6deg) scale(1.04)}40%{transform:rotate(0)}}
  .m-waves{animation:mWaves .9s ease-out infinite}@keyframes mWaves{from{opacity:1}to{opacity:0;transform:translateX(12px)}}
  .m-wave{animation:mWave 1.4s ease-in-out infinite}@keyframes mWave{0%,100%{transform:rotate(0)}25%{transform:rotate(-18deg)}50%{transform:rotate(6deg)}75%{transform:rotate(-14deg)}}`;
  document.head.appendChild(css);
  window.Mascot = { svg, scan };
  if (document.readyState !== 'loading') scan(); else addEventListener('DOMContentLoaded', () => scan());
  new MutationObserver(() => scan()).observe(document.documentElement, { childList: true, subtree: true });
})();
