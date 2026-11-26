// Klavye (Tab, ok tuşları, Enter, Esc) ve oyun kolu ile gezinme — Blogger şablonundaki TV/oyun kolu gezinmesinin Class karşılığı.
// Oyun kolu: D-pad / sol çubuk = odağı taşı, A = seç, B = geri, X = yeni, Y = ara, LB/RB = sekme, Start = ayarlar,
// Select = tema, sağ çubuk = kaydır, L3 = yardım. Klavye: oklar = taşı, Enter/Boşluk = seç, Esc/Backspace = geri.
const CFG = { deadzone: 0.45, padDelay: 340, padRepeat: 140, keyRepeat: 90 };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const $ = (s, r = document) => r.querySelector(s);
const S = { cur: null, pointer: false, held: {}, padOn: false, prevPressed: {}, last: 0 };

/* ---- görünürlük / kapsam ---- */
const visible = (e) => { const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; return !e.closest('[hidden],[inert]'); };
function scope() {
  const menu = $('.menu'); if (menu) return menu;
  const dlgs = [...document.querySelectorAll('dialog[open]')]; if (dlgs.length) return dlgs[dlgs.length - 1];
  return document.body;
}
function list() { const sc = scope(); return [...sc.querySelectorAll(FOCUSABLE)].filter((e) => visible(e) && !(e.tagName === 'INPUT' && e.type === 'checkbox' && getComputedStyle(e).opacity === '0')); }
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

function findNext(dir, from) {
  const fr = from.getBoundingClientRect(), fc = center(fr); let best = null, bs = Infinity;
  for (const e of list()) {
    if (e === from) continue; const r = e.getBoundingClientRect(), c = center(r); const dx = c.x - fc.x, dy = c.y - fc.y;
    let primary, ortho;
    if (dir === 'right') { if (r.left < fr.right - 4 && dx <= 4) continue; primary = dx; ortho = Math.abs(dy); }
    else if (dir === 'left') { if (r.right > fr.left + 4 && dx >= -4) continue; primary = -dx; ortho = Math.abs(dy); }
    else if (dir === 'down') { if (r.top < fr.bottom - 4 && dy <= 4) continue; primary = dy; ortho = Math.abs(dx); }
    else { if (r.bottom > fr.top + 4 && dy >= -4) continue; primary = -dy; ortho = Math.abs(dx); }
    if (primary <= 0) continue;
    const score = primary + ortho * 2.2; if (score < bs) { bs = score; best = e; }
  }
  return best;
}
function firstVisible() { const l = list().filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }); return l[0] || list()[0] || null; }

/* ---- odak noktası ve duyuru ---- */
let dot = null, live = null;
function ensureUi() {
  if (!dot) { dot = document.createElement('div'); dot.id = 'focusDot'; dot.setAttribute('aria-hidden', 'true'); document.body.append(dot); }
  if (!live) { live = document.createElement('div'); live.className = 'srOnly'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.append(live); }
}
function label(e) { return (e.getAttribute('aria-label') || e.title || e.textContent || e.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
function announce(t) { ensureUi(); live.textContent = ''; setTimeout(() => (live.textContent = t), 30); }
function updateDot(e) {
  ensureUi(); if (!e || S.pointer) { dot.classList.remove('on'); return; }
  const r = e.getBoundingClientRect(); dot.style.left = Math.max(8, r.left + 6) + 'px'; dot.style.top = r.top + r.height / 2 + 'px'; dot.classList.add('on');
}
function pick(e) { if (!e) return false; S.cur = e; try { e.focus({ preventScroll: true }); } catch {} e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); S.pointer = false; updateDot(e); announce(label(e)); return true; }
function move(dir) {
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox') { try { a.blur(); } catch {} }
  let from = S.cur && document.contains(S.cur) && visible(S.cur) ? S.cur : (a && a !== document.body ? a : null);
  const next = from ? findNext(dir, from) : firstVisible();
  if (next) return pick(next);
  const sc = scrollable(from); const dy = dir === 'up' ? -240 : dir === 'down' ? 240 : 0; if (dy && sc) { sc.scrollBy({ top: dy, behavior: 'smooth' }); setTimeout(() => { const n = from ? findNext(dir, from) : null; if (n) pick(n); }, 160); }
  return false;
}
function activate() {
  const e = S.cur && document.contains(S.cur) ? S.cur : document.activeElement; if (!e || e === document.body) return move('down');
  if (/^(INPUT|TEXTAREA)$/.test(e.tagName) && e.type !== 'checkbox') { e.focus(); return; }
  e.click(); announce('Seçildi: ' + label(e)); setTimeout(() => { const n = document.activeElement; if (n && n !== document.body) { S.cur = n; updateDot(n); } else updateDot(S.cur); }, 60);
}
function scrollable(from) { let n = from; while (n && n !== document.body) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) return n; n = n.parentElement; } return $('.vwBody[open]') || $('dialog[open] .vwBody') || $('#home:not([hidden])') || $('.msgs') || document.scrollingElement; }

