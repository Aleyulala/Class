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
  if (window.defterSheet?.phone()) window.defterSheet.sheetize(sheet.querySelector('.sheet'), { close: no });
  document.body.append(sheet); sheet.querySelector('.btn.primary, .btn')?.focus();
}
function maybeAsk() {
  if (standalone() || sheet ) return;
  if (Date.now() - lsGet('defter-install-no', 0) < 7 * 864e5) return;
  if (document.querySelector('dialog[open]')) { setTimeout(maybeAsk, 2500); return; }
  setTimeout(() => { if (!document.querySelector('dialog[open]')) installSheet(false); else maybeAsk(); }, 2500);
}
if (isIOS()) setTimeout(maybeAsk, 3000);

/* ---------- Pencere düzeni: dock.js (Dockview, Krita tarzı sekmeli ve yüzen pencereler) ---------- */
const cols = () => $('#cols');
const wide = () => innerWidth > 900;
const D = () => window.defterDock;
const dockOn = () => !!D()?.enabled();
const setWm = (on) => D()?.setOn(on);

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
const SVG = (p) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
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
  swap: SVG('<circle cx="6" cy="6" r="2.2" fill="currentColor"/><path d="M5 12h14M15 8l4 4-4 4M5 18h14"/>'),
  pen: SVG('<path d="M4 20h6M14 4l6 6-9.5 9.5H5v-5.5z"/><path d="M13 5l6 6"/>'),
  users: SVG('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 5.5M18 14.5c1.8.7 3 2.5 3 5.5"/>'),
  sms: SVG('<path d="M21 11V9c0-4-2-6-6-6H9C5 3 3 5 3 9v5c0 4 2 6 6 6h2"/><path d="m8 9 3.4 2.6a2 2 0 0 0 2.4 0L17 9"/><path d="m14 21 2-.5 4.5-4.5a1.4 1.4 0 0 0-2-2L14 18.5z"/>'),
  labs: SVG('<path d="M9 3h6M10 3v6.5L4.7 18a2 2 0 0 0 1.7 3h11.2a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.5 15h9"/>'),
  foldercode: SVG('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m10 11-2 2 2 2M14 11l2 2-2 2"/>'),
  speed: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="14" r="2"/><path d="m13.4 12.6 3-3"/>'),
  verifyf: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.1 15.9 4 13l-.9-2.9 2.5-1.7 1-2.8 3 .2z"/><path d="m8.6 12 2.3 2.3 4.5-4.6" fill="none" stroke="#1e1e1e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const ico = (k) => (String(k).startsWith('<svg') ? k : DI[k] || ic(k));
