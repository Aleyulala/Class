/* Class: Blogger/Plus UI bileşenleri — hızlı menü (qeF), bildirim şeridi (ntf), karşılama çipleri, tema düğmesi */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const A = () => window.defterApp, S = () => window.defterShell;
const svg = (p) => `<svg class="line" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const P = {
  gear: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m22 22-2-2"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  home: '<path d="M9 2.8 3.6 7C2.7 7.7 2 9.2 2 10.4v7.4C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2v-7.3c0-1.2-.8-2.8-1.8-3.5l-6.2-4.3c-1.4-1-3.7-1-5 .1z"/><path d="M12 17.5v-3"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/>',
  layout: '<rect x="3" y="3" width="8" height="18" rx="2"/><rect x="14" y="3" width="7" height="8" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  pad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M16 11.5h.01M18.5 14h.01"/>',
  install: '<path d="M12 3v12M7 10l5 5 5-5M5 19h14"/>',
  verify: '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.6-1.9-.2-1 .5-2.1 1.6-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01"/>',
  smile: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/>',
};
/* ---------- Tema rengi (Saved'deki THEME_COLORS ile aynı renk adları) ---------- */
const GRAY = '#9aa0a6'; /* Saved ile aynı: varsayılan tema rengi gri */
const COLORS = [[GRAY, 'Gri (Varsayılan)'], ['#ea4335', 'Kırmızı'], ['#1e8e3e', 'Yeşil'], ['#4285f4', 'Mavi'], ['#f9ab00', 'Sarı'], ['#9334e6', 'Mor'], ['#e52592', 'Pembe'], ['#12b5cb', 'Camgöbeği'], ['#fa7b17', 'Turuncu'], ['#00897b', 'Teal'], ['#3949ab', 'İndigo'], ['#1a73e8', 'Google Mavi'], ['#188038', 'Koyu Yeşil'], ['#1967d2', 'Derin Mavi'], ['#a142f4', 'Açık Mor'], ['#d93025', 'Koyu Kırmızı'], ['#60cdff', 'Açık Mavi']];
const curColor = () => lsGet('class-theme-color', '') || GRAY;
const lum = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
function applyAccent() {
  const r = document.documentElement.style, c = curColor();
  ['--ac', '--ac2', '--acfg', '--ca', '--cb'].forEach((k) => r.removeProperty(k));
  r.setProperty('--ac', c); r.setProperty('--ac2', c); r.setProperty('--acfg', lum(c) > .42 ? '#10131a' : '#ffffff');
  r.setProperty('--ca', `color-mix(in srgb, ${c} 28%, var(--bg))`); r.setProperty('--cb', `color-mix(in srgb, ${c} 14%, var(--bg))`);
}
let pop = null;
function closePop() { if (!pop) return; pop.remove(); pop = null; document.querySelector('.tcScrim')?.remove(); document.removeEventListener('pointerdown', outPop, true); document.removeEventListener('keydown', keyPop, true); }
const outPop = (e) => { if (pop && !pop.contains(e.target)) closePop(); };
const keyPop = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closePop(); } };
function openThemeColors(anchor) {
  if (pop) { closePop(); return; }
  const cur = curColor();
  pop = el('div', { className: 'tcPop', role: 'dialog', 'aria-label': 'Tema rengi' }, el('h4', { textContent: 'Tema rengi' }),
    ...COLORS.map(([hex, name]) => {
      const b = el('button', { type: 'button', className: 'tcDot' + (hex === cur ? ' on' : ''), title: name, 'aria-label': name, 'aria-pressed': String(hex === cur) });
      b.style.setProperty('--c', hex);
      b.onclick = () => { lsSet('class-theme-color', hex); applyAccent(); closePop(); }; return b;
    }));
  if (window.defterSheet?.phone()) { window.defterSheet.sheetize(pop, { close: closePop }); pop.querySelector('h4').dataset.drag = '1'; document.body.append(el('div', { className: 'menuScrim tcScrim' })); }
  document.body.append(pop);
  const r = (anchor || document.body).getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; pop.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top - h - 8)) + 'px';
  document.addEventListener('pointerdown', outPop, true); document.addEventListener('keydown', keyPop, true); pop.tabIndex = -1; pop.focus({ preventScroll: true });
}
window.defterTheme = { open: openThemeColors, apply: applyAccent, colors: COLORS, current: curColor };
const isDark = () => { const t = A().getTheme(); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches); };
const nbView = () => $('#cols') && !$('#cols').hidden;

/* ---------- Hızlı menü (Blogger .qeF: dişli + köşegen karo ızgarası) ---------- */
function items() {
  const a = A(), s = S() || {}, L = [];
  L.push({ t: 'Yeni not defteri', i: 'plus', run: () => a.createNb() });
  L.push({ t: 'Ara  (Ctrl+K)', i: 'search', run: () => window.defterSearch?.open() });
  if (nbView()) {
    L.push({ t: 'Kaynak ekle', i: 'upload', run: () => $('#addFile')?.click() });
    L.push({ t: 'Not oluştur', i: 'edit', run: () => $('#addNote')?.click() });
    L.push({ t: 'Sohbeti indir (.md)', i: 'doc', run: () => $('#expChat')?.click() });
    L.push({ t: 'Tüm not defterleri', i: 'home', run: () => a.goHome() });
  }
  L.push({ t: 'Stüdyolar', i: 'palette', run: () => window.defterHub?.open() });
  L.push({ t: 'Ayarlar', i: 'gear', run: () => window.defterSettings?.open() });
  L.push({ t: 'Model seç', i: 'cpu', run: () => a.openModel() });
  L.push({ t: isDark() ? 'Açık mod' : 'Koyu mod', i: isDark() ? 'sun' : 'moon', run: () => a.setTheme(isDark() ? 'light' : 'dark') });
  if (s.wide?.()) L.push({ t: 'Pencere düzeni', i: 'layout', run: () => s.toggleWm?.() });
  L.push({ t: 'Tema rengi', i: 'palette', run: () => openThemeColors($('.qeT')) });
  L.push({ t: 'Klavye ve oyun kolu', i: 'pad', run: () => window.defterHelp?.() });
  if (!s.standalone?.()) L.push({ t: 'Uygulama olarak kur', i: 'install', run: () => s.install?.() });
  L.push({ t: 'İletişim', i: 'smile', run: () => window.defterContact?.open() });
  L.push({ t: 'Çerez politikası', i: 'verify', run: () => document.getElementById('cookieDlg')?.showModal() });
  return L.slice(0, 15);
}
function buildFab() {
  if ($('.qeF')) return;
  const input = el('input', { className: 'qeI', id: 'offQEdit', type: 'checkbox', hidden: true });
  const toggle = el('label', { className: 'qeT', htmlFor: 'offQEdit', role: 'button', tabIndex: 0, 'aria-label': 'Hızlı menü', title: 'Hızlı menü' });
  toggle.innerHTML = `<span class="g1">${svg(P.gear)}</span><span class="g2">${svg(P.x)}</span>`;
  toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.checked = !input.checked; } });
  const list = el('div', { className: 'qeL' });
  const fab = el('div', { className: 'qeF' }, input, el('label', { className: 'fCls', htmlFor: 'offQEdit' }), toggle, list);
  function fill() {
    list.replaceChildren(...items().map((it) => {
      const b = el('button', { type: 'button', title: it.t, 'aria-label': it.t, innerHTML: svg(P[it.i]) });
      b.onclick = () => { input.checked = false; it.run(); }; return b;
    }));
  }
  input.addEventListener('change', () => { if (input.checked) fill(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.checked) { input.checked = false; e.stopPropagation(); toggle.focus(); } }, true);
  fill(); document.body.append(fab);
}

/* ---------- Bildirim şeridi (Blogger .ntf: ALİ & NSONE + kapat + çizgi göstergeleri) ---------- */
function buildNtf() {
  const home = $('#home'); if (!home || $('#ntf') || lsGet('class-ntf-x', 0) > Date.now() - 864e5) return;
  const slides = [['CLASS', 'https://github.com/Aleyulala/Class', 'SAVED', 'https://aleyulala.github.io/saved/'], ['ALİ', 'https://aleyulala.blogspot.com/', 'NSONE', 'https://negronshow.blogspot.com/']];
  const wrap = el('div', { className: 'ntfS' });
  slides.forEach((s, i) => wrap.append(el('div', { className: 'ntfSl' + (i ? '' : ' on') },
    el('a', { href: s[1], target: '_blank', rel: 'noopener noreferrer', textContent: s[0] }), el('span', { className: 'ntfAmp', textContent: '&' }), el('a', { href: s[3], target: '_blank', rel: 'noopener noreferrer', textContent: s[2] }))));
  const dots = el('div', { className: 'ntfDots' }, ...slides.map((_, i) => el('button', { type: 'button', className: i ? '' : 'on', 'aria-label': `Şerit ${i + 1}` })));
  const bar = el('div', { className: 'ntfBar', id: 'ntf' }, el('button', { type: 'button', className: 'ntfX', 'aria-label': 'Kapat', innerHTML: svg(P.x), onclick: () => { lsSet('class-ntf-x', Date.now()); bar.remove(); } }), wrap, dots);
  let cur = 0; const go = (n) => { cur = n; [...wrap.children].forEach((c, i) => c.classList.toggle('on', i === cur)); [...dots.children].forEach((c, i) => c.classList.toggle('on', i === cur)); };
  [...dots.children].forEach((d, i) => (d.onclick = () => go(i)));
  const t = setInterval(() => { if (!bar.isConnected) clearInterval(t); else if (!matchMedia('(prefers-reduced-motion:reduce)').matches) go((cur + 1) % slides.length); }, 5000);
  ($('.homeIn') || home).prepend(bar);
}

/* ---------- Karşılama çipleri ("N defter", "İyi akşamlar!") ---------- */
function greet() { const h = new Date().getHours(); return h < 5 ? 'İyi geceler!' : h < 12 ? 'Günaydın!' : h < 18 ? 'İyi öğleden sonralar!' : 'İyi akşamlar!'; }
function buildChips() {
  const h = $('.hRow'); if (!h || $('#chips')) return;
  const n = el('span', { innerHTML: P.eye && svg(P.eye) }, el('b', { id: 'chipN', textContent: '0 defter' }));
  const g = el('span', { innerHTML: svg(P.smile) }, el('b', { textContent: greet() }));
  h.before(el('div', { className: 'chipsRow', id: 'chips' }, n, g));
  const upd = () => { const c = A().notebooks().length; $('#chipN').textContent = `${c} defter`; };
  upd(); new MutationObserver(upd).observe($('#nbGrid'), { childList: true });
}

/* ---------- Üst çubuk: tema düğmesi ---------- */
function buildThemeBtn() {
  const g = $('#gearBtn'); if (!g || $('#themeBtn')) return;
  const b = el('button', { className: 'ib', id: 'themeBtn', type: 'button', 'aria-label': 'Tema', title: 'Açık / koyu mod' });
  const upd = () => { b.innerHTML = svg(isDark() ? P.moon : P.sun); };
  b.onclick = () => { A().setTheme(isDark() ? 'light' : 'dark'); upd(); };
  g.before(b); upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/* "Tümü" filtresi üst çubuktan çıkar, ana ekranda başlık satırına (sıralama düğmesinin yanına) taşınır */
function moveFilter() {
  const f = $('#filterBtn'), r = $('.hRow'), srt = $('#sortBtn'); if (!f || !r || !srt || f.parentElement === r) return;
  f.classList.add('inRow'); r.insertBefore(f, srt);
}

/* ---------- Alt bilgi (Blogger footer: profil bloğu, bağlantı satırı, başlıklı sütunlar, Feed) ---------- */
/* Alt bilgi: aleyulala.blogspot.com'daki Blogger alt bilgisinin birebir aynısı
   (Image21 "Şehir / Neon" + Sosyal Medyalar + Forum / Servis / Ödeme + Feed) */
const FT = {
  avatar: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiXqu4z46j-GcJ3cxAfPwMWNH9vSQu7t-NC9fVPaK7hoQjpdDGh40-nLgilNiKF0Aa_gEgTgsy0jq4QMrHuC8A4V-OLHLPCYZ6Pn_bqrS3dUpM9oA1HDv4PV07IV5X2M7ONrPafanwFL4gWUOjgJZpx94_OupDQZ7BkqC3NyvalZ8Lazfj0TxH8q4oib8M/s150/228599685.jpg',
  title: 'Şehir', caption: 'Neon', follow: 'https://www.blogger.com/followers/follow/560859626649677709?hl=tr',
  social: [['Youtube', 'https://www.youtube.com/@aliyildiz6726/post'], ['Whatsapp', 'https://www.wa.me/+905446412904'], ['Haritalar', 'https://asgardia.space/en/social/users/1166609']],
  cols: [
    ['Forum', [['Hakkında', 'https://aleyulala.blogspot.com/p/hakknda.html'], ['İstekler', 'https://github.com/Aleyulala/saved/discussions/?pli=1'], ['Topluluk', 'https://matrix.to/#/#negronn-show:matrix.org']]],
    ['Servis', [['Öneriler', 'https://aleyulala.blogspot.com/p/muhabbet.html'], ['İçerikler', 'https://aleyulala.blogspot.com/search'], ['Döküman', 'https://classroom.google.com/c/ODk5NDg5NzgzOTg4?cjc=vsdgkwhu']]],
    ['Ödeme', [['Bağışlar', 'https://aleyulala.blogspot.com/p/odeme.html'], ['LinkedIn', 'https://www.linkedin.com/in/ali-yildiz-5531a5285/'], ['Cüzdan', 'https://minepi.com/?u=Aleyyulala']]],
  ],
  feed: 'https://aleyulala.blogspot.com/feeds/posts/default?alt=rss',
};
const BLOGGER = '<svg class="ftrB" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.976 24H2.026C.9 24 0 23.1 0 21.976V2.026C0 .9.9 0 2.025 0H22.05C23.1 0 24 .9 24 2.025v19.95C24 23.1 23.1 24 21.976 24zM12 3.975H9c-2.775 0-5.025 2.25-5.025 5.025v6c0 2.774 2.25 5.024 5.025 5.024h6c2.774 0 5.024-2.25 5.024-5.024v-3.975c0-.6-.45-1.05-1.05-1.05H18c-.524 0-.976-.45-.976-.976 0-2.776-2.25-5.026-5.024-5.026zm3.074 12H9c-.525 0-.975-.45-.975-.975s.45-.976.975-.976h6.074c.526 0 .977.45.977.976s-.45.976-.975.976zm-2.55-7.95c.527 0 .976.45.976.975s-.45.975-.975.975h-3.6c-.525 0-.976-.45-.976-.975s.45-.975.975-.975h3.6z"/></svg>';
const RSS = '<svg class="ftrRss" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/></svg>';
function buildFooter() {
  const home = $('.homeIn'); if (!home || $('#ftr')) return;
  const L = (t, h, c) => el('a', { href: h, target: '_blank', rel: 'noopener noreferrer', textContent: t, ...(c ? { className: c } : {}) });
  const col = (title, items, extra) => el('div', { className: 'ftrW ftrSec' }, el('h3', { className: 'ftrTt', textContent: title }), el('ul', {}, ...items.map(([t, h]) => el('li', {}, L(t, h)))), ...(extra ? [extra] : []));
  const feed = el('a', { className: 'ftrFeed', href: FT.feed, target: '_blank', rel: 'noopener noreferrer', title: 'Feed', innerHTML: RSS + '<span>Feed</span>' });
  const f = el('footer', { className: 'ftr', id: 'ftr' },
    el('div', { className: 'ftrW ftrAbt' },
      el('div', { className: 'ftrBrand' },
        el('img', { className: 'ftrAv', src: FT.avatar, alt: FT.title, width: 70, height: 70, loading: 'lazy', decoding: 'async', referrerPolicy: 'no-referrer' }),
        el('div', { className: 'ftrT' }, el('h2', { className: 'ftrTl', textContent: FT.title }),
          el('p', { className: 'ftrD' }, el('a', { className: 'ftrFollow', href: FT.follow, target: '_blank', rel: 'nofollow noreferrer noopener', title: 'Blogger Takip Et', innerHTML: BLOGGER + `<span>${FT.caption}</span>` })))),
      el('ul', { className: 'ftrSL' }, ...FT.social.map(([t, h]) => el('li', {}, L(t, h))))),
    ...FT.cols.map(([t, items], i) => col(t, items, i === FT.cols.length - 1 ? feed : null)));
  home.append(f);
}


/* ---------- Yukarı / aşağı düğmesi (Blogger .tTb ile birebir: ilerleme halkası, en üstte aşağı iner) ----------
   Sayfanın ortasında dişli menü gizlenir, bu düğme ise kaydırma boyunca görünür kalır. */
const TTB = "<svg viewBox='0 0 34 34' aria-hidden='true'><g transform='translate(0, 34) rotate(-90)' stroke-width='2.2' stroke='currentColor' stroke-linecap='round'><circle cx='17' cy='17' r='15.92'></circle><circle cx='17' cy='17' r='15.92' fill='none' stroke-dasharray='100, 100'></circle><path transform='translate(34, 34) rotate(180)' d='M15.07,21.06,19.16,17l-4.09-4.06' fill='none' stroke-width='1.25'></path></g></svg>";
const FL_SKIP = 'dialog,.drawer,.sldTrack,.cmdTrack,.spPills,.hsTabs,.hbStrip,.qeF,#panelChat,.dkPane .msgs';
function buildToTop() {
  if ($('.tTb')) return;
  const b = el('button', { type: 'button', className: 'tTb', innerHTML: TTB });
  const qe = () => $('#offQEdit');
  let tgt = null;
  const area = () => {
    if (tgt?.isConnected && tgt.getClientRects().length) return tgt;
    const h = $('#home'); return h && !h.hidden ? h : document.scrollingElement;
  };
  const upd = () => {
    const t = area(); const max = t.scrollHeight - t.clientHeight, y = t.scrollTop;
    const top = y <= 20, lbl = top ? 'Aşağı in' : 'Yukarı çık';
    b.style.setProperty('--progress', max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0);
    b.classList.toggle('b', top); b.classList.toggle('off', max < 40);
    b.title = lbl; b.setAttribute('aria-label', lbl);
    document.body.classList.toggle('flMid', max >= 40 && !top && y < max - 24 && !qe()?.checked);
  };
  document.addEventListener('scroll', (e) => {
    const t = e.target === document ? document.scrollingElement : e.target;
    if (!(t instanceof Element) || t.closest(FL_SKIP)) return;
    tgt = t; upd();
  }, { capture: true, passive: true });
  b.onclick = () => { const t = area(); t.scrollTo({ top: t.scrollTop <= 20 ? t.scrollHeight : 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); };
  document.addEventListener('change', (e) => { if (e.target === qe()) upd(); });
  addEventListener('resize', upd);
  for (const v of [$('#cols'), $('#home')]) if (v) new MutationObserver(() => { tgt = null; upd(); }).observe(v, { attributes: true, attributeFilter: ['hidden'] });
  document.body.append(b); upd();
}

function boot() { applyAccent(); buildThemeBtn(); buildChips(); moveFilter(); buildNtf(); buildFooter(); buildFab(); buildToTop(); }
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
