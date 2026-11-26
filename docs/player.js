/* Class medya oynatıcı. Sohbetteki görsel / ses / video yerinde oynamaz: kapak kartı olarak durur.
   Karta dokun → tam ekran; köşe düğmesi → kayan (sürüklenebilir) mini oynatıcı. Tek bir medya öğesi iki görünüm
   arasında taşınır, yani tam ekran ↔ kayan geçişinde oynatma kesilmez. Oynayan medyanın kartında "Oynatılıyor" yazar.
   Geri / Esc: tam ekrandaki ses-video kayan pencereye küçülür, görsel kapanır. */
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-')) e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const sv = (d, n = 18) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  v: sv('<rect x="2.5" y="5" width="15" height="14" rx="3"/><path d="M17.5 10l4-2.5v9l-4-2.5"/>'),
  a: sv('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  i: sv('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.5-4.5L7 20"/>'),
  pip: sv('<rect x="2" y="4" width="20" height="16" rx="3"/><rect x="11.5" y="11.5" width="7.5" height="5.5" rx="1.5"/>'),
  full: sv('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  dl: sv('<path d="M12 3v12M7 10l5 5 5-5M5 20h14"/>'),
  x: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
};
const kindOf = (m) => (m.video ? 'v' : m.audio ? 'a' : 'i');
const srcOf = (m) => m.video || m.audio || m.img || '';
const label = (m) => (m.text || '').trim() || { v: 'Video', a: 'Ses', i: 'Görsel' }[kindOf(m)];
const top = 'showPopover' in HTMLElement.prototype;
const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

let cur = null; /* { m, k, src, node, media } — ses/video */
let IMG = null; /* tam ekranda açık görsel: çalan müziği durdurmaz */
let FS = null, FL = null;

/* ---------- sohbet kartı ---------- */
function frame(url, host) {
  const c = el('canvas', { className: 'cpImg' }); host.append(c);
  const go = () => {
    const v = document.createElement('video');
    const end = () => { v.removeAttribute('src'); try { v.load(); } catch {} };
    const draw = () => { try { c.width = v.videoWidth || 640; c.height = v.videoHeight || 360; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); host.classList.add('hasImg'); } catch {} end(); };
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.addEventListener('loadeddata', () => { try { v.currentTime = Math.min(1, (v.duration || 4) / 4); } catch { draw(); } }, { once: true });
    v.addEventListener('seeked', draw, { once: true });
    v.addEventListener('error', end, { once: true });
    v.src = url;
  };
  if (!('IntersectionObserver' in window)) return go();
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '200px' });
  io.observe(host);
}
export function card(m) {
  const k = kindOf(m), src = srcOf(m);
  const b = el('button', { type: 'button', className: `cpCard is-${k}`, 'aria-label': `${k === 'i' ? 'Görseli' : 'Tam ekranda'} aç: ${label(m)}`, title: 'Tam ekranda aç' });
  b.dataset.src = src;
  if (k === 'i') { const im = el('img', { src, alt: label(m), loading: 'lazy' }); b.append(im); b.classList.add('hasImg'); }
  else { b.append(el('span', { className: 'cpArt', innerHTML: I[k] })); if (k === 'v') frame(src, b); }
  if (k !== 'i') b.append(el('span', { className: 'cpTag', innerHTML: I[k] }, el('b', { textContent: label(m) })));
  b.append(el('span', { className: 'cpNow' }, el('i'), el('i'), el('i'), el('b', { textContent: 'Oynatılıyor' })));
  b.onclick = () => open(m);
  const w = el('div', { className: 'cpCardW' }, b);
  if (k !== 'i') w.append(el('button', { type: 'button', className: 'cpCorner', title: 'Kayan pencerede izle', 'aria-label': 'Kayan pencerede izle', innerHTML: I.pip, onclick: (e) => { e.stopPropagation(); open(m, { floating: true }); } }));
  else if (m.text) w.append(el('small', { className: 'cpCap', textContent: m.text }));
  if (cur && cur.k !== 'i' && cur.src === src) b.classList.add('is-now');
  return w;
}
function mark() { document.querySelectorAll('.cpCard').forEach((c) => c.classList.toggle('is-now', !!cur && cur.k !== 'i' && c.dataset.src === cur.src)); }

