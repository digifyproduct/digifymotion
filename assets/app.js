(() => {
const S = window.SITE;
let C = null, X = null, YT = {}, LES = [];
const app = document.getElementById('app');
const byId = id => LES.find(l => l.id === id);
function setData(d) {
  C = d.course; X = d.extra; YT = d.youtube || {};
  LES = C.modules.flatMap(m => m.lessons.map(l => ({ ...l, mod: m })));
  if (d.secrets) { S.linkKomunitas = d.secrets.komunitas || ''; S.linkSkillZip = d.secrets.skill_zip || ''; }
  if (!G.id) G.id = X.gaya[0].id;
}
// Mode sungguhan bila Supabase diisi di config.js; tanpa itu = mode demo lokal.
const REAL = !!(S.supabaseUrl && S.supabaseAnonKey);
let sb = null, uid = null, booted = false, syncT = 0;

/* ---------- state (localStorage) ---------- */
const KEY = 'dmc-v1';
let st;
try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
st.done ||= {}; st.checks ||= {}; st.favs ||= [];
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  if (REAL && sb && uid) { clearTimeout(syncT); syncT = setTimeout(() => sb.from('progress').upsert({ user_id: uid,
    data: { done: st.done, checks: st.checks, favs: st.favs }, updated_at: new Date().toISOString() }).then(() => {}), 600); }
};

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  spark: '<path d="m12 3 1.9 5.8L20 9l-4.9 3.6L17 18.5 12 15l-5 3.5 1.9-5.9L4 9l6.1-.2z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16a6 6 0 0 0 6-6c0-4.4-4.5-8.3-10-8.3z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  down: '<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
};
const ic = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24">${I[n]}</svg>`;

// teks untuk tombol salin/favorit (hindari escaping di atribut)
let T = [];
const tx = s => (T.push(s), T.length - 1);
const copyBtn = (s, label = 'Salin', cls = 'btn-or') => `<button class="btn ${cls} btn-sm" data-act="copy" data-t="${tx(s)}">${ic('copy')}${label}</button>`;
const favBtn = (s, label) => { const on = st.favs.includes(s);
  return label ? `<button class="btn btn-line btn-sm ${on ? 'fav-on' : ''}" data-act="fav" data-t="${tx(s)}">${ic('star')}${on ? 'Tersimpan' : label}</button>`
               : `<button class="btn star ${on ? 'on' : ''}" title="Simpan ke favorit" data-act="fav" data-t="${tx(s)}">${ic('star')}</button>`; };

