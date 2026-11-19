// Judul penutup bergaya kredit film: "Disutradarai oleh kamu" → "Dianimasikan oleh AI".
// Markup: <h2 class="credit"><span class="cl"><small>Disutradarai oleh</small><b>kamu</b></span><span class="cl">…</span></h2>
(() => {
  const css = `
.action h2.credit,h2.credit{display:grid;gap:14px;margin:0 0 22px;font-weight:400}
.credit .cl{display:grid;justify-items:center;gap:2px}
.credit small{font-family:var(--fm);font-size:clamp(12px,3.4vw,15px);font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cdb3a2}
.credit b{font-family:var(--fd);font-weight:400;text-transform:uppercase;font-size:clamp(58px,16vw,112px);line-height:.9;display:block;white-space:nowrap}
.credit .cl:nth-child(1) b{color:var(--or2)}
.credit .cl:nth-child(2) b{color:transparent;-webkit-text-stroke:2px var(--or2);position:relative}
.credit .cl:nth-child(2) b .ch{background:linear-gradient(90deg,var(--or),var(--or2));-webkit-background-clip:text;background-clip:text;background-size:0 100%;background-repeat:no-repeat;transition:opacity .45s var(--d,0s),transform .55s cubic-bezier(.2,1.4,.4,1) var(--d,0s),filter .45s var(--d,0s),background-size .6s ease-out calc(var(--d,0s) + .7s)}
.credit .ch{display:inline-block;opacity:0;transform:translateY(.45em) rotate(6deg);filter:blur(6px);transition:opacity .45s,transform .55s cubic-bezier(.2,1.4,.4,1),filter .45s;transition-delay:var(--d,0s)}
.credit small .ch{transform:translateY(.6em);filter:none}
.credit .cl.on .ch{opacity:1;transform:none;filter:none}
.credit .cl:nth-child(2).on b .ch{background-size:100% 100%}
.credit .cl.off .ch{opacity:0;transform:translateY(-.3em);filter:blur(4px);transition-delay:calc(var(--d,0s) / 3)}
.credit .cl small{position:relative;padding:0 2px}
.credit .cl small::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;background:var(--or2);transform:scaleX(0);transform-origin:left;transition:transform .5s ease-out .5s}
.credit .cl.on small::after{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.credit .ch{opacity:1!important;transform:none!important;filter:none!important;transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.querySelectorAll('.credit').forEach(h => {
    const lines = [...h.querySelectorAll('.cl')];
    h.setAttribute('aria-label', lines.map(l => l.textContent.replace(/\s+/g, ' ').trim()).join('. '));
    lines.forEach(l => { let k = 0;
      l.querySelectorAll('small,b').forEach(el => {
        const big = el.tagName === 'B';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = [...el.textContent].map(c => c === ' ' ? ' ' : `<span class="ch" style="--d:${(big ? .35 : 0) + (k++) * (big ? .07 : .025)}s">${c}</span>`).join('');
      });
    });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let vis = false, run = false;
    const loop = async () => {
      if (run) return; run = true;
      while (vis) {
        lines.forEach(l => l.classList.remove('on', 'off'));
        await wait(250);
        lines[0].classList.add('on'); await wait(1700);
        lines[1].classList.add('on'); await wait(4200);
        lines.forEach(l => { l.classList.remove('on'); l.classList.add('off'); }); await wait(900);
      }
      run = false;
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { lines.forEach(l => l.classList.add('on')); return; }
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) loop(); }, { threshold: .4 }).observe(h);
  });
})();
