/* Class kabuğu: sol çekmece, pencere düzeni (Krita tarzı), uygulama kurulumu */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
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
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && drawer) { const f = [...drawer.querySelectorAll('.dwItem:not([disabled])')]; const i = f.indexOf(document.activeElement); if (f.length) { e.preventDefault(); f[(i + (e.key === 'ArrowDown' ? 1 : -1) + f.length) % f.length].focus(); } return; }
  if (e.key !== 'Tab' || !drawer) return;
  const f = [...drawer.querySelectorAll('button:not([disabled])')]; if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i < 0 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
}
const SVG = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const DI = {
  tree: SVG('<rect x="3" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="16" width="7" height="5" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><path d="M6.5 8v8.5a1.5 1.5 0 0 0 1.5 1.5H14M6.5 12H14"/>'),
  flash: SVG('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  tools: SVG('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/>'),
  folder: SVG('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  note: SVG('<path d="M5 4h11l3 3v13H5z"/><path d="M8 11h8M8 15h5"/>'),
  verify: SVG('<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  gamepad: SVG('<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M16 11.5h.01M18.5 14h.01"/>'),
  github: SVG('<path d="M9 19c-4 1.2-4-2-6-2.5M15 21v-3.2a2.8 2.8 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-5.8a4.5 4.5 0 0 0-1.2-3.1 4.2 4.2 0 0 0-.1-3.1s-1-.3-3.2 1.2a11 11 0 0 0-5.8 0C7 3.4 6 3.7 6 3.7a4.2 4.2 0 0 0-.1 3.1A4.5 4.5 0 0 0 4.7 10c0 4.5 2.7 5.5 5.3 5.8a2.8 2.8 0 0 0-.8 2.2V21"/>'),
  eye: SVG('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  insta: SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
  tg: SVG('<path d="m21 4-9.5 17-2.5-7.5L3 11z"/><path d="m9 13.5 12-9.5"/>'),
  tt: SVG('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.3 2.5 2 4.2 5 4.5"/>'),
  mx: SVG('<path d="M5 3H3v18h2M19 3h2v18h-2M8 8v8M8 10l4 3 4-3M16 8v8"/>'),
  vk: SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 9c.5 3.5 2.3 6 5 6v-3.5c1.5.3 2.4 1.4 3 3.5h2.5c-.5-2-1.6-3.3-2.8-4 1.2-.7 2.2-2 2.5-3.5h-2.4c-.4 1.4-1.4 2.4-2.8 2.7V8H9.5"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
};
const ico = (k) => DI[k] || ic(k);
const FKEY = 'defter-folders';
function folder(id, icon, title, badge, items) {
  const open = (lsGet(FKEY, { nb: true }))[id] === true;
  const input = el('input', { type: 'checkbox', id: 'dwf-' + id, checked: open, hidden: true });
  input.addEventListener('change', () => { const o = lsGet(FKEY, { nb: true }); o[id] = input.checked; lsSet(FKEY, o); });
  const label = el('label', { htmlFor: 'dwf-' + id, role: 'button', tabIndex: 0, className: 'dwItem dwFolder', 'aria-label': title },
    el('span', { className: 'mi', innerHTML: ico(icon) }), el('span', { className: 'ml', textContent: title }), badge ? el('span', { className: 'dwBadge', textContent: badge }) : '');
  label.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.checked = !input.checked; input.dispatchEvent(new Event('change')); } });
  return el('div', { className: 'dwGroup' }, input, label, el('div', { className: 'dwSub' }, ...items));
}
function item(icon, label, run, extra = {}) {
  return el('button', { type: 'button', className: 'dwItem' + (extra.on ? ' on' : ''), disabled: !!extra.disabled, onclick: () => { closeDrawer(); run(); } }, el('span', { className: 'mi', innerHTML: ico(icon) }), el('span', { className: 'ml', textContent: label }), extra.on ? el('span', { className: 'mc', textContent: '✓' }) : '');
}
/* XML'deki .pl2-slider-wrap: tek satırlık, 4,5 sn'de bir dönen, sağında "+" olan mini slider */
function miniSlider(slides) {
  const wrap = el('div', { className: 'plSl' }); let cur = 0, paused = false;
  const els = slides.map((s, i) => {
    const a = el('a', { className: 'plLink', href: s.href || '#', title: s.label, ...(s.href ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, el('span', { className: 'plIc', innerHTML: ico(s.icon) }), el('span', { textContent: s.label }));
    if (s.run) a.onclick = (e) => { e.preventDefault(); s.run(); };
    const nx = el('button', { type: 'button', className: 'plNext', 'aria-label': 'Sonraki', innerHTML: ico('plus') });
    const d = el('div', { className: 'plSlide' + (i === 0 ? ' active' : '') }, a, nx); wrap.append(d); return { d, nx };
  });
  const go = () => { cur = (cur + 1) % els.length; els.forEach((x, i) => x.d.classList.toggle('active', i === cur)); };
  els.forEach((x) => x.nx.addEventListener('click', go));
  wrap.addEventListener('mouseenter', () => (paused = true)); wrap.addEventListener('mouseleave', () => (paused = false));
  wrap.addEventListener('focusin', () => (paused = true)); wrap.addEventListener('focusout', () => (paused = false));
  wrap.addEventListener('touchstart', () => { paused = true; setTimeout(() => (paused = false), 8000); }, { passive: true });
  const t = setInterval(() => { if (!wrap.isConnected) clearInterval(t); else if (!paused && !matchMedia('(prefers-reduced-motion:reduce)').matches) go(); }, 4500);
  return wrap;
}
function openDrawer() {
  if (drawer) { closeDrawer(); return; }
  const app = A(); if (!app) return; app.closeMenu();
  const cur = app.current();
  const recent = [...app.notebooks()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).filter((n) => !cur || n.id !== cur.id)[0];
  const th = app.getTheme();
  drawer = el('div', { className: 'drWrap' },
    el('div', { className: 'drScrim', onclick: closeDrawer }),
    el('aside', { className: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menü' },
      el('div', { className: 'drHead' }, el('span', { className: 'wm', textContent: 'Class' }), el('button', { className: 'ib', type: 'button', 'aria-label': 'Kapat', innerHTML: ic('close'), onclick: closeDrawer })),
      el('div', { className: 'drBody' },
        el('ul', { className: 'dwList' },
          folder('nb', 'tree', 'Not defterleri', 'Yeni!', [
            item('plus', 'Yeni not defteri', () => app.createNb()),
            item('back', 'Tüm not defterleri', () => app.goHome()),
            recent ? item('note', recent.title, () => app.openNb(recent.id)) : item('note', 'Henüz başka defter yok', () => {}, { disabled: true })]),
          el('div', { className: 'dwBr' }),
          folder('tools', 'flash', 'Araçlar', 'Canlı', [
            item('cpu', 'Model seç', () => app.openModel()),
            wide() ? item('win', 'Pencere düzeni', () => setWm(!wm.on), { on: wm.on }) : item('gamepad', 'Klavye ve oyun kolu', () => window.defterHelp?.()),
            standalone() ? item('gamepad', 'Klavye ve oyun kolu', () => window.defterHelp?.()) : item('install', 'Uygulama olarak kur', () => installSheet(true))]),
          el('div', { className: 'dwBr' }),
          folder('look', 'tools', 'Görünüm', '', [
            item('sun', 'Açık mod', () => app.setTheme('light'), { on: th === 'light' }),
            item('moon', 'Koyu mod', () => app.setTheme('dark'), { on: th === 'dark' }),
            item('auto', 'Cihaz teması', () => app.setTheme('system'), { on: th === 'system' })]))),
      el('div', { className: 'drFoot' },
        miniSlider([
          { icon: 'verify', label: 'Çerez Politikası', run: () => { closeDrawer(); document.getElementById('cookieDlg')?.showModal(); } },
          { icon: 'gamepad', label: 'Klavye ve oyun kolu', run: () => { closeDrawer(); window.defterHelp?.(); } },
          { icon: 'note', label: 'Gizlilik: veri cihazdan çıkmaz', run: () => { closeDrawer(); document.getElementById('cookieDlg')?.showModal(); } }]),
        miniSlider([
          { icon: 'github', label: 'GitHub', href: 'https://github.com/Aleyulala/Class' },
          { icon: 'eye', label: 'Saved', href: 'https://aleyulala.github.io/saved/' },
          { icon: 'insta', label: 'Instagram', href: 'https://www.instagram.com/aleyul.ala/' },
          { icon: 'tg', label: 'Telegram', href: 'https://t.me/aleyyulala' },
          { icon: 'tt', label: 'TikTok', href: 'https://www.tiktok.com/@Aleyyu.Ala' },
          { icon: 'mx', label: 'Matrix', href: 'https://matrix.to/#/#negronn-show:matrix.org' },
          { icon: 'vk', label: 'VKontakte', href: 'https://vk.com/negronn' }]))));
  document.body.append(drawer); $('#menuBtn')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => drawer?.classList.add('in'));
  document.addEventListener('keydown', drawerKey, true); setTimeout(() => drawer?.querySelector('.dwItem')?.focus(), 60);
}

/* ---------- Mobil menü (XML: sec_Mobile_Menu / .mobM .mobC) ---------- */
const MI = {
  home: SVG('<path d="M9 2.8 3.6 7C2.7 7.7 2 9.2 2 10.4v7.4C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2v-7.3c0-1.2-.8-2.8-1.8-3.5l-6.2-4.3c-1.4-1-3.7-1-5 .1z"/><path d="M12 17.5v-3"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  menu: SVG('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  top: SVG('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  src: SVG('<path d="M5 4h11l3 3v13H5z"/><path d="M8 11h8M8 15h5"/>'),
  chat: SVG('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  studio: SVG('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: SVG('<path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/>'),
  back: SVG('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
};
function buildMobileMenu() {
  if ($('#mobM')) return;
  const bar = el('nav', { className: 'mobM', id: 'mobM', 'aria-label': 'Mobil menü' }, el('ul', { className: 'mobC' }));
  document.body.append(bar);
  const isDark = () => { const t = A().getTheme(); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches); };
  const view = () => (cols().hidden ? 'home' : 'nb');
  const tab = () => cols().dataset.tab;
  const press = (t) => $(`#tabs [data-tab="${t}"]`)?.click();
  const defs = () => view() === 'nb'
    ? [{ k: 'back', i: 'back', t: 'Defterler', run: () => A().goHome() },
       { k: 'sources', i: 'src', t: 'Kaynaklar', on: tab() === 'sources', run: () => press('sources') },
       { k: 'chat', i: 'chat', t: 'Sohbet', on: tab() === 'chat', run: () => press('chat') },
       { k: 'studio', i: 'studio', t: 'Stüdyo', on: tab() === 'studio', run: () => press('studio') },
       { k: 'menu', i: 'menu', t: 'Menü', run: openDrawer }]
    : [{ k: 'home', i: 'home', t: 'Ana sayfa', on: true, run: () => scrollTo({ top: 0 }) || $('#home').scrollTo?.({ top: 0, behavior: 'smooth' }) },
       { k: 'search', i: 'search', t: 'Ara', run: () => $('#searchBtn').click() },
       { k: 'menu', i: 'menu', t: 'Menü', run: openDrawer },
       { k: 'mode', i: isDark() ? 'sun' : 'moon', t: isDark() ? 'Açık' : 'Koyu', run: () => { A().setTheme(isDark() ? 'light' : 'dark'); render(); } },
       { k: 'top', i: 'top', t: 'Yukarı', run: () => { $('#home').scrollTo?.({ top: 0, behavior: 'smooth' }); } }];
  function render() {
    const ul = bar.firstChild; ul.replaceChildren();
    for (const d of defs()) {
      const b = el('button', { type: 'button', className: 'mobB' + (d.on ? ' on' : ''), 'aria-label': d.t, 'aria-current': d.on ? 'page' : null, innerHTML: MI[d.i] }, el('span', { textContent: d.t }));
      b.onclick = d.run; ul.append(el('li', {}, b));
    }
  }
  render();
  new MutationObserver(render).observe(cols(), { attributes: true, attributeFilter: ['hidden', 'data-tab'] });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change', render);
}

function boot() {
  buildMobileMenu();
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
