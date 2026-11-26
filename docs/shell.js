/* Class kabuğu: sol çekmece, pencere düzeni (Krita tarzı), uygulama kurulumu */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k); return e; };
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const A = () => window.defterApp;
const ic = (n) => A()?.IC?.[n] || '';

/* ---------- Uygulama kurulumu ---------- */
let deferred = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; maybeAsk(); });
window.addEventListener('appinstalled', () => { deferred = null; closeSheet(); });
let sheet = null;
function closeSheet() { sheet?.remove(); sheet = null; }
function installSheet(manual) {
  if (sheet || standalone()) return;
  const how = deferred ? 'Ana ekrana ya da masaüstüne eklenir, tam ekran açılır ve çevrimdışı da çalışır.'
    : isIOS() ? 'Safari’de Paylaş düğmesine, sonra “Ana Ekrana Ekle”ye dokun.'
    : 'Tarayıcı menüsünden “Uygulamayı yükle” ya da “Ana ekrana ekle” seçeneğini kullan.';
  const no = () => { lsSet('defter-install-no', Date.now()); closeSheet(); };
  sheet = el('div', { className: 'sheetWrap' },
    el('div', { className: 'sheetScrim', onclick: no }),
    el('div', { className: 'sheet', role: 'dialog', 'aria-label': 'Uygulamayı kur' },
      el('div', { className: 'sheetIcon' }, el('img', { src: 'icon.svg', alt: '', width: 40, height: 40 })),
      el('h3', { textContent: 'Class’ı web uygulaması olarak kurmak ister misiniz?' }),
      el('p', { className: 'muted', textContent: how }),
      el('div', { className: 'row end' },
        el('button', { className: 'btn', type: 'button', textContent: manual ? 'Kapat' : 'Şimdi değil', onclick: no }),
        deferred ? el('button', { className: 'btn primary', type: 'button', textContent: 'Kur', onclick: async () => { const d = deferred; deferred = null; closeSheet(); d.prompt(); await d.userChoice.catch(() => {}); } }) : '')));
  document.body.append(sheet); sheet.querySelector('.btn.primary, .btn')?.focus();
}
function maybeAsk() {
  if (standalone() || sheet ) return;
  if (Date.now() - lsGet('defter-install-no', 0) < 7 * 864e5) return;
  if (document.querySelector('dialog[open]')) { setTimeout(maybeAsk, 2500); return; }
  setTimeout(() => { if (!document.querySelector('dialog[open]')) installSheet(false); else maybeAsk(); }, 2500);
}
if (isIOS()) setTimeout(maybeAsk, 3000);

