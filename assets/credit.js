// Judul penutup bergaya kredit film: satu baris bergantian
// "Disutradarai oleh KAMU" ⇄ "Dianimasikan oleh AI" (jeda 2 detik), kata terakhir berwarna oranye.
// Markup: <h2 class="credit"><span class="cl"><small>Disutradarai oleh</small><b>kamu</b></span><span class="cl">…</span></h2>
(() => {
  const css = `
.action h2.credit,h2.credit{display:grid;justify-items:center;margin:0 0 22px;font-family:var(--fd);font-weight:400;text-transform:uppercase;font-size:clamp(28px,8.6vw,46px);line-height:1;white-space:nowrap;text-wrap:nowrap}
.credit .cl{grid-area:1/1;display:block}
.credit .cl,.credit .cl *{white-space:nowrap;text-wrap:nowrap}
.credit .cl small,.credit .cl b{font:inherit;color:#fff3e8}
.credit .cl b{color:var(--or2)}
.credit .ch{display:inline-block;opacity:0;transform:translateY(.5em);filter:blur(5px);transition:opacity .4s,transform .5s cubic-bezier(.2,1.4,.4,1),filter .4s;transition-delay:var(--d,0s)}
.credit .cl.on .ch{opacity:1;transform:none;filter:none}
.credit .cl.off .ch{opacity:0;transform:translateY(-.4em);filter:blur(4px);transition-delay:calc(var(--d,0s) / 4)}
@media (prefers-reduced-motion:reduce){.credit .ch{transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.querySelectorAll('.credit').forEach(h => {
    const lines = [...h.querySelectorAll('.cl')];
    h.setAttribute('aria-label', lines.map(l => l.textContent.replace(/\s+/g, ' ').trim()).join('. '));
    lines.forEach(l => { let k = 0;
      l.setAttribute('aria-hidden', 'true');
      const parts = [...l.querySelectorAll('small,b')];
      parts.forEach((el, n) => {
        el.innerHTML = [...el.textContent].map(c => c === ' ' ? ' ' : `<span class="ch" style="--d:${(k++) * .035 + (n ? .15 : 0)}s">${c}</span>`).join('');
        if (n < parts.length - 1) el.insertAdjacentText('afterend', ' ');
      });
    });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let vis = false, run = false, i = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines[0].classList.add('on');
      setInterval(() => { lines.forEach(l => l.classList.remove('on')); i = (i + 1) % lines.length; lines[i].classList.add('on'); }, 2000);
      return;
    }
    const loop = async () => {
      if (run) return; run = true;
      while (vis) {
        const l = lines[i];
        l.classList.remove('off'); l.classList.add('on');
        await wait(900 + 2000);            // muncul, lalu tahan 2 detik
        l.classList.remove('on'); l.classList.add('off');
        await wait(450);
        i = (i + 1) % lines.length;
      }
      run = false;
    };
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) loop(); }, { threshold: .4 }).observe(h);
  });
})();
