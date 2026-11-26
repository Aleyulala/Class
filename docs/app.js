// Defter — tarayıcıda çalışan, kaynaklarla sohbet eden yerel yapay zekâ arayüzü.
// Model: wllama (llama.cpp'nin WASM/WebGPU sürümü). Hiçbir veri sunucuya gönderilmez.

import { TYPES, parseJson, normalize, demo } from './rich.js';
import { renderOutput } from './viewers.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (t, props = {}, ...kids) => { const e = Object.assign(document.createElement(t), props); kids.flat().forEach((k) => e.append(k)); return e; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const params = new URLSearchParams(location.search);

/* ---------------- Simgeler, açılır menü, tema ---------------- */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const IC = {
  back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'), search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'), plus: svg('<path d="M12 5v14M5 12h14"/>'),
  share: svg('<path d="M12 16V4M7 9l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/>'), more: svg('<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  caret: svg('<path d="M6 9l6 6 6-6"/>', 'width="16" height="16"'), sort: svg('<path d="M4 7h16M7 12h10M10 17h4"/>'), close: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  layers: svg('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'), tune: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', 'width="18" height="18"'), up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  stop: svg('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>'), pin: svg('<path d="M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7"/>', 'width="18" height="18"'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>', 'width="18" height="18"'), check: svg('<path d="M5 12l5 5 9-10"/>', 'width="18" height="18"'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>', 'width="18" height="18"'), trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 'width="18" height="18"'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'width="18" height="18"'),
  moon: svg('<path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/>', 'width="18" height="18"'), auto: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', 'width="18" height="18"'),
  cpu: svg('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>', 'width="18" height="18"'),
  pdf: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', 'width="22" height="22" style="color:#ef4444"'), txt: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
};
document.querySelectorAll('[data-ic]').forEach((n) => (n.innerHTML = IC[n.dataset.ic] || ''));
function applyTheme(t) { const r = document.documentElement; if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme'); }
const getTheme = () => { try { return localStorage.getItem('defter-theme') || 'system'; } catch { return 'system'; } };
const setTheme = (t) => { try { localStorage.setItem('defter-theme', t); } catch {} applyTheme(t); };
applyTheme(getTheme());

let openMenu = null;
function closeMenu() { if (openMenu) { openMenu.el.remove(); openMenu.anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', openMenu.out, true); document.removeEventListener('keydown', openMenu.key, true); openMenu = null; } }
function showMenu(anchor, items, { align = 'right' } = {}) {
  const same = openMenu && openMenu.anchor === anchor; closeMenu(); if (same) return;
  const m = el('div', { className: 'menu', role: 'menu' });
  items.forEach((it) => {
    if (it === '-') { m.append(el('hr')); return; }
    const b = el('button', { type: 'button', role: 'menuitem', className: it.danger ? 'danger' : '' }, el('span', { className: 'mi', innerHTML: it.icon ? IC[it.icon] : '' }), el('span', { className: 'ml' }, it.label, it.sub ? el('small', { textContent: it.sub }) : ''), it.check ? el('span', { className: 'mc', innerHTML: IC.check }) : '');
    b.onclick = () => { closeMenu(); it.run(); }; m.append(b);
  });
  document.body.append(m);
  const r = anchor.getBoundingClientRect(); const w = m.offsetWidth;
  m.style.top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8) + 'px';
  m.style.left = Math.max(8, Math.min(align === 'right' ? r.right - w : r.left, innerWidth - w - 8)) + 'px';
  anchor.setAttribute('aria-expanded', 'true');
  const out = (e) => { if (!m.contains(e.target) && !anchor.contains(e.target)) closeMenu(); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); anchor.focus(); } };
  document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', key, true);
  openMenu = { el: m, anchor, out, key }; m.querySelector('button')?.focus();
}

/* ---------------- Depolama (IndexedDB) ---------------- */
const DB = (() => {
  let p;
  const open = () => (p ||= new Promise((res, rej) => {
    const r = indexedDB.open('defter', 3);
    r.onupgradeneeded = () => { const d = r.result; for (const n of ['sources', 'notes', 'notebooks', 'outputs']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'key' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (s, mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction(s, mode); const out = fn(t.objectStore(s)); t.oncomplete = () => res(out && 'result' in out ? out.result : undefined); t.onerror = () => rej(t.error); }); };
  return {
    all: (s) => tx(s, 'readonly', (st) => st.getAll()),
    put: (s, v) => tx(s, 'readwrite', (st) => st.put(v)),
    del: (s, k) => tx(s, 'readwrite', (st) => st.delete(k)),
    get: async (k) => { const r = await tx('kv', 'readonly', (st) => st.get(k)); return r ? r.value : undefined; },
    set: (k, value) => tx('kv', 'readwrite', (st) => st.put({ key: k, value })),
  };
})();

/* ---------------- Metin işleme / arama ---------------- */
const STOP = new Set('ve veya ile için bir bu şu o da de mi mı mu mü ne nasıl neden hangi gibi daha çok en ki ise ama fakat ya the of and to in is a an'.split(' '));
const norm = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = (s) => norm(s).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 1 && !STOP.has(t)).map((t) => t.slice(0, 5)); // Türkçe ekler için ön ek eşleşmesi

function chunkText(text, max = 900) {
  const paras = text.replace(/\r/g, '').split(/\n{2,}/).map((p) => p.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
  const out = []; let cur = '';
  const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ''; };
  for (const p of paras) {
    if (p.length > max) { push(); const sents = p.split(/(?<=[.!?…])\s+/); for (const s of sents) { if ((cur + ' ' + s).length > max) push(); cur += (cur ? ' ' : '') + s; } push(); continue; }
    if ((cur + '\n\n' + p).length > max) push();
    cur += (cur ? '\n\n' : '') + p;
  }
  push();
  return out;
}

function search(query, sources, k = 6) {
  const chunks = [];
  for (const s of sources) chunkText(s.text).forEach((t, i) => chunks.push({ src: s, i, text: t, tf: null }));
  const qt = [...new Set(tokens(query))];
  if (!chunks.length) return [];
  const N = chunks.length; let avg = 0;
  chunks.forEach((c) => { const tk = tokens(c.text); c.len = tk.length; avg += c.len; const tf = new Map(); tk.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1)); c.tf = tf; });
  avg /= N || 1;
  const df = new Map(); qt.forEach((t) => df.set(t, chunks.reduce((n, c) => n + (c.tf.has(t) ? 1 : 0), 0)));
  const k1 = 1.4, b = 0.75;
  chunks.forEach((c) => { c.score = qt.reduce((sc, t) => { const f = c.tf.get(t) || 0; if (!f) return sc; const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5)); return sc + idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * c.len) / avg))); }, 0); });
  let ranked = chunks.filter((c) => c.score > 0).sort((a, b2) => b2.score - a.score).slice(0, k);
  if (!ranked.length) ranked = chunks.slice(0, Math.min(k, 3)); // eşleşme yoksa kaynakların başı
  return ranked;
}

