/* Class: telefonda Krita mobil tarzı kayan paneller.
   - Sohbet her zaman ana alan. Kaynaklar, Araçlar (Görsel, Ses, Yazıya dök…) ve Stüdyo (Notlar bölümüyle) ayrı ayrı
     alttan açılan sayfada açılır (tutamaç, altta #Kaynaklar / #Araçlar / #Stüdyo çubuğu).
   - Ayarlar soldan kayarak gelir (dişli ya da sol kenardan sağa kaydır); sola kaydırınca kapanır.
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
const SIDES = {}; /* telefonda yan panel yok: Kaynaklar, Araçlar ve Stüdyo alttan; Ayarlar soldan (settings.js iletişim kutusu) */
const LBL = { tools: 'Araçlar', sources: 'Kaynaklar', studio: 'Stüdyo' };
const focusMob = (k) => $(`#mobM .mobB[aria-label="${LBL[k] || 'Araçlar'}"]`)?.focus();
const DESC = { image: 'Stable Diffusion ile görsel üret', tts: 'Metni seslendir', stt: 'Ses ya da videoyu metne çevir', music: 'Müzik ve ses efekti üret', video: 'Metinden video üret', convert: 'Görsel, PDF, ses, video, belge', web: 'Web araması, adresten kaynak', models: 'Model indir, ara, sil', system: 'Güncelleme, temizlik, anahtarlar' };
const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

let scrim = null;
function sync() {
  const c = cols(); if (!c) return;
  const on = enabled() && narrow();
  if (on) c.dataset.slide = 'on'; else { delete c.dataset.slide; if (c.dataset.sheet) close(); }
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
  const c = cols(); if (!c || !SIDES[side]) return;
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
function showSheet(t) { if (t !== 'sources' && !window.defterHub) return; close(); hubSheet().show(t); }

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
  /* sol kenardan sağa kaydırınca Ayarlar soldan açılır */
  if (x <= EDGE && window.defterSettings) g = { mode: 'settings', x, y, t: Date.now() };
}
function onMove(e) {
  if (!g) return; const t = e.touches ? e.touches[0] : e; const dx = t.clientX - g.x, dy = t.clientY - g.y;
  if (g.mode === 'settings') { if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { g = null; return; } if (dx > 44 && dx > Math.abs(dy) * 1.2) { g = null; window.defterSettings.open(); } return; }
  if (!g.go) {
    if (Math.abs(dx) < 10) { if (Math.abs(dy) > 12) g = null; return; }
    if (Math.abs(dx) < Math.abs(dy) * 1.2) { g = null; return; }
    const dir = 1; if ((g.mode === 'open' ? dx * dir : -dx * dir) <= 0) { g = null; return; }
    g.go = true; g.p.classList.add('slDrag'); if (g.mode === 'open') { cols().dataset.sheet = g.side; ensureScrim().classList.add('on', 'slDrag'); }
  }
  if (e.cancelable) e.preventDefault();
  const dir = 1;
  const shown = g.mode === 'open' ? Math.max(0, Math.min(g.w, dx * dir)) : Math.max(0, Math.min(g.w, g.w + dx * dir));
  g.shown = shown; g.p.style.transform = `translateX(${dir * -(g.w - shown)}px)`; scrim.style.opacity = String(shown / g.w);
}
function onEnd() {
  if (!g) return; const k = g; g = null; if (k.mode === 'settings' || !k.go) return;
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
  const body = el('div', { className: 'hsBody' });
  const grip = el('button', { type: 'button', className: 'hsGrip', title: 'Sürükleyerek boyutlandır', 'aria-label': 'Paneli büyüt / küçült' }, el('span'));
  const homeB = el('button', { type: 'button', className: 'hsHome', title: 'Araçlar', 'aria-label': 'Araçlar listesine dön', hidden: true, innerHTML: sv('<path d="M15 18l-6-6 6-6"/>'), onclick: () => show(H.root) });
  const barT = el('b', { textContent: '#Stüdyolar' });
  const bar = el('div', { className: 'fsBar hsBar' }, homeB, barT,
    el('button', { type: 'button', title: 'Kapat (Esc)', 'aria-label': 'Kapat (Esc)', innerHTML: sv('<path d="M18 6 6 18M6 6l12 12"/>'), onclick: () => hide() }));
  const sheet = el('section', { className: 'hubSheet', id: 'hubSheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Stüdyolar' }, grip, body, bar);
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
  /* Araçlar listesi: Görsel, Ses, Yazıya dök… (Stüdyo'dan ayrı, kendi alttan sayfası) */
  let toolsEl = null;
  const toolList = () => toolsEl || (toolsEl = el('div', { className: 'tlWrap' },
    el('div', { className: 'ph' }, el('h2', { textContent: 'Araçlar' }), el('span', { className: 'muted', textContent: `${P().length} araç` })),
    el('ul', { className: 'tlList' }, ...P().map((t) => el('li', {}, el('button', { type: 'button', className: 'tlItem', 'data-id': t.id, onclick: () => show(t.id) },
      el('span', { className: 'tlIc', innerHTML: t.icon }), el('span', { className: 'tlTx' }, el('b', { textContent: t.title }), el('small', { textContent: DESC[t.id] || '' }))))))));
  const NAME = { studio: 'Stüdyo', sources: 'Kaynaklar', tools: 'Araçlar' };
  function show(id) {
    const was = sheet.classList.contains('on');
    /* kök: sayfa hangi görünümle açıldıysa; Araçlar listesinden bir araca girilince alttaki ‹ listeye döner */
    if (!was || NAME[id]) H.root = id;
    if (P().some((x) => x.id === id)) try { localStorage.setItem('class-hub-tab', id); } catch {}
    giveBack(); H.cur = id; document.body.dataset.hs = id;
    sheet.dataset.v = NAME[id] ? id : 'tool'; sheet.setAttribute('aria-label', NAME[id] || 'Araçlar');
    homeB.hidden = !(H.root === 'tools' && id !== 'tools');
    barT.textContent = '#' + (NAME[id] || P().find((x) => x.id === id)?.title || 'Araçlar');
    let pe;
    if (id === 'studio') pe = lend('panelStudio');
    else if (id === 'sources') pe = lend('panelSources');
    else if (id === 'tools') pe = toolList();
    else { pe = window.defterHub.panelEl(id); const d = document.getElementById('hubDlg'); if (d?.open && d.contains(pe)) d.close(); }
    body.replaceChildren(el('div', { className: 'dlg hsIn hs-' + (NAME[id] ? id : 'tool') }, pe)); body.scrollTop = 0;
    if (!was) { close(); sheet.classList.add('on'); back.classList.add('on'); document.addEventListener('keydown', key, true); setTimeout(() => pe?.querySelector?.('button:not([disabled]),input,select,textarea')?.focus({ preventScroll: true }), 60); }
  }
  function hide() { sheet.classList.remove('on'); back.classList.remove('on'); document.removeEventListener('keydown', key, true); giveBack(); H.cur = ''; delete document.body.dataset.hs; }
  const key = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.stopPropagation(); back1(); } };
  /* geri: Araçlar listesinden açılan bir araçtaysa önce listeye, değilse kapat */
  let lastBack = 0; /* aynı Esc hem bu dinleyiciye hem nav.js'e ulaşır: tek adım say */
  const back1 = () => { const t = performance.now(); if (t - lastBack < 120) return; lastBack = t; if (H.root && H.cur !== H.root) show(H.root); else hide(); };
  H = { show, hide, back1, sheet, cur: '', root: '' }; return H;
}

