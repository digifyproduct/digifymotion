// Film strip Shorts: kartu yang punya ID YouTube bisa diputar langsung di website (pop-up 9:16).
(() => {
  const YT = window.SHORTS_YT || {};
  window.shortFrame = w => {
    const id = YT[w.slug.replace(/^digify-/, '')];
    const inner = `<div class="im"><img loading="lazy" src="${w.img}" alt="">${id ? '<span class="play" aria-hidden="true"></span>' : ''}</div><p>${w.t}</p>`;
    return id ? `<button type="button" class="frame" data-yt="${id}" aria-label="Putar ${w.t}">${inner}</button>`
              : `<div class="frame">${inner}</div>`;
  };
  const css = document.createElement('style');
  css.textContent = `
  button.frame{background:none;border:0;padding:0;text-align:left;cursor:pointer;font:inherit;color:inherit}
  .frame .im{position:relative}
  .frame .play{position:absolute;left:50%;top:50%;width:48px;height:48px;translate:-50% -50%;border-radius:50%;background:rgba(242,106,33,.92);box-shadow:0 8px 20px -6px #000;transition:transform .2s}
  .frame .play::after{content:"";position:absolute;left:19px;top:14px;border:10px solid transparent;border-left:15px solid #fff;border-right:0}
  button.frame:hover .play{transform:scale(1.12)}
  .ytpop{position:fixed;inset:0;z-index:60;display:none;place-items:center;background:rgba(10,5,2,.82);backdrop-filter:blur(4px);padding:16px}
  .ytpop.on{display:grid}
  .ytpop .box{position:relative;height:min(82vh,760px);aspect-ratio:9/16;max-width:100%;border-radius:18px;overflow:hidden;background:#000;box-shadow:0 30px 60px -20px #000}
  .ytpop iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  .ytpop .x{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:0;background:#fff;color:#2a0b00;font-size:22px;cursor:pointer;z-index:2}`;
  document.head.appendChild(css);
  const pop = document.createElement('div');
  pop.className = 'ytpop'; pop.innerHTML = '<button class="x" aria-label="Tutup">×</button><div class="box"></div>';
  const close = () => { pop.classList.remove('on'); pop.querySelector('.box').innerHTML = ''; };
  pop.addEventListener('click', e => { if (e.target === pop || e.target.closest('.x')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-yt]'); if (!b) return;
    pop.querySelector('.box').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.yt)}?autoplay=1&rel=0&playsinline=1" title="Video Digify" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    pop.classList.add('on');
  });
  (document.body ? Promise.resolve() : new Promise(r => addEventListener('DOMContentLoaded', r))).then(() => document.body.appendChild(pop));
})();