function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function md(text) {
  const lines = esc(text).split('\n'); let html = '', list = null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[(\d{1,2})\]/g, '<span class="cite-chip" role="button" tabindex="0" data-n="$1" title="Kaynağı göster">$1</span>');
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd(); let m;
    if ((m = l.match(/^\s*#{1,4}\s+(.*)/))) { close(); html += `<h4>${inline(m[1])}</h4>`; }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*(\d+)[.)]\s+(.*)/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[2])}</li>`; }
    else if (!l.trim()) close();
    else { close(); html += `<p>${inline(l)}</p>`; }
  }
  close(); return html;
}

/* ---------------- Dosya okuma ---------------- */
async function readPdf(file) {
  const pdfjs = await import('./vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', location.href).href;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    out += tc.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n') + '\n\n';
  }
  return out;
}
async function readFile(file) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return readPdf(file);
  const t = await file.text();
  if (/\.html?$/i.test(file.name)) { const d = new DOMParser().parseFromString(t, 'text/html'); d.querySelectorAll('script,style,nav,footer').forEach((n) => n.remove()); return d.body.textContent.replace(/\n{3,}/g, '\n\n'); }
  return t;
}

/* ---------------- Model motoru ---------------- */
const PRESETS = [
  { id: 'q15', name: 'Qwen2.5 1.5B', note: '≈1 GB · en hızlı, basit işler', repo: 'Qwen/Qwen2.5-1.5B-Instruct-GGUF', file: 'qwen2.5-1.5b-instruct-q4_k_m.gguf' },
  { id: 'l3', name: 'Llama 3.2 3B', note: '≈2 GB · hızlı ve dengeli', repo: 'bartowski/Llama-3.2-3B-Instruct-GGUF', file: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf' },
  { id: 'q3', name: 'Qwen2.5 3B', note: '≈2 GB · Türkçe için iyi bir başlangıç', repo: 'Qwen/Qwen2.5-3B-Instruct-GGUF', file: 'qwen2.5-3b-instruct-q4_k_m.gguf' },
  { id: 'q7', name: 'Qwen2.5 7B', note: '≈4.7 GB · en akıllısı, 8 GB ekran kartı ister', repo: 'Qwen/Qwen2.5-7B-Instruct-GGUF', file: 'qwen2.5-7b-instruct-q4_k_m-00001-of-00002.gguf' },
];
const engine = { kind: 'none', wllama: null, label: '', nctx: 4096 };

async function getWllama() {
  if (engine.wllama) return engine.wllama;
  const mod = await import('./vendor/wllama/index.js');
  engine.wllama = new mod.Wllama({ default: new URL('./vendor/wllama/wllama.wasm', location.href).href }, mod.LoggerWithoutDebug ? { logger: mod.LoggerWithoutDebug } : {});
  return engine.wllama;
}

async function chatStream(messages, { maxTokens = 700, temperature = 0.3, signal, onToken, demo, responseFormat }) {
  if (engine.kind === 'demo') {
    const text = demo || 'Demo kipi: model yüklü değil.';
    for (let i = 0; i < text.length; i += 6) { if (signal?.aborted) break; onToken(text.slice(i, i + 6)); await new Promise((r) => setTimeout(r, 12)); }
    return;
  }
  const stream = await engine.wllama.createChatCompletion({ messages, stream: true, max_tokens: maxTokens, temperature, abortSignal: signal, ...(responseFormat ? { response_format: responseFormat } : {}) });
  for await (const chunk of stream) { const d = chunk?.choices?.[0]?.delta?.content; if (d) onToken(d); if (signal?.aborted) break; }
}

/* ---------------- Durum ---------------- */
let notebooks = [], nb = null, sources = [], notes = [], outputs = [], chat = [], busy = false, abortCtl = null;
const enabledSources = () => sources.filter((s) => s.enabled !== false);
const budgetChars = (reserve = 0) => Math.max(1500, Math.round((engine.nctx - 900) * 2.4) - reserve);

/* ---------------- Görünüm ---------------- */
function renderSources() {
  const ul = $('#srcList'); ul.replaceChildren();
  sources.forEach((s) => {
    const cb = el('input', { type: 'checkbox', className: 'chk', checked: s.enabled !== false, ariaLabel: `${s.title} kaynağını kullan` });
    cb.onchange = async () => { s.enabled = cb.checked; await DB.put('sources', s); renderSources(); };
    const del = el('button', { className: 'x', title: 'Kaldır', ariaLabel: `${s.title} kaynağını kaldır`, innerHTML: IC.close.replace('width="22" height="22"', 'width="16" height="16"') });
    del.onclick = async () => { await DB.del('sources', s.id); sources = sources.filter((x) => x.id !== s.id); renderSources(); touchNb(); };
    ul.append(el('li', {}, el('span', { className: 'ki', innerHTML: s.kind === 'PDF' ? IC.pdf : IC.txt }), el('div', { className: 't' }, el('b', { textContent: s.title, title: s.title }), el('small', { textContent: `${s.kind} · ${(s.text.length / 1000).toFixed(1)}k karakter` })), del, cb));
  });
  const on = enabledSources().length;
  $('#srcCount').textContent = `${sources.length} kaynak · ${on} seçili`;
  $('#srcHint').hidden = sources.length > 0;
  $('#selAll').checked = sources.length > 0 && on === sources.length;
  $('#srcBadgeN').textContent = on; $('#srcBadge').classList.toggle('empty', !on);
  $('#q').placeholder = on ? 'Soru sorun veya içerik oluşturun' : 'Bir şey sor (kaynak seçili değil, normal sohbet)…';
}
function renderNotes() {
  const ul = $('#noteList'); ul.replaceChildren();
  notes.slice().sort((a, b) => b.addedAt - a.addedAt).forEach((n) => {
    const copy = el('button', { className: 'btn sm', textContent: 'Kopyala' }); copy.onclick = () => navigator.clipboard?.writeText(n.text);
    const del = el('button', { className: 'btn sm', textContent: 'Sil' }); del.onclick = async () => { await DB.del('notes', n.id); notes = notes.filter((x) => x.id !== n.id); renderNotes(); };
    ul.append(el('li', {}, el('b', { textContent: n.title }), el('div', { className: 'nt', textContent: n.text }), el('div', { className: 'na' }, copy, del)));
  });
  $('#noteHint').hidden = notes.length > 0;
}
function renderChat() {
  const box = $('#msgs'); box.replaceChildren();
  if (!chat.length) box.append(el('div', { className: 'welcome', innerHTML: '<h3>Kaynaklarınla sohbet et</h3><p>Soldan PDF/metin ekle, bir model seç, sonra soru sor ya da sağdaki Stüdyo düğmeleriyle özet ve çalışma rehberi çıkar.</p>' }));
  chat.forEach((m, i) => box.append(msgNode(m, i)));
  box.scrollTop = box.scrollHeight;
}
function msgNode(m, i) {
  const d = el('div', { className: `msg ${m.role === 'user' ? 'me' : ''} ${m.err ? 'err' : ''}` });
  if (m.role === 'user') d.textContent = m.text; else d.innerHTML = md(m.text);
  if (m.role !== 'user' && !m.err && m.text && !m.live) {
    const save = el('button', { className: 'ib sm', title: 'Nota kaydet', ariaLabel: 'Nota kaydet', innerHTML: IC.pin });
    save.onclick = () => saveNote(m.title || (chat[i - 1]?.text || 'Not').slice(0, 60), m.text);
    const copy = el('button', { className: 'ib sm', title: 'Kopyala', ariaLabel: 'Kopyala', innerHTML: IC.copy });
    copy.onclick = () => { navigator.clipboard?.writeText(m.text).then(() => { copy.innerHTML = IC.check; setTimeout(() => (copy.innerHTML = IC.copy), 1200); }).catch(() => {}); };
    d.append(el('div', { className: 'acts' }, save, copy));
  }
  if (m.role !== 'user' && m.at && !m.live) d.append(el('div', { className: 'stamp', textContent: `${new Date(m.at).toDateString() === new Date().toDateString() ? 'Bugün' : fmtDate(m.at)} • ${new Date(m.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` }));
  return d;
}
async function saveNote(title, text) { const n = { id: uid(), nbId: nb.id, title, text, addedAt: Date.now() }; notes.push(n); await DB.put('notes', n); renderNotes(); touchNb(); toast('Nota kaydedildi'); }
function toast(t) { $('#ctxInfo').textContent = t; }
function setModelUi(state, label) {
  $('#modelDot').className = `dot ${state}`; $('#modelLabel').textContent = label;
}

/* ---------------- Üretim akışı ---------------- */
function needModel() {
  if (engine.kind === 'wllama' || engine.kind === 'demo') return false;
  $('#modelDlg').showModal(); return true;
}
async function persistChat() { if (nb) { await DB.set('chat:' + nb.id, chat.filter((m) => !m.live).slice(-60)); touchNb(); } }

async function run({ userText, shownText, messages, cites, title, maxTokens, demo }) {
  if (busy) return;
  busy = true; abortCtl = new AbortController();
  $('#send').hidden = true; $('#stop').hidden = false;
  chat.push({ role: 'user', text: shownText ?? userText });
  const reply = { role: 'assistant', text: '', live: true, cites, title, at: Date.now() };
  chat.push(reply); renderChat();
  const node = () => $('#msgs').lastElementChild;
  try {
    await chatStream(messages, { maxTokens, signal: abortCtl.signal, demo, onToken: (t) => { reply.text += t; node().innerHTML = md(reply.text); $('#msgs').scrollTop = $('#msgs').scrollHeight; } });
    if (!reply.text.trim()) reply.text = '(Boş cevap geldi. Soruyu değiştirmeyi dene.)';
  } catch (e) { reply.err = true; reply.text = `Hata: ${e.message || e}`; }
  reply.live = false; busy = false; abortCtl = null;
  $('#send').hidden = false; $('#stop').hidden = true;
  renderChat(); persistChat();
}

function buildChatMessages(question) {
  const on = enabledSources(); const hist = chat.filter((m) => !m.err).slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 1200) }));
  if (!on.length) return { messages: [{ role: 'system', content: 'Yardımsever bir asistansın. Türkçe, kısa ve net cevap ver.' }, ...hist, { role: 'user', content: question }], cites: [] };
  const histChars = hist.reduce((n, h) => n + h.content.length, 0);
  let hits = search(question, on, 8); let used = 0; const picked = [];
  for (const h of hits) { if (used + h.text.length > budgetChars(histChars + question.length + 500)) break; picked.push(h); used += h.text.length; }
  const cites = picked.map((h, i) => ({ n: i + 1, title: h.src.title, text: h.text }));
  const ctx = cites.map((c) => `[${c.n}] (${c.title})\n${c.text}`).join('\n\n');
  const sys = 'Sen kullanıcının kaynaklarıyla çalışan bir araştırma yardımcısısın. Yalnızca aşağıdaki kaynak parçalarına dayanarak Türkçe cevap ver. Kullandığın her bilginin sonuna parça numarasını köşeli parantezle yaz, örneğin [1] veya [2][3]. Kaynaklarda cevap yoksa bunu açıkça söyle, uydurma.\n\nKAYNAK PARÇALARI:\n' + ctx;
  return { messages: [{ role: 'system', content: sys }, ...hist, { role: 'user', content: question }], cites };
}
function demoAnswer(cites) {
  if (!cites.length) return 'Demo kipi: model yüklü değil. Gerçek cevap için üstten bir model yükle.';
  return 'Demo kipi — gerçek model yüklü değil. Sorunla en çok eşleşen kaynak parçaları:\n\n' + cites.slice(0, 3).map((c) => `- ${c.text.replace(/\s+/g, ' ').slice(0, 220)}… [${c.n}]`).join('\n');
}