/* ---- geri / kısayollar ---- */
function click(sel) { const e = $(sel); if (e && !e.hidden && !e.disabled) { e.click(); return true; } return false; }
function goBack() {
  if (window.classPlayer?.back()) return true; /* tam ekran oynatıcı: ses/video kayan pencereye küçülür */
  if ($('.menu')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; }
  const dlg = [...document.querySelectorAll('dialog[open]')].pop(); if (dlg) { dlg.close(); return true; }
  if (window.defterSlide?.back()) return true; /* telefonda açık kayan panel / stüdyo sayfası */
  if (click('#backBtn')) return true;
  if (!$('#searchBar')?.hidden && click('#searchClose')) return true;
  return false;
}
function switchTab(d) { const tabs = [...document.querySelectorAll('#tabs button')]; if (!tabs.length || $('#tabs')?.hidden || !visible($('#tabs'))) return false; const i = tabs.findIndex((b) => b.classList.contains('on')); const n = tabs[Math.max(0, Math.min(tabs.length - 1, i + d))]; n?.click(); return true; }
function inNb() { return document.body.classList.contains('in-nb'); }
const actions = {
  search: () => (inNb() ? (switchTab(-9), $('#q')?.focus()) : click('#searchBtn')),
  create: () => (inNb() ? click('#addFile') : (click('#newPill') || click('.nbNew'))),
  menu: () => click('#gearBtn'),
  theme: () => { const r = document.documentElement; const dark = r.getAttribute('data-theme') ? r.getAttribute('data-theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; const t = dark ? 'light' : 'dark'; try { localStorage.setItem('defter-theme', t); } catch {} r.setAttribute('data-theme', t); announce(t === 'dark' ? 'Koyu tema' : 'Açık tema'); },
  home: () => click('#homeLink') || click('#backBtn'),
  top: () => (scrollable(S.cur) || document.scrollingElement).scrollTo({ top: 0, behavior: 'smooth' }),
};

/* ---- yardım penceresi ---- */
const HELP = [['Oklar / D-pad / sol çubuk', 'Odağı taşı'], ['Tab / Shift+Tab', 'Sıradaki / önceki öğe'], ['Enter, Boşluk / A', 'Seç'], ['Esc, Backspace / B', 'Geri, pencereyi kapat'], ['Y, / , s', 'Ara (not defterinde yazma alanı)'], ['X', 'Yeni not defteri / kaynak ekle'], ['LB / RB, [ ve ]', 'Önceki / sonraki sekme'], ['Start, m', 'Ayarlar menüsü'], ['Select, d', 'Açık / koyu tema'], ['h', 'Ana ekran'], ['t', 'En üste kaydır'], ['Sağ çubuk', 'Kaydır'], ['L3, ?', 'Bu yardım']];
function help() {
  let d = $('#navHelp');
  if (!d) { d = document.createElement('dialog'); d.id = 'navHelp'; const form = document.createElement('form'); form.method = 'dialog'; form.className = 'dlg'; form.innerHTML = '<h3>Klavye ve oyun kolu</h3><table class="helpT"><tbody>' + HELP.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('') + '</tbody></table><div class="row end"><button class="btn primary" value="close">Tamam</button></div>'; d.append(form); document.body.append(d); }
  if (d.open) d.close(); else d.showModal();
}
window.defterHelp = help;

/* ---- klavye ---- */
const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const editable = (e) => e && (e.isContentEditable || (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && e.type !== 'checkbox' && e.type !== 'radio'));
document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  S.pointer = false; const a = document.activeElement; const k = ev.key;
  if (k === 'Tab') { setTimeout(() => { const n = document.activeElement; if (n && n !== document.body) { S.cur = n; updateDot(n); } }, 0); return; }
  if (editable(a)) {
    if (k === 'Escape') { if (a.closest && a.closest('dialog')) return; ev.preventDefault(); a.blur(); return; }
    if (a.tagName === 'SELECT') return;
    const d = DIRS[k]; if (d && (a.tagName === 'INPUT' || !a.value)) { ev.preventDefault(); S.cur = a; a.blur(); move(d); }
    return;
  }
  const now = Date.now(); if (now - S.last < CFG.keyRepeat) return;
  if (DIRS[k]) { if (a && /^(SELECT)$/.test(a.tagName)) return; ev.preventDefault(); S.last = now; move(DIRS[k]); return; }
  if (k === 'Backspace' || (k === 'Escape' && !document.querySelector('dialog[open]') && !$('.menu'))) { if (goBack()) ev.preventDefault(); return; }
  if ((k === 'Enter' || k === ' ') && a && a !== document.body && /^(A|BUTTON|SUMMARY|INPUT)$/.test(a.tagName)) return; // yerel davranış
  if (k === 'Enter' || k === ' ') { if (S.cur) { ev.preventDefault(); activate(); } return; }
  if (document.querySelector('dialog[open]') && k !== '?') return;
  const map = { '/': 'search', s: 'search', S: 'search', m: 'menu', M: 'menu', d: 'theme', D: 'theme', h: 'home', H: 'home', t: 'top', T: 'top', n: 'create', N: 'create' };
  if (k === '?' || k === 'F1') { ev.preventDefault(); help(); return; }
  if (k === '[') { switchTab(-1); return; } if (k === ']') { switchTab(1); return; }
  if (map[k]) { ev.preventDefault(); actions[map[k]](); }
}, true);
['mousedown', 'touchstart', 'pointerdown'].forEach((t) => document.addEventListener(t, () => { S.pointer = true; dot?.classList.remove('on'); }, true));
document.addEventListener('focusin', (e) => { if (!S.pointer && e.target !== document.body) { S.cur = e.target; updateDot(e.target); } });
addEventListener('resize', () => updateDot(S.cur)); document.addEventListener('scroll', () => updateDot(S.cur), true);