/* ---------- tam ekran ---------- */
function ensureFs() {
  if (FS) return FS;
  const title = el('b', { className: 'cpTitle' });
  const pip = el('button', { type: 'button', className: 'cpBtn', title: 'Kayan pencereye küçült', 'aria-label': 'Kayan pencereye küçült', innerHTML: I.pip, onclick: () => show('fl') });
  const dl = el('a', { className: 'cpBtn', title: 'İndir', 'aria-label': 'İndir', innerHTML: I.dl });
  const x = el('button', { type: 'button', className: 'cpBtn', title: 'Kapat (Esc)', 'aria-label': 'Kapat', innerHTML: I.x, onclick: () => (IMG ? closeImg() : close()) });
  const stage = el('div', { className: 'cpStage' });
  const root = el('div', { className: 'cpFs', id: 'cpFs', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Medya oynatıcı', hidden: true }, el('div', { className: 'cpBar' }, title, pip, dl, x), stage);
  if (top) root.setAttribute('popover', 'manual');
  stage.addEventListener('click', (e) => { if (e.target === stage) (IMG ? closeImg() : close()); });
  document.body.append(root);
  FS = { root, stage, title, pip, dl }; return FS;
}

/* ---------- kayan pencere ---------- */
const POS = 'class-cp-pos';
function ensureFl() {
  if (FL) return FL;
  const stage = el('div', { className: 'cpStage' });
  const full = el('button', { type: 'button', className: 'cpBtn', title: 'Tam ekran', 'aria-label': 'Tam ekran', innerHTML: I.full, onclick: (e) => { e.stopPropagation(); show('fs'); } });
  const x = el('button', { type: 'button', className: 'cpBtn', title: 'Kapat', 'aria-label': 'Kapat', innerHTML: I.x, onclick: (e) => { e.stopPropagation(); close(); } });
  const grip = el('div', { className: 'cpGrip', 'aria-hidden': 'true' });
  const title = el('b', { className: 'cpTitle' });
  const root = el('div', { className: 'cpFl', id: 'cpFl', role: 'region', 'aria-label': 'Kayan oynatıcı', hidden: true }, grip, stage, el('div', { className: 'cpFlBar' }, title, full, x));
  if (top) root.setAttribute('popover', 'manual');
  document.body.append(root);
  drag(root);
  addEventListener('resize', () => clamp(root));
  FL = { root, stage, title }; return FL;
}
function setPos(r, right, bottom) { r.style.right = Math.round(right) + 'px'; r.style.bottom = Math.round(bottom) + 'px'; }
function clamp(r) {
  if (r.hidden) return; const b = r.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  setPos(r, Math.max(8, Math.min(W - b.width - 8, W - b.right)), Math.max(8, Math.min(H - b.height - 8, H - b.bottom)));
}
function drag(r) {
  r.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button,a,input,select')) return;
    const onMedia = /^(VIDEO|AUDIO)$/.test(e.target.tagName);
    if (onMedia && e.pointerType === 'mouse') return;
    const b = r.getBoundingClientRect(), W = innerWidth, H = innerHeight, x0 = e.clientX, y0 = e.clientY, r0 = W - b.right, b0 = H - b.bottom, id = e.pointerId;
    let moved = false, raf = 0, nr = r0, nb = b0;
    if (!onMedia) { try { r.setPointerCapture(id); } catch {} }
    const mv = (v) => {
      if (v.pointerId !== id) return; const dx = v.clientX - x0, dy = v.clientY - y0;
      if (!moved) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; moved = true; r.classList.add('drag'); document.documentElement.classList.add('cpDrag'); try { r.setPointerCapture(id); } catch {} }
      if (v.cancelable) v.preventDefault();
      nr = Math.max(8, Math.min(W - b.width - 8, r0 - dx)); nb = Math.max(8, Math.min(H - b.height - 8, b0 - dy));
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; setPos(r, nr, nb); });
    };
    const up = (v) => {
      if (v.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      r.classList.remove('drag'); document.documentElement.classList.remove('cpDrag');
      if (moved) { cancelAnimationFrame(raf); setPos(r, nr, nb); try { localStorage.setItem(POS, JSON.stringify([nr, nb])); } catch {} r._dragged = true; setTimeout(() => (r._dragged = false), 0); }
    };
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  r.addEventListener('click', (e) => { if (r._dragged || e.target.closest('button,a,video,audio')) return; show('fs'); });
}