/* ---------- Pencere düzeni ---------- */
const WM_KEY = 'defter-wm';
let wm = lsGet(WM_KEY, { on: false, r: {} });
const cols = () => $('#cols');
const PANELS = ['panelSources', 'panelChat', 'panelStudio'];
let zTop = 10;
const save = () => lsSet(WM_KEY, wm);
const wide = () => innerWidth > 900;
function defaults() {
  const W = cols().clientWidth, H = cols().clientHeight, g = 12;
  const sw = Math.min(320, Math.round(W * .24)), tw = Math.min(360, Math.round(W * .26));
  return {
    panelSources: { x: g, y: g, w: sw, h: H - 2 * g },
    panelChat: { x: sw + 2 * g, y: g, w: W - sw - tw - 4 * g, h: H - 2 * g },
    panelStudio: { x: W - tw - g, y: g, w: tw, h: H - 2 * g },
  };
}
function apply(id) {
  const p = document.getElementById(id), r = wm.r[id]; if (!p || !r) return;
  const W = cols().clientWidth, H = cols().clientHeight;
  r.w = Math.max(240, Math.min(r.w, W)); r.h = Math.max(120, Math.min(r.h, H));
  r.x = Math.max(0, Math.min(r.x, W - 80)); r.y = Math.max(0, Math.min(r.y, H - 44));
  p.style.setProperty('--x', r.x + 'px'); p.style.setProperty('--y', r.y + 'px'); p.style.setProperty('--w', r.w + 'px'); p.style.setProperty('--h', (r.min ? 46 : r.h) + 'px');
  p.style.setProperty('--z', r.z || 1); p.classList.toggle('wmMin', !!r.min); p.classList.toggle('wmMax', !!r.max);
}
function layoutAll(reset) {
  if (!wm.on || cols().hidden || !wide()) return;
  const d = defaults();
  for (const id of PANELS) { if (reset || !wm.r[id]) wm.r[id] = { ...d[id], z: ++zTop }; apply(id); }
  save();
}
function front(id) { wm.r[id].z = ++zTop; apply(id); }
function setupWindow(id) {
  const p = document.getElementById(id); if (!p || p.dataset.wm) return; p.dataset.wm = '1';
  const head = $('.ph', p);
  const bm = el('button', { className: 'wmB', type: 'button', title: 'Küçült', 'aria-label': 'Küçült', innerHTML: ic('min') });
  const bx = el('button', { className: 'wmB', type: 'button', title: 'Büyüt / geri al', 'aria-label': 'Büyüt', innerHTML: ic('max') });
  const bw = el('span', { className: 'wmBtns' }, bm, bx); head.append(bw);
  bm.onclick = () => { const r = wm.r[id]; r.min = !r.min; apply(id); save(); };
  const toggleMax = () => { const r = wm.r[id]; if (r.max) { Object.assign(r, r.prev, { max: false }); delete r.prev; } else { r.prev = { x: r.x, y: r.y, w: r.w, h: r.h }; r.x = 0; r.y = 0; r.w = cols().clientWidth; r.h = cols().clientHeight; r.max = true; r.min = false; } front(id); apply(id); save(); };
  bx.onclick = toggleMax; head.addEventListener('dblclick', (e) => { if (wm.on && wide() && !e.target.closest('button')) toggleMax(); });
  for (const k of ['e', 's', 'se']) p.append(el('div', { className: 'wmR wmR' + k, 'data-k': k }));
  p.addEventListener('pointerdown', () => { if (wm.on && wide() && wm.r[id]) front(id); }, true);
  const drag = (e, mode) => {
    if (!wm.on || !wide() || e.button > 0) return; const r = wm.r[id]; if (r.max && mode === 'move') return;
    e.preventDefault(); front(id); document.body.classList.add('wmDrag');
    const sx = e.clientX, sy = e.clientY, o = { ...r }; const tgt = e.currentTarget; tgt.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (mode === 'move') { r.x = o.x + dx; r.y = o.y + dy; }
      else { if (mode.includes('e')) r.w = o.w + dx; if (mode.includes('s')) r.h = o.h + dy; r.max = false; r.min = false; }
      apply(id);
    };
    const up = () => { tgt.removeEventListener('pointermove', mv); tgt.removeEventListener('pointerup', up); tgt.removeEventListener('pointercancel', up); document.body.classList.remove('wmDrag'); save(); };
    tgt.addEventListener('pointermove', mv); tgt.addEventListener('pointerup', up); tgt.addEventListener('pointercancel', up);
  };
  head.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) drag(e, 'move'); });
  p.querySelectorAll('.wmR').forEach((h) => h.addEventListener('pointerdown', (e) => drag(e, h.dataset.k)));
}
function setWm(on) {
  wm.on = on; save(); cols().dataset.wm = on ? 'on' : 'off';
  if (on) { PANELS.forEach(setupWindow); requestAnimationFrame(() => layoutAll(false)); }
}
function resetWm() { wm.r = {}; save(); layoutAll(true); }
new ResizeObserver(() => wm.on && PANELS.forEach(apply)).observe(document.body);
new MutationObserver(() => { if (wm.on && !cols().hidden) requestAnimationFrame(() => layoutAll(false)); }).observe(cols(), { attributes: true, attributeFilter: ['hidden'] });

