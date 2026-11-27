/* Class arama paneli: Saved'deki ve Blogger şablonundaki #Arama (advSearchModal) tasarımı.
   Sayfada (defter, kaynak, not, komut) arar; ayrıca Google, çeviri, YouTube gibi motorlar ve "tr metin" gibi kısayollar.
   <dialog> + showModal() kullanır; üst katmanda (top layer) açılır, hiçbir şeyin arkasında kalmaz. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const A = () => window.defterApp;
const svg = (p) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="8"/><path d="m22 22-2-2"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  nb: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M8 11h8M8 15h5"/>'),
  src: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  note: svg('<path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  cmd: svg('<path d="m4 17 6-6-6-6M12 19h8"/>'),
  calc: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  web: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
};
const dlg = $('#srchDlg'), inp = $('#spInput'), items = $('#spItems'), cnt = $('#spCount'), kbd = $('#spKbd'), res = $('#spRes'), chips = $('#spChips');
$('#spGo').innerHTML = I.search; $('#spClr').innerHTML = I.x;
/* Haplar: önce Class içi kapsamlar (Sayfada = hepsi), sonra web motorları (Saved ile aynı sıra) */
const LOCAL = [['all', 'Sayfada'], ['nb', 'Defterler'], ['src', 'Kaynaklar'], ['note', 'Notlar'], ['cmd', 'Komutlar']];
const ENGINES = [
  ['https://www.google.com/search?udm=50&q=', 'Google AI'], ['https://www.google.com/search?q=', 'Google'],
  ['https://translate.google.com/?sl=auto&tl=tr&text=', 'Google Çeviri'], ['https://www.deepl.com/translator#auto/tr/', 'DeepL'],
  ['https://translate.yandex.com/?source_lang=auto&target_lang=tr&text=', 'Yandex Çeviri'], ['https://music.youtube.com/search?q=', 'YT Music'],
  ['https://www.youtube.com/results?search_query=', 'YouTube'], ['https://github.com/search?q=', 'GitHub'],
  ['https://tr.wikipedia.org/wiki/Özel:Ara?search=', 'Wikipedia'], ['https://duckduckgo.com/?q=', 'DuckDuckGo'],
  ['https://www.perplexity.ai/search?q=', 'Perplexity'], ['https://archive.org/search?query=', 'Archive'],
];
const SCOPES = [...LOCAL, ...ENGINES];
const isLocal = (k) => LOCAL.some(([x]) => x === k);
const engName = (k) => (SCOPES.find(([x]) => x === k) || [, 'Arama motoru'])[1];
/* Kısayollar: "tr merhaba" → Google Çeviri (Saved ile aynı) */
const SHORT = { tr: ENGINES[2], ceviri: ENGINES[2], deepl: ENGINES[3], dl: ENGINES[3], ytr: ENGINES[4], ytm: ENGINES[5], music: ENGINES[5], yt: ENGINES[6], youtube: ENGINES[6], gh: ENGINES[7], github: ENGINES[7], wiki: ENGINES[8], g: ENGINES[1], ai: ENGINES[0], ddg: ENGINES[9], px: ENGINES[10] };
const CHIPS = [['tr ', 'tr', 'Google Çeviri'], ['deepl ', 'deepl', 'DeepL Çeviri'], ['ytr ', 'ytr', 'Yandex Çeviri'], ['ytm ', 'ytm', 'YouTube Music'], ['yt ', 'yt', 'YouTube'], ['gh ', 'gh', 'GitHub'], ['wiki ', 'wiki', 'Wikipedia'], ['@', '@defter', 'Not defterlerinde ara'], ['>', '>komut', 'Komutlarda ara'], ['!hesap ', '!hesap', 'Hesap makinesi']];
const TAG = { nb: 'defter', src: 'kaynak', note: 'not', cmd: 'komut', calc: 'hesap' };
const EK = 'class-search-engine';
let scope = (() => { try { const v = localStorage.getItem(EK); return SCOPES.some(([k]) => k === v) ? v : 'all'; } catch { return 'all'; } })();
let data = { notebooks: [], sources: [], notes: [] }, results = [], sel = -1;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const isUrl = (r) => /^(https?:\/\/|[\w-]+\.[a-z]{2,})(\/\S*)?$/i.test(r) && !/\s/.test(r);
function shortcut(raw) { const m = raw.match(/^(\S+?):?\s+(.+)$/); const e = m && SHORT[m[1].toLowerCase()]; return e ? { url: e[0], name: e[1], q: m[2].trim() } : null; }
const go = (url) => { window.open(url, '_blank', 'noopener,noreferrer'); dlg.close(); };
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
    { t: 'Ayarlar', s: 'Görünüm, motor, sohbet, veri', run: () => window.defterSettings?.open() },
    { t: 'Görsel stüdyo', s: 'Stable Diffusion ile görsel üret', run: () => window.defterHub?.open('image') },
    { t: 'Ses stüdyosu', s: 'Metni seslendir (TTS)', run: () => window.defterHub?.open('tts') },
    { t: 'Yazıya dök', s: 'Ses ya da videoyu metne çevir (Whisper)', run: () => window.defterHub?.open('stt') },
    { t: 'Müzik stüdyosu', s: 'Müzik ve ses efekti üret', run: () => window.defterHub?.open('music') },
    { t: 'Video stüdyosu', s: 'Metinden video üret', run: () => window.defterHub?.open('video') },
    { t: 'Dönüştürücü', s: 'Görsel, PDF, ses, video, altyazı, yazı tipi, belge, gizlilik', run: () => window.defterHub?.open('convert') },
    { t: 'Web’de kaynak ara', s: 'Web araması ve adresten kaynak ekle', run: () => window.defterHub?.open('web') },
    { t: 'Model Merkezi', s: 'Model indir, ara, sil', run: () => window.defterHub?.open('models') },
    { t: 'Sistem', s: 'Güncelleme, temizlik, Hugging Face anahtarı', run: () => window.defterHub?.open('system') },
    { t: 'Kurulum sihirbazı', s: 'İlk kurulum adımları', run: () => window.defterSettings?.setup() },
    ...(window.defterDock?.wide() ? [
      { t: window.defterDock.enabled() ? 'Pencere düzenini kapat' : 'Pencere düzenini aç', s: 'Krita gibi sekmeli, sürüklenebilir, yüzen pencereler', run: () => window.defterDock.toggle() },
      ...Object.entries(window.defterDock.WS).map(([k, w]) => ({ t: 'Çalışma alanı: ' + w.t, s: w.d, run: () => window.defterDock.setWs(k) }))] : []),
    { t: 'Model seç', s: 'Yerel yapay zekâ modeli', run: () => a.openModel() },
    { t: dark ? 'Açık moda geç' : 'Koyu moda geç', s: 'Görünüm', run: () => a.setTheme(dark ? 'light' : 'dark') },
    { t: 'İletişim', s: 'Mesaj yaz', run: () => window.defterContact?.open() },
    { t: 'Tema rengi', s: 'Vurgu rengini seç', run: () => window.defterTheme?.open(document.querySelector('.qeT')) },
    { t: 'Klavye ve oyun kolu', s: 'Kısayollar', run: () => window.defterHelp?.() },
    { t: 'Çerez politikası', s: 'Gizlilik', run: () => document.getElementById('cookieDlg')?.showModal() },
  ].map((c) => ({ ...c, k: 'cmd', ico: I.cmd }));
}
function compute() {
  const raw = inp.value.trim(), q = raw.replace(/^[>@]\s*/, ''); let sc = scope;
  if (!isLocal(sc) || shortcut(raw) || isUrl(raw)) return [];
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
/* Canlı bilgi şeridi (Saved'deki .adv-banner): kısayol, adres, hesap, seçili sonuç ya da motor */
function banner(raw) {
  const c = calc(raw), sh = shortcut(raw), r = results[sel];
  const set = (html, k) => { chips.innerHTML = html; kbd.textContent = k; };
  if (c !== null) return set(`<span>🧮</span><span>Hesap sonucu: <b>${esc(raw.replace(/^!hesap\s*/i, ''))} = ${c}</b></span>`, 'Kopyala (Enter ↵)');
  if (sh) return set(`<span class="spBn">${esc(sh.name)}:</span><span>“<b>${esc(sh.q)}</b>” üzerinde ara</span>`, 'Enter ↵');
  if (isUrl(raw)) return set(`<span>🔗</span><span>Doğrudan siteye git: <b>${esc(raw)}</b></span>`, 'Git (Enter ↵)');
  if (!isLocal(scope)) return set(`<span class="spBn">${esc(engName(scope))}:</span><span>“<b>${esc(raw || '...')}</b>” ara</span>`, 'Ara (Enter ↵)');
  if (r && raw) return set(`<span>🚀</span><span>Aç: <b>${esc(r.t)}</b></span>`, 'Aç (Enter ↵)');
  if (!raw) { chips.replaceChildren(...CHIPS.map(([p, l, t]) => el('button', { type: 'button', className: 'spChip', textContent: l, title: t, onclick: () => { inp.value = p; inp.focus(); sel = -1; render(); } }))); kbd.textContent = 'Enter ↵'; return; }
  if (results.length) return set(`<span>🔍</span><span>“<b>${esc(raw)}</b>” için sonuçlar aşağıda, ↑ ↓ ile seçin</span>`, 'Enter ↵');
  set(`<span>🔍</span><span>“<b>${esc(raw)}</b>” için sonuç yok, bir motor seçip webde arayın</span>`, 'Enter ↵');
}
function render() {
  results = compute(); if (sel >= results.length) sel = results.length - 1;
  const raw = inp.value.trim();
  const local = isLocal(scope) && !shortcut(raw) && !isUrl(raw);
  res.hidden = !local;
  cnt.textContent = !raw ? `📖 ${({ nb: 'Not defterleri', src: 'Kaynaklar', note: 'Notlar', cmd: 'Komutlar' })[scope] || 'Son kullanılanlar'} (${results.length})` : `🔍 Eşleşen sonuçlar (${results.length})`;
  items.replaceChildren(...(results.length ? results.map((r, i) => {
    const b = el('button', { type: 'button', className: 'spItem' + (i === sel ? ' sel' : ''), role: 'option', 'aria-selected': i === sel ? 'true' : 'false' },
      el('span', { className: 'spItMain' }, el('span', { className: 'spItIco', innerHTML: r.ico }), el('span', { className: 'spItTx' }, el('b', { textContent: r.t }), el('small', { textContent: r.s }))),
      el('span', { className: 'spTag', textContent: TAG[r.k] || 'sonuç' }));
    b.onclick = () => pick(i); b.onmouseenter = () => { sel = i; mark(); }; return b;
  }) : [el('div', { className: 'spEmpty', textContent: raw ? 'Sayfada eşleşen bir şey bulunamadı. Bir motor seçip Enter ile webde arayabilirsiniz.' : 'Henüz not defteri yok. “Yeni not defteri” komutunu deneyin.' })]));
  banner(raw);
}
function mark() { [...items.children].forEach((b, i) => { b.classList.toggle('sel', i === sel); b.setAttribute('aria-selected', i === sel); if (i === sel) b.scrollIntoView({ block: 'nearest' }); }); banner(inp.value.trim()); }
function pick(i) { const r = results[i]; if (!r) return; dlg.close(); r.run?.(); }
/* Enter: hesap → kopyala, kısayol/adres/motor → yeni sekme, Sayfada → seçili (yoksa ilk) sonuç */
function run() {
  const raw = inp.value.trim(), c = calc(raw), sh = shortcut(raw);
  if (c !== null) { navigator.clipboard?.writeText(String(c)).catch(() => {}); inp.value = `${raw.replace(/^!hesap\s*/i, '')} = ${c}`; render(); return; }
  if (sh) return go(sh.url + encodeURIComponent(sh.q));
  if (isUrl(raw)) return go(/^https?:/i.test(raw) ? raw : 'https://' + raw);
  if (!isLocal(scope)) { if (raw) go(scope + encodeURIComponent(raw)); return; }
  pick(sel >= 0 ? sel : 0);
}
function setScope(s) {
  scope = s; try { localStorage.setItem(EK, s); } catch {}
  [...$('#spPills').children].forEach((b) => { b.classList.toggle('is-active', b.dataset.s === s); b.setAttribute('aria-selected', b.dataset.s === s); });
  sel = -1; render();
}
$('#spPills').replaceChildren(...SCOPES.map(([k, l]) => el('button', { type: 'button', className: 'spPill', role: 'tab', 'data-s': k, textContent: l, onclick: () => { setScope(k); inp.focus(); } })));
/* Hap ve çip satırları: fareyle sürükleyerek ya da tekerlekle yatay kaydırılır (Saved ile aynı) */
for (const row of [$('#spPills'), chips]) {
  row.addEventListener('wheel', (e) => { const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (d && row.scrollWidth > row.clientWidth) { e.preventDefault(); row.scrollLeft += d; } }, { passive: false });
  let x0 = 0, l0 = 0, down = false, moved = false;
  row.addEventListener('mousedown', (e) => { if (e.button) return; down = true; moved = false; x0 = e.pageX; l0 = row.scrollLeft; });
  addEventListener('mousemove', (e) => { if (!down) return; const dx = e.pageX - x0; if (Math.abs(dx) > 4) { moved = true; row.scrollLeft = l0 - dx; } });
  addEventListener('mouseup', () => { if (down && moved) addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true }); down = false; });
}
inp.addEventListener('input', () => { sel = -1; render(); });
inp.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) { sel = (sel + 1) % results.length; mark(); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (results.length) { sel = sel <= 0 ? results.length - 1 : sel - 1; mark(); } }
  else if (e.key === 'Enter') { e.preventDefault(); run(); }
  else if (e.key === 'Tab' && !e.shiftKey && !inp.value) { e.preventDefault(); const i = SCOPES.findIndex(([k]) => k === scope); setScope(SCOPES[(i + 1) % SCOPES.length][0]); }
});
$('#spClr').onclick = () => { inp.value = ''; sel = -1; render(); inp.focus(); };
$('#spGo').onclick = run;
$('#spClose').onclick = () => dlg.close();
dlg.addEventListener('click', (e) => { if (e.target.isConnected && !e.target.closest('.spBar, .spPills, .spBanner, .spItem, .spHead, .fsBar')) dlg.close(); });
dlg.addEventListener('close', () => { document.body.style.overflow = ''; });
async function open(q) {
  if (!A()) return; A().closeMenu?.();
  try { data = await A().searchData(); } catch { data = { notebooks: A().notebooks(), sources: [], notes: [] }; }
  if (typeof q === 'string') inp.value = q; else inp.value = '';
  sel = -1; setScope(scope);
  if (!dlg.open) dlg.showModal(); setTimeout(() => { inp.focus(); inp.select(); }, 50);
}
window.defterSearch = { open, close: () => dlg.close() };
document.addEventListener('keydown', (e) => {
  const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dlg.open ? dlg.close() : open(); }
  else if (e.key === '/' && !typing && !dlg.open && !document.querySelector('dialog[open]')) { e.preventDefault(); open(); }
});