window.defterSlide = {
  enabled, active, open, close, take,
  set: (on) => { lsSet(KEY, on ? 'on' : 'off'); sync(); },
  /* hub.js sorar: telefonda kayan mod açıksa stüdyo alttan açılır */
  openHub: (id) => { if (!enabled() || !narrow() || !window.defterHub) return false; hubSheet().show(id); return true; },
  hideHub: () => H?.hide(),
  back: () => { if (H?.sheet.classList.contains('on')) { const was = H.cur; H.back1(); if (!H.cur || was === 'studio') focusMob(was === 'sources' || was === 'studio' ? was : 'tools'); return true; } if (cols()?.dataset.sheet) { const s = cols().dataset.sheet; close(); focusMob(s); return true; } return false; },
  /* alt menüdeki Araçlar düğmesi */
  toggleTools: () => { if (!active() || !window.defterHub) { window.defterHub?.open(); return; } if (H?.sheet.classList.contains('on') && H.root === 'tools') H.hide(); else showSheet('tools'); },
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cols()?.dataset.sheet && !document.querySelector('dialog[open]') && !$('#hubSheet.on')) { e.stopPropagation(); const s = cols().dataset.sheet; close(); focusMob(s); } }, true);
/* Ayarlar telefonda soldan açılır; içinden sola kaydırınca kapanır */
let sg = null;
document.addEventListener('touchstart', (e) => {
  const d = document.getElementById('setDlg'); if (!narrow() || !d?.open || !d.contains(e.target) || e.touches.length > 1 || hScroller(e.target)) return;
  const t = e.touches[0]; sg = { d, x: t.clientX, y: t.clientY, go: false, w: d.offsetWidth || 1, dx: 0 };
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!sg) return; const t = e.touches[0]; const dx = t.clientX - sg.x, dy = t.clientY - sg.y;
  if (!sg.go) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { sg = null; return; } if (dx > -10 || Math.abs(dx) < Math.abs(dy) * 1.2) return; sg.go = true; sg.d.classList.add('setDrag'); }
  sg.dx = Math.min(0, dx); sg.d.style.transform = `translateX(${sg.dx}px)`; if (e.cancelable) e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => {
  if (!sg) return; const k = sg; sg = null; if (!k.go) return; k.d.classList.remove('setDrag');
  if (-k.dx > k.w * 0.3) { k.d.style.transform = 'translateX(-105%)'; setTimeout(() => { k.d.close(); k.d.style.transform = ''; }, 200); } else k.d.style.transform = '';
});
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