/* ---- oyun kolu ---- */
function fire(id, fn) { const now = Date.now(); const h = S.held[id]; if (!h) { S.held[id] = { t0: now, last: now }; fn(); return; } if (now - h.t0 >= CFG.padDelay && now - h.last >= CFG.padRepeat) { h.last = now; fn(); } }
function poll(gp) {
  const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed); const live = [];
  const once = (id, i, fn) => { if (b(i)) { live.push(id); if (!S.prevPressed[id]) fn(); S.prevPressed[id] = true; } else S.prevPressed[id] = false; };
  const rep = (id, i, fn) => { if (b(i)) { live.push(id); fire(id, fn); } };
  const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
  once('A', 0, () => { S.pointer = false; activate(); });
  once('B', 1, () => { if (!goBack()) announce('Geri gidilecek yer yok'); });
  once('X', 2, () => actions.create()); once('Y', 3, () => actions.search());
  once('LB', 4, () => switchTab(-1)); once('RB', 5, () => switchTab(1));
  once('Select', 8, () => actions.theme()); once('Start', 9, () => actions.menu()); once('L3', 10, () => help());
  rep('Up', 12, () => move('up')); rep('Down', 13, () => move('down')); rep('Left', 14, () => move('left')); rep('Right', 15, () => move('right'));
  if (Math.abs(lx) > CFG.deadzone || Math.abs(ly) > CFG.deadzone) { if (Math.abs(lx) >= Math.abs(ly)) { live.push('ax-x'); fire('ax-x', () => move(lx > 0 ? 'right' : 'left')); } else { live.push('ax-y'); fire('ax-y', () => move(ly > 0 ? 'down' : 'up')); } }
  if (Math.abs(ry) > 0.2 || Math.abs(rx) > 0.2) (scrollable(S.cur) || document.scrollingElement).scrollBy(rx * 18, ry * 24);
  for (const k in S.held) if (!live.includes(k)) delete S.held[k];
}
function frame() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; let any = false;
  for (const gp of gps) if (gp && gp.connected) { any = true; poll(gp); }
  if (any && !S.padOn) { S.padOn = true; announce('Oyun kolu bağlandı. Yardım için L3 ya da soru işareti.'); }
  requestAnimationFrame(frame);
}
if (navigator.getGamepads) { addEventListener('gamepadconnected', () => {}); requestAnimationFrame(frame); }