async function ask(question) {
  const { messages, cites } = buildChatMessages(question);
  $('#ctxInfo').textContent = cites.length ? `${cites.length} kaynak parçası kullanıldı · bağlam ${engine.nctx}` : '';
  await run({ userText: question, messages, cites, maxTokens: 700, demo: demoAnswer(cites) });
}

const STUDIO = [
  { id: 'ozet', label: 'Özet', sub: 'Kısa genel bakış', p: 'Kaynakların kısa ve anlaşılır bir özetini yaz. Önce 2-3 cümlelik genel bakış, sonra en önemli noktalar madde madde.' },
  { id: 'fikir', label: 'Ana fikirler', sub: 'Madde madde', p: 'Kaynaklardaki ana fikirleri ve önemli bulguları numaralı bir liste olarak çıkar. Her madde tek cümle olsun.' },
  { id: 'sss', label: 'SSS', sub: 'Sık sorulan sorular', p: 'Bu kaynaklardan 6 adet sık sorulan soru ve kısa cevaplarını üret. Biçim: "S:" ve "C:".' },
  { id: 'rehber', label: 'Çalışma rehberi', sub: 'Kavramlar + sorular', p: 'Bir çalışma rehberi hazırla: (1) Anahtar kavramlar ve kısa tanımları, (2) Tekrar için 5 kısa cevaplı soru, (3) Düşündürücü 2 soru.' },
];
async function studio(t) {
  if (busy || needModel()) return;
  const on = enabledSources();
  if (!on.length) { toast('Önce en az bir kaynak ekle ve seç.'); setTab('sources'); return; }
  const cap = budgetChars(400); const per = Math.floor(cap / on.length);
  const body = on.map((s) => `### ${s.title}\n${s.text.slice(0, per)}`).join('\n\n');
  const cut = on.some((s) => s.text.length > per);
  const sys = `Sen kullanıcının kaynaklarıyla çalışan bir araştırma yardımcısısın. Yalnızca verilen kaynaklara dayan, Türkçe yaz, uydurma.\n\nKAYNAKLAR:\n${body}`;
  setTab('chat');
  $('#ctxInfo').textContent = cut ? 'Kaynaklar uzun olduğu için her biri baştan kısaltıldı.' : '';
  await run({ userText: t.label, shownText: `${t.label} (Stüdyo)`, messages: [{ role: 'system', content: sys }, { role: 'user', content: t.p }], cites: [], title: `${t.label} — ${on.map((s) => s.title).join(', ').slice(0, 50)}`, maxTokens: 900, demo: `Demo kipi — "${t.label}" çıktısı gerçek model ile üretilir.\n\n` + on.map((s) => `- ${s.title}: ${s.text.replace(/\s+/g, ' ').slice(0, 140)}…`).join('\n') });
}