const toast = (m, happy) => { const t = document.getElementById('toast'); t.innerHTML = (happy ? '<span class="masc toast-m" data-m="head"></span>' : '') + esc(m); t.classList.toggle('happy', !!happy); t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800); };
async function copy(s) {
  try { await navigator.clipboard.writeText(s); }
  catch (e) { const a = document.createElement('textarea'); a.value = s; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast('Prompt tersalin ✓');
}

const doneCount = ls => ls.filter(l => st.done[l.id]).length;
const pct = () => Math.round(doneCount(LES) / LES.length * 100);
const nextLesson = () => LES.find(l => !st.done[l.id]) || LES[LES.length - 1];
const thumb = (l, cls = '') => `<div class="thumb ${cls}">${l.thumb ? `<img loading="lazy" src="${l.thumb}" alt="">` : `<span class="na">${l.id}</span>`}
  ${l.seconds ? `<span class="d">${fmt(l.seconds)}</span>` : ''}${st.done[l.id] ? `<span class="ck">${ic('check')}</span>` : ''}</div>`;

/* ---------- shell ---------- */
const NAV = [
  ['BELAJAR', [['beranda', 'Beranda', 'home'], ['kelas', 'Kelas', 'play']]],
  ['ALAT', [['racik', 'Racik Prompt', 'spark'], ['prompt', 'Perpustakaan Prompt', 'book'], ['gaya', 'Resep Gaya', 'palette', 'BETA'], ['kamus', 'Kamus Motion', 'type']]],
  ['LAINNYA', [['komunitas', 'Grup Komunitas', 'users'], ['download', 'Download', 'down'], ['akun', 'Akun', 'user']]],
];
function shell(route, html) {
  const act = route === 'lesson' ? 'kelas' : route;
  return `<div class="shell" id="shell">
  <div class="top-m"><a class="brand" href="#/beranda"><img src="assets/img/logo-digify.png" alt="">DIGIFY</a>
    <button data-act="menu" aria-label="Menu">${ic('menu')}</button></div>
  <aside class="side">
    <a class="brand" href="./"><img src="assets/img/logo-digify.png" alt=""><span>DIGIFY<small>Motion Course</small></span></a>
    ${NAV.map(([h, items]) => `<h6>${h}</h6><nav class="nav">${items.map(([r, n, i, b]) =>
      `<a href="#/${r}" class="${r === act ? 'on' : ''}">${ic(i)}${n}${b ? `<span class="beta">${b}</span>` : ''}</a>`).join('')}</nav>`).join('')}
    <div class="mine"><small>KELASMU</small><b>${esc(S.namaKelas)}</b><span>Akses selamanya</span></div>
    <button class="out" data-act="logout">${ic('out')}Keluar</button>
  </aside>
  <div class="scrim" data-act="menu"></div>
  <main class="main">${html}</main></div>`;
}

/* ---------- halaman ---------- */
function pBeranda() {
  const u = st.user, h = new Date().getHours();
  const salam = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
  const p = pct(), n = nextLesson();
  const day = Math.floor(Date.now() / 864e5), term = X.kamus[day % X.kamus.length];
  const favN = st.favs.length;
  return `
  <div class="hello"><div><h1 class="ph1">Selamat ${salam}, ${esc(u.name || 'kreator')}!</h1>
    <p class="sub">${p === 0 ? 'Mulai dari video pertama, tonton berurutan ya.' : p === 100 ? 'Semua materi selesai. Saatnya bikin video sendiri!' : `Kamu sudah ${p}% jalan. Lanjut sedikit lagi.`}</p></div>
    <div class="hello-r"><span class="masc hello-m"></span><div class="ring" style="--p:${p}"><b>${p}%</b></div></div></div>
  <div class="dark cont">
    <a href="#/lesson/${n.id}" style="position:relative">${thumb(n)}</a>
    <div style="position:relative"><span class="k-lbl">${p === 100 ? 'Tonton lagi' : 'Lanjutkan belajar'}</span>
      <h2>${n.id} · ${esc(n.title)}</h2>
      <div class="m">${n.mod.label} · ${esc(n.mod.name)}${n.seconds ? ' · ' + fmt(n.seconds) : ''}</div>
      <ul>${n.summary.slice(0, 3).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="acts"><a class="btn btn-or" href="#/lesson/${n.id}">Buka lesson & checklist</a>
        <button class="btn btn-line" data-act="done" data-id="${n.id}">${ic('check')}${st.done[n.id] ? 'Sudah selesai' : 'Tandai selesai'}</button></div></div>
  </div>
  <h2 class="h2">Progres modul</h2>
  <div class="mgrid">${C.modules.map(m => { const d = doneCount(m.lessons), all = d === m.lessons.length;
    return `<a class="card mcard" href="#/kelas#m${m.id}"><div class="tile ${all ? 'ok' : ''}">${all ? ic('check') : m.id}</div>
      <div class="x"><b>${m.label}</b><small>${esc(m.name)}</small><div class="bar ${all ? 'ok' : ''}"><i style="width:${d / m.lessons.length * 100}%"></i></div></div>
      <em>${d}/${m.lessons.length}</em></a>`; }).join('')}</div>
  <h2 class="h2">Alat belajar</h2>
  <div class="grid3">
    <a class="dark card tool" href="#/racik"><span class="chip chip-or" style="align-self:flex-start;position:relative">Racik Prompt</span>
      <h3 style="color:#fff;position:relative">Butuh prompt cepat?</h3><p style="position:relative">Pilih tahap, isi sedikit, prompt langsung jadi.</p><span class="go" style="position:relative">Racik sekarang →</span></a>
    <a class="card tool" href="#/kamus?q=${encodeURIComponent(term.n)}"><span class="chip chip-ink" style="align-self:flex-start">Istilah hari ini</span>
      <h3>${esc(term.n)}</h3><p>${esc(term.a)}</p><span class="go">Buka Kamus Motion →</span></a>
    <a class="card tool" href="#/prompt?fav=1"><span class="chip chip-or" style="align-self:flex-start">${ic('star')} Prompt favorit</span>
      <h3>${favN ? favN + ' prompt tersimpan' : 'Belum ada favorit'}</h3><p>${favN ? 'Semua prompt yang kamu tandai bintang ada di satu tempat.' : 'Klik ☆ di prompt mana pun untuk menyimpannya.'}</p><span class="go">Buka favoritku →</span></a>
  </div>`;
}

function pKelas() {
  const d = doneCount(LES);
  return `<h1 class="ph1">Kelas</h1>
  <p class="sub">${C.modules.length} modul · ${LES.length} lesson · ${d} dari ${LES.length} selesai</p>
  ${C.modules.map(m => { const dn = doneCount(m.lessons), all = dn === m.lessons.length, t = m.lessons.reduce((a, l) => a + l.seconds, 0);
    return `<section class="mod" id="m${m.id}"><div class="mod-h"><div class="tile ${all ? 'ok' : ''}">${m.id}</div>
      <div><h2>${m.label} · ${esc(m.name)}</h2><div class="meta">${dn}/${m.lessons.length} lesson · ${fmt(t)}<div class="bar ${all ? 'ok' : ''}"><i style="width:${dn / m.lessons.length * 100}%"></i></div></div></div>
      ${all ? '<span class="chip chip-ok">Selesai</span>' : dn ? '<span class="chip chip-or">Berjalan</span>' : ''}</div>
      <p>${esc(m.desc)}</p>
      <div class="lgrid">${m.lessons.map(l => `<a class="lcard" href="#/lesson/${l.id}">${thumb(l)}<small>${l.id} · ${m.label}</small><b>${esc(l.title)}</b></a>`).join('')}</div></section>`; }).join('')}`;
}

function pLesson(id) {
  const l = byId(id); if (!l) return `<p class="empty">Lesson tidak ditemukan.</p>`;
  const i = LES.indexOf(l), prev = LES[i - 1], next = LES[i + 1], m = l.mod, yt = YT[l.id];
  const checks = st.checks[l.id] || [];
  const promptLines = l.prompts;
  return `<div class="crumb"><a class="btn btn-line btn-sm" href="#/kelas#m${m.id}">${ic('left')}Kembali ke ${m.label}</a>
    <span>Kelas / ${m.label} · ${esc(m.name)}</span></div>
  <div class="les"><div>
    <div class="player">${yt ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0&modestbranding=1" title="${esc(l.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `${l.thumb ? `<img src="${l.thumb}" alt="">` : ''}<div class="soon">${ic('play')}<b>Video segera tayang</b><span>Sementara, baca ringkasan dan checklist di bawah.</span></div>`}</div>
    <h1>${l.id} · ${esc(l.title)}</h1>
    <span class="chip chip-ok">${promptLines.length ? 'tutorial + prompt' : 'tutorial'}${l.seconds ? ' · ' + fmt(l.seconds) : ''}</span>
    <div class="two">
      <div class="card"><h3>Ringkasan</h3><ul>${l.summary.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="card"><h3>Sekarang coba kamu</h3>${l.checklist.map((c, k) => `<label class="chk"><input type="checkbox" data-act="chk" data-id="${l.id}" data-k="${k}" ${checks[k] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('') || '<p class="sub">Tidak ada checklist.</p>'}</div>
    </div>
    ${promptLines.length ? `<h3 style="margin:28px 0 12px;font-size:19px">Prompt di video ini</h3>${promptLines.map(p => `<pre class="pblock"><span class="lbl">prompt</span>${esc(p)}</pre><div class="prow">${copyBtn(p, 'Salin prompt')}${favBtn(p, 'Simpan ke favorit')}</div>`).join('')}` : ''}
    <div class="pn">${prev ? `<a class="btn btn-line btn-sm" href="#/lesson/${prev.id}">${ic('left')}${prev.id}</a>` : '<span></span>'}
      ${next ? `<a class="btn btn-line btn-sm" href="#/lesson/${next.id}">${next.id}${ic('right')}</a>` : ''}</div>
  </div>
  <aside class="card slist"><h4>${m.label} · ${doneCount(m.lessons)}/${m.lessons.length} selesai</h4>
    ${m.lessons.map(x => `<a href="#/lesson/${x.id}" class="${x.id === l.id ? 'on' : ''}"><span class="dot ${st.done[x.id] ? 'ok' : ''}">${st.done[x.id] ? ic('check') : ''}</span>${x.id} ${esc(x.title)}</a>`).join('')}
    <button class="btn ${st.done[l.id] ? 'btn-done' : 'btn-line'}" data-act="done" data-id="${l.id}">${ic('check')}${st.done[l.id] ? 'Sudah selesai' : 'Tandai selesai'}</button>
    ${!st.done[l.id] && next ? `<p style="margin:10px 4px 0;color:var(--muted);font-size:13.5px">Setelah ditandai, lanjut ke ${next.id}.</p>` : ''}
  </aside></div>`;
}

/* ---------- racik ---------- */
const R = { stage: 'Brief', jenis: 'video penjelasan', topik: '', penonton: '', durasi: '35 detik', format: '16:9 untuk YouTube', nuansa: 'santai', gaya: 'tawarkan', vo: true, sfx: true,
  narator: 'pria, hangat', musik: '15', adegan: '1', benda: '', ubah: '', masalah: 'kaku', uji: true, out: '' };
const STAGES = ['Brief', 'Naskah', 'Suara', 'Animasi', 'Revisi', 'Render'];
const sel = (k, opts) => `<select class="inp" data-r="${k}">${opts.map(o => `<option ${R[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const txt = (k, ph, area) => area ? `<textarea class="inp" data-r="${k}" placeholder="${esc(ph)}">${esc(R[k])}</textarea>` : `<input class="inp" data-r="${k}" placeholder="${esc(ph)}" value="${esc(R[k])}">`;
const F = (n, label, body) => `<div class="fld"><div class="lb"><span class="n">${n}</span>${label}</div>${body}</div>`;
function racikFields() {
  const s = R.stage; let n = 2; const f = [];
  const add = (l, b) => f.push(F(n++, l, b));
  if (s === 'Brief') {
    add('Mau bikin apa?', sel('jenis', ['video penjelasan', 'video promo', 'Shorts fakta unik', 'intro kanal', 'video tutorial']));
    add('Topik, produk, atau idemu', txt('topik', 'contoh: kenapa langit berwarna biru? atau: kedai kopi Senja', 1));
    add('Untuk siapa?', txt('penonton', 'contoh: anak SMP, ibu muda, pemilik UMKM'));
    f.push(`<div class="row2">${F(n++, 'Durasi', sel('durasi', ['15 detik', '20 detik', '30 detik', '35 detik', '45 detik', '60 detik']))}${F(n++, 'Format', sel('format', ['16:9 untuk YouTube', '9:16 untuk Reels/TikTok/Shorts', '1:1 untuk feed']))}</div>`);
    add('Nuansa', sel('nuansa', ['santai', 'ceria', 'serius', 'sinematik', 'lucu', 'menegangkan']));
    add('Gaya visual', `<select class="inp" data-r="gaya"><option value="tawarkan" ${R.gaya === 'tawarkan' ? 'selected' : ''}>belum tahu, tawarkan 3 pilihan</option>${X.gaya.map(g => `<option value="${g.id}" ${R.gaya === g.id ? 'selected' : ''}>${esc(g.nama)}</option>`).join('')}</select>`);
    add('Suara <small style="color:var(--soft);font-weight:700">ElevenLabs</small>', `<label class="tog"><input type="checkbox" data-r="vo" ${R.vo ? 'checked' : ''}>Voiceover</label><label class="tog"><input type="checkbox" data-r="sfx" ${R.sfx ? 'checked' : ''}>Efek suara</label>`);
  } else if (s === 'Naskah') {
    add('Topik', txt('topik', 'contoh: kenapa bulan ngikutin kita?', 1));
    add('Untuk siapa?', txt('penonton', 'contoh: pelajar SMP'));
    f.push(`<div class="row2">${F(n++, 'Durasi', sel('durasi', ['15 detik', '20 detik', '30 detik', '35 detik', '45 detik', '60 detik']))}${F(n++, 'Nuansa', sel('nuansa', ['santai', 'ceria', 'serius', 'sinematik', 'lucu']))}</div>`);
  } else if (s === 'Suara') {
    add('Narator', sel('narator', ['pria, hangat', 'wanita, hangat', 'pria, energik', 'wanita, tenang', 'anak muda, santai']));
    add('Volume musik latar (%)', sel('musik', ['0', '10', '15', '20', '30']));
    add('Efek suara', `<label class="tog"><input type="checkbox" data-r="sfx" ${R.sfx ? 'checked' : ''}>Pakai efek suara pelan</label>`);
  } else if (s === 'Animasi') {
    add('Adegan nomor', sel('adegan', ['1', '2', '3', '4', '5', '6']));
    add('Masalahnya', sel('masalah', ['kaku', 'terlalu cepat', 'terlalu kosong', 'teks sulit dibaca', 'transisi patah']));
  } else if (s === 'Revisi') {
    add('Adegan nomor', sel('adegan', ['1', '2', '3', '4', '5', '6']));
    add('Benda yang diubah', txt('benda', 'contoh: paus, judul, latar laut'));
    add('Perubahannya (pakai angka)', txt('ubah', 'contoh: 30% lebih besar, geser ke kiri'));
  } else {
    add('Format', sel('format', ['16:9 untuk YouTube', '9:16 untuk Reels/TikTok/Shorts', '1:1 untuk feed']));
    add('Uji dulu', `<label class="tog"><input type="checkbox" data-r="uji" ${R.uji ? 'checked' : ''}>Cek 8 detik pertama sebelum render penuh</label>`);
  }
  return f.join('');
}
function racikGen() {
  const s = R.stage, v = (x, ph) => (x || '').trim() || `[${ph}]`;
  if (s === 'Brief') {
    const g = X.gaya.find(g => g.id === R.gaya);
    const suara = R.vo && R.sfx ? 'pakai voiceover dan efek suara dari ElevenLabs.' : R.vo ? 'pakai voiceover dari ElevenLabs, tanpa efek suara.' : R.sfx ? 'efek suara saja, tanpa voiceover.' : 'tanpa suara.';
    return `bikin ${R.jenis} ${R.durasi}: ${v(R.topik, 'topik')}. untuk ${v(R.penonton, 'penonton')}. format ${R.format}. nuansa ${R.nuansa}. ${suara}\n`
      + (g ? `gaya: ${g.nama.toLowerCase()} — ${g.ciri.join(', ').toLowerCase()}.\n` : 'sebelum mulai, tawarkan 3 pilihan gaya visual, nanti aku pilih.\n')
      + 'tulis rencananya dulu (adegan, naskah, perkiraan kredit) sebelum membuat apa pun.';
  }
  if (s === 'Naskah') return `tulis naskah video ${R.durasi} tentang ${v(R.topik, 'topik')}, untuk ${v(R.penonton, 'penonton')}, nuansa ${R.nuansa}. bagi jadi 5 adegan, tiap adegan maksimal 2 kalimat. buka dengan hook maksimal 8 kata. jangan buat animasi dulu, tunggu persetujuanku.`;
  if (s === 'Suara') return `buat voiceover bahasa Indonesia dengan narator ${R.narator}. tes adegan 1 dulu supaya aku bisa dengar nadanya. ${R.musik === '0' ? 'tanpa musik latar.' : `musik latar ${R.musik}% di bawah suara narator, konsisten dari awal sampai akhir.`} ${R.sfx ? 'efek suara pelan dan relevan dengan gerakan, jangan whoosh di setiap transisi.' : 'tanpa efek suara.'}`;
  if (s === 'Animasi') return {
    'kaku': `adegan ${R.adegan} terasa kaku. tambahkan easing, sedikit anticipation sebelum benda bergerak, dan overshoot kecil saat berhenti. suara dan timing jangan diubah.`,
    'terlalu cepat': `adegan ${R.adegan} terlalu cepat. beri jeda 0,3 detik di antara gerakan dan biarkan benda utama diam sebentar sebelum adegan berganti. suara jangan diubah.`,
    'terlalu kosong': `adegan ${R.adegan} terasa kosong. tambahkan satu benda pendukung yang relevan dengan kalimatnya dan latar bergerak pelan. bagian lain jangan diubah.`,
    'teks sulit dibaca': `teks di adegan ${R.adegan} sulit dibaca. perbesar 20%, beri kontras lebih kuat, dan tahan minimal 1,5 detik. bagian lain jangan diubah.`,
    'transisi patah': `transisi dari adegan ${R.adegan} ke berikutnya terasa patah. sambungkan dengan match cut atau zoom menembus benda. bagian lain jangan diubah.`,
  }[R.masalah];
  if (s === 'Revisi') return `di adegan ${R.adegan}, ${v(R.benda, 'benda')}-nya ${v(R.ubah, 'perubahan + angka')}. bagian lain jangan diubah.`;
  return R.uji ? `render jadi mp4 ${R.format}, 60 fps. cek 8 detik pertama dulu ya` : `render penuh jadi mp4 ${R.format}, 60 fps.`;
}
function pRacik() {
  return `<h1 class="ph1">Racik Prompt</h1><p class="sub">Isi, klik, prompt jadi. Salin lalu tempel ke Claude Code.</p>
  <div class="racik"><div class="card">
    ${F(1, 'Sekarang di tahap apa?', `<div class="pills">${STAGES.map(s => `<button class="pill ${R.stage === s ? 'on' : ''}" data-act="stage" data-s="${s}">${s}</button>`).join('')}</div>`)}
    ${racikFields()}
    <button class="btn btn-ink" data-act="racik">${ic('spark')}Racik prompt</button>
  </div>
  <div class="dark rout"><h3>${ic('spark')}Prompt siap tempel ke Claude Code</h3>
    <pre id="rOut" class="${R.out ? '' : 'ph'}">${R.out ? esc(R.out) : 'Isi formulir di kiri, lalu klik "Racik prompt".'}</pre>
    <div class="prow">${R.out ? copyBtn(R.out) + favBtn(R.out, 'Simpan ke favorit') : `<button class="btn btn-or btn-sm" disabled>${ic('copy')}Salin</button>`}</div></div></div>`;
}

/* ---------- perpustakaan ---------- */
const LIB = { q: '', t: 'Semua', fav: false };
function pPrompt() {
  const q = LIB.q.toLowerCase();
  let items = X.prompts.map(p => ({ ...p }));
  if (LIB.fav) {
    items = st.favs.map(f => X.prompts.find(p => p.p === f) || { t: 'Tersimpan', j: 'Prompt tersimpan', p: f });
  }
  items = items.filter(p => (LIB.t === 'Semua' || p.t === LIB.t) && (!q || (p.j + ' ' + p.p + ' ' + p.t).toLowerCase().includes(q)));
  return `<div class="lib-top"><div><h1 class="ph1">Perpustakaan Prompt</h1>
    <p class="sub">${X.prompts.length} prompt siap pakai, dikelompokkan per tahap. Ganti bagian dalam [kurung].</p></div>
    <div class="seg"><button class="${LIB.fav ? '' : 'on'}" data-act="libfav" data-v="0">Semua</button><button class="${LIB.fav ? 'on' : ''}" data-act="libfav" data-v="1">★ Favoritku · ${st.favs.length}</button></div></div>
  <div class="search">${ic('search')}<input class="inp" id="libq" placeholder='Cari prompt, misal "hook" atau "9:16"' value="${esc(LIB.q)}"></div>
  <div class="pills">${['Semua', ...X.tahap].map(t => `<button class="pill ${LIB.t === t ? 'on' : ''}" data-act="libt" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="pcards" id="pcards">${items.length ? items.map(p => `<div class="pc"><div class="art"><small>${esc(p.t.toUpperCase())}</small><i style="width:72%"></i><i style="width:88%"></i><i style="width:55%"></i></div>
    <div class="body"><h3>${esc(p.j)}</h3><pre class="pblock">${esc(p.p)}</pre><div class="prow" style="margin:0">${copyBtn(p.p)}${favBtn(p.p)}</div></div></div>`).join('')
    : `<p class="empty">${LIB.fav ? 'Belum ada favorit. Klik ☆ di prompt mana pun untuk menyimpannya.' : 'Tidak ada prompt yang cocok.'}</p>`}</div>`;
}

/* ---------- resep gaya ---------- */
const G = { id: null, rev: 0 };
function pGaya() {
  const g = X.gaya.find(x => x.id === G.id), rv = g.revisi[G.rev] || g.revisi[0];
  const imgs = g.contoh.map(s => C.works.find(w => w.slug === s)).filter(Boolean);
  const pics = imgs.length ? imgs.map(w => `<img src="${w.img}" alt="">`).join('') : ['3.1', '2.1', '1.2'].map(id => byId(id)).filter(l => l && l.thumb).map(l => `<img src="${l.thumb}" alt="" style="aspect-ratio:16/9">`).join('');
  const own = [
    ['Dari gambar yang kamu suka', 'Lampirkan screenshot atau poster. Claude membaca cirinya lalu meracik versi baru.', 'lihat gambar terlampir. tulis 5 ciri gayanya (warna, bentuk, tekstur, gerak, huruf), lalu buat satu adegan uji dengan ciri itu untuk topik [topik]. jangan menyalin isinya.'],
    ['Campur dua gaya', 'Cara paling cepat dapat gaya yang terasa baru, misalnya siluet × kertas kolase.', 'campur dua gaya: [gaya A] dan [gaya B]. ambil warna dari [A] dan tekstur dari [B]. buat satu adegan uji untuk [topik].'],
    ['Pakai warna brand-ku', 'Satu langkah yang langsung bikin videomu beda dari punya orang lain.', 'pakai warna brand-ku di semua adegan: utama [kode warna], aksen [kode warna], latar [kode warna]. bagian lain jangan diubah.'],
    ['Kunci jadi gayamu', 'Setelah cocok, minta Claude menulis aturan gayamu. Video berikutnya tinggal bilang "pakai GAYA-SAYA.md".', 'tulis semua aturan gaya video ini ke file GAYA-SAYA.md: warna, font, bentuk tokoh, gerak, suara, dan larangan. supaya video berikutnya cukup bilang "pakai GAYA-SAYA.md".'],
  ];
  return `<h1 class="ph1">Resep Gaya <span class="chip" style="background:var(--or);color:#fff;vertical-align:middle;font-family:var(--ff)">Beta</span></h1>
  <p class="sub">Salin prompt awalnya, lalu pilih revisi sesuai yang kurang dari hasilmu.</p>
  <div class="tabs">${X.gaya.map(x => `<button class="${x.id === G.id ? 'on' : ''}" data-act="gaya" data-v="${x.id}"><i style="background:${x.warna}"></i>${esc(x.nama)}</button>`).join('')}</div>
  <div class="card gaya"><div>
    <h2>${esc(g.nama)}</h2><p class="sub" style="margin:6px 0 0">${esc(g.desc)}</p>
    <div class="k-lbl" style="color:var(--red);margin-top:22px">Ciri gayanya</div>
    <ul class="ciri">${g.ciri.map(c => `<li>${ic('check')}${esc(c)}</li>`).join('')}</ul>
    <div class="step-h"><b>1</b><h3>Prompt awal</h3></div>
    <p style="color:var(--muted);margin:0 0 12px">Pastikan skill Digify Motion terpasang. Ganti bagian dalam [kurung] dengan topikmu.</p>
    <pre class="pblock lite">${esc(g.prompt)}</pre><div class="prow">${copyBtn(g.prompt, 'Salin prompt')}${favBtn(g.prompt, 'Favorit')}</div>
    <div class="step-h"><b>2</b><h3>Kalau hasilmu…</h3></div>
    <p style="color:var(--muted);margin:0 0 12px">Pilih yang paling mirip dengan masalahmu, salin, lalu kirim satu per satu.</p>
    <div class="pills" style="margin-bottom:14px">${g.revisi.map((r, k) => `<button class="pill ${k === G.rev ? 'on' : ''}" data-act="rev" data-v="${k}">${esc(r[0])}</button>`).join('')}</div>
    <pre class="pblock lite">${esc(rv[1])}</pre><div class="prow">${copyBtn(rv[1], 'Salin revisi', 'btn-ink')}</div>
  </div><div class="ex">${pics}</div></div>
  <h2 class="h2">Pengen bikin gayamu sendiri?</h2>
  <div class="own">${own.map((o, k) => `<div class="card"><span class="num">${k + 1}</span><h3 style="font-size:17px">${o[0]}</h3><p>${o[1]}</p>${copyBtn(o[2], 'Salin', 'btn-line')}</div>`).join('')}</div>`;
}

/* ---------- kamus ---------- */
const K = { q: '', k: 'Semua' };
const box = (st_, extra = '') => `<div style="${st_}" ${extra}></div>`;
function demo(d) {
  const c = 'left:50%;top:50%;translate:-50% -50%;';
  const dot = (top, anim, lbl, dx = 200) => `<span class="lab" style="top:${top - 18}px">${lbl}</span><div class="o" style="left:18px;top:${top}px;--dx:${dx}px;animation:${anim}"></div>`;
  switch (d) {
    case 'qa': return `<span class="qa1">?</span><span class="qa2">!</span>`;
    case 'promo': return box(c + 'width:80px;height:92px;border-radius:14px;background:#efe2d2;animation:over 2.6s infinite') + `<span class="chip" style="left:56%;top:20%;background:var(--red);color:#fff;animation:pop 2.6s .3s infinite;opacity:0">-30%</span>`;
    case 'intro': return `<img src="assets/img/logo-digify.png" alt="" style="${c}width:58px;animation:over 2.6s infinite">`;
    case 'lower': return `<div style="left:0;bottom:24px;height:40px;width:70%;overflow:hidden"><div style="height:100%;background:var(--or);color:#fff;font-weight:800;padding:8px 16px;animation:slideL 3s infinite">Rina · Desainer</div></div>`;
    case 'key': return `<div class="ln" style="top:74px"></div>` + box('left:28px;top:69px;width:12px;height:12px;background:var(--or2);rotate:45deg') + box('left:228px;top:69px;width:12px;height:12px;background:var(--or2);rotate:45deg') + `<div class="o p" style="left:21px;top:62px;--dx:200px;animation:mvx 2.6s ease-in-out infinite"></div>`;
    case 'ease': return dot(42, 'mvx 2.4s linear infinite', 'LINEAR') + dot(108, 'mvx 2.4s ease-in-out infinite', 'EASE IN-OUT');
    case 'timing': return dot(42, 'mvx .9s ease-in-out infinite', 'CEPAT · 0,7 DTK') + dot(108, 'mvx 2.6s ease-in-out infinite', 'PELAN · 2,2 DTK');
    case 'squash': return `<div class="ln" style="bottom:20px"></div><div class="o" style="left:calc(50% - 13px);bottom:22px;transform-origin:50% 100%;animation:sq 1.1s ease-in-out infinite"></div>`;
    case 'antic': return `<div class="o" style="left:40px;top:62px;animation:antic 2.6s ease-in-out infinite"></div>`;
    case 'over': return box(c + 'width:70px;height:88px;border-radius:12px;background:var(--orsoft);animation:over 2.6s infinite');
    case 'stagger': return [0, 1, 2, 3].map(i => box(`left:${38 + i * 54}px;top:57px;width:36px;height:36px;border-radius:9px;background:var(--or);opacity:0;animation:pop 2.6s ${i * .15}s infinite`)).join('');
    case 'follow': return `<div style="left:40px;top:40px;--dx:150px;animation:mvx 2.6s ease-in-out infinite"><div style="width:4px;height:74px;background:#efe2d2"></div><div style="position:absolute;left:4px;top:0;width:52px;height:30px;background:var(--or);transform-origin:0 50%;animation:wag 1.3s ease-out infinite"></div></div>`;
    case 'match': return box('left:50px;top:45px;width:60px;height:60px;border-radius:50%;animation:morph 2.8s ease-in-out infinite');
    case 'zoom': return box(c + 'width:60px;height:40px;border:3px solid var(--or2);border-radius:6px;animation:zoom 2.6s ease-in infinite');
    case 'wipe': return `<span style="${c}color:#cdb3a2;font-family:var(--fd);font-size:28px">ADEGAN 1</span><div style="inset:0;background:var(--or);display:grid;place-items:center;color:#fff;font-family:var(--fd);font-size:28px;animation:wipe 2.6s ease-in-out infinite">ADEGAN 2</div>`;
    case 'kinetic': return `<div style="${c}display:flex;gap:8px;font-family:var(--fd);font-size:28px;color:#fff;white-space:nowrap">${['BIKIN', 'VIDEO', 'CUKUP', 'NGOBROL'].map((w, i) => `<span style="display:inline-block;opacity:0;animation:pop 2.8s ${i * .22}s infinite;${i === 3 ? 'color:var(--or2)' : ''}">${w}</span>`).join('')}</div>`;
    case 'mask': return `<div style="${c}height:52px;overflow:hidden"><div style="font-family:var(--fd);font-size:40px;color:#fff;line-height:52px;animation:rise 2.6s cubic-bezier(.2,.8,.2,1) infinite">JUDUL</div></div>`;
    case 'karaoke': return `<div style="${c}display:flex;gap:7px;font-weight:800;font-size:18px;white-space:nowrap">${['kamu', 'punya', 'keahlian', 'berharga'].map((w, i) => `<span style="color:#6f5240;animation:lit 2.4s ${i * .3}s infinite;${i === 2 ? 'animation-name:none;color:var(--or2)' : ''}">${w}</span>`).join('')}</div>`;
    case 'ratio': return box(c + 'border:3px solid var(--or2);border-radius:8px;animation:ratio 3.2s ease-in-out infinite');
    case 'fps': return dot(42, 'mvx 2s linear infinite', '60 FPS') + dot(108, 'mvx 2s steps(5) infinite', '12 FPS');
    case 'render': return `<div style="${c}width:68%;height:12px;border-radius:9px;background:#3a2414;overflow:hidden"><div style="height:100%;background:linear-gradient(90deg,var(--or),var(--or2));animation:fill 2.6s ease-in-out infinite"></div></div><span class="chip chip-ok" style="left:50%;top:30%;translate:-50% 0;animation:pop 2.6s 1.6s infinite;opacity:0">MP4 ✓</span>`;
    case 'loop': return box(c + 'width:84px;height:84px;border-radius:50%;border:3px dashed var(--or);animation:spin 5s linear infinite') + box(c + 'width:16px;height:16px;border-radius:50%;background:var(--or2)');
  }
  return '';
}
function pKamus() {
  const q = K.q.toLowerCase();
  const items = X.kamus.filter(t => (K.k === 'Semua' || t.k === K.k) && (!q || (t.n + ' ' + t.a).toLowerCase().includes(q)));
  return `<h1 class="ph1">Kamus Motion</h1><p class="sub">${X.kamus.length} istilah motion dengan arti singkat dan cara menulisnya di prompt.</p>
  <div class="search">${ic('search')}<input class="inp" id="kq" placeholder='Cari istilah, misal "easing"' value="${esc(K.q)}"></div>
  <div class="pills">${['Semua', ...X.kategori].map(t => `<button class="pill ${K.k === t ? 'on' : ''}" data-act="kk" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="kgrid">${items.length ? items.map(t => `<div class="kc"><div class="stage" aria-hidden="true">${demo(t.d)}</div><div class="body">
    <h3>${esc(t.n)} <small>${esc(t.k)}</small></h3><p>${esc(t.a)}</p><code><b>di prompt:</b> ${esc(t.p)}</code></div></div>`).join('') : '<p class="empty">Istilah tidak ditemukan.</p>'}</div>`;
}

/* ---------- download & akun ---------- */
function pKomunitas() {
  const ok = !!S.linkKomunitas;
  return `<h1 class="ph1">Grup Komunitas</h1><p class="sub">Khusus peserta Digify Motion Course: tanya kendala, pamer hasil, dan dapat kabar update materi.</p>
  <div class="dark card" style="padding:28px;display:flex;gap:22px;align-items:center;flex-wrap:wrap">
    <span class="masc" data-act="wave" style="width:120px;position:relative;flex:none"></span>
    <div style="flex:1;min-width:220px;position:relative">
      <span class="chip chip-or">Khusus member</span>
      <h2 style="font-family:var(--fd);font-weight:400;font-size:32px;text-transform:uppercase;color:#fff;margin:10px 0 8px">Ngobrol bareng sesama kreator</h2>
      <p style="color:#cdb3a2;margin:0 0 18px">Kirim hasil videomu, minta masukan, atau tanya kalau mentok di satu langkah.</p>
      ${ok ? `<a class="btn btn-or" href="${esc(S.linkKomunitas)}" target="_blank" rel="noopener">${ic('users')}Gabung grup</a>`
           : `<button class="btn btn-or" disabled>${ic('users')}Link grup segera dibagikan</button>`}
    </div></div>
  <div class="card" style="margin-top:20px"><h3 style="font-size:19px;margin-bottom:10px">Aturan singkat</h3>
    <ul style="margin:0;padding-left:20px;line-height:1.9;color:var(--muted)">
      <li>Link grup hanya untuk peserta kelas, mohon tidak dibagikan ke luar.</li>
      <li>Saat bertanya, sertakan tangkapan layar atau pesan error-nya.</li>
      <li>Saling bantu dan jaga obrolan tetap sopan.</li></ul></div>`;
}
function pDownload() {
  const ok = !!S.linkSkillZip, pr = 'pasang skill dari zip ini ke folder skill Claude Code';
  return `<h1 class="ph1">Download</h1><p class="sub">Cukup <b>1 zip</b> yang dipasang ke Claude Code.</p>
  <div class="card" style="display:grid;gap:18px">
    <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <div style="width:64px;height:64px;border-radius:16px;background:var(--ink);display:grid;place-items:center"><img src="assets/img/logo-digify.png" alt="" style="width:34px"></div>
      <div style="flex:1;min-width:220px"><span class="chip chip-ok">Wajib</span><h3 style="font-size:21px;margin:6px 0 4px">Skill Digify Motion ${esc(S.versiSkill)}</h3>
        <span style="color:var(--muted)">Alur kerja kelas ini: brief, gaya, suara, animasi, revisi, sampai render MP4.</span></div>
      ${ok ? `<a class="btn btn-or" href="${esc(S.linkSkillZip)}" target="_blank" rel="noopener">${ic('down')}Unduh</a>` : `<button class="btn btn-or" disabled>${ic('down')}Segera</button>`}
    </div>
    <ol style="background:var(--paper);border-radius:16px;padding:16px 16px 16px 36px;margin:0;line-height:2">
      <li>Unduh zip-nya. <b>Jangan diekstrak.</b></li><li>Buka chat baru di Claude Code, lampirkan zip-nya, lalu kirim prompt di bawah.</li><li>Setelah Claude selesai memasang, tutup lalu buka lagi aplikasi Claude.</li></ol>
    <pre class="pblock">${esc(pr)}</pre><div class="prow" style="margin:0">${copyBtn(pr)}</div>
    <a href="#/lesson/2.1" style="color:var(--red);font-weight:800;text-decoration:none">Tonton tutorialnya di lesson 2.1 →</a>
  </div>
  <p style="color:var(--muted);font-size:14px;margin-top:22px">Digify tidak berafiliasi dengan Anthropic maupun ElevenLabs. Claude dan ElevenLabs adalah merek milik pemiliknya masing-masing.</p>`;
}
function pAkun() {
  const u = st.user;
  return `<h1 class="ph1">Akun</h1><p class="sub">Atur profil dan progres belajarmu.</p>
  <div class="acc"><form class="card" data-form="profil"><h2 style="font-size:26px">Profil</h2>
    <label for="nm">Nama panggilan</label><input class="inp" id="nm" name="name" value="${esc(u.name)}" required>
    <label for="em">Email</label><input class="inp" id="em" name="email" type="email" value="${esc(u.email)}" required ${REAL ? 'readonly style="opacity:.7"' : ''}>
    <button class="btn btn-ink" style="margin-top:20px">Simpan</button></form>
  <div class="stack"><div class="dark card" style="padding:28px"><span class="chip chip-or" style="position:relative">Kelasmu</span>
      <h2 style="position:relative;font-family:var(--fd);font-weight:400;font-size:34px;text-transform:uppercase;color:#fff;margin:10px 0">${esc(S.namaKelas)}</h2>
      <p style="position:relative;margin:0;color:#cdb3a2">${LES.length} lesson, skill Digify Motion, Racik Prompt, ${X.prompts.length} prompt siap tempel, dan Kamus Motion. Akses selamanya, termasuk update materi.</p></div>
    ${REAL ? `<form class="card" data-form="pass"><h3 style="font-size:20px">Buat / ubah password</h3>
      <p style="color:var(--muted);margin:6px 0 0">Masuk lewat link email? Buat password di sini supaya berikutnya cukup masuk dengan email + password.</p>
      <label for="np1">Password baru</label><input class="inp" id="np1" name="pw1" type="password" minlength="8" autocomplete="new-password" required>
      <label for="np2">Ulangi password</label><input class="inp" id="np2" name="pw2" type="password" minlength="8" autocomplete="new-password" required>
      <button class="btn btn-ink btn-sm" style="margin-top:14px">Simpan password</button></form>` : ''}
    <div class="card"><h3 style="font-size:20px">Progres belajar</h3><p style="color:var(--muted)">Mau mengulang dari awal? Tombol ini menghapus semua tanda selesai dan checklist di akunmu.</p>
      <button class="btn btn-line btn-sm" data-act="reset">Reset progres belajar</button></div>
    <div class="card"><h3 style="font-size:20px">Butuh bantuan?</h3><p style="color:var(--muted)">Mentok di satu langkah? Kirim DM ke Instagram @${esc(S.instagram)}, sertakan tangkapan layarnya.</p>
      <a class="btn btn-line btn-sm" href="https://ig.me/m/${encodeURIComponent(S.instagram)}" target="_blank" rel="noopener">DM Instagram</a></div></div></div>`;
}
let loginMsg = null; // {type:'ok'|'err', text}
let pendingEmail = '';
let loginView = 'masuk'; // masuk | daftar | lupa | link | reset
const note = m => m ? `<div class="note" style="${m.type === 'ok' ? 'background:var(--oksoft);color:#1d6e45' : ''}">${m.text}</div>` : '';
const tabBtn = (v, label) => `<button type="button" class="pill ${loginView === v ? 'on' : ''}" data-act="lv" data-v="${v}" style="flex:1">${label}</button>`;
function pMasuk() {
  const m = loginMsg, em = esc(pendingEmail);
  const shell = (inner, head = '') => `<div class="login"><div class="card"><span class="masc login-m"></span><span class="login-b">halo! 👋</span>${head}${inner}
    <p style="text-align:center;margin:18px 0 0;font-size:14px;color:var(--muted)">Belum punya akses? <a href="motion-course.html" style="color:var(--or);font-weight:800">Lihat kelasnya</a></p></div></div>`;
  if (!REAL) return shell(`<form data-form="demo"><h1>Masuk kelas</h1><p style="color:var(--muted);margin:6px 0 0">Pakai email yang kamu gunakan saat membeli kelas.</p>
    <label for="lnm">Nama panggilan</label><input class="inp" id="lnm" name="name" placeholder="contoh: Rina" required>
    <label for="lem">Email pembelian</label><input class="inp" id="lem" name="email" type="email" placeholder="nama@email.com" required>
    <button class="btn btn-or" id="lbtn">Masuk</button>
    <div class="note">Mode demo: email apa pun bisa masuk. Isi Supabase di config.js untuk login sungguhan.</div></form>`);
  const tabs = `<div style="display:flex;gap:8px;margin:2px 0 14px">${tabBtn('masuk', 'Masuk')}${tabBtn('daftar', 'Daftar')}</div>`;
  const pw = (id, label, ac) => `<label for="${id}">${label}</label><input class="inp" id="${id}" name="${id}" type="password" minlength="8" autocomplete="${ac}" required>`;
  const emailIn = `<label for="lem">Email pembelian</label><input class="inp" id="lem" name="email" type="email" placeholder="nama@email.com" value="${em}" autocomplete="email" required>`;
  const link = (v, t) => `<button type="button" data-act="lv" data-v="${v}" style="background:none;border:0;padding:0;color:var(--or);font-weight:800;font-size:14px">${t}</button>`;
  if (loginView === 'reset') return shell(`<form data-form="reset"><h1>Password baru</h1><p style="color:var(--muted);margin:6px 0 0">Buat password baru untuk akunmu (minimal 8 karakter).</p>
    ${pw('pw1', 'Password baru', 'new-password')}${pw('pw2', 'Ulangi password', 'new-password')}
    <button class="btn btn-or" id="lbtn">Simpan password</button>${note(m)}</form>`);
  if (loginView === 'daftar') return shell(`<form data-form="daftar"><h1>Daftar akun</h1>
    <p style="color:var(--muted);margin:6px 0 0">Khusus pembeli. Pakai email yang sama dengan email saat checkout.</p>
    <label for="lnm">Nama panggilan</label><input class="inp" id="lnm" name="name" placeholder="contoh: Rina" required>
    ${emailIn}${pw('pw1', 'Buat password', 'new-password')}${pw('pw2', 'Ulangi password', 'new-password')}
    <button class="btn btn-or" id="lbtn">Daftar</button>${note(m)}</form>`, tabs);
  if (loginView === 'lupa') return shell(`<form data-form="lupa"><h1>Lupa password</h1><p style="color:var(--muted);margin:6px 0 0">Kami kirim link untuk membuat password baru.</p>
    ${emailIn}<button class="btn btn-or" id="lbtn">Kirim link reset</button>${note(m)}
    <p style="margin:14px 0 0">${link('masuk', '← Kembali ke Masuk')}</p></form>`);
  if (loginView === 'link') return shell(`<form data-form="link"><h1>Masuk tanpa password</h1><p style="color:var(--muted);margin:6px 0 0">Kami kirim kode dan link masuk ke email pembelianmu. Kode bisa diketik di perangkat mana pun.</p>
    ${emailIn}<button class="btn btn-or" id="lbtn">${pendingEmail ? 'Kirim ulang email' : 'Kirim kode & link masuk'}</button>${note(m)}</form>
    ${pendingEmail && S.loginKode ? `<form data-form="kode" style="margin-top:16px;border-top:2px dashed var(--line);padding-top:14px">
      <label for="lkode" style="margin-top:0">Kode dari email</label>
      <input class="inp" id="lkode" name="kode" inputmode="numeric" autocomplete="one-time-code" placeholder="••••••" maxlength="10" required style="font-family:var(--fm);font-size:22px;letter-spacing:6px;text-align:center">
      <button class="btn btn-ink" id="kbtn">Masuk dengan kode</button></form>` : ''}
    <p style="margin:14px 0 0">${link('masuk', '← Masuk dengan password')}</p>`);
  return shell(`<form data-form="masuk"><h1>Masuk kelas</h1>
    ${emailIn}${pw('pw1', 'Password', 'current-password')}
    <button class="btn btn-or" id="lbtn">Masuk</button>${note(m)}
    <p style="margin:14px 0 0;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">${link('lupa', 'Lupa password?')}${link('link', 'Masuk lewat link email')}</p></form>`, tabs);
}function pBukanMember(email) {
  return `<div class="login"><div class="card"><span class="masc login-m" data-act="think"></span>
    <h1>Belum terdaftar</h1><p style="color:var(--muted)">Email <b>${esc(email)}</b> belum tercatat sebagai peserta. Kalau sudah membayar, kirim bukti pembayaran lewat DM Instagram @${esc(S.instagram)} supaya kami aktifkan.</p>
    <a class="btn btn-or" href="https://ig.me/m/${encodeURIComponent(S.instagram)}" target="_blank" rel="noopener">DM Instagram</a>
    <button class="btn btn-line" style="width:100%;justify-content:center;margin-top:10px;color:var(--text)" data-act="logout">Pakai email lain</button></div></div>`;
}
/* ---------- router ---------- */
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, anchor] = raw.split('#');
  const [path, qs] = pathPart.split('?');
  const [r, id] = path.split('/');
  const params = new URLSearchParams(qs || '');
  return { r: r || 'beranda', id, params, anchor };
}
function render(keepScroll) {
  if (!booted) return;
  T = [];
  const { r, id, params, anchor } = route();
  if (!st.user) { if (r !== 'masuk') { try { sessionStorage.setItem('dmc-next', location.hash); } catch (e) {} location.replace('#/masuk'); return; } app.innerHTML = pMasuk(); document.title = 'Masuk · ' + S.namaKelas; return; }
  if (r === 'masuk') { location.replace('#/beranda'); return; }
  if (!keepScroll && r === 'prompt' && params.get('fav')) LIB.fav = true;
  if (!keepScroll && r === 'kamus' && params.get('q')) { K.q = params.get('q'); K.k = 'Semua'; }
  const pages = { beranda: pBeranda, kelas: pKelas, lesson: () => pLesson(id), racik: pRacik, prompt: pPrompt, gaya: pGaya, kamus: pKamus, download: pDownload, komunitas: pKomunitas, akun: pAkun };
  const y = window.scrollY;
  app.innerHTML = shell(r, (pages[r] || pBeranda)());
  const titles = { beranda: 'Beranda', kelas: 'Kelas', lesson: id ? 'Lesson ' + id : 'Lesson', racik: 'Racik Prompt', prompt: 'Perpustakaan Prompt', gaya: 'Resep Gaya', kamus: 'Kamus Motion', download: 'Download', komunitas: 'Grup Komunitas', akun: 'Akun' };
  document.title = (titles[r] || 'Beranda') + ' · ' + S.namaKelas;
  if (keepScroll) window.scrollTo(0, y);
  else if (anchor && document.getElementById(anchor)) document.getElementById(anchor).scrollIntoView();
  else window.scrollTo(0, 0);
}
const rerender = () => render(true);

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'chk') return; // ditangani change
  if (a === 'copy') return copy(T[+b.dataset.t]);
  if (a === 'fav') { const s = T[+b.dataset.t], i = st.favs.indexOf(s); i < 0 ? st.favs.push(s) : st.favs.splice(i, 1); save(); toast(i < 0 ? 'Disimpan ke favorit ★' : 'Dihapus dari favorit'); return rerender(); }
  if (a === 'done') { const id = b.dataset.id; st.done[id] = !st.done[id]; if (!st.done[id]) delete st.done[id]; save(); toast(st.done[id] ? 'Mantap, lesson selesai ✓' : 'Tanda selesai dihapus', st.done[id]); return rerender(); }
  if (a === 'menu') return document.getElementById('shell').classList.toggle('open');
  if (a === 'logout') { logout(); return; }
  if (a === 'lv') { loginView = v; loginMsg = null; return render(); }
  if (a === 'reset') { if (confirm('Hapus semua tanda selesai dan checklist?')) { st.done = {}; st.checks = {}; save(); toast('Progres direset'); rerender(); } return; }
  if (a === 'stage') { R.stage = b.dataset.s; R.out = ''; return rerender(); }
  if (a === 'racik') { R.out = racikGen(); rerender(); if (innerWidth < 900) document.getElementById('rOut').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (a === 'libfav') { LIB.fav = v === '1'; return rerender(); }
  if (a === 'libt') { LIB.t = v; return rerender(); }
  if (a === 'gaya') { G.id = v; G.rev = 0; return rerender(); }
  if (a === 'rev') { G.rev = +v; return rerender(); }
  if (a === 'kk') { K.k = v; return rerender(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'chk') { const id = t.dataset.id, k = +t.dataset.k; (st.checks[id] ||= [])[k] = t.checked; save(); }
  if (t.dataset.r) R[t.dataset.r] = t.type === 'checkbox' ? t.checked : t.value;
});
let qTimer;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.r && t.type !== 'checkbox') R[t.dataset.r] = t.value;
  if (t.id === 'libq' || t.id === 'kq') {
    (t.id === 'libq' ? LIB : K).q = t.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { const pos = t.selectionStart; rerender(); const n = document.getElementById(t.id); n.focus(); n.setSelectionRange(pos, pos); }, 200);
  }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const fm = f.dataset.form, mail = (d.email || '').trim().toLowerCase();
  if (REAL) {
    if (fm === 'masuk') return pwLogin(mail, d.pw1);
    if (fm === 'daftar') return pwSignup(d.name.trim(), mail, d.pw1, d.pw2);
    if (fm === 'lupa') return pwForgot(mail);
    if (fm === 'link') return sendLink('', mail);
    if (fm === 'reset') return pwReset(d.pw1, d.pw2);
    if (fm === 'pass') return pwChange(d.pw1, d.pw2, f);
    if (fm === 'kode') return verifyCode(String(d.kode).replace(/\D/g, ''));
  }
  st.user = { name: d.name.trim(), email: REAL ? st.user.email : mail }; save();
  if (REAL && fm === 'profil') sb.from('members').update({ name: st.user.name }).eq('email', st.user.email).then(() => {});
  if (fm === 'demo') { let nx = ''; try { nx = sessionStorage.getItem('dmc-next') || ''; sessionStorage.removeItem('dmc-next'); } catch (e) {} location.hash = nx && nx !== '#/masuk' ? nx : '#/beranda'; } else { toast('Profil disimpan'); rerender(); }
});
window.addEventListener('hashchange', () => render());

/* ---------- boot ---------- */
const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('gagal memuat ' + src)); document.head.appendChild(s); });
const loading = txt => { app.innerHTML = `<div class="login"><div class="card" style="text-align:center"><span class="masc login-m" data-act="type" style="margin:-80px auto 6px"></span><h1 style="font-size:28px">${txt}</h1></div></div>`; };

async function sendLink(name, email) {
  const btn = document.getElementById('lbtn'); if (btn) { btn.disabled = true; btn.textContent = 'Mengecek email…'; }
  try {
    const { data: ok, error } = await sb.rpc('check_member', { p_email: email });
    if (error) throw error;
    if (!ok) { loginMsg = { type: 'err', text: `Email <b>${esc(email)}</b> belum terdaftar sebagai peserta. Pakai email saat checkout, atau DM @${esc(S.instagram)}.` }; return render(); }
    try { localStorage.setItem('dmc-name', name); } catch (e) {}
    const { error: e2 } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
    if (e2) throw e2;
    pendingEmail = email;
    loginMsg = { type: 'ok', text: `Email masuk sudah dikirim ke <b>${esc(email)}</b>. ${S.loginKode ? 'Ketik <b>kode</b> dari email di bawah, atau klik tombol <b>Masuk ke kelas</b> di email itu.' : 'Buka email itu lalu klik <b>link masuk</b>.'} Cek folder Spam/Promosi kalau belum muncul.` };
  } catch (err) {
    loginMsg = { type: 'err', text: 'Gagal mengirim link: ' + esc(err.message || err) + '. Coba lagi beberapa saat.' };
  }
  render();
}

const busy = (txt) => { const b = document.getElementById('lbtn'); if (b) { b.disabled = true; b.textContent = txt; } };
const isMember = async email => { const { data, error } = await sb.rpc('check_member', { p_email: email }); if (error) throw error; return !!data; };
const notMemberMsg = email => ({ type: 'err', text: `Email <b>${esc(email)}</b> belum terdaftar sebagai peserta. Pakai email saat checkout, atau DM @${esc(S.instagram)}.` });
const idErr = e => {
  const m = (e && e.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email atau password salah. Belum punya password? Pilih "Masuk lewat link email", lalu buat password di menu Akun.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Buka email konfirmasi dari kami dan klik link-nya dulu.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Terlalu banyak permintaan email. Tunggu beberapa menit lalu coba lagi.';
  if (m.includes('password')) return 'Password minimal 8 karakter.';
  return 'Terjadi kendala: ' + esc(e && e.message || e);
};
async function pwLogin(email, pw) {
  busy('Masuk…');
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
  if (error) { pendingEmail = email; loginMsg = { type: 'err', text: idErr(error) }; return render(); }
  enter(data.session);
}
async function pwSignup(name, email, pw1, pw2) {
  pendingEmail = email;
  if (pw1 !== pw2) { loginMsg = { type: 'err', text: 'Kedua password tidak sama.' }; return render(); }
  busy('Mengecek email…');
  try {
    if (!(await isMember(email))) { loginMsg = notMemberMsg(email); return render(); }
    try { localStorage.setItem('dmc-name', name); } catch (e) {}
    const { data, error } = await sb.auth.signUp({ email, password: pw1, options: { emailRedirectTo: location.origin + location.pathname, data: { name } } });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      loginView = 'masuk'; loginMsg = { type: 'err', text: 'Email ini sudah punya akun. Silakan masuk, atau pakai "Lupa password?".' }; return render();
    }
    if (data.session) return enter(data.session);
    loginView = 'masuk';
    loginMsg = { type: 'ok', text: `Akun dibuat! Buka email <b>${esc(email)}</b> dan klik link konfirmasi, setelah itu kamu langsung masuk. Cek folder Spam kalau belum muncul.` };
  } catch (e) { loginMsg = { type: 'err', text: idErr(e) }; }
  render();
}
async function pwForgot(email) {
  pendingEmail = email; busy('Mengirim…');
  try {
    if (!(await isMember(email))) { loginMsg = notMemberMsg(email); return render(); }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) throw error;
    loginMsg = { type: 'ok', text: `Link reset password sudah dikirim ke <b>${esc(email)}</b>. Klik link-nya untuk membuat password baru.` };
  } catch (e) { loginMsg = { type: 'err', text: idErr(e) }; }
  render();
}
async function pwReset(pw1, pw2) {
  if (pw1 !== pw2) { loginMsg = { type: 'err', text: 'Kedua password tidak sama.' }; return render(); }
  busy('Menyimpan…');
  const { error } = await sb.auth.updateUser({ password: pw1 });
  if (error) { loginMsg = { type: 'err', text: idErr(error) }; return render(); }
  loginView = 'masuk'; loginMsg = null;
  const { data: { session } } = await sb.auth.getSession();
  toast('Password baru tersimpan ✓'); enter(session);
}
async function pwChange(pw1, pw2, f) {
  if (pw1 !== pw2) return toast('Kedua password tidak sama');
  const { error } = await sb.auth.updateUser({ password: pw1 });
  if (error) return toast(idErr(error).replace(/<[^>]+>/g, ''));
  f.reset(); toast('Password tersimpan ✓');
}

async function verifyCode(code) {
  const btn = document.getElementById('kbtn'); if (btn) { btn.disabled = true; btn.textContent = 'Mengecek kode…'; }
  const { data, error } = await sb.auth.verifyOtp({ email: pendingEmail, token: code, type: 'email' });
  if (error || !data.session) { loginMsg = { type: 'err', text: 'Kode salah atau sudah kedaluwarsa. Minta email baru lalu coba lagi.' }; return render(); }
  pendingEmail = ''; enter(data.session);
}

let entering = false;
async function enter(session) {
  if (entering || !session) return; entering = true;
  loading('Membuka kelasmu…');
  uid = session.user.id;
  const email = (session.user.email || '').toLowerCase();
  const [course, sec, mem, prog] = await Promise.all([
    sb.from('course').select('data').eq('id', 1).maybeSingle(),
    sb.from('secrets').select('key,value'),
    sb.from('members').select('name').maybeSingle(),
    sb.from('progress').select('data').maybeSingle(),
  ]);
  if (!course.data) { booted = false; entering = false; app.innerHTML = pBukanMember(email); return; }
  setData({ course: course.data.data.course, extra: course.data.data.extra, youtube: course.data.data.youtube,
    secrets: Object.fromEntries((sec.data || []).map(r => [r.key, r.value])) });
  let nm = ''; try { nm = localStorage.getItem('dmc-name') || ''; localStorage.removeItem('dmc-name'); } catch (e) {}
  const name = (mem.data && mem.data.name) || nm || (st.user && st.user.email === email && st.user.name) || email.split('@')[0];
  if (nm && !(mem.data && mem.data.name)) sb.from('members').update({ name: nm }).eq('email', email).then(() => {});
  const p = (prog.data && prog.data.data) || {};
  st = { user: { name, email }, done: p.done || {}, checks: p.checks || {}, favs: p.favs || [] };
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  if (location.search || /access_token|error=/.test(location.hash)) history.replaceState(null, '', location.pathname + (/access_token|error=/.test(location.hash) ? '#/beranda' : location.hash));
  booted = true; loginMsg = null; entering = false;
  let nx = ''; try { nx = sessionStorage.getItem('dmc-next') || ''; sessionStorage.removeItem('dmc-next'); } catch (e) {}
  if (nx && nx !== '#/masuk' && nx !== location.hash) location.hash = nx; else render();
}

async function logout() {
  if (REAL && sb) { await sb.auth.signOut(); uid = null; entering = false; loginView = 'masuk'; }
  st = { done: {}, checks: {}, favs: [] }; save();
  if (REAL) booted = true;
  location.hash = '#/masuk'; render();
}

async function boot() {
  if (!REAL) {
    try { await loadScript('assets/data.js'); await loadScript('assets/youtube.js'); await loadScript('assets/extra.js'); }
    catch (e) { app.innerHTML = '<p class="empty">Materi belum tersambung. Isi Supabase di assets/config.js.</p>'; return; }
    setData({ course: window.COURSE, extra: window.EXTRA, youtube: window.YT_IDS });
    booted = true; return render();
  }
  loading('Menyiapkan…');
  await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
  sb = window.supabase.createClient(S.supabaseUrl, S.supabaseAnonKey, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } });
  const recovery = /type=recovery/.test(location.hash);
  const { data: { session } } = await sb.auth.getSession();
  if (session && recovery) { history.replaceState(null, '', location.pathname + '#/masuk'); st = { done: {}, checks: {}, favs: [] }; loginView = 'reset'; booted = true; return render(); }
  if (session) return enter(session);
  st = { done: {}, checks: {}, favs: [] }; booted = true; render();
  sb.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY') { loginView = 'reset'; return render(); } if (ev === 'SIGNED_IN' && s && !uid && loginView !== 'reset') enter(s); });
}
boot();
})();
