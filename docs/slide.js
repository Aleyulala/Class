/* Class: telefonda Krita mobil tarzı kayan paneller.
   - Sohbet her zaman ana alan; Araçlar (Görsel, Ses, Yazıya dök, Müzik…) soldan kayarak gelir
     (alt menüdeki Araçlar düğmesi ya da sol kenardan kaydır); bir araca dokununca alttan açılan sayfada açılır.
   - Kaynaklar ve Stüdyo (Notlar bölümüyle) alttan açılan sayfada açılır (tutamaç, altta #Kaynaklar / #Stüdyo çubuğu).
   - Açık paneli kenarına doğru kaydırınca kapanır; arka plana dokununca ya da Esc ile de kapanır.
   - Stüdyolar (Görsel, Ses, Dönüştür…) alttan açılan, tutamaçla boyu ayarlanan sekmeli bir “docker” sayfasında açılır.
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
const SIDES = { tools: 'panelTools' }; /* Kaynaklar ve Stüdyo telefonda yan panel değil, alttan açılan sayfada açılır */
const LEFT = 'tools';
const LBL = { tools: 'Araçlar', sources: 'Kaynaklar', studio: 'Stüdyo' };
const focusMob = (k) => $(`#mobM .mobB[aria-label="${LBL[k] || 'Araçlar'}"]`)?.focus();
const DESC = { image: 'Stable Diffusion ile görsel üret', tts: 'Metni seslendir', stt: 'Ses ya da videoyu metne çevir', music: 'Müzik ve ses efekti üret', video: 'Metinden video üret', convert: 'Görsel, PDF, ses, video, belge', web: 'Web araması, adresten kaynak', models: 'Model indir, ara, sil', system: 'Güncelleme, temizlik, anahtarlar' };
/* Araçlar paneli (yalnızca kayan modda): Kaynaklar panelinin eski yerinde, soldan açılır */
function toolsPanel() {
  const ex = document.getElementById('panelTools'); if (ex) return ex;
  const P = window.defterHub?.PANELS || []; const c = cols(); if (!P.length || !c) return null;
  const p = el('section', { className: 'panel', id: 'panelTools', 'aria-label': 'Araçlar' },
    el('div', { className: 'ph' }, el('h2', { textContent: 'Araçlar' }), el('span', { className: 'muted', textContent: `${P.length} araç` })),
    el('ul', { className: 'tlList' }, ...P.map((t) => el('li', {}, el('button', { type: 'button', className: 'tlItem', 'data-id': t.id, onclick: () => { close(); hubSheet().show(t.id); } },
      el('span', { className: 'tlIc', innerHTML: t.icon }), el('span', { className: 'tlTx' }, el('b', { textContent: t.title }), el('small', { textContent: DESC[t.id] || '' })))))));
  c.append(p); return p;
}
const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

let scrim = null;
function sync() {
  const c = cols(); if (!c) return;
  const on = enabled() && narrow();
  if (on) c.dataset.slide = 'on'; else { delete c.dataset.slide; if (c.dataset.sheet) close(); }
  if (on) toolsPanel();
  if (on && c.dataset.tab !== 'chat' && SIDES[c.dataset.tab]) { const t = c.dataset.tab; c.dataset.tab = 'chat'; open(t); }
  if (on && (c.dataset.tab === 'studio' || c.dataset.tab === 'sources')) { const t = c.dataset.tab; c.dataset.tab = 'chat'; showSheet(t); }
  if (!on && (H?.cur === 'studio' || H?.cur === 'sources')) H.hide();
  const top = $('#top'), mob = $('#mobM');
  c.style.setProperty('--slTop', Math.round(top?.getBoundingClientRect().bottom || 56) + 'px');
  c.style.setProperty('--slBot', Math.round(mob && getComputedStyle(mob).display !== 'none' ? innerHeight - mob.getBoundingClientRect().top : 0) + 'px');
}
function ensureScrim() {
  if (scrim) return scrim;
  scrim = el('div', { className: 'slScrim', 'aria-hidden': 'true' }); scrim.onclick = () => close(); document.body.append(scrim); return scrim;
}
export function open(side) {
  const c = cols(); if (!c || !SIDES[side]) return; if (side === 'tools' && !toolsPanel()) return;
  sync(); c.dataset.sheet = side; ensureScrim().classList.add('on');
  const p = document.getElementById(SIDES[side]); p.style.transform = ''; p.setAttribute('aria-modal', 'true'); p.setAttribute('role', 'dialog');
  setTimeout(() => { if (c.dataset.sheet === side && !p.contains(document.activeElement)) p.querySelector('button:not([disabled]),input,[tabindex]')?.focus({ preventScroll: true }); }, reduce() ? 0 : 280);
}
export function close() {
  const c = cols(); if (!c) return; const side = c.dataset.sheet; if (!side) return;
  const p = document.getElementById(SIDES[side]); p.style.transform = ''; p.removeAttribute('aria-modal'); p.removeAttribute('role');
  delete c.dataset.sheet; scrim?.classList.remove('on');
}
/* app.js setTab buraya sorar: kayan modda Kaynaklar/Stüdyo alttan sayfa, Araçlar soldan panel olur */
function take(t) {
  if (!active()) return false;
  if (t === 'studio' || t === 'sources') { if (H?.sheet.classList.contains('on') && H.cur === t) H.hide(); else showSheet(t); return true; }
  if (SIDES[t]) { H?.hide(); if (cols().dataset.sheet === t) close(); else open(t); return true; }
  close(); H?.hide(); return false;
}
function showSheet(t) { if (t === 'studio' && !window.defterHub) return; close(); hubSheet().show(t); }