/* ---------------- Atıf ---------------- */
document.addEventListener('click', (e) => { const c = e.target.closest('.cite-chip'); if (c) showCite(c); });
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('cite-chip')) { e.preventDefault(); showCite(e.target); } });
function showCite(c) {
  const idx = [...$('#msgs').children].indexOf(c.closest('.msg')); const m = chat[idx]; const ci = m?.cites?.find((x) => x.n === +c.dataset.n);
  if (!ci) return; $('#citeTitle').textContent = `[${ci.n}] ${ci.title}`; $('#citeBody').textContent = ci.text; $('#citeDlg').showModal();
}

/* ---------------- Kaynak ekleme ---------------- */
async function addSource(title, text, kind) {
  text = text.replace(/\u0000/g, '').trim(); if (!text) { toast(`"${title}" içinde okunabilir metin bulunamadı.`); return; }
  if (!nb) return; const s = { id: uid(), nbId: nb.id, title, text, kind, enabled: true, addedAt: Date.now() }; sources.push(s); await DB.put('sources', s); renderSources(); touchNb();
}
$('#addFile').onclick = () => $('#srcDlg').showModal();
async function ingestFiles(files) {
  for (const f of files) { try { toast(`${f.name} okunuyor…`); await addSource(f.name, await readFile(f), /\.pdf$/i.test(f.name) ? 'PDF' : 'Dosya'); toast(''); } catch (err) { toast(`${f.name} okunamadı: ${err.message || err}`); } }
}
$('#fileInput').onchange = async (e) => { const files = [...e.target.files]; e.target.value = ''; await ingestFiles(files); };
let noteMode = false;
const openText = (note) => { noteMode = note; $('#textHead').textContent = note ? 'Not oluştur' : 'Metin yapıştır'; $('#textSave').textContent = note ? 'Kaydet' : 'Ekle'; $('#textTitle').value = ''; $('#textBody').value = ''; $('#textDlg').showModal(); };
$('#addText').onclick = () => openText(false);
$('#addNote').onclick = () => openText(true);
$('#textSave').onclick = async () => { const t = $('#textTitle').value.trim(), b = $('#textBody').value.trim(); if (noteMode) { if (b) await saveNote(t || b.slice(0, 40), b); } else await addSource(t || 'Yapıştırılan metin', $('#textBody').value, 'Metin'); $('#textDlg').close(); };
$('#selAll').onchange = async (e) => { for (const s of sources) { s.enabled = e.target.checked; await DB.put('sources', s); } renderSources(); };