/* ---------- Sol çekmece ---------- */
let drawer = null;
function closeDrawer() { if (!drawer) return; const d = drawer; drawer = null; d.classList.remove('in'); setTimeout(() => d.remove(), 200); document.removeEventListener('keydown', drawerKey, true); $('#menuBtn')?.setAttribute('aria-expanded', 'false'); }
function drawerKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeDrawer(); $('#menuBtn')?.focus(); return; }
  if (e.key !== 'Tab' || !drawer) return;
  const f = [...drawer.querySelectorAll('button:not([disabled])')]; if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i < 0 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
}
function item(icon, label, run, extra = {}) {
  return el('button', { type: 'button', className: 'dwItem' + (extra.on ? ' on' : ''), onclick: () => { closeDrawer(); run(); } }, el('span', { className: 'mi', innerHTML: ic(icon) }), el('span', { className: 'ml', textContent: label }), extra.on ? el('span', { className: 'mc', textContent: '✓' }) : '');
}
function openDrawer() {
  if (drawer) { closeDrawer(); return; }
  const app = A(); if (!app) return; app.closeMenu();
  const cur = app.current();
  const list = [...app.notebooks()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 30);
  const th = app.getTheme();
  const nbs = list.length ? list.map((n) => el('button', { type: 'button', className: 'dwItem' + (cur && cur.id === n.id ? ' on' : ''), onclick: () => { closeDrawer(); app.openNb(n.id); } }, el('span', { className: 'mi', textContent: n.icon || '📘' }), el('span', { className: 'ml', textContent: n.title }))) : [el('p', { className: 'muted dwEmpty', textContent: 'Henüz not defterin yok.' })];
  drawer = el('div', { className: 'drWrap' },
    el('div', { className: 'drScrim', onclick: closeDrawer }),
    el('aside', { className: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menü' },
      el('div', { className: 'drHead' }, el('span', { className: 'wm', textContent: 'Class' }), el('button', { className: 'ib', type: 'button', 'aria-label': 'Kapat', innerHTML: ic('close'), onclick: closeDrawer })),
      el('div', { className: 'drBody' },
        item('plus', 'Yeni not defteri', () => app.createNb()),
        item('back', 'Tüm not defterleri', () => app.goHome()),
        el('div', { className: 'dwSec', textContent: 'Not defterleri' }), ...nbs,
        el('div', { className: 'dwSec', textContent: 'Görünüm' }),
        item('sun', 'Açık mod', () => app.setTheme('light'), { on: th === 'light' }),
        item('moon', 'Koyu mod', () => app.setTheme('dark'), { on: th === 'dark' }),
        item('auto', 'Cihaz teması', () => app.setTheme('system'), { on: th === 'system' }),
        el('div', { className: 'dwSec', textContent: 'Uygulama' }),
        item('cpu', 'Model seç', () => app.openModel()),
        ...(wide() ? [item('win', 'Pencere düzeni', () => { setWm(!wm.on); }, { on: wm.on })] : []),
        ...(standalone() ? [] : [item('install', 'Uygulama olarak kur', () => installSheet(true))]))));
  document.body.append(drawer); $('#menuBtn')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => drawer?.classList.add('in'));
  document.addEventListener('keydown', drawerKey, true); setTimeout(() => drawer?.querySelector('.dwItem')?.focus(), 60);
}
function boot() {
  $('#menuBtn').onclick = openDrawer;
  if (wm.on) setWm(true); else cols().dataset.wm = 'off';
  window.defterShell = {
    menuItems: () => [
      '-',
      ...(wide() ? [{ icon: 'win', label: 'Pencere düzeni', sub: wm.on ? 'Açık: sürükle, boyutlandır' : 'Panelleri serbest pencere yap', check: wm.on, run: () => setWm(!wm.on) }] : []),
      ...(wm.on && wide() ? [{ icon: 'win', label: 'Pencere düzenini sıfırla', run: resetWm }] : []),
      ...(standalone() ? [] : [{ icon: 'install', label: 'Uygulama olarak kur', run: () => installSheet(true) }]),
    ],
  };
  maybeAsk();
}
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
