/* Class: telefonda alttan açılan sayfalar.
   - Sohbet her zaman ana alan.
   - Stüdyo (Görsel, Ses, Yazıya dök, Müzik…) alttan açılan sayfada liste; birine dokununca aynı sayfada o stüdyo açılır,
     alttaki ‹ ile listeye dönülür. Alt menüdeki Stüdyo düğmesi açar / kapatır.
   - Kaynaklar ve Notlar da aynı alttan açılan sayfada (altta #Kaynaklar çubuğu).
   - Sayfa aşağı kaydırınca kapanır: tutamaçtan ya da içerik en üstteyken içerikten aşağı çek.
     Tutamaçla boyu da ayarlanır (yukarı büyür); arka plana dokununca ya da Esc ile de kapanır.
   - Araçlar (Sesli özet, Zihin haritası, Quiz…) sohbetin üstündeki Tümü / Geçmiş / Tepkiler satırında kayan çipler;
     üretim çubuğu da telefonda sohbetin üstüne taşınır.
   Geniş ekranda dock.js (pencere düzeni) devreye girer; bu dosya yalnızca dar ekranda çalışır. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-')) e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const sv = (d, n = 18) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const KEY = 'class-slide';
const cols = () => document.getElementById('cols');
const narrow = () => innerWidth <= 900;
const enabled = () => lsGet(KEY, 'on') !== 'off';
const active = () => enabled() && narrow() && !!cols() && !cols().hidden;
const LBL = { sources: 'Kaynaklar', studio: 'Kaynaklar' }; /* geri kalan her şey (Stüdyo listesi ve stüdyolar) alt menüde Stüdyo */
const focusMob = (k) => $(`#mobM .mobB[aria-label="${LBL[k] || 'Stüdyo'}"]`)?.focus();
/* üretim çubuğu (… hazırlanıyor · Durdur): telefonda sohbet satırının altına, geniş ekranda Stüdyo'ya */
function placeGen(on) {
  const g = document.getElementById('genBar'), rail = document.getElementById('chRail'), st = document.getElementById('hbStrip'); if (!g || !rail || !st) return;
  if (on && g.previousElementSibling !== rail) rail.after(g); else if (!on && g.previousElementSibling !== st) st.after(g);
}
const DESC = { image: 'Stable Diffusion ile görsel üret', tts: 'Metni seslendir', stt: 'Ses ya da videoyu metne çevir', music: 'Müzik ve ses efekti üret', video: 'Metinden video üret', convert: 'Görsel, PDF, ses, video, belge', web: 'Web araması, adresten kaynak', models: 'Model indir, ara, sil', system: 'Güncelleme, temizlik, anahtarlar' };
/* Stüdyo listesi (Görsel, Ses, Yazıya dök…): alttan açılan sayfada gösterilir */
let TL = null;
function toolsList() {
  if (TL) return TL;
  const P = window.defterHub?.PANELS || []; if (!P.length) return null;
  TL = el('section', { className: 'tlPanel', id: 'panelTools', 'aria-label': 'Stüdyo' },
    el('div', { className: 'ph' }, el('h2', { textContent: 'Stüdyo' }), el('span', { className: 'muted', textContent: `${P.length} stüdyo` })),
    el('ul', { className: 'tlList' }, ...P.map((t) => el('li', {}, el('button', { type: 'button', className: 'tlItem', 'data-id': t.id, onclick: () => H?.show(t.id) },
      el('span', { className: 'tlIc', innerHTML: t.icon }), el('span', { className: 'tlTx' }, el('b', { textContent: t.title }), el('small', { textContent: DESC[t.id] || '' })))))));
  return TL;
}
function sync() {
  const c = cols(); if (!c) return;
  const on = enabled() && narrow();
  if (on) c.dataset.slide = 'on'; else delete c.dataset.slide;
  placeGen(on);
  if (on && (c.dataset.tab === 'studio' || c.dataset.tab === 'sources')) { c.dataset.tab = 'chat'; showSheet('sources'); }
  if (!on && H?.cur) H.hide();
}
/* app.js setTab buraya sorar: kayan modda Kaynaklar (ve eski Stüdyo sekmesi) alttan sayfa olur */
function take(t) {
  if (!active()) return false;
  if (t === 'studio') t = 'sources'; /* telefonda Stüdyo üretim sayfası yok: Araçlar sohbet satırında, notlar Kaynaklar sayfasında */
  if (t === 'sources') { if (H?.sheet.classList.contains('on') && H.cur === t) H.hide(); else showSheet(t); return true; }
  H?.hide(); return false;
}
function showSheet(t) { if (t === 'tools' && !toolsList()) return; hubSheet().show(t); }