/* ---------------- Model penceresi ---------------- */
const presetBox = $('#presets');
PRESETS.forEach((p, i) => presetBox.append(el('label', { className: 'preset' }, el('input', { type: 'radio', name: 'preset', value: p.id, checked: i === 1 }), el('div', {}, el('b', { textContent: p.name }), el('small', { textContent: p.note })))));
$('#tuneBtn').onclick = () => $('#modelDlg').showModal();
$('#dlgCancel').onclick = (e) => { e.preventDefault(); $('#modelDlg').close(); };
$('#demoBtn').onclick = () => { engine.kind = 'demo'; engine.label = 'Demo'; setModelUi('ok', 'Demo kipi (model yok)'); $('#modelDlg').close(); };
$('#loadBtn').onclick = async () => {
  const btn = $('#loadBtn'); const nctx = +$('#nctx').value; const useGpu = $('#useGpu').checked;
  const file = $('#ggufFile').files[0]; const url = $('#hfUrl').value.trim(); const repo = $('#hfRepo').value.trim(); const hfile = $('#hfFile').value.trim();
  const preset = PRESETS.find((p) => p.id === document.querySelector('input[name=preset]:checked')?.value);
  btn.disabled = true; $('#dlBar').hidden = false; $('#dlFill').style.width = '0%'; $('#dlText').textContent = 'Hazırlanıyor…'; setModelUi('busy', 'Model yükleniyor…');
  try {
    try { await navigator.storage?.persist?.(); } catch {}
    if (engine.kind === 'wllama' && engine.wllama) { try { await engine.wllama.exit(); } catch {} engine.wllama = null; engine.kind = 'none'; }
    const w = await getWllama();
    const opts = { n_ctx: nctx, ...(useGpu ? {} : { n_gpu_layers: 0 }), progressCallback: ({ loaded, total }) => { const pct = total ? Math.round((loaded / total) * 100) : 0; $('#dlFill').style.width = pct + '%'; $('#dlText').textContent = `İndiriliyor… %${pct} (${(loaded / 1e9).toFixed(2)} / ${(total / 1e9).toFixed(2)} GB)`; } };
    let label;
    if (file) { await w.loadModel([file], opts); label = file.name; }
    else if (url) { await w.loadModelFromUrl(url, opts); label = url.split('/').pop(); }
    else if (repo && hfile) { await w.loadModelFromHF({ repo, file: hfile }, opts); label = `${repo}/${hfile}`; }
    else { await w.loadModelFromHF({ repo: preset.repo, file: preset.file }, opts); label = preset.name; }
    engine.kind = 'wllama'; engine.nctx = nctx; engine.label = label; setModelUi('ok', label); $('#dlText').textContent = 'Hazır.'; $('#modelDlg').close();
    DB.set('lastModel', { label, nctx, useGpu, preset: preset?.id, repo, file: hfile, url });
  } catch (e) { setModelUi(engine.kind === 'wllama' ? 'ok' : '', engine.kind === 'wllama' ? engine.label : 'Model yüklenmedi'); $('#dlText').textContent = `Yüklenemedi: ${e.message || e}`; }
  finally { btn.disabled = false; }
};

/* ---------------- Sohbet formu / sekmeler / dışa aktarım ---------------- */
const q = $('#q');
q.addEventListener('input', () => { q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 140) + 'px'; });
q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#composer').requestSubmit(); } });
$('#composer').onsubmit = (e) => { e.preventDefault(); const t = q.value.trim(); if (!t || busy || needModel()) return; q.value = ''; q.style.height = 'auto'; ask(t); };
$('#stop').onclick = () => abortCtl?.abort();
$('#clearChat').onclick = async () => { if (busy) return; chat = []; await DB.set('chat:' + nb.id, []); renderChat(); };
function download(name, text) { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/markdown' })), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('#expChat').onclick = () => download('defter-sohbet.md', '# Defter sohbeti\n\n' + chat.map((m) => (m.role === 'user' ? `**Sen:** ${m.text}` : `**Defter:**\n\n${m.text}`)).join('\n\n---\n\n') + '\n');
$('#expNotes').onclick = () => download('defter-notlar.md', '# Defter notları\n\n' + notes.slice().sort((a, b) => a.addedAt - b.addedAt).map((n) => `## ${n.title}\n\n${n.text}`).join('\n\n---\n\n') + '\n');
function setTab(t) { $('#cols').dataset.tab = t; document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); }
document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
Object.entries(TYPES).forEach(([k, T]) => { const b = el('button', { className: 'btn tile' }, el('span', { className: 'tIc', textContent: T.emoji }), el('b', { textContent: T.label }), el('small', { textContent: T.sub })); b.onclick = () => makeRich(k); $('#studioBtns').append(b); });
STUDIO.forEach((t) => { const b = el('button', { className: 'btn tile' }, el('span', { className: 'tIc', textContent: '📝' }), el('b', { textContent: t.label }), el('small', { textContent: t.sub })); b.onclick = () => studio(t); $('#studioBtns').append(b); });