const FKEY = 'defter-folders';
function folder(id, icon, title, badge, items) {
  const open = (lsGet(FKEY, {}))[id] !== false;
  const input = el('input', { type: 'checkbox', id: 'dwf-' + id, checked: open, hidden: true });
  input.addEventListener('change', () => { const o = lsGet(FKEY, {}); o[id] = input.checked; lsSet(FKEY, o); });
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
const link = (icon, label, href) => el('a', { className: 'dwItem', href, target: '_blank', rel: 'noopener noreferrer nofollow', onclick: () => closeDrawer() }, el('span', { className: 'mi', innerHTML: ico(icon) }), el('span', { className: 'ml', textContent: label }));
/* Blogger şablonundaki sol çekmece (sec_Nav_Widgets_1 / items-mainMenu) ile aynı üç klasör ve dokuz bağlantı */
function openDrawer() {
  if (drawer) { closeDrawer(); return; }
  const app = A(); if (!app) return; app.closeMenu();
  const mirror = el('button', { type: 'button', className: 'dwItem', onclick: () => { const r = document.documentElement; const on = r.dir !== 'rtl'; r.dir = on ? 'rtl' : 'ltr'; try { localStorage.setItem('class-dir', on ? 'rtl' : 'ltr'); } catch {} closeDrawer(); } }, el('span', { className: 'mi', innerHTML: ico('swap') }), el('span', { className: 'ml', textContent: 'Ayna' }));
  drawer = el('div', { className: 'drWrap' },
    el('div', { className: 'drScrim', onclick: closeDrawer }),
    el('aside', { className: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menü' },
      el('div', { className: 'drBody' },
        el('ul', { className: 'dwList' },
          folder('apps', 'tree', 'Uygulamalar', 'Yeni!', [
            link('eye', 'NESCİONE', 'https://aleyulala.github.io/saved/'),
            link('pen', 'NotebookLM', 'https://notebooklm.google.com/'),
            link('users', 'Formlar', 'https://docs.google.com/forms/u/0/')]),
          folder('comm', 'flash', 'Topluluk', 'Canlı', [
            link('sms', 'Chat', 'https://script.google.com/macros/s/AKfycby2BbaRplWrOLZDiTba4Wnn9LAy6m2IuIBDmhFS6aSYr-fagSGVKbw_PYb9aajK39jZ/exec'),
            link('users', 'Tartışmalar', 'https://github.com/Aleyulala/saved/discussions/?pli=1'),
            link('labs', 'Labs', 'https://labs.google.com/')]),
          folder('tools', 'foldercode', 'Araçlar', '', [
            mirror,
            link('search', 'SEO', 'https://search.google.com/test/rich-results'),
            link('speed', 'Hız', 'https://pagespeed.web.dev/analysis')]))),
      el('div', { className: 'drFoot' },
        miniSlider([
          { icon: 'sms', label: 'İletişim', run: () => { closeDrawer(); window.defterContact?.open(); } },
          { icon: 'verifyf', label: 'Gizlilik', href: 'https://aleyulala.github.io/saved/?view=privacy' },
          { icon: 'verify', label: 'Çerez Politikası', run: () => { closeDrawer(); document.getElementById('cookieDlg')?.showModal(); } },
          { icon: 'sms', label: 'Yorumlar', href: 'https://aleyulala.blogspot.com/p/muhabbet.html' }]),
        miniSlider([
          { icon: 'tg', label: 'Telegram', href: 'https://t.me/aleyyulala' },
          { icon: 'insta', label: 'Instagram', href: 'https://www.instagram.com/aleyul.ala/' },
          { icon: 'tt', label: 'TikTok', href: 'https://www.tiktok.com/@Aleyyu.Ala' },
          { icon: 'mx', label: 'Matrix', href: 'https://matrix.to/#/#negronn-show:matrix.org' },
          { icon: 'vk', label: 'VKontakte', href: 'https://vk.com/negronn' },
          { icon: 'github', label: 'GitHub', href: 'https://github.com/Aleyulala/Class' }]))));
  document.body.append(drawer); $('#menuBtn')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => drawer?.classList.add('in'));
  document.addEventListener('keydown', drawerKey, true); setTimeout(() => drawer?.querySelector('.dwItem')?.focus(), 60);
}

/* ---------- Mobil menü (XML: sec_Mobile_Menu / .mobM .mobC) ---------- */
const MI = {
  home: SVG('<path d="M9 2.8 3.6 7C2.7 7.7 2 9.2 2 10.4v7.4C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2v-7.3c0-1.2-.8-2.8-1.8-3.5l-6.2-4.3c-1.4-1-3.7-1-5 .1z"/><path d="M12 17.5v-3"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  menu: SVG('<circle cx="7.5" cy="7.5" r="3.5"/><circle cx="16.5" cy="7.5" r="3.5"/><circle cx="7.5" cy="16.5" r="3.5"/><circle cx="16.5" cy="16.5" r="3.5"/>'),
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
  const sheet = () => cols().dataset.sheet || '';
  const press = (t) => $(`#tabs [data-tab="${t}"]`)?.click();
  const defs = () => view() === 'nb'
    ? [{ k: 'home', i: 'home', t: 'Ana sayfa', run: () => A().goHome() },
       { k: 'sources', i: 'src', t: 'Kaynaklar', on: tab() === 'sources' || sheet() === 'sources', run: () => press('sources') },
       { k: 'menu', i: 'menu', t: 'Menü', run: openDrawer },
       { k: 'studio', i: 'studio', t: 'Stüdyo', on: tab() === 'studio' || sheet() === 'studio' || document.body.dataset.hs === 'studio', run: () => press('studio') },
       { k: 'chat', i: 'chat', t: 'Sohbet', on: tab() === 'chat' && !sheet(), run: () => press('chat') }]
    : [{ k: 'home', i: 'home', t: 'Ana sayfa', on: true, run: () => scrollTo({ top: 0 }) || $('#home').scrollTo?.({ top: 0, behavior: 'smooth' }) },
       { k: 'search', i: 'search', t: 'Ara', run: () => $('#searchBtn').click() },
       { k: 'menu', i: 'menu', t: 'Menü', run: openDrawer },
       { k: 'mode', i: isDark() ? 'sun' : 'moon', t: isDark() ? 'Açık' : 'Koyu', run: () => { A().setTheme(isDark() ? 'light' : 'dark'); render(); } },
       { k: 'top', i: 'top', t: 'Yukarı', run: () => { $('#home').scrollTo?.({ top: 0, behavior: 'smooth' }); } }];
  function render() {
    bar.classList.toggle('isHome', view() === 'home');
    const ul = bar.firstChild; ul.replaceChildren();
    for (const d of defs()) {
      const b = el('button', { type: 'button', className: 'mobB' + (d.on ? ' on' : ''), 'aria-label': d.t, 'aria-current': d.on ? 'page' : null, innerHTML: MI[d.i] }, el('span', { textContent: d.t }));
      b.onclick = d.run; ul.append(el('li', {}, b));
    }
  }
  render();
  new MutationObserver(render).observe(cols(), { attributes: true, attributeFilter: ['hidden', 'data-tab', 'data-sheet'] });
  new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ['data-hs'] });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change', render);
}


