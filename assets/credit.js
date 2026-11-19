// Judul penutup bergaya kredit film: "Disutradarai oleh kamu" → "Dianimasikan oleh AI".
// Markup: <h2 class="credit"><span class="cl"><small>Disutradarai oleh</small><b>kamu</b></span><span class="cl">…</span></h2>
(() => {
  const css = `
.action h2.credit,h2.credit{display:grid;gap:6px;margin:0 0 22px;font-weight:400;line-height:1}
.credit .cl{display:flex;justify-content:center;align-items:baseline;gap:.3em;white-space:nowrap;font-size:clamp(40px,12vw,92px)}
.credit small{font-family:var(--fd);font-size:.52em;font-weight:400;letter-spacing:.5px;text-transform:uppercase;color:#cdb3a2}
.credit b{font-family:var(--fd);font-weight:400;text-transform:uppercase;font-size:1em;line-height:1;display:inline-block;padding:.04em .02em}
.credit b{color:var(--or2)}
.credit .ch{display:inline-block;opacity:0;transform:translateY(.45em) rotate(6deg);filter:blur(6px);transition:opacity .45s,transform .55s cubic-bezier(.2,1.4,.4,1),filter .45s;transition-delay:var(--d,0s)}
.credit small .ch{transform:translateY(.6em);filter:none}
.credit .cl.on .ch{opacity:1;transform:none;filter:none}
.credit .cl.off .ch{opacity:0;transform:translateY(-.3em);filter:blur(4px);transition-delay:calc(var(--d,0s) / 3)}
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