/* ---------------- Not defterleri (ana ekran) ---------------- */
const ICONS = ['📘', '🔬', '📚', '🧪', '🌍', '💡', '📊', '🎓'];
const home = { filter: 'all', sort: 'recent', query: '', more: false };
async function touchNb() { if (!nb) return; nb.updatedAt = Date.now(); await DB.put('notebooks', nb); }
function fmtDate(t) { return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
const SORTS = { recent: 'Son kullanılan', name: 'Ada göre (A–Z)', created: 'Oluşturulma tarihi' };
const FILTERS = { all: 'Tümü', pinned: 'Sabitlenenler' };

function visibleNotebooks() {
  let list = notebooks.filter((n) => (home.filter === 'pinned' ? n.pinned : true) && (!home.query || n.title.toLocaleLowerCase('tr').includes(home.query.toLocaleLowerCase('tr'))));
  const by = { recent: (a, b) => b.updatedAt - a.updatedAt, name: (a, b) => a.title.localeCompare(b.title, 'tr'), created: (a, b) => b.createdAt - a.createdAt }[home.sort];
  return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || by(a, b));
}
async function renderHome() {
  const grid = $('#nbGrid'); grid.replaceChildren();
  $('#homeTitle').textContent = home.filter === 'pinned' ? 'Sabitlenen not defterleri' : home.query ? `“${home.query}” için sonuçlar` : 'Son kullanılan not defterleri';
  $('#filterLabel').textContent = FILTERS[home.filter];
  const add = el('button', { className: 'nbNew', type: 'button', ariaLabel: 'Yeni not defteri oluştur' }, el('span', { className: 'nbPlus', innerHTML: IC.plus }), el('b', { textContent: 'Yeni not defteri' }));
  add.onclick = createNb; grid.append(add);
  const counts = {}; (await DB.all('sources')).forEach((x) => (counts[x.nbId] = (counts[x.nbId] || 0) + 1));
  const list = visibleNotebooks(); const LIMIT = 10; const shown = home.more ? list : list.slice(0, LIMIT);
  shown.forEach((n) => {
    const more = el('button', { className: 'nbMore', type: 'button', title: 'Seçenekler', ariaLabel: `${n.title} seçenekleri`, ariaHaspopup: 'menu', innerHTML: IC.more });
    more.onclick = (e) => { e.stopPropagation(); showMenu(more, [
      { icon: 'edit', label: 'Başlığı düzenle', run: () => renameNb(n) },
      { icon: 'pin', label: n.pinned ? 'Sabitlemeyi kaldır' : 'En üste sabitle', run: async () => { n.pinned = !n.pinned; await DB.put('notebooks', n); renderHome(); } },
      '-', { icon: 'trash', label: 'Sil', danger: true, run: () => deleteNb(n) }]); };
    const card = el('div', { className: 'nbCard', role: 'button', tabIndex: 0, ariaLabel: `${n.title} not defterini aç` },
      el('span', { className: 'nbIco', textContent: n.icon || '📘' }),
      el('div', { className: 'nbT' }, el('b', { textContent: n.title }), el('small', { textContent: `${n.pinned ? '📌 ' : ''}${counts[n.id] || 0} kaynak · ${fmtDate(n.updatedAt)}` })), more);
    card.onclick = () => openNb(n.id);
    card.onkeydown = (e) => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openNb(n.id); } };
    grid.append(card);
  });
  if (!home.more && list.length > LIMIT) { const mb = el('button', { className: 'moreRow', type: 'button' }, 'Daha fazla göster ', el('span', { innerHTML: IC.caret.replace('<svg', '<svg style="transform:rotate(-90deg)"') })); mb.onclick = () => { home.more = true; renderHome(); }; grid.append(mb); }
  $('#nbEmpty').hidden = list.length > 0 || notebooks.length === 0 ? true : false;
  if (!list.length && notebooks.length) { $('#nbEmpty').textContent = home.query ? 'Eşleşen not defteri bulunamadı.' : 'Sabitlenmiş not defteri yok.'; $('#nbEmpty').hidden = false; }
  else if (!notebooks.length) { $('#nbEmpty').textContent = 'Henüz not defterin yok. “Yeni not defteri” ile başla.'; $('#nbEmpty').hidden = false; }
}
async function createNb() {
  const n = { id: uid(), title: 'Adsız not defteri', icon: ICONS[notebooks.length % ICONS.length], createdAt: Date.now(), updatedAt: Date.now() };
  notebooks.push(n); await DB.put('notebooks', n); await openNb(n.id); $('#srcDlg').showModal();
}
async function renameNb(n) {
  const t = prompt('Not defteri başlığı', n.title); if (t === null) return;
  n.title = t.trim() || 'Adsız not defteri'; await DB.put('notebooks', n); if (nb && nb.id === n.id) { $('#nbTitle').value = n.title; document.title = `${n.title} — Defter`; } if (!nb) renderHome();
}
async function deleteNb(n) {
  if (!confirm(`"${n.title}" not defteri, kaynakları ve notlarıyla birlikte silinsin mi?`)) return;
  for (const x of (await DB.all('sources')).filter((x) => x.nbId === n.id)) await DB.del('sources', x.id);
  for (const x of (await DB.all('notes')).filter((x) => x.nbId === n.id)) await DB.del('notes', x.id);
  for (const x of (await DB.all('outputs')).filter((x) => x.nbId === n.id)) await DB.del('outputs', x.id);
  await DB.del('notebooks', n.id); await DB.set('chat:' + n.id, []); notebooks = notebooks.filter((x) => x.id !== n.id);
  if (nb && nb.id === n.id) { busy = false; goHome(); } else renderHome();
}
function setView(v) {
  const inNb = v === 'nb'; document.body.classList.toggle('in-nb', inNb);
  $('#home').hidden = inNb; $('#cols').hidden = !inNb; $('#tabs').hidden = !inNb;
  $('#backBtn').hidden = !inNb; $('#nbTitle').hidden = !inNb; $('#newNbBtn').hidden = !inNb; $('#shareBtn').hidden = !inNb; $('#moreBtn').hidden = !inNb;
  $('#filterBtn').hidden = inNb; $('#searchBtn').hidden = inNb; if (inNb) $('#searchBar').hidden = true;
}
async function openNb(id) {
  const n = notebooks.find((x) => x.id === id); if (!n) return goHome();
  if (busy) return; nb = n; closeMenu();
  [sources, notes, outputs, chat] = await Promise.all([DB.all('sources').then((a) => a.filter((x) => x.nbId === id).sort((a, b) => a.addedAt - b.addedAt)), DB.all('notes').then((a) => a.filter((x) => x.nbId === id)), DB.all('outputs').then((a) => a.filter((x) => x.nbId === id)), DB.get('chat:' + id).then((c) => c || [])]);
  setView('nb'); $('#nbTitle').value = n.title; document.title = `${n.title} — Defter`;
  if (location.hash !== '#nb-' + id) history.pushState(null, '', '#nb-' + id);
  setTab('chat'); renderSources(); renderNotes(); renderOutputs(); renderChat();
}
function goHome() {
  if (busy) return; nb = null; sources = []; notes = []; outputs = []; chat = []; closeMenu();
  setView('home'); document.title = 'Defter — Tarayıcıda Yerel Yapay Zekâ';
  if (location.hash) history.pushState(null, '', location.pathname + location.search);
  renderHome();
}
$('#backBtn').onclick = goHome;
$('#homeLink').onclick = (e) => { e.preventDefault(); goHome(); };
$('#newPill').onclick = createNb; $('#newNbBtn').onclick = createNb;
$('#nbTitle').onchange = async (e) => { if (!nb) return; nb.title = e.target.value.trim() || 'Adsız not defteri'; e.target.value = nb.title; document.title = `${nb.title} — Defter`; await touchNb(); };
$('#nbTitle').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
window.addEventListener('popstate', () => { const m = location.hash.match(/^#nb-(.+)$/); if (m) openNb(m[1]); else { busy = false; goHome(); } });

// üst çubuk menüleri
$('#filterBtn').onclick = () => showMenu($('#filterBtn'), Object.entries(FILTERS).map(([k, v]) => ({ label: v, check: home.filter === k, run: () => { home.filter = k; home.more = false; renderHome(); } })), { align: 'left' });
$('#sortBtn').onclick = () => showMenu($('#sortBtn'), Object.entries(SORTS).map(([k, v]) => ({ label: v, check: home.sort === k, run: () => { home.sort = k; renderHome(); } })));
$('#searchBtn').onclick = () => { $('#searchBar').hidden = false; $('#nbSearch').focus(); };
$('#searchClose').onclick = () => { $('#searchBar').hidden = true; $('#nbSearch').value = ''; home.query = ''; renderHome(); };
$('#nbSearch').oninput = (e) => { home.query = e.target.value.trim(); home.more = false; renderHome(); };
$('#nbSearch').onkeydown = (e) => { if (e.key === 'Escape') $('#searchClose').click(); };
$('#gearBtn').onclick = () => {
  const th = getTheme();
  showMenu($('#gearBtn'), [
    { icon: 'cpu', label: engine.kind === 'none' ? 'Model seç' : 'Modeli değiştir', sub: engine.kind === 'none' ? 'Henüz model yüklenmedi' : engine.label, run: () => $('#modelDlg').showModal() },
    '-',
    { icon: 'sun', label: 'Açık mod', check: th === 'light', run: () => setTheme('light') },
    { icon: 'moon', label: 'Koyu mod', check: th === 'dark', run: () => setTheme('dark') },
    { icon: 'auto', label: 'Cihaz', check: th === 'system', run: () => setTheme('system') },
    '-',
    { icon: 'tune', label: 'Klavye ve oyun kolu', sub: 'Kısayollar ve düğme eşleşmeleri', run: () => window.defterHelp?.() },
  ]);
};
$('#moreBtn').onclick = () => showMenu($('#moreBtn'), [
  { icon: 'edit', label: 'Başlığı düzenle', run: () => { $('#nbTitle').focus(); $('#nbTitle').select(); } },
  { icon: 'share', label: 'Notları indir (.md)', run: () => $('#expNotes').click() },
  { icon: 'share', label: 'Sohbeti indir (.md)', run: () => $('#expChat').click() },
  { icon: 'trash', label: 'Sohbeti temizle', run: () => $('#clearChat').click() },
  '-', { icon: 'trash', label: 'Not defterini sil', danger: true, run: () => nb && deleteNb(nb) },
]);
$('#shareBtn').onclick = () => $('#expChat').click();

// kaynak ekle penceresi
const drop = $('#drop');
drop.onclick = () => $('#fileInput').click();
drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#fileInput').click(); } };
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => ingestFiles([...e.dataTransfer.files]));
$('#dlgFile').onclick = () => $('#fileInput').click();
$('#dlgText').onclick = () => { $('#srcDlg').close(); $('#addText').click(); };

/* ---------------- Zengin Stüdyo çıktıları ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function showGen(on, text = '') { $('#genBar').hidden = !on; $('#genText').textContent = text; }
$('#genStop').onclick = () => abortCtl?.abort();

async function makeRich(type) {
  if (busy || needModel()) return;
  const on = enabledSources(); const T = TYPES[type];
  if (!on.length) { toast('Önce en az bir kaynak ekle ve seç.'); setTab('sources'); return; }
  busy = true; abortCtl = new AbortController(); showGen(true, `${T.label} hazırlanıyor…`);
  try {
    let data;
    if (engine.kind === 'demo') { await sleep(600); data = demo(type, on); }
    else {
      const cap = budgetChars(T.max * 2 + 600); const per = Math.floor(cap / on.length);
      const body = on.map((s) => `### ${s.title}\n${s.text.slice(0, per)}`).join('\n\n');
      const messages = [{ role: 'system', content: `Sen kullanıcının kaynaklarıyla çalışan bir araştırma yardımcısısın. Yalnızca verilen kaynaklara dayan, Türkçe yaz, uydurma. Yalnızca geçerli JSON döndür.\n\nKAYNAKLAR:\n${body}` }, { role: 'user', content: T.prompt }];
      let last = null;
      for (const rf of [{ type: 'json_schema', json_schema: { name: type, schema: T.schema, strict: true } }, { type: 'json_object' }, undefined]) {
        let text = '';
        try { await chatStream(messages, { maxTokens: T.max, temperature: 0.4, signal: abortCtl.signal, responseFormat: rf, onToken: (t) => { text += t; $('#genText').textContent = `${T.label} hazırlanıyor… ${text.length} karakter`; } }); data = parseJson(text); break; }
        catch (e) { if (abortCtl.signal.aborted) throw e; last = e; data = null; }
      }
      if (!data) throw last || new Error('Çıktı alınamadı');
    }
    const out = { id: uid(), nbId: nb.id, type, title: '', data: normalize(type, data), createdAt: Date.now() }; out.title = out.data.title;
    outputs.push(out); await DB.put('outputs', out); touchNb(); renderOutputs(); openOutput(out); toast('');
  } catch (e) { toast(abortCtl?.signal.aborted ? 'Üretim durduruldu.' : `${T.label} üretilemedi: ${e.message || e}. Tekrar dene ya da daha büyük bir model seç.`); }
  finally { busy = false; abortCtl = null; showGen(false); }
}

function renderOutputs() {
  const ul = $('#outList'); ul.replaceChildren();
  outputs.slice().sort((a, b) => b.createdAt - a.createdAt).forEach((o) => {
    const T = TYPES[o.type]; const del = el('button', { className: 'x', title: 'Sil', ariaLabel: `${o.title} çıktısını sil`, innerHTML: IC.close.replace('width="22" height="22"', 'width="16" height="16"') });
    del.onclick = async (e) => { e.stopPropagation(); await DB.del('outputs', o.id); outputs = outputs.filter((x) => x.id !== o.id); renderOutputs(); };
    const li = el('li', { className: 'outItem', tabIndex: 0, role: 'button' }, el('span', { className: 'tIc', textContent: T.emoji }), el('div', { className: 't' }, el('b', { textContent: o.title, title: o.title }), el('small', { textContent: `${T.label} · ${fmtDate(o.createdAt)}` })), del);
    li.onclick = () => openOutput(o); li.onkeydown = (e) => { if (e.target === li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openOutput(o); } };
    ul.append(li);
  });
  $('#outHint').hidden = outputs.length > 0;
}

let vwCleanup = null;
function openOutput(o) {
  const dlg = $('#vwDlg'); const actions = $('#vwActions'); actions.replaceChildren(); $('#vwBody').replaceChildren(); $('#vwTitle').textContent = `${TYPES[o.type].emoji} ${o.title}`;
  vwCleanup?.(); const r = renderOutput(o, actions); $('#vwBody').append(r.node); vwCleanup = r.cleanup || null;
  if (!dlg.open) dlg.showModal();
}
$('#vwClose').onclick = () => $('#vwDlg').close();
$('#vwDlg').addEventListener('close', () => { vwCleanup?.(); vwCleanup = null; });

/* ---------------- Başlangıç ---------------- */
(async () => {
  notebooks = await DB.all('notebooks');
  
  if (params.has('demo')) { engine.kind = 'demo'; setModelUi('ok', 'Demo kipi (model yok)'); }
  const m = location.hash.match(/^#nb-(.+)$/);
  if (m && notebooks.some((x) => x.id === m[1])) await openNb(m[1]); else { setView('home'); await renderHome(); }
  if (!crossOriginIsolated && !params.has('nocoi')) toast('Not: çok çekirdekli mod için sayfa bir kez yenilenebilir (service worker).');
  navigator.storage?.estimate?.().then((e) => { if (e?.quota) $('#dlText').textContent = `Tarayıcı depolama kotası: ≈${(e.quota / 1e9).toFixed(1)} GB`; });
})();
