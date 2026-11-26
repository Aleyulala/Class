/* Class: Krita tarzı pencere çatısı.
   Geniş ekranda (masaüstü, el konsolu, yatay tablet) Kaynaklar, Sohbet, Stüdyo ve tüm stüdyo panelleri
   sekmeli, sürükle-bırak ile yerleştirilebilen, yüzen pencere olabilen bölmelere dönüşür.
   Kitaplık: Dockview 8.8.3 (MIT, vendor/dockview) — yalnızca bu mod açılınca yüklenir.
   Düzen her yön (yatay / dikey) için ayrı saklanır. Telefonda klasik sekmeler kalır. */
import { pi } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-')) e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const KEY = 'class-dock';
/* Plus çizgi tarzında (1.5 kalınlık, yuvarlak uç) küçük simgeler */
const sv = (d, n = 16) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const DI = {
  layout: sv('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M15 4v16"/>'),
  focus: sv('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/>'),
  image: sv('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  cpu: sv('<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
  float: sv('<rect x="3" y="7" width="13" height="13" rx="2.5"/><path d="M8 4h10a3 3 0 0 1 3 3v10"/>'),
  dock: sv('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18"/>'),
  max: sv('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
  unmax: sv('<path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  reset: sv('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  exit: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
};
const ic = (k, n = 16) => (DI[k] ? DI[k].replace('width="16" height="16"', `width="${n}" height="${n}"`) : pi(k, n));
const ver = (document.querySelector('script[src*="dock.js"]')?.src.match(/v=(\d+)/) || [])[1] || '1';
const orient = () => (innerWidth >= innerHeight ? 'yatay' : 'dikey');
const LKEY = () => 'class-dock-' + orient();
const wide = () => innerWidth > 900 && innerHeight >= 520; /* yatay telefonda (kısa ekran) klasik görünüm kalır */
const cols = () => document.getElementById('cols');

const old = lsGet('defter-wm', null);
const S = lsGet(KEY, { on: !!old?.on, ws: 'arastirma' });
const save = () => lsSet(KEY, S);

const CORE = { sources: ['panelSources', 'Kaynaklar', 'note'], chat: ['panelChat', 'Sohbet', 'chat'], studio: ['panelStudio', 'Stüdyo', 'sparkle'] };
const hubP = () => window.defterHub?.PANELS || [];
const title = (k) => (CORE[k] ? CORE[k][1] : hubP().find((p) => 'hub:' + p.id === k)?.title || k);
const minW = (k) => (k === 'chat' ? 340 : 250);

/* ---------- çalışma alanları ---------- */
const WS = {
  arastirma: { t: 'Araştırma', i: 'layout', d: 'Kaynaklar · Sohbet · Stüdyo yan yana',
    build: (a) => { a('chat'); a('sources', { direction: 'left', ref: 'chat', w: 300 }); a('studio', { direction: 'right', ref: 'chat', w: 340 }); },
    dikey: (a) => { a('chat'); a('sources', { direction: 'below', ref: 'chat', h: Math.round(innerHeight * 0.36) }); a('studio', { direction: 'right', ref: 'sources' }); } },
  odak: { t: 'Odak', i: 'focus', d: 'Geniş sohbet, yanda sekmeli kaynak ve stüdyo',
    build: (a) => { a('chat'); a('sources', { direction: 'right', ref: 'chat', w: 330 }); a('studio', { direction: 'within', ref: 'sources', inactive: true }); },
    dikey: (a) => { a('chat'); a('sources', { direction: 'below', ref: 'chat', h: Math.round(innerHeight * 0.3) }); a('studio', { direction: 'within', ref: 'sources', inactive: true }); } },
  medya: { t: 'Medya', i: 'image', d: 'Görsel, ses, müzik ve video stüdyoları açık',
    build: (a) => { a('chat'); a('sources', { direction: 'left', ref: 'chat', w: 270 }); a('hub:image', { direction: 'right', ref: 'chat', w: 430 }); ['hub:tts', 'hub:music', 'hub:video', 'hub:stt'].forEach((k) => a(k, { direction: 'within', ref: 'hub:image', inactive: true })); a('studio', { direction: 'below', ref: 'sources', h: 280 }); } },
  lab: { t: 'Laboratuvar', i: 'cpu', d: 'Modeller, sistem ve web araştırması',
    build: (a) => { a('chat'); a('sources', { direction: 'left', ref: 'chat', w: 280 }); a('studio', { direction: 'within', ref: 'sources', inactive: true }); a('hub:models', { direction: 'right', ref: 'chat', w: 460 }); ['hub:web', 'hub:system'].forEach((k) => a(k, { direction: 'within', ref: 'hub:models', inactive: true })); } },
};

/* ---------- kitaplığı yükle ---------- */
let loading = null;
function loadLib() {
  if (window.dockview) return Promise.resolve();
  return (loading ||= new Promise((res, rej) => {
    const s = el('script', { src: 'vendor/dockview/dockview.min.js?v=' + ver });
    s.onload = () => (window.dockview ? res() : rej(new Error('Pencere kitaplığı açılamadı')));
    s.onerror = () => { loading = null; s.remove(); rej(new Error('Pencere kitaplığı yüklenemedi')); };
    document.head.append(s);
  }));
}

/* ---------- içerik: mevcut bölümler taşınır (kopyalanmaz) ---------- */
let api = null, wrap = null, park = null, bar = null, saveT = 0, cntObs = null;
function parkEl(n) { if (n && park && n.parentNode !== park) park.append(n); }
function mount(box, k) {
  if (CORE[k]) { const s = document.getElementById(CORE[k][0]); if (s) box.append(s); return; }
  const id = k.replace(/^hub:/, ''); const p = window.defterHub?.panelEl(id); if (!p) { box.append(el('p', { className: 'hint', textContent: 'Bu panel yüklenemedi.' })); return; }
  const d = document.getElementById('hubDlg'); if (d?.open && d.contains(p)) d.close();
  box.append(el('div', { className: 'dlg dkHub' }, p));
}
function createComponent() {
  const element = el('div', { className: 'dkPane' });
  return {
    element,
    init(p) { element.dataset.k = p.params?.k || ''; mount(element, p.params?.k); },
    dispose() { for (const id of Object.values(CORE).map((c) => c[0])) { const s = element.querySelector('#' + id); if (s) parkEl(s); } },
  };
}
/* grup başlığındaki düğmeler: yüzdür / yerleştir, büyüt */
function headerActions() {
  const element = el('div', { className: 'dkAct' }); let g = null; const subs = [];
  const fl = el('button', { type: 'button', className: 'dkB' }); const mx = el('button', { type: 'button', className: 'dkB' });
  const sync = () => {
    if (!g) return; const fly = g.api.location?.type === 'floating', big = g.api.isMaximized?.();
    fl.innerHTML = ic(fly ? 'dock' : 'float'); fl.title = fl.ariaLabel = fly ? 'Yerine yerleştir' : 'Yüzen pencere yap';
    mx.innerHTML = ic(big ? 'unmax' : 'max'); mx.title = mx.ariaLabel = big ? 'Önceki boyut' : 'Büyüt';
    mx.hidden = fly;
  };
  fl.onclick = () => { if (!g || !api) return; if (g.api.location?.type === 'floating') g.api.moveTo({ position: 'right' }); else { const r = wrap.getBoundingClientRect(); api.addFloatingGroup(g, { x: Math.max(20, r.width / 2 - 220), y: 60, width: 440, height: Math.min(560, r.height - 90) }); } setTimeout(sync, 30); };
  mx.onclick = () => { if (!g) return; g.api.isMaximized() ? g.api.exitMaximized() : g.api.maximize(); setTimeout(sync, 30); };
  element.append(fl, mx);
  return {
    element,
    init(p) { g = p.group; sync(); subs.push(p.api.onDidLocationChange?.(sync), api?.onDidMaximizedGroupChange?.(sync)); },
    dispose() { subs.forEach((s) => s?.dispose?.()); },
  };
}

/* ---------- düzen ---------- */
let sizes = [];
function addK(k, o = {}) {
  if (!api || api.getPanel(k)) { api?.getPanel(k)?.api.setActive(); return; }
  const opt = { id: k, component: 'pane', title: title(k), params: { k }, minimumWidth: minW(k), minimumHeight: k === 'chat' ? 360 : 160 };
  if ((o.w || o.h) && o.direction !== 'within') sizes.push([k, o.h ? { height: o.h } : { width: o.w }]);
  if (o.ref && api.getPanel(o.ref)) opt.position = { referencePanel: o.ref, direction: o.direction || 'within' };
  else if (o.direction && o.direction !== 'within') opt.position = { direction: o.direction };
  if (o.w) opt.initialWidth = o.w; if (o.h) opt.initialHeight = o.h; if (o.inactive) opt.inactive = true;
  if (o.float) { delete opt.position; opt.floating = o.float; }
  api.addPanel(opt);
}
function build(ws) {
  if (!api) return; api.clear(); sizes = []; const w = WS[ws] || WS.arastirma; (orient() === 'dikey' && w.dikey ? w.dikey : w.build)(addK);
  const sz = sizes; sizes = []; requestAnimationFrame(() => { sz.forEach(([k, e]) => { try { api?.getPanel(k)?.group?.api.setSize(e); } catch {} }); store(); });
  Object.keys(CORE).forEach((k) => { if (!api.getPanel(k)) addK(k, { ref: 'chat', direction: 'within', inactive: true }); });
  api.getPanel('chat')?.api.setActive();
}
function store() { clearTimeout(saveT); saveT = setTimeout(() => { if (api) try { lsSet(LKEY(), api.toJSON()); } catch {} }, 250); }
function restore() {
  const j = lsGet(LKEY(), null);
  if (j) { try { api.fromJSON(j); if (Object.keys(CORE).every((k) => api.getPanel(k))) return; } catch {} }
  build(S.ws);
}
function setWs(ws) { if (!WS[ws]) return; S.ws = ws; save(); if (!api) { setOn(true); return; } build(ws); store(); renderBar(); window.defterApp?.toast?.(`Çalışma alanı: ${WS[ws].t}`); }
function reset() { try { localStorage.removeItem('class-dock-yatay'); localStorage.removeItem('class-dock-dikey'); } catch {} build(S.ws); store(); }

/* ---------- üst şerit ---------- */
function renderBar() {
  if (!bar) return;
  const chip = (k) => el('button', { type: 'button', className: 'dkWs' + (S.ws === k ? ' on' : ''), title: WS[k].d, 'aria-pressed': String(S.ws === k), innerHTML: ic(WS[k].i), onclick: () => setWs(k) }, el('span', { textContent: WS[k].t }));
  const all = [...Object.keys(CORE), ...hubP().map((p) => 'hub:' + p.id)];
  const addB = el('button', { type: 'button', className: 'dkWs dkAdd', title: 'Pencere ekle', 'aria-haspopup': 'menu', innerHTML: ic('plus') }, el('span', { textContent: 'Pencere' }));
  addB.onclick = () => window.defterApp?.showMenu(addB, all.map((k) => ({ label: title(k), sub: api?.getPanel(k) ? 'Açık · öne getir' : 'Yeni sekme olarak aç', check: !!api?.getPanel(k), run: () => openPanel(k) })), { align: 'left' });
  bar.replaceChildren(
    el('div', { className: 'dkWsL', role: 'group', 'aria-label': 'Çalışma alanları' }, ...Object.keys(WS).map(chip)),
    el('span', { className: 'grow' }), addB,
    el('button', { type: 'button', className: 'dkI', title: 'Düzeni sıfırla', 'aria-label': 'Düzeni sıfırla', innerHTML: ic('reset'), onclick: reset }),
    el('button', { type: 'button', className: 'dkI', title: 'Klasik görünüme dön', 'aria-label': 'Klasik görünüme dön', innerHTML: ic('exit'), onclick: () => setOn(false) }));
}
export function openPanel(k, float) {
  if (!api) return false;
  if (api.getPanel(k)) { api.getPanel(k).api.setActive(); return true; }
  const r = wrap.getBoundingClientRect();
  const side = k.startsWith('hub:') ? api.panels.find((p) => p.id.startsWith('hub:') && p.api.location?.type === 'grid') || api.getPanel('studio') : api.activePanel;
  if (float || !side) addK(k, { float: { x: Math.max(20, r.width / 2 - 230), y: 56, width: 460, height: Math.min(600, r.height - 80) } });
  else if (side.id === 'chat' && k.startsWith('hub:')) addK(k, { ref: 'chat', direction: 'right', w: 420 });
  else addK(k, { ref: side.id, direction: 'within' });
  store(); return true;
}

/* ---------- aç / kapat ---------- */
async function enter() {
  if (api || !wide()) return;
  const c = cols(); if (!c) return;
  try { await loadLib(); } catch (e) { window.defterApp?.toast?.(e.message); S.on = false; save(); return; }
  if (api || !S.on || !wide()) return;
  const dv = window.dockview;
  park = el('div', { className: 'dkPark', hidden: true });
  bar = el('div', { className: 'dkBar', role: 'toolbar', 'aria-label': 'Pencere düzeni' });
  const host = el('div', { className: 'dkHost' });
  wrap = el('div', { className: 'dkWrap', id: 'dkWrap' }, bar, host, park);
  Object.values(CORE).forEach(([id]) => parkEl(document.getElementById(id)));
  c.append(wrap); c.dataset.wm = 'on'; document.body.classList.add('docked');
  const theme = { ...(dv.themeAbyssSpaced || {}), name: 'class', className: 'dockview-theme-abyss-spaced', colorScheme: undefined, gap: 8 };
  api = dv.createDockview(host, {
    theme, defaultRenderer: 'always', createComponent, createRightHeaderActionComponent: headerActions,
    floatingGroupBounds: 'boundedWithinViewport',
    getTabContextMenuItems: ({ panel, group }) => [
      { label: group.api.isMaximized() ? 'Önceki boyut' : 'Büyüt', action: () => (group.api.isMaximized() ? group.api.exitMaximized() : group.api.maximize()) },
      { label: group.api.location?.type === 'floating' ? 'Yerine yerleştir' : 'Yüzen pencere yap', action: () => (group.api.location?.type === 'floating' ? group.api.moveTo({ position: 'right' }) : api.addFloatingGroup(panel, { x: 80, y: 60, width: 440, height: 520 })) },
      'separator', { label: 'Kapat', action: () => panel.api.close() }],
  });
  restore();
  api.onDidLayoutChange(() => { store(); renderBar(); });
  api.onDidRemovePanel?.((p) => { if (CORE[p.id]) setTimeout(() => { if (api && !api.getPanel(p.id)) window.defterApp?.toast?.(`${title(p.id)} kapatıldı · “Pencere” ile geri açabilirsin`); }, 0); });
  const cnt = $('#srcCount'); const syncCnt = () => api?.getPanel('sources')?.api.setTitle(`Kaynaklar · ${(cnt?.textContent.match(/\d+/) || [0])[0]}`);
  if (cnt) { cntObs = new MutationObserver(syncCnt); cntObs.observe(cnt, { childList: true, characterData: true, subtree: true }); syncCnt(); }
  renderBar();
}
function leave() {
  if (!api) return; store();
  const c = cols(); const secs = Object.values(CORE).map(([id]) => document.getElementById(id));
  cntObs?.disconnect(); cntObs = null;
  try { api.dispose(); } catch {}
  api = null; secs.forEach((s) => s && c.append(s)); wrap?.remove(); wrap = park = bar = null;
  c.dataset.wm = 'off'; document.body.classList.remove('docked');
}
export function setOn(on) { S.on = !!on; save(); if (S.on && wide()) enter(); else leave(); }
let lastO = orient();
addEventListener('resize', () => {
  if (!S.on) return;
  if (!wide()) { leave(); return; }
  if (!api) { enter(); return; }
  if (orient() !== lastO) { store(); lastO = orient(); const j = lsGet(LKEY(), null); if (j) try { api.fromJSON(j); } catch { build(S.ws); } }
  lastO = orient();
});

window.defterDock = {
  WS, toggle: () => setOn(!S.on), setOn, setWs, reset, openPanel,
  on: () => !!api, enabled: () => S.on, ws: () => S.ws, wide,
  /* stüdyo açma isteği: düzen açıksa sekme olarak, değilse null döner (pencere açılır) */
  openHub: (id) => (api ? openPanel('hub:' + id) : false),
};
function boot() { if (S.on && wide()) enter(); else if (cols()) cols().dataset.wm = 'off'; }
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