/* ---------- kaydırma: kenardan aç, kenara doğru kapat ---------- */
const EDGE = 26;
let g = null;
function hScroller(n) { for (; n && n !== document.body; n = n.parentElement) { if (n.scrollWidth > n.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true; } return false; }
function onStart(e) {
  if (!active() || e.touches?.length > 1 || document.querySelector('dialog[open]') || $('#hubSheet.on')) return;
  const t = e.touches ? e.touches[0] : e; const x = t.clientX, y = t.clientY; const c = cols();
  const top = parseFloat(c.style.getPropertyValue('--slTop')) || 56, bot = innerHeight - (parseFloat(c.style.getPropertyValue('--slBot')) || 0);
  if (y < top || y > bot) return;
  const cur = c.dataset.sheet;
  if (cur) { const p = document.getElementById(SIDES[cur]); if (!p.contains(e.target) || hScroller(e.target)) return; g = { side: cur, mode: 'close', x, y, t: Date.now(), p, w: p.offsetWidth, go: false }; return; }
  if (x <= EDGE && toolsPanel()) g = { side: LEFT, mode: 'open', x, y, t: Date.now() };
  if (g) { g.p = document.getElementById(SIDES[g.side]); g.w = Math.min(innerWidth * 0.88, 380); g.go = false; }
}
function onMove(e) {
  if (!g) return; const t = e.touches ? e.touches[0] : e; const dx = t.clientX - g.x, dy = t.clientY - g.y;
  if (!g.go) {
    if (Math.abs(dx) < 10) { if (Math.abs(dy) > 12) g = null; return; }
    if (Math.abs(dx) < Math.abs(dy) * 1.2) { g = null; return; }
    const dir = g.side === LEFT ? 1 : -1; if ((g.mode === 'open' ? dx * dir : -dx * dir) <= 0) { g = null; return; }
    g.go = true; g.p.classList.add('slDrag'); if (g.mode === 'open') { cols().dataset.sheet = g.side; ensureScrim().classList.add('on', 'slDrag'); }
  }
  if (e.cancelable) e.preventDefault();
  const dir = g.side === LEFT ? 1 : -1;
  const shown = g.mode === 'open' ? Math.max(0, Math.min(g.w, dx * dir)) : Math.max(0, Math.min(g.w, g.w + dx * dir));
  g.shown = shown; g.p.style.transform = `translateX(${dir * -(g.w - shown)}px)`; scrim.style.opacity = String(shown / g.w);
}
function onEnd() {
  if (!g) return; const k = g; g = null; if (!k.go) return;
  k.p.classList.remove('slDrag'); scrim?.classList.remove('slDrag'); if (scrim) scrim.style.opacity = '';
  const v = (k.shown || 0) / k.w; const fast = Date.now() - k.t < 260;
  const keep = k.mode === 'open' ? v > 0.33 || (fast && v > 0.12) : v > 0.66 && !(fast && v < 0.9);
  k.p.style.transform = '';
  if (keep) open(k.side); else close();
}

/* ---------- stüdyo docker sayfası (alttan) ---------- */
let H = null;
const SNAP = [0.55, 0.92];
function hubSheet() {
  if (H) return H;
  const tabs = el('div', { className: 'hsTabs', role: 'tablist', 'aria-label': 'Stüdyolar' });
  const body = el('div', { className: 'hsBody' });
  const grip = el('button', { type: 'button', className: 'hsGrip', title: 'Sürükleyerek boyutlandır', 'aria-label': 'Paneli büyüt / küçült' }, el('span'));
  const homeB = el('button', { type: 'button', className: 'hsHome', title: 'Stüdyo', 'aria-label': 'Stüdyo’ya dön', hidden: true, innerHTML: sv('<path d="M15 18l-6-6 6-6"/>'), onclick: () => show('studio') });
  const barT = el('b', { textContent: '#Stüdyolar' });
  const bar = el('div', { className: 'fsBar hsBar' }, homeB, barT,
    el('button', { type: 'button', title: 'Kapat (Esc)', 'aria-label': 'Kapat (Esc)', innerHTML: sv('<path d="M18 6 6 18M6 6l12 12"/>'), onclick: () => hide() }));
  const sheet = el('section', { className: 'hubSheet', id: 'hubSheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Stüdyolar' }, grip, tabs, body, bar);
  const back = el('div', { className: 'slScrim hsScrim', 'aria-hidden': 'true' }); back.onclick = () => hide();
  document.body.append(back, sheet);
  const P = () => window.defterHub?.PANELS || [];
  /* Stüdyo ana görünümü (sekme düğmesi yok): #panelStudio sayfanın içine taşınır, kapanınca yerine döner.
     Bir araca (Görsel, Ses…) girilince alttaki ‹ ile, aynı sekmeye tekrar dokununca ya da geri/Esc ile Stüdyo'ya dönülür. */
  /* Kaynaklar da aynı sayfada açılır (sekmeler gizli): #panelSources içeri taşınır, kapanınca yerine döner */
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
  function show(id) {
    if (!tabs.childElementCount && id !== 'sources') P().forEach((p) => { const b = el('button', { type: 'button', className: 'hbTab', role: 'tab', 'data-id': p.id, innerHTML: p.icon }, el('span', { textContent: p.title })); b.onclick = () => show(H.cur === p.id && H.home ? 'studio' : p.id); tabs.append(b); });
    if (id !== 'sources') try { localStorage.setItem('class-hub-tab', id); } catch {}
    tabs.querySelectorAll('.hbTab').forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    if (!sheet.classList.contains('on')) H.home = id === 'studio'; else if (id === 'studio') H.home = true;
    if (id === 'sources') H.home = false;
    giveBack(); H.cur = id; document.body.dataset.hs = id;
    const src = id === 'sources'; sheet.dataset.v = src ? 'sources' : 'hub'; sheet.setAttribute('aria-label', src ? 'Kaynaklar' : 'Stüdyolar');
    homeB.hidden = src || !(H.home && id !== 'studio');
    barT.textContent = src ? '#Kaynaklar' : id === 'studio' ? '#Stüdyo' : '#' + (P().find((x) => x.id === id)?.title || 'Stüdyolar');
    let pe;
    if (id === 'studio') pe = lend('panelStudio');
    else if (src) pe = lend('panelSources');
    else { pe = window.defterHub.panelEl(id); const d = document.getElementById('hubDlg'); if (d?.open && d.contains(pe)) d.close(); }
    body.replaceChildren(el('div', { className: 'dlg hsIn' + (id === 'studio' ? ' hsStudio' : src ? ' hsSources' : '') }, pe)); body.scrollTop = 0;
    if (!sheet.classList.contains('on')) { close(); sheet.classList.add('on'); back.classList.add('on'); document.addEventListener('keydown', key, true); setTimeout(() => (src ? pe.querySelector('button:not([disabled])') : tabs.querySelector('.on'))?.focus({ preventScroll: true }), 60); }
  }
  function hide() { sheet.classList.remove('on'); back.classList.remove('on'); document.removeEventListener('keydown', key, true); giveBack(); H.cur = ''; delete document.body.dataset.hs; }
  const key = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.stopPropagation(); back1(); } };
  /* geri: araçtaysa önce Stüdyo ana görünümüne, oradaysa kapat */
  let lastBack = 0; /* aynı Esc hem bu dinleyiciye hem nav.js'e ulaşır: tek adım say */
  const back1 = () => { const t = performance.now(); if (t - lastBack < 120) return; lastBack = t; if (H.home && H.cur !== 'studio') show('studio'); else hide(); };
  H = { show, hide, back1, sheet, cur: '', home: false }; return H;
}