/* ---------- oynatma ---------- */
function build(m) {
  const k = kindOf(m), src = srcOf(m);
  if (k === 'i') { const im = el('img', { className: 'cpMedia', src, alt: label(m) }); return { node: im, media: null }; }
  if (k === 'v') { const v = el('video', { className: 'cpMedia', src, controls: true, playsInline: true, autoplay: true, preload: 'auto' }); return { node: v, media: v }; }
  const a = el('audio', { className: 'cpMedia', src, controls: true, autoplay: true, preload: 'auto' });
  const node = el('div', { className: 'cpAudio' }, el('span', { className: 'cpDisc', innerHTML: I.a }), el('b', { textContent: label(m) }), a);
  return { node, media: a };
}
function popShow(r) { r.hidden = false; if (top) { try { r.hidePopover(); } catch {} try { r.showPopover(); } catch {} } }
function popHide(r) { if (top) { try { r.hidePopover(); } catch {} } r.hidden = true; }
function show(mode) {
  if (!cur) return;
  if (cur.k === 'i') mode = 'fs';
  const fs = ensureFs(), fl = cur.k === 'i' ? null : ensureFl();
  const dest = mode === 'fs' ? fs : fl;
  dest.stage.append(cur.node); /* aynı öğe taşınır: oynatma sürer */
  dest.title.textContent = label(cur.m);
  if (mode === 'fs') {
    fs.pip.hidden = cur.k === 'i'; fs.dl.href = cur.src; fs.dl.download = (label(cur.m).replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 60) || 'class') + ({ v: '.mp4', a: '.wav', i: '.png' }[cur.k]);
    if (fl) popHide(fl.root); popShow(fs.root); document.documentElement.classList.add('cpOpen');
    setTimeout(() => fs.root.querySelector('.cpBar .cpBtn:last-child')?.focus({ preventScroll: true }), 30);
  } else {
    popHide(fs.root); document.documentElement.classList.remove('cpOpen');
    fl.root.classList.toggle('isAudio', cur.k === 'a'); popShow(fl.root);
    let p = null; try { p = JSON.parse(localStorage.getItem(POS)); } catch {}
    if (Array.isArray(p)) setPos(fl.root, p[0], p[1]); else { fl.root.style.right = ''; fl.root.style.bottom = ''; }
    requestAnimationFrame(() => clamp(fl.root));
  }
  cur.mode = mode;
  cur.media?.play?.().catch(() => { if (cur?.media) { cur.media.muted = true; cur.media.play().catch(() => {}); } });
}
function openImg(m) {
  const fs = ensureFs(); closeImg();
  IMG = el('img', { className: 'cpMedia', src: m.img, alt: label(m) });
  if (cur?.mode === 'fs') show('fl');
  fs.stage.append(IMG); fs.title.textContent = label(m); fs.pip.hidden = true; fs.dl.href = m.img; fs.dl.download = 'class-gorsel.png';
  popShow(fs.root); document.documentElement.classList.add('cpOpen');
}
function closeImg() { if (!IMG) return; IMG.remove(); IMG = null; if (FS && !(cur && cur.mode === 'fs')) { popHide(FS.root); document.documentElement.classList.remove('cpOpen'); } }
export function open(m, { floating = false } = {}) {
  const src = srcOf(m); if (!src) return;
  if (kindOf(m) === 'i') return openImg(m);
  if (!cur || cur.src !== src) { stop(); const b = build(m); cur = { m, k: kindOf(m), src, ...b }; }
  show(floating ? 'fl' : 'fs'); mark();
}
function stop() {
  if (!cur) return;
  try { cur.media?.pause(); } catch {} cur.media?.removeAttribute('src'); cur.node.remove(); cur = null;
  if (FS) popHide(FS.root); if (FL) popHide(FL.root); document.documentElement.classList.remove('cpOpen');
}
export function close() { stop(); mark(); }
/* nav.js geri / Esc buraya sorar */
export function back() {
  if (IMG) { closeImg(); return true; }
  if (!cur || cur.mode !== 'fs') return false;
  if (cur.k === 'i') close(); else show('fl');
  return true;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (IMG || (cur && cur.mode === 'fs'))) { e.preventDefault(); e.stopImmediatePropagation(); back(); } }, true);
window.classPlayer = { card, open, close, back, current: () => cur && { src: cur.src, mode: cur.mode, kind: cur.k } };