/* ---------- stüdyo docker sayfası (alttan) ---------- */
let H = null;
const SNAP = [0.55, 0.92];
function hubSheet() {
  if (H) return H;
  const tabs = el('div', { className: 'hsTabs', role: 'tablist', 'aria-label': 'Stüdyolar' });
  const body = el('div', { className: 'hsBody' });
  const grip = el('button', { type: 'button', className: 'hsGrip', title: 'Sürükleyerek boyutlandır', 'aria-label': 'Paneli büyüt / küçült' }, el('span'));
  const homeB = el('button', { type: 'button', className: 'hsHome', title: 'Stüdyo', 'aria-label': 'Stüdyo listesine dön', hidden: true, innerHTML: sv('<path d="M15 18l-6-6 6-6"/>'), onclick: () => show('tools') });
  const barT = el('b', { textContent: '#Stüdyolar' });
  const bar = el('div', { className: 'fsBar hsBar' }, homeB, barT,
    el('button', { type: 'button', title: 'Kapat (Esc)', 'aria-label': 'Kapat (Esc)', innerHTML: sv('<path d="M18 6 6 18M6 6l12 12"/>'), onclick: () => hide() }));
  const sheet = el('section', { className: 'hubSheet', id: 'hubSheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Stüdyolar' }, grip, tabs, body, bar);
  const back = el('div', { className: 'slScrim hsScrim', 'aria-hidden': 'true' }); back.onclick = () => hide();
  document.body.append(back, sheet);
  const P = () => window.defterHub?.PANELS || [];
  /* Stüdyo listesi sayfanın ana görünümü: bir stüdyoya (Görsel, Ses…) girilince alttaki ‹ ile, geri ya da Esc ile listeye dönülür.
     Kaynaklar da aynı sayfada açılır: #panelSources ve #panelNotes içeri taşınır, kapanınca yerine döner. */
  const marks = {};
  const lend = (id) => { const st = document.getElementById(id); if (!st) return null; if (!marks[id]) { marks[id] = document.createComment(id); st.before(marks[id]); } st.classList.add('inSheet'); return st; };
  const giveBack = () => { for (const id of Object.keys(marks)) { const st = document.getElementById(id); if (st && st.classList.contains('inSheet')) { marks[id].after(st); st.classList.remove('inSheet'); } } };
  let snap = lsGet('class-hs-snap', 1);
  const setH = (f) => sheet.style.setProperty('--hsH', Math.round(f * 100) + 'dvh');
  setH(SNAP[snap] || SNAP[1]);
  grip.onclick = () => { snap = snap ? 0 : 1; lsSet('class-hs-snap', snap); setH(SNAP[snap]); };
  /* tutamaçtan sürükle: yukarı büyür, aşağı küçülür, çok aşağı kapanır */
  grip.addEventListener('pointerdown', (e) => {
    const sy = e.clientY, h0 = sheet.getBoundingClientRect().height; grip.setPointerCapture(e.pointerId); sheet.classList.add('slDrag'); let moved = false;
    const mv = (ev) => { const d = ev.clientY - sy; if (Math.abs(d) > 4) moved = true; sheet.style.setProperty('--hsH', Math.max(120, Math.min(innerHeight * 0.96, h0 - d)) + 'px'); };
    const up = (ev) => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); sheet.classList.remove('slDrag');
      if (!moved) return; const f = (h0 - (ev.clientY - sy)) / innerHeight;
      if (f < 0.3) { setH(SNAP[snap]); hide(); return; }
      snap = Math.abs(f - SNAP[0]) < Math.abs(f - SNAP[1]) ? 0 : 1; lsSet('class-hs-snap', snap); setH(SNAP[snap]);
      grip.addEventListener('click', (c) => c.stopImmediatePropagation(), { once: true, capture: true });
    };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  /* içerik en üstteyken aşağı kaydır: sayfa parmağı izler, yeterince çekilince kapanır, az çekilince yerine döner */
  const scrolled = (n) => { for (; n && n !== body; n = n.parentElement) if (n.scrollTop > 0 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) return true; return false; };
  let pd = null;
  body.addEventListener('touchstart', (e) => {
    pd = null;
    if (e.touches.length > 1 || body.scrollTop > 0 || scrolled(e.target) || e.target.closest?.('input,textarea,select,[contenteditable="true"],canvas')) return;
    const t = e.touches[0]; pd = { x: t.clientX, y: t.clientY, t: performance.now(), dy: 0, go: false, h: sheet.getBoundingClientRect().height };
  }, { passive: true });
  body.addEventListener('touchmove', (e) => {
    if (!pd) return; const t = e.touches[0], dx = t.clientX - pd.x, dy = t.clientY - pd.y;
    if (!pd.go) { if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return; if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || body.scrollTop > 0) { pd = null; return; } pd.go = true; sheet.classList.add('slDrag'); }
    if (e.cancelable) e.preventDefault();
    pd.dy = Math.max(0, dy); sheet.style.transform = `translateY(${pd.dy}px)`;
  }, { passive: false });
  const pend = (e) => {
    const k = pd; pd = null; if (!k?.go) return;
    sheet.classList.remove('slDrag'); sheet.style.transform = '';
    const v = k.dy / Math.max(1, performance.now() - k.t);
    if (e.type === 'touchend' && (k.dy > Math.min(160, k.h * 0.25) || (v > 0.5 && k.dy > 40))) hide();
  };
  body.addEventListener('touchend', pend); body.addEventListener('touchcancel', pend);
  function show(id) {
    if (!tabs.childElementCount && id !== 'sources') P().forEach((p) => { const b = el('button', { type: 'button', className: 'hbTab', role: 'tab', 'data-id': p.id, innerHTML: p.icon }, el('span', { textContent: p.title })); b.onclick = () => show(H.cur === p.id && H.home ? 'tools' : p.id); tabs.append(b); });
    if (id !== 'sources' && id !== 'tools') try { localStorage.setItem('class-hub-tab', id); } catch {}
    tabs.querySelectorAll('.hbTab').forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    if (!sheet.classList.contains('on')) H.home = id === 'tools'; else if (id === 'tools') H.home = true;
    if (id === 'sources') H.home = false;
    giveBack(); H.cur = id; document.body.dataset.hs = id;
    const src = id === 'sources', list = id === 'tools';
    sheet.dataset.v = src ? 'sources' : list ? 'tools' : 'hub'; sheet.setAttribute('aria-label', src ? 'Kaynaklar' : list ? 'Stüdyo' : 'Stüdyolar');
    homeB.hidden = src || list || !H.home;
    barT.textContent = src ? '#Kaynaklar' : list ? '#Stüdyo' : '#' + (P().find((x) => x.id === id)?.title || 'Stüdyolar');
    let pe;
    if (list) pe = toolsList();
    else if (src) pe = el('div', { className: 'hsSrcNotes' }, lend('panelSources'), lend('panelNotes'));
    else { pe = window.defterHub.panelEl(id); const d = document.getElementById('hubDlg'); if (d?.open && d.contains(pe)) d.close(); }
    body.replaceChildren(el('div', { className: 'dlg hsIn' + (list ? ' hsTools' : src ? ' hsSources' : '') }, pe)); body.scrollTop = 0;
    if (!sheet.classList.contains('on')) { sheet.classList.add('on'); back.classList.add('on'); document.addEventListener('keydown', key, true); setTimeout(() => (src || list ? pe.querySelector('button:not([disabled])') : tabs.querySelector('.on'))?.focus({ preventScroll: true }), 60); }
  }
  function hide() { sheet.classList.remove('on'); back.classList.remove('on'); document.removeEventListener('keydown', key, true); giveBack(); H.cur = ''; delete document.body.dataset.hs; }
  const key = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.stopPropagation(); back1(); } };
  /* geri: bir stüdyodaysa önce Stüdyo listesine, oradaysa kapat */
  let lastBack = 0; /* aynı Esc hem bu dinleyiciye hem nav.js'e ulaşır: tek adım say */
  const back1 = () => { const t = performance.now(); if (t - lastBack < 120) return; lastBack = t; if (H.home && H.cur !== 'tools') show('tools'); else hide(); };
  H = { show, hide, back1, sheet, cur: '', home: false }; return H;
}