/* ---------- Masaüstü ray (XML: .navI, ≥896px — kapalıyken 75px yalnız ikon, açıkken 230px ikon + yazı) ---------- */
const RKEY = 'defter-rail';
let rail = null, railFly = null;
const railOpen = () => lsGet(RKEY, false) === true;
function railGroups(app) {
  const cur = app.current(); const th = app.getTheme();
  const recent = [...app.notebooks()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).filter((n) => !cur || n.id !== cur.id).slice(0, 3);
  return [
    { id: 'nb', icon: 'tree', title: 'Not defterleri', badge: 'Yeni!', items: [
      ['plus', 'Yeni not defteri', () => app.createNb()],
      ...(recent.length ? recent.map((n) => ['note', n.title, () => app.openNb(n.id)]) : [['note', 'Henüz başka defter yok', null]])] },
    { id: 'tools', icon: 'flash', title: 'Araçlar', badge: 'Canlı', items: [
      ['cpu', 'Model seç', () => app.openModel()],
      ...(D()?.wide() ? [['win', 'Pencere düzeni', () => setWm(!dockOn()), dockOn()]] : []),
      ['gamepad', 'Klavye ve oyun kolu', () => window.defterHelp?.()]] },
    { id: 'studio', icon: 'foldercode', title: 'Stüdyolar', items: (window.defterHub?.PANELS || []).map((p) => [p.icon, p.title, () => window.defterHub.open(p.id)]) },
    { id: 'look', icon: 'tools', title: 'Görünüm', items: [
      ['sun', 'Açık mod', () => app.setTheme('light'), th === 'light'],
      ['moon', 'Koyu mod', () => app.setTheme('dark'), th === 'dark'],
      ['auto', 'Cihaz teması', () => app.setTheme('system'), th === 'system']] },
  ];
}
function railItem([icon, label, run, on]) {
  return el('button', { type: 'button', className: 'rlSubItem' + (on ? ' on' : ''), disabled: !run, title: label, onclick: () => { closeFly(); run?.(); renderRail(); } },
    el('span', { className: 'mi', innerHTML: ico(icon) }), el('span', { className: 'ml', textContent: label }), on ? el('span', { className: 'mc', textContent: '✓' }) : '');
}
function closeFly() { if (!railFly) return; railFly.classList.remove('fly'); railFly.querySelector('.rlFolder')?.setAttribute('aria-expanded', 'false'); railFly = null; }
function renderRail() {
  const app = A(); if (!app || !rail) return;
  const open = railOpen(); const fo = lsGet(FKEY, { nb: true });
  rail.classList.toggle('open', open); document.body.style.setProperty('--railW', open ? '230px' : '75px');
  const home = el('button', { type: 'button', className: 'rlItem' + (app.current() ? '' : ' on'), title: 'Ana Sayfa', 'aria-label': 'Ana Sayfa', onclick: () => { closeFly(); app.goHome(); renderRail(); } },
    el('span', { className: 'mi', innerHTML: ico('home') || MI.home }), el('span', { className: 'ml', textContent: 'Ana Sayfa' }));
  const groups = railGroups(app).map((g) => {
    const isOpen = open && fo[g.id] === true;
    const btn = el('button', { type: 'button', className: 'rlItem rlFolder', title: g.title, 'aria-label': g.title, 'aria-expanded': String(isOpen), 'aria-haspopup': open ? null : 'true' },
      el('span', { className: 'mi', innerHTML: ico(g.icon) }), el('span', { className: 'ml', textContent: g.title }), g.badge ? el('span', { className: 'rlBadge', textContent: g.badge }) : '', el('span', { className: 'rlChev', innerHTML: SVG('<path d="m9 6 6 6-6 6"/>') }));
    const sub = el('div', { className: 'rlSub', role: 'group', 'aria-label': g.title }, el('div', { className: 'rlFlyHead', textContent: g.title }), ...g.items.map(railItem));
    const wrap = el('div', { className: 'rlGroup' + (isOpen ? ' x' : '') }, btn, sub);
    btn.onclick = (e) => {
      e.stopPropagation();
      if (railOpen()) { const o = lsGet(FKEY, { nb: true }); o[g.id] = !wrap.classList.contains('x'); lsSet(FKEY, o); wrap.classList.toggle('x', o[g.id]); btn.setAttribute('aria-expanded', String(o[g.id])); return; }
      const same = railFly === wrap; closeFly(); if (same) return;
      railFly = wrap; wrap.classList.add('fly'); btn.setAttribute('aria-expanded', 'true'); setTimeout(() => sub.querySelector('button:not([disabled])')?.focus(), 30);
    };
    return wrap;
  });
  const tog = el('button', { type: 'button', className: 'rlItem rlTog', title: open ? 'Menüyü daralt' : 'Menüyü genişlet', 'aria-label': open ? 'Menüyü daralt' : 'Menüyü genişlet', 'aria-expanded': String(open), onclick: toggleRail },
    el('span', { className: 'mi', innerHTML: SVG('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>') }), el('span', { className: 'ml', textContent: 'Daralt' }));
  rail.replaceChildren(el('nav', { className: 'rlList', 'aria-label': 'Kenar menüsü' }, home, el('div', { className: 'rlBr' }), ...groups), tog);
  $('#menuBtn')?.setAttribute('aria-expanded', String(open));
}
function toggleRail() { closeFly(); lsSet(RKEY, !railOpen()); renderRail(); }
function syncRail() {
  const on = wide();
  document.body.classList.toggle('hasRail', on);
  if (on && !rail) { rail = el('aside', { className: 'rail', id: 'rail' }); document.body.append(rail); renderRail(); }
  if (!on && rail) { rail.remove(); rail = null; railFly = null; }
  const top = $('#top'); if (top) document.body.style.setProperty('--railTop', top.offsetHeight + 'px');
}
document.addEventListener('pointerdown', (e) => { if (railFly && !railFly.contains(e.target)) closeFly(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && railFly) { const b = railFly.querySelector('.rlFolder'); e.stopPropagation(); closeFly(); b?.focus(); } }, true);