window.defterSlide = {
  enabled, active, open, close, take,
  set: (on) => { lsSet(KEY, on ? 'on' : 'off'); sync(); },
  /* hub.js sorar: telefonda kayan mod açıksa stüdyo alttan açılır */
  openHub: (id) => { if (!enabled() || !narrow() || !window.defterHub) return false; hubSheet().show(id); return true; },
  hideHub: () => H?.hide(),
  back: () => { if (H?.sheet.classList.contains('on')) { const was = H.cur; H.back1(); if (!H.cur || was === 'studio') focusMob(was === 'sources' || was === 'studio' ? was : 'tools'); return true; } if (cols()?.dataset.sheet) { const s = cols().dataset.sheet; close(); focusMob(s); return true; } return false; },
  /* alt menüdeki Araçlar düğmesi */
  toggleTools: () => { if (!active()) { window.defterHub?.open(); return; } H?.hide(); if (cols().dataset.sheet === 'tools') close(); else open('tools'); },
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cols()?.dataset.sheet && !document.querySelector('dialog[open]') && !$('#hubSheet.on')) { e.stopPropagation(); const s = cols().dataset.sheet; close(); focusMob(s); } }, true);
document.addEventListener('touchstart', onStart, { passive: true });
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('touchend', onEnd); document.addEventListener('touchcancel', onEnd);
function boot() {
  sync(); addEventListener('resize', sync);
  const c = cols(); if (!c) return;
  new MutationObserver(() => { if (c.hidden) { close(); H?.hide(); } sync(); }).observe(c, { attributes: true, attributeFilter: ['hidden'] });
  /* sekme başka yoldan Kaynaklar / Stüdyo yapılırsa (eski kod, eklenti, test) kayan panele çevir */
  new MutationObserver(() => { const t = c.dataset.tab; if (active() && SIDES[t]) { c.dataset.tab = 'chat'; open(t); } else if (active() && (t === 'studio' || t === 'sources')) { c.dataset.tab = 'chat'; showSheet(t); } }).observe(c, { attributes: true, attributeFilter: ['data-tab'] });
}
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