window.defterSlide = {
  enabled, active, take,
  set: (on) => { lsSet(KEY, on ? 'on' : 'off'); sync(); },
  /* hub.js sorar: telefonda kayan mod açıksa stüdyo alttan açılır */
  openHub: (id) => { if (!enabled() || !narrow() || !window.defterHub) return false; hubSheet().show(id); return true; },
  hideHub: () => H?.hide(),
  back: () => { if (!H?.sheet.classList.contains('on')) return false; const was = H.cur; H.back1(); if (!H.cur) focusMob(was); return true; },
  /* alt menüdeki Stüdyo düğmesi: Stüdyo listesini alttan açar / kapatır */
  toggleTools: () => { if (!active()) { window.defterHub?.open(); return; } if (H?.sheet.classList.contains('on') && H.cur !== 'sources') H.hide(); else showSheet('tools'); },
};
function boot() {
  sync(); addEventListener('resize', sync);
  const c = cols(); if (!c) return;
  new MutationObserver(() => { if (c.hidden) H?.hide(); sync(); }).observe(c, { attributes: true, attributeFilter: ['hidden'] });
  /* sekme başka yoldan Kaynaklar / Stüdyo yapılırsa (eski kod, eklenti, test) kayan panele çevir */
  new MutationObserver(() => { const t = c.dataset.tab; if (active() && (t === 'studio' || t === 'sources')) { c.dataset.tab = 'chat'; showSheet('sources'); } }).observe(c, { attributes: true, attributeFilter: ['data-tab'] });
}
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
