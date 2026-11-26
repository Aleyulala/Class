/* Class arama paneli: Blogger şablonundaki Ctrl+K (advSearchModal) tasarımı.
   <dialog> + showModal() kullanır; üst katmanda (top layer) açılır, alt menü/çekmece/pencere hiçbir şeyin arkasında kalmaz. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const A = () => window.defterApp;
const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="8"/><path d="m22 22-2-2"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  nb: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M8 11h8M8 15h5"/>'),
  src: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  note: svg('<path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  cmd: svg('<path d="m4 17 6-6-6-6M12 19h8"/>'),
  calc: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
};
const dlg = $('#srchDlg'), inp = $('#spInput'), items = $('#spItems'), cnt = $('#spCount'), kbd = $('#spKbd');
$('#spIco').innerHTML = I.search; $('#spGo').innerHTML = I.search; $('#spClr').innerHTML = I.x;
const SCOPES = [['all', 'Tümü'], ['nb', 'Defterler'], ['src', 'Kaynaklar'], ['note', 'Notlar'], ['cmd', 'Komutlar']];
let scope = 'all', data = { notebooks: [], sources: [], notes: [] }, results = [], sel = 0;
const norm = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
const snippet = (text, q) => { const t = String(text || '').replace(/\s+/g, ' '); const i = norm(t).indexOf(norm(q)); if (i < 0) return t.slice(0, 90); const a = Math.max(0, i - 30); return (a ? '…' : '') + t.slice(a, a + 100); };
function calc(raw) {
  const m = raw.replace(/^!hesap\s*/i, '').replace(/,/g, '.'); if (!/^[\d\s+\-*/().%^]+$/.test(m) || !/[+\-*/%^]/.test(m)) return null;
  try { const v = Function('"use strict";return (' + m.replace(/\^/g, '**') + ')')(); return Number.isFinite(v) ? +v.toFixed(10) : null; } catch { return null; }
}
const nbTitle = (id) => (data.notebooks.find((n) => n.id === id) || {}).title || 'Not defteri';
function commands() {
  const a = A(), dark = a.getTheme() !== 'light';
  return [
    { t: 'Yeni not defteri', s: 'Boş bir defter başlat', run: () => a.createNb() },
    { t: 'Tüm not defterleri', s: 'Ana ekrana dön', run: () => a.goHome() },
    { t: 'Model seç', s: 'Yerel yapay zekâ modeli', run: () => a.openModel() },
    { t: dark ? 'Açık moda geç' : 'Koyu moda geç', s: 'Görünüm', run: () => a.setTheme(dark ? 'light' : 'dark') },
    { t: 'Klavye ve oyun kolu', s: 'Kısayollar', run: () => window.defterHelp?.() },
    { t: 'Çerez politikası', s: 'Gizlilik', run: () => document.getElementById('cookieDlg')?.showModal() },
  ].map((c) => ({ ...c, k: 'cmd', ico: I.cmd }));
}
function compute() {
  const raw = inp.value.trim(), q = raw.replace(/^[>@]\s*/, ''); let sc = scope;
  if (raw.startsWith('>')) sc = 'cmd'; else if (raw.startsWith('@')) sc = 'nb';
  const out = []; const c = calc(raw); const cur = A().current();
  if (c !== null) out.push({ k: 'calc', t: `${raw.replace(/^!hesap\s*/i, '')} = ${c}`, s: 'Hesap sonucu (kopyalamak için Enter)', ico: I.calc, run: () => navigator.clipboard?.writeText(String(c)) });
  const m = (s) => !q || norm(s).includes(norm(q));
  if (sc === 'all' || sc === 'nb') [...data.notebooks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).filter((n) => m(n.title)).slice(0, sc === 'nb' ? 40 : 6).forEach((n) => out.push({ k: 'nb', t: (n.icon || '📘') + ' ' + n.title, s: 'Not defteri' + (cur && cur.id === n.id ? ' · açık' : ''), ico: I.nb, run: () => A().openNb(n.id) }));
  if (q && (sc === 'all' || sc === 'src')) data.sources.filter((s) => m(s.title) || m(s.text)).slice(0, sc === 'src' ? 40 : 6).forEach((s) => out.push({ k: 'src', t: s.title, s: nbTitle(s.nbId) + ' · ' + snippet(norm(s.title).includes(norm(q)) ? '' : s.text, q), ico: I.src, run: async () => { await A().openNb(s.nbId); A().setTab('sources'); } }));
  if (q && (sc === 'all' || sc === 'note')) data.notes.filter((n) => m(n.title) || m(n.text)).slice(0, sc === 'note' ? 40 : 6).forEach((n) => out.push({ k: 'note', t: n.title, s: nbTitle(n.nbId) + ' · ' + snippet(n.text, q), ico: I.note, run: async () => { await A().openNb(n.nbId); A().setTab('studio'); } }));
  if (sc === 'all' || sc === 'cmd') commands().filter((x) => m(x.t) || m(x.s)).slice(0, sc === 'cmd' ? 20 : (q ? 4 : 3)).forEach((x) => out.push(x));
  return out;
}
function render() {
  results = compute(); if (sel >= results.length) sel = Math.max(0, results.length - 1);
  const raw = inp.value.trim(); $('#spClr').hidden = !raw;
  cnt.textContent = !raw ? '🕘 Son Not Defterleri ve komutlar' : `🔎 ${results.length} sonuç`;
  kbd.textContent = results.length ? 'Enter ↵' : 'Sonuç yok';
  items.replaceChildren(...(results.length ? results.map((r, i) => {
    const b = el('button', { type: 'button', className: 'spItem' + (i === sel ? ' sel' : ''), role: 'option', 'aria-selected': i === sel ? 'true' : 'false' },
      el('span', { className: 'spItIco', innerHTML: r.ico }), el('span', { className: 'spItTx' }, el('b', { textContent: r.t }), el('small', { textContent: r.s })));
    b.onclick = () => pick(i); b.onmouseenter = () => { sel = i; mark(); }; return b;
  }) : [el('div', { className: 'spEmpty', textContent: raw ? 'Eşleşen bir şey bulunamadı. Başka bir ifade deneyin.' : 'Henüz not defteri yok. “Yeni not defteri” komutunu deneyin.' })]));
}
function mark() { [...items.children].forEach((b, i) => { b.classList.toggle('sel', i === sel); b.setAttribute('aria-selected', i === sel); if (i === sel) b.scrollIntoView({ block: 'nearest' }); }); }
function pick(i) { const r = results[i]; if (!r) return; dlg.close(); r.run?.(); }
function setScope(s) { scope = s; [...$('#spPills').children].forEach((b) => { b.classList.toggle('is-active', b.dataset.s === s); b.setAttribute('aria-selected', b.dataset.s === s); }); sel = 0; render(); }
$('#spPills').replaceChildren(...SCOPES.map(([k, l]) => el('button', { type: 'button', className: 'spPill' + (k === 'all' ? ' is-active' : ''), role: 'tab', 'data-s': k, textContent: l, onclick: () => { setScope(k); inp.focus(); } })));
$('#spChips').replaceChildren(...[['>', 'komut'], ['@', 'defter'], ['!hesap ', '!hesap']].map(([p, l]) => el('span', { className: 'spChip', textContent: l, title: p.trim() + ' ile başla', onclick: () => { inp.value = p; inp.focus(); sel = 0; render(); } })));
inp.addEventListener('input', () => { sel = 0; render(); });
inp.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) { sel = (sel + 1) % results.length; mark(); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (results.length) { sel = (sel - 1 + results.length) % results.length; mark(); } }
  else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
  else if (e.key === 'Tab' && !e.shiftKey && !inp.value) { e.preventDefault(); const i = SCOPES.findIndex(([k]) => k === scope); setScope(SCOPES[(i + 1) % SCOPES.length][0]); }
});
$('#spClr').onclick = () => { inp.value = ''; sel = 0; render(); inp.focus(); };
$('#spGo').onclick = () => pick(sel);
$('#spClose').onclick = () => dlg.close();
dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('spCard')) dlg.close(); });
dlg.addEventListener('close', () => { document.body.style.overflow = ''; });
async function open(q) {
  if (!A()) return; A().closeMenu?.();
  try { data = await A().searchData(); } catch { data = { notebooks: A().notebooks(), sources: [], notes: [] }; }
  if (typeof q === 'string') inp.value = q; else inp.value = '';
  sel = 0; scope = 'all'; setScope('all');
  if (!dlg.open) dlg.showModal(); setTimeout(() => { inp.focus(); inp.select(); }, 50);
}
window.defterSearch = { open, close: () => dlg.close() };
document.addEventListener('keydown', (e) => {
  const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dlg.open ? dlg.close() : open(); }
  else if (e.key === '/' && !typing && !dlg.open && !document.querySelector('dialog[open]')) { e.preventDefault(); open(); }
});