function boot() {
  buildMobileMenu();
  $('#menuBtn').onclick = () => (wide() ? toggleRail() : openDrawer());
  syncRail(); addEventListener('resize', () => { if (wide() && drawer) closeDrawer(); syncRail(); });
  new MutationObserver(() => renderRail()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(() => renderRail()).observe(cols(), { attributes: true, attributeFilter: ['hidden'] });
  window.defterShell = {
    toggleWm: () => setWm(!dockOn()), install: () => installSheet(true), standalone, wide,
    menuItems: () => [
      '-',
      ...(D()?.wide() ? [{ icon: 'win', label: 'Pencere düzeni', sub: dockOn() ? 'Açık: sekmeleri sürükle, yüzdür, yerleştir' : 'Krita gibi sekmeli ve yüzen pencereler', check: dockOn(), run: () => setWm(!dockOn()) }] : []),
      ...(dockOn() && D()?.wide() ? Object.entries(D()?.WS || {}).map(([k, w]) => ({ icon: 'win', label: 'Çalışma alanı: ' + w.t, sub: w.d, check: D().ws() === k, run: () => D().setWs(k) })) : []),
      ...(standalone() ? [] : [{ icon: 'install', label: 'Uygulama olarak kur', run: () => installSheet(true) }]),
    ],
  };
  maybeAsk();
}
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
