// Class — tarayıcıda çalışan, kaynaklarla sohbet eden yerel yapay zekâ arayüzü.
// Motor: tarayıcıda wllama (WASM/WebGPU), kendi bilgisayarındaki yerel sunucu ya da seçtiğin OpenAI uyumlu API.
// Veriler bu cihazda saklanır; yalnızca seçtiğin motora/sunucuya gönderilir.

import { readDoc, toWav16k, DOC_RX, MEDIA_RX } from './extract.js';
import { TYPES, parseJson, normalize, demo } from './rich.js';
import { renderOutput } from './viewers.js';
import { card as mediaCard } from './player.js';
import { sheetize, phone } from './sheet.js';

const $ = (s, r = document) => r.querySelector(s);
/* Stüdyo simgeleri: Görsel / Ses şeridiyle aynı çizgi stili */
const sic = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SIC = {
  podcast: sic('<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2.5" y="14" width="5" height="7" rx="2"/><rect x="16.5" y="14" width="5" height="7" rx="2"/>'),
  map: sic('<circle cx="12" cy="12" r="2.6"/><circle cx="4.5" cy="5" r="2"/><circle cx="19.5" cy="5" r="2"/><circle cx="4.5" cy="19" r="2"/><circle cx="19.5" cy="19" r="2"/><path d="m6.2 6.4 3.9 3.8m7.7-3.8-3.9 3.8m-7.7 7.2 3.9-3.8m7.7 3.8-3.9-3.8"/>'),
  infographic: sic('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 16.5v-3M12 16.5v-9M16.5 16.5v-5.5"/>'),
  cards: sic('<rect x="3" y="7" width="13" height="14" rx="3"/><path d="M7 3.5h10.5A3.5 3.5 0 0 1 21 7v10.5"/>'),
  quiz: sic('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12.5 2.8 2.8L16.5 9"/>'),
  ozet: sic('<path d="M14 3H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  fikir: sic('<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  sss: sic('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .9-1 1.6v.4M12 17h.01"/>'),
  rehber: sic('<path d="M4 19V6a3 3 0 0 1 3-3h13v14H7a3 3 0 0 0-3 3 2 2 0 0 0 2 2h14"/><path d="M9 7.5h7M9 11h4.5"/>'),
  note: sic('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m14.5 7.5 3 3"/>'),
};
const NOTE_IC = { '📄': 'ozet', '💡': 'fikir', '❓': 'sss', '📚': 'rehber' };
const noteIc = (n) => SIC[NOTE_IC[n.icon]] || SIC.note;
const el = (t, props = {}, ...kids) => { const e = Object.assign(document.createElement(t), props); kids.flat().forEach((k) => e.append(k)); return e; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const params = new URLSearchParams(location.search);

/* ---------------- Simgeler, açılır menü, tema ---------------- */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const IC = {
  speak: svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/>'), refresh: svg('<path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4"/>'), star: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'), expand: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  menu: svg('<polyline points="2 17 7 12 2 7"/><path d="M8 5h14M12 12h10M8 19h14"/>'), install: svg('<path d="M12 3v12M7 10l5 5 5-5M5 19h14"/>'), win: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/>'), min: svg('<path d="M6 12h12"/>'), max: svg('<rect x="5" y="5" width="14" height="14" rx="2"/>'),
  back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'), search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'), plus: svg('<path d="M12 5v14M5 12h14"/>'), chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>'),
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
  smile: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"/>', 'width="16" height="16"'),
  reply: svg('<path d="M10 8 5 12.5l5 4.5"/><path d="M5 12.5h9a5 5 0 0 1 5 5V19"/>', 'width="16" height="16"'),
  clip: svg('<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7"/>', 'width="20" height="20"'),
  jump: svg('<path d="M7 17 17 7M9 7h8v8"/>', 'width="14" height="14"'),
  pdf: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', 'width="22" height="22" style="color:#ef4444"'), txt: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
};
document.querySelectorAll('[data-ic]').forEach((n) => (n.innerHTML = IC[n.dataset.ic] || ''));
function applyTheme(t) { const r = document.documentElement; if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme'); }
const getTheme = () => { try { return localStorage.getItem('defter-theme') || 'dark'; } catch { return 'dark'; } };
const setTheme = (t) => { try { localStorage.setItem('defter-theme', t); } catch {} applyTheme(t); };
applyTheme(getTheme());
try { if (localStorage.getItem('class-dir') === 'rtl') document.documentElement.dir = 'rtl'; } catch {}

let openMenu = null;
function closeMenu() { document.querySelector('.menuScrim')?.remove(); if (openMenu) { openMenu.el.remove(); openMenu.anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', openMenu.out, true); document.removeEventListener('keydown', openMenu.key, true); openMenu = null; } }
function showMenu(anchor, items, { align = 'right', title, body } = {}) {
  const same = openMenu && openMenu.anchor === anchor; closeMenu(); if (same) return;
  const m = el('div', { className: 'menu', role: 'menu' });
  if (phone()) sheetize(m, { title: title || anchor.getAttribute('aria-label') || anchor.title || '', close: () => { if (openMenu?.el === m) closeMenu(); } });
  items.forEach((it) => {
    if (it === '-') { m.append(el('hr')); return; }
    const b = el('button', { type: 'button', role: 'menuitem', className: it.danger ? 'danger' : '' }, el('span', { className: 'mi', innerHTML: it.icon ? IC[it.icon] : '' }), el('span', { className: 'ml' }, it.label, it.sub ? el('small', { textContent: it.sub }) : ''), it.check ? el('span', { className: 'mc', innerHTML: IC.check }) : '');
    b.onclick = () => { closeMenu(); it.run(); }; m.append(b);
  });
  if (body) m.append(body);
  document.body.append(el('div', { className: 'menuScrim' }), m);
  const r = anchor.getBoundingClientRect(); const w = m.offsetWidth;
  m.style.top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8) + 'px';
  m.style.left = Math.max(8, Math.min(align === 'right' ? r.right - w : r.left, innerWidth - w - 8)) + 'px';
  anchor.setAttribute('aria-expanded', 'true');
  const out = (e) => { if (!m.contains(e.target) && !anchor.contains(e.target)) closeMenu(); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); anchor.focus(); } };
  document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', key, true);
  openMenu = { el: m, anchor, out, key }; (m.querySelector('button') || m).focus?.();
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
/* Yerel sunucu Whisper: ses/video → yazı (gerekirse konuşma motorunu başlatır) */
async function srvJSON(url, opt) { const r = await fetch(url, opt); const t = await r.text(); let j = {}; try { j = JSON.parse(t || '{}'); } catch { throw new Error('Yerel sunucu yok ya da geçersiz yanıt (Class’ı başlatıcıyla açın).'); } if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`); return j; }
async function transcribe(blob, { language = 'auto', name = 'ses.wav', onPhase } = {}) {
  onPhase?.('Ses çözülüyor…'); const wav = await toWav16k(blob);
  let st = {}; try { st = await srvJSON('/api/speech/status'); } catch (e) { throw new Error('Ses ve video için yerel sunucu gerekir (Whisper). Class’ı windows.bat / linux.sh / mac.sh ile açın.'); }
  let model = st.settings?.model || '';
  if (!st.ready) {
    const ms = (await srvJSON('/api/speech/models')).models || []; const m = ms.find((x) => x.installed !== false) || ms[0];
    if (!m) throw new Error('Sunucuda konuşma (Whisper) modeli yok. Stüdyolar > Modeller’den indirin.');
    model = m.filename || m.id || m.name; onPhase?.('Konuşma motoru başlatılıyor…');
    await srvJSON('/api/speech/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, language }) });
  }
  onPhase?.('Yazıya dökülüyor…');
  const q = new URLSearchParams({ language, filename: name.replace(/\.[^.]+$/, '') + '.wav', ...(model ? { model } : {}) });
  const j = await srvJSON('/api/speech/transcribe?' + q, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav });
  return String(j.transcription?.text || '').trim();
}
async function readFile(file) {
  if (DOC_RX.test(file.name)) return readDoc(file);
  if (MEDIA_RX.test(file.name) || /^(audio|video)\//.test(file.type)) return transcribe(file, { name: file.name, onPhase: (t) => toast(`${file.name}: ${t}`) });
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
/* Ayarlar (Ayarlar panelinden değişir; yalnızca bu tarayıcıda saklanır) */
const CFG_DEF = { temperature: 0.3, maxTokens: 700, sys: '', enterSend: true, engine: 'wllama', ctx: 8192, api: { base: '', key: '', model: '' } };
const CFG = (() => { try { const c = JSON.parse(localStorage.getItem('class-cfg') || '{}'); return { ...CFG_DEF, ...c, api: { ...CFG_DEF.api, ...(c.api || {}) } }; } catch { return { ...CFG_DEF }; } })();
function saveCfg() { try { localStorage.setItem('class-cfg', JSON.stringify(CFG)); } catch {} }
/* OpenAI uyumlu akış (yerel sunucu /api/llm/chat, LM Studio, Ollama, OpenRouter…): SSE "data:" satırları */
async function streamSSE(url, headers, body, { signal, onToken }) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  if (!res.ok) { let m = `HTTP ${res.status}`; try { const j = await res.json(); m = j.error?.message || j.error || j.message || m; } catch {} throw new Error(m); }
  if (!res.body) { const j = await res.json(); const t = j?.choices?.[0]?.message?.content; if (t) onToken(t); return; }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  const take = (ev) => {
    const data = ev.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n').trim();
    if (!data) return false; if (data === '[DONE]') return true;
    try { const j = JSON.parse(data); const c = j.choices?.[0]; const t = c?.delta?.content ?? c?.message?.content ?? c?.text ?? j.content ?? j.response ?? ''; if (t) onToken(typeof t === 'string' ? t : ''); } catch {}
    return false;
  };
  for (;;) {
    const { done, value } = await rd.read(); buf += dec.decode(value || new Uint8Array(), { stream: !done });
    const evs = buf.split(/\r?\n\r?\n/); buf = evs.pop() || '';
    for (const ev of evs) if (take(ev)) { try { rd.cancel(); } catch {} return; }
    if (done) break;
  }
  if (buf.trim()) take(buf);
}

/** Cihaz / tarayıcı uygunluğu: model yüklemeden önce anlaşılır bir uyarı için */
const NO_WASM = 'Bu tarayıcıda WebAssembly çalışmıyor, bu yüzden model yüklenemez. Sık nedenler: tarayıcıda "JavaScript JIT / V8 optimizasyonu" kapalı (Chrome: Ayarlar → Site ayarları → JavaScript JIT; Android\'in Gelişmiş Koruma modu), iOS\'ta Lockdown (Kilitleme) modu, sertleştirilmiş tarayıcılar (Vanadium, Cromite, Tor gibi) ya da uygulama içi tarayıcılar. Güncel Chrome/Edge/Firefox\'u normal modda dene. Arayüzü modelsiz görmek için "Demo (model yok)" çalışır.';
function capabilityNote() {
  if (typeof WebAssembly === 'undefined') return { blocked: true, text: NO_WASM };
  const notes = [];
  if (!navigator.gpu) notes.push('Bu tarayıcıda WebGPU yok; model yalnızca işlemciyle çalışır ve yavaş olur.');
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) notes.push('Cihaz belleği düşük görünüyor (≈' + navigator.deviceMemory + ' GB). "Qwen2.5 1.5B" gibi küçük bir model seç.');
  return { blocked: false, text: notes.join(' ') };
}
async function getWllama() {
  if (typeof WebAssembly === 'undefined') throw new Error(NO_WASM);
  if (engine.wllama) return engine.wllama;
  const mod = await import('./vendor/wllama/index.js');
  engine.wllama = new mod.Wllama({ default: new URL('./vendor/wllama/wllama.wasm', location.href).href }, mod.LoggerWithoutDebug ? { logger: mod.LoggerWithoutDebug } : {});
  return engine.wllama;
}

async function chatStream(messages, { maxTokens = CFG.maxTokens, temperature = CFG.temperature, signal, onToken, demo, responseFormat }) {
  if (engine.kind === 'server') return streamSSE('/api/llm/chat', {}, { messages, stream: true, temperature, max_tokens: maxTokens, ...(responseFormat ? { response_format: responseFormat } : {}) }, { signal, onToken });
  if (engine.kind === 'openai') {
    const base = CFG.api.base.replace(/\/+$/, '');
    return streamSSE(base + '/chat/completions', CFG.api.key ? { Authorization: 'Bearer ' + CFG.api.key } : {}, { model: CFG.api.model || undefined, messages, stream: true, temperature, max_tokens: maxTokens, ...(responseFormat ? { response_format: responseFormat } : {}) }, { signal, onToken });
  }
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
  $('#q').placeholder = on ? 'Soru sorun ya da / yazın' : 'Bir şey sorun';
}
function renderNotes() { renderOutputs(); }
async function delNote(n) { await DB.del('notes', n.id); notes = notes.filter((x) => x.id !== n.id); renderOutputs(); }
function openNote(n) {
  const dlg = $('#vwDlg'); const actions = $('#vwActions'); vwCleanup?.(); vwCleanup = null;
  $('#vwTitle').textContent = n.title;
  actions.replaceChildren(
    el('button', { className: 'btn sm', type: 'button', textContent: 'Sohbette göster', onclick: () => { dlg.close(); noteToChat(n); } }),
    el('button', { className: 'btn sm', type: 'button', textContent: 'Kopyala', onclick: (e) => { navigator.clipboard?.writeText(n.text); e.currentTarget.textContent = 'Kopyalandı'; } }),
    el('button', { className: 'btn sm', type: 'button', textContent: 'Sil', onclick: async () => { dlg.close(); await delNote(n); } }));
  const body = el('div', { className: 'vwNote mBd' }); body.innerHTML = md(n.text); $('#vwBody').replaceChildren(body);
  if (!dlg.open) dlg.showModal();
}
function noteToChat(n) { chat.push({ id: uid(), role: 'assistant', text: `**${n.icon || '📝'} ${n.title}**\n\n${n.text}`, at: Date.now() }); renderChat(); persistChat(); setTab('chat'); }
function outToChat(o) { chat.push({ id: uid(), role: 'assistant', kind: 'slides', outId: o.id, text: `${TYPES[o.type].emoji} ${o.title} (${TYPES[o.type].label})`, at: Date.now() }); renderChat(); persistChat(); setTab('chat'); }
function renderChat() {
  const box = $('#msgs'); box.replaceChildren();
  if (!chat.length) box.append(el('div', { className: 'welcome', innerHTML: '<h3>Kaynaklarınla sohbet et</h3><p>' + (matchMedia('(max-width:900px)').matches ? 'Kaynaklar’dan PDF/metin ekle, bir model seç, sonra soru sor ya da yukarıdaki Araçlar’la (Sesli özet, Özet, Quiz…) özet ve çalışma rehberi çıkar.' : 'Soldan PDF/metin ekle, bir model seç, sonra soru sor ya da sağdaki Stüdyo düğmeleriyle özet ve çalışma rehberi çıkar.') + '</p><p class="small">Stüdyo’ya buradan da iş ver: <b>/ciz</b>, <b>/seslendir</b>, <b>/muzik</b>, <b>/video</b>, <b>/dok</b>, <b>/ara</b> ya da “… çiz” gibi yaz; Stüdyo’da ne yaparsan sonucu burada görünür.</p>' }));
  chat.forEach((m, i) => { const n = msgNode(m, i); n.hidden = !chatVisible(m); box.append(n); });
  box.scrollTop = box.scrollHeight; updateChatRail();
}
/* Sohbet üst çubuğu: sol ray süzgeçleri (tümü / tepki / alıntı) + mesajlarda ara */
const chatF = { f: 'all', q: '' };
const nq = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
function chatVisible(m) { if (chatF.f === 'rx' && !m.rx && !m.pin) return false; if (chatF.f === 'rp' && !m.reply) return false; if (chatF.q && !nq(m.text).includes(nq(chatF.q))) return false; return true; }
function updateChatRail() {
  document.querySelectorAll('#chRail button').forEach((b) => b.classList.toggle('on', b.dataset.f === chatF.f));
  const c = $('#chCount'); if (c) c.textContent = String(chat.length);
}
function applyChatFilter() { [...$('#msgs').children].forEach((n, i) => { if (chat[i] && n.classList.contains('msg')) n.hidden = !chatVisible(chat[i]); }); updateChatRail(); }
$('#chRail').addEventListener('click', (e) => { const a = e.target.closest('button[data-act]'); if (a) { if (a.dataset.act === 'new') newChat(); else openHist(); return; } const b = e.target.closest('button[data-f]'); if (!b) return; chatF.f = b.dataset.f; applyChatFilter(); });
$('#chSearch').addEventListener('input', (e) => { chatF.q = e.target.value.trim(); applyChatFilter(); });
const RX = ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '👀', '💯'];
const fmtSize = (b) => (b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
const snip = (t, n = 90) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
/* XML: .btt-cr-att-row / .btt-cr-att-card — bilgi solda, küçük önizleme sağda */
function attCard(a, onRemove) {
  const thumb = el('div', { className: 'attThumb' });
  if (a.url) thumb.append(el('img', { src: a.url, alt: '' })); else thumb.textContent = (a.name.split('.').pop() || '').slice(0, 4).toUpperCase();
  const card = el('div', { className: 'attCard' }, el('div', { className: 'attInfo' }, el('span', { className: 'attTitle', textContent: a.name }), el('span', { className: 'attSub', textContent: a.sub || fmtSize(a.size) })), thumb);
  const row = el('div', { className: 'attRow' }, card);
  if (onRemove) row.append(el('button', { type: 'button', className: 'attRm', title: 'Eki kaldır', ariaLabel: 'Eki kaldır', textContent: '✕', onclick: onRemove }));
  return row;
}
/* XML: .btt-reply-quote-ref — basınca yanıtlanan mesaja gider ve parlatır */
function quoteRef(r) {
  const b = el('button', { type: 'button', className: 'rqRef', title: 'Yanıtlanan mesaja gitmek için tıklayın' },
    el('span', { className: 'rqTx' }, el('b', { textContent: '@' + r.who }), document.createTextNode(' ' + r.text)), el('span', { className: 'rqJump', innerHTML: IC.jump }));
  b.onclick = (e) => { e.stopPropagation(); flashMsg(r.id); };
  return b;
}
function flashMsg(id) {
  const t = $('#msgs').querySelector(`[data-mid="${CSS.escape(id)}"]`); if (!t) { toast('Yanıtlanan mesaj artık sohbette yok.'); return; }
  t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 3200);
}
const LK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10.9c2.3 2.3 2.3 5.9 0 8.1s-5.9 2.3-8.1 0c-2.2-2.2-2.2-5.8 0-8.1"/><path d="M10.6 13.4c-2.3-2.3-2.3-6.1 0-8.5s6.1-2.3 8.5 0c2.3 2.3 2.3 6.1 0 8.5"/></svg>';
function msgWhen(t) { if (!t) return ''; const d = new Date(t); return `${d.toDateString() === new Date().toDateString() ? 'Bugün' : fmtDate(t)} • ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`; }
/* XML: .cmBd > .cmAv + .cmCh (.aNm + rozet + .cmTi) — avatar, ad, rozet, tarih */
function msgHead(m, me, i) {
  const more = el('button', { type: 'button', className: 'mMore', title: 'Mesaj işlemleri', ariaLabel: 'Mesaj işlemleri', ariaHaspopup: 'menu', innerHTML: IC.more });
  more.onclick = (e) => { e.stopPropagation(); msgMenu(more, m, i); };
  return el('div', { className: 'mHd' }, el('span', { className: 'mAv ' + (me ? 'u' : 'a'), textContent: me ? 'S' : 'C', 'aria-hidden': 'true' }),
    el('div', { className: 'mWho' }, el('div', { className: 'mNm' }, el('b', { textContent: me ? 'Sen' : 'Class' }), el('span', { className: 'mBadge', textContent: m.via || (m.kind === 'slides' ? 'Slayt' : me ? (m.cmd ? 'Komut' : 'Soru') : 'Yanıt') }), m.pin ? el('span', { className: 'mPin', title: 'Sabitlendi', innerHTML: IC.star }) : ''), el('time', { className: 'mTi', textContent: msgWhen(m.at) })), more);
}
/* Mesaj işlemleri: sabitle, sesli oku, düzenle, yeniden üret, sil */
let speakingId = null;
function speak(m) {
  if (!('speechSynthesis' in window)) { toast('Bu tarayıcı sesli okumayı desteklemiyor.'); return; }
  if (speakingId === m.id) { speechSynthesis.cancel(); speakingId = null; return; }
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(m.text).replace(/[*_`#>]/g, '')); u.lang = 'tr-TR'; u.onend = u.onerror = () => { if (speakingId === m.id) speakingId = null; };
  speakingId = m.id; speechSynthesis.speak(u);
}
function msgMenu(anchor, m, i) {
  const me = m.role === 'user', last = i === chat.length - 1 || (i === chat.length - 2 && chat[chat.length - 1].role !== 'user');
  const items = [{ icon: 'star', label: m.pin ? 'Sabitlemeyi kaldır' : 'Sabitle', run: () => { m.pin = !m.pin; if (!m.pin) delete m.pin; renderChat(); persistChat(); } }];
  if (m.text && !m.live) items.push({ icon: 'speak', label: speakingId === m.id ? 'Okumayı durdur' : 'Sesli oku', run: () => speak(m) });
  if (me && m.text) items.push({ icon: 'edit', label: 'Düzenle', sub: 'Metni yazma alanına al', run: () => { $('#q').value = m.text; $('#q').dispatchEvent(new Event('input')); $('#q').focus(); setTab('chat'); } });
  if (!me && !m.err && !m.live && m.kind !== 'slides' && chat[i - 1]?.role === 'user' && !busy) items.push({ icon: 'refresh', label: 'Yeniden üret', run: () => { const p = chat[i - 1]; chat.splice(i - 1, 2); renderChat(); if (p.cmd) redo(p.text); else ask(p.text); } });
  if (m.kind === 'slides') items.push({ icon: 'expand', label: 'Tam ekranda aç', run: () => { const o = outputs.find((x) => x.id === m.outId); if (o) openOutput(o); else toast('Bu çıktı silinmiş.'); } });
  items.push('-', { icon: 'trash', label: 'Mesajı sil', danger: true, run: () => { if (busy && m.live) return; chat.splice(i, 1); renderChat(); persistChat(); } });
  showMenu(anchor, items);
}
/* ---- Sohbet içi slaytlar: Stüdyo çıktıları yatay kaydırılan kartlar olarak sohbette ---- */
function slidesFor(o) {
  const d = o.data;
  if (o.type === 'cards') return d.cards.map((c, k) => ({ k: `Kart ${k + 1}/${d.cards.length}`, t: c.front, s: c.back, flip: true }));
  if (o.type === 'quiz') return d.questions.map((q, k) => ({ k: `Soru ${k + 1}/${d.questions.length}`, t: q.q, opts: q.options, ans: q.answer, ex: q.explanation }));
  if (o.type === 'infographic') return [...d.points.map((p) => ({ k: p.emoji, t: p.title, s: p.text })), ...(d.takeaway ? [{ k: '💡', t: 'Çıkarım', s: d.takeaway }] : [])];
  if (o.type === 'podcast') return d.turns.map((t) => ({ k: t.speaker, t: t.text }));
  return d.branches.map((b) => ({ k: 'Dal', t: b.title, list: b.children }));
}
function slidesNode(m) {
  const o = outputs.find((x) => x.id === m.outId); const wrap = el('div', { className: 'sld' });
  if (!o) { wrap.append(el('div', { className: 'sldGone', textContent: 'Bu çıktı silinmiş.' })); return wrap; }
  const T = TYPES[o.type]; const sl = slidesFor(o);
  wrap.append(el('div', { className: 'sldHd' }, el('span', { className: 'tIc', innerHTML: SIC[o.type] || '' }), el('b', { textContent: o.title }), el('small', { textContent: `${T.label} · ${sl.length} slayt` })));
  const track = el('div', { className: 'sldTrack', tabIndex: 0, role: 'group', ariaLabel: 'Slaytlar: sağa sola kaydırın' });
  sl.forEach((s) => {
    const c = el('div', { className: 'sldCard' }, el('span', { className: 'sldK', textContent: s.k }), el('b', { className: 'sldT', textContent: s.t }));
    if (s.flip) { const back = el('p', { className: 'sldS', textContent: s.s, hidden: true }); c.append(back, el('button', { type: 'button', className: 'sldBtn', textContent: 'Cevabı göster', onclick: (e) => { back.hidden = !back.hidden; e.currentTarget.textContent = back.hidden ? 'Cevabı göster' : 'Gizle'; } })); }
    else if (s.s) c.append(el('p', { className: 'sldS', textContent: s.s }));
    if (s.list) c.append(el('ul', { className: 'sldL' }, ...s.list.map((x) => el('li', { textContent: x }))));
    if (s.opts) { const ex = el('p', { className: 'sldS', hidden: true, textContent: s.ex || '' }); c.append(el('div', { className: 'sldO' }, ...s.opts.map((t, j) => el('button', { type: 'button', textContent: t, onclick: (e) => { const row = e.currentTarget.parentElement; row.querySelectorAll('button').forEach((b, x) => { b.disabled = true; b.classList.toggle('ok', x === s.ans); }); if (j !== s.ans) e.currentTarget.classList.add('bad'); ex.hidden = !s.ex; } }))), ex); }
    track.append(c);
  });
  const dots = el('div', { className: 'sldDots' }, ...sl.map((_, k) => el('button', { type: 'button', className: k ? '' : 'on', ariaLabel: `Slayt ${k + 1}`, onclick: () => track.children[k].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }) })));
  track.addEventListener('scroll', () => { const k = Math.round(track.scrollLeft / (track.children[0].offsetWidth + 10)); [...dots.children].forEach((d, x) => d.classList.toggle('on', x === k)); }, { passive: true });
  wrap.append(track, dots); return wrap;
}
function msgNode(m, i) {
  if (!m.id) m.id = uid();
  const me = m.role === 'user';
  const d = el('div', { className: `msg c ${me ? 'me' : ''} ${m.err ? 'err' : ''}` }); d.dataset.mid = m.id;
  d.append(msgHead(m, me, i));
  const bd = el('div', { className: 'mBd' }); d.append(bd);
  const mm = withBlob(m);
  if (mm.audio || mm.video || mm.img) bd.append(mediaCard(mm));
  if (m.kind === 'slides') bd.append(slidesNode(m));
  else if (m.kind === 'web') bd.append(webNode(m));
  else if (m.kind === 'files') bd.append(filesNode(m));
  else if (mm.img || mm.audio || mm.video) {}
  else if (me) { if (m.reply) bd.append(quoteRef(m.reply)); if (m.text) bd.append(el('span', { className: 'mTx', textContent: m.text })); if (m.atts?.length) bd.append(el('div', { className: 'atts' }, ...m.atts.map((a) => attCard(a)))); }
  else bd.innerHTML = md(m.text);
  if (m.live || m.err || !m.text && !m.atts?.length) return d;
  /* XML: .btt-cm-rx-wrap — seçili tepki rozeti + tepki ekle, sağda Yanıtla */
  const rxWrap = el('span', { className: 'rxWrap' });
  if (m.rx) rxWrap.append(el('button', { type: 'button', className: 'rxPill', title: 'Tepkiyi kaldır', ariaLabel: 'Tepkiyi kaldır', onclick: () => setRx(m, m.rx) }, el('span', { className: 'rxEmo', textContent: m.rx }), el('span', { className: 'rxCount', textContent: '1' })));
  const trig = el('button', { type: 'button', className: 'rxBtn', title: 'Tepki Ekle', ariaLabel: 'Tepki ekle', innerHTML: IC.smile, ariaExpanded: 'false' });
  const pop = el('div', { className: 'rxPop', role: 'menu' }, ...RX.map((e) => el('button', { type: 'button', className: 'rxOpt' + (m.rx === e ? ' on' : ''), textContent: e, ariaLabel: 'Tepki: ' + e, onclick: () => setRx(m, e) })));
  trig.onclick = (e) => {
    e.stopPropagation();
    if (phone()) { closeRx(); showMenu(trig, [], { title: 'Tepki ekle', body: el('div', { className: 'rxGrid' }, ...RX.map((x) => el('button', { type: 'button', className: 'rxOpt' + (m.rx === x ? ' on' : ''), textContent: x, ariaLabel: 'Tepki: ' + x, onclick: () => { closeMenu(); setRx(m, x); } }))) }); return; }
    const open = !pop.classList.contains('open'); closeRx(); pop.classList.toggle('open', open); trig.setAttribute('aria-expanded', open); if (open) pop.firstChild.focus(); };
  rxWrap.append(trig, pop);
  const reply = el('button', { type: 'button', className: 'rxBtn ghost', title: 'Yanıtla', ariaLabel: 'Yanıtla', innerHTML: IC.reply, onclick: () => startReply(m) });
  const lnk = el('button', { type: 'button', className: 'rxBtn ghost', title: 'Mesaj bağlantısını kopyala', ariaLabel: 'Mesaj bağlantısını kopyala', innerHTML: LK });
  lnk.onclick = () => { navigator.clipboard?.writeText(location.href.split('#')[0] + '#msg-' + m.id).then(() => { lnk.innerHTML = IC.check; setTimeout(() => (lnk.innerHTML = LK), 1200); }).catch(() => {}); };
  const acts = el('div', { className: 'acts' }, rxWrap, lnk, reply);
  if (m.role !== 'user') {
    const save = el('button', { className: 'rxBtn ghost', title: 'Nota kaydet', ariaLabel: 'Nota kaydet', innerHTML: IC.pin });
    save.onclick = () => saveNote(m.title || (chat[i - 1]?.text || 'Not').slice(0, 60), m.text);
    const copy = el('button', { className: 'rxBtn ghost', title: 'Kopyala', ariaLabel: 'Kopyala', innerHTML: IC.copy });
    copy.onclick = () => { navigator.clipboard?.writeText(m.text).then(() => { copy.innerHTML = IC.check; setTimeout(() => (copy.innerHTML = IC.copy), 1200); }).catch(() => {}); };
    acts.append(save, copy);
  }
  d.append(acts);
  return d;
}
function closeRx() { document.querySelectorAll('.rxPop.open').forEach((p) => { p.classList.remove('open'); p.previousElementSibling?.setAttribute('aria-expanded', 'false'); }); }
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.rxWrap')) closeRx(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.querySelector('.rxPop.open')) { e.stopPropagation(); closeRx(); } }, true);
function setRx(m, e) { m.rx = m.rx === e ? '' : e; if (!m.rx) delete m.rx; const y = $('#msgs').scrollTop; renderChat(); $('#msgs').scrollTop = y; persistChat(); }

/* Yanıtla: yazma alanının üstünde alıntı çubuğu */
let replyTo = null;
function startReply(m) {
  replyTo = { id: m.id, who: m.role === 'user' ? 'Sen' : 'Class', text: snip(m.text || m.atts?.map((a) => a.name).join(', ')) };
  const bar = $('#replyBar'); bar.replaceChildren(quoteRef(replyTo), el('button', { type: 'button', className: 'attRm', title: 'Yanıtı iptal et', ariaLabel: 'Yanıtı iptal et', textContent: '✕', onclick: cancelReply }));
  bar.hidden = false; setTab('chat'); $('#q').focus();
}
function cancelReply() { replyTo = null; $('#replyBar').hidden = true; $('#replyBar').replaceChildren(); }

/* Sohbete dosya ekleme: önizle, gönderince kaynak olarak ekle */
let pending = [];
function renderPending() { const box = $('#attList'); box.replaceChildren(...pending.map((f, i) => attCard(f, () => { if (f.url) URL.revokeObjectURL(f.url); pending.splice(i, 1); renderPending(); }))); box.hidden = !pending.length; }
function addPending(files) {
  for (const f of files) {
    const ok = /\.(pdf|txt|md|markdown|csv|html?|json)$/i.test(f.name) || /^text\//.test(f.type);
    pending.push({ file: f, name: f.name, size: f.size, sub: ok ? fmtSize(f.size) + ' · kaynak olarak eklenecek' : fmtSize(f.size) + ' · okunamaz, yalnızca ad gider', ok, url: /^image\//.test(f.type) ? URL.createObjectURL(f) : '' });
  }
  renderPending(); setTab('chat'); $('#q').focus();
}
async function saveNote(title, text, icon) { const n = { id: uid(), nbId: nb.id, title, text, addedAt: Date.now(), ...(icon ? { icon } : {}) }; notes.push(n); await DB.put('notes', n); renderNotes(); touchNb(); toast('Nota kaydedildi'); }
function toast(t) { $('#ctxInfo').textContent = t; }
function setModelUi(state, label) {
  $('#modelDot').className = `dot ${state}`; $('#modelLabel').textContent = label;
}

/* ---------------- Üretim akışı ---------------- */
function needModel() {
  if (['wllama', 'demo', 'server', 'openai'].includes(engine.kind)) return false;
  $('#modelDlg').showModal(); return true;
}
/* ---------------- Sohbet geçmişi: defter başına önceki sohbetler ----------------
   Açık sohbet 'chat:<defter>' anahtarında kalır; "Yeni sohbet" onu 'chats:<defter>' arşivine taşır,
   arşivden seçilen sohbet yeniden açık sohbet olur. */
const histKey = (id) => 'chats:' + id;
const loadHist = async (id) => (await DB.get(histKey(id))) || [];
const chatTitle = (msgs) => { const u = msgs.find((m) => m.role === 'user' && m.text) || msgs.find((m) => m.text); return ((u && u.text) || 'Sohbet').replace(/\s+/g, ' ').trim().slice(0, 80); };
async function archiveCurrent() {
  const msgs = chat.filter((m) => !m.live);
  if (!nb || !msgs.length) return;
  const h = await loadHist(nb.id);
  h.unshift({ id: uid(), title: chatTitle(msgs), at: msgs[msgs.length - 1].at || Date.now(), n: msgs.length, msgs: msgs.slice(-60) });
  await DB.set(histKey(nb.id), h.slice(0, 50));
}
async function updateHistN() { const b = $('#histN'); if (!b || !nb) return; const n = (await loadHist(nb.id)).length; b.textContent = n; b.hidden = !n; }
async function newChat() {
  if (busy || !nb) return; if (!chat.some((m) => !m.live)) { setTab('chat'); $('#q').focus(); return; }
  await archiveCurrent(); chat = []; cancelReply(); await DB.set('chat:' + nb.id, []); renderChat(); updateHistN(); setTab('chat'); toast('Yeni sohbet başladı. Öncekine Geçmiş’ten dönebilirsin.');
}
let HD = null;
function histDlg() {
  if (HD) return HD;
  const list = el('ul', { className: 'list histList' });
  const nw = el('button', { type: 'button', className: 'btn primary histNew', innerHTML: IC.plus || '+' }, el('span', { textContent: 'Yeni sohbet' }));
  nw.onclick = () => { HD.d.close(); newChat(); };
  const d = el('dialog', { className: 'fs hist', id: 'histDlg' }); d.dataset.title = '#Sohbet geçmişi';
  d.append(el('div', { className: 'dlg' }, el('h2', { textContent: 'Sohbet geçmişi' }), el('p', { className: 'muted histSub' }), nw, list));
  document.body.append(d); fsInit(d); fsGrip(d);
  HD = { d, list, sub: d.querySelector('.histSub') }; return HD;
}
async function openHist() {
  if (!nb) return; const H = histDlg(); const h = await loadHist(nb.id);
  H.sub.textContent = `${nb.title || 'Bu defter'} · ${h.length ? h.length + ' eski sohbet' : 'henüz eski sohbet yok'}`;
  const cur = chat.filter((m) => !m.live);
  const rows = [];
  if (cur.length) rows.push(el('li', { className: 'histItem on' }, el('span', { className: 'hiIc', innerHTML: IC.chat || '' }), el('span', { className: 't' }, el('b', { textContent: chatTitle(cur) }), el('small', { textContent: `Açık sohbet · ${cur.length} mesaj` }))));
  h.forEach((it, k) => {
    const del = el('button', { type: 'button', className: 'x', title: 'Sil', ariaLabel: `${it.title} sohbetini sil`, innerHTML: IC.trash || '×' });
    del.onclick = async (e) => { e.stopPropagation(); const a = await loadHist(nb.id); a.splice(k, 1); await DB.set(histKey(nb.id), a); updateHistN(); openHist(); };
    const li = el('li', { className: 'histItem', tabIndex: 0, role: 'button' }, el('span', { className: 'hiIc', innerHTML: IC.chat || '' }), el('span', { className: 't' }, el('b', { textContent: it.title }), el('small', { textContent: `${fmtDate(it.at)} · ${it.n} mesaj` })), del);
    const go = async () => {
      if (busy) return; const a = await loadHist(nb.id); const pick = a.splice(k, 1)[0]; if (!pick) return;
      await DB.set(histKey(nb.id), a); await archiveCurrent();
      chat = pick.msgs || []; cancelReply(); await persistChat(); renderChat(); updateHistN(); H.d.close(); setTab('chat');
    };
    li.onclick = go; li.onkeydown = (e) => { if (e.target === li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } };
    rows.push(li);
  });
  if (!rows.length) rows.push(el('li', { className: 'histEmpty muted', textContent: 'Burada önceki sohbetlerin listelenir. “Yeni sohbet” ile başladığında açık sohbet buraya taşınır.' }));
  H.list.replaceChildren(...rows);
  if (!H.d.open) H.d.showModal();
}
async function persistChat() { if (nb) { await DB.set('chat:' + nb.id, chat.filter((m) => !m.live).slice(-60)); touchNb(); } }

/* ---------------- Stüdyo işleri sohbette ----------------
   Araçlar, Stüdyo panelleri ve /komutlar aynı yoldan geçer: (varsa) komut balonu → canlı ilerleme → sonuç.
   Sonuç görsel / ses / video (adres ya da dosya), web sonuçları, dosya listesi ya da metin olabilir. */
const blobUrls = new WeakMap();
function withBlob(m) {
  if (!m.blob || m.img || m.audio || m.video) return m;
  let u = blobUrls.get(m.blob); if (!u) { u = URL.createObjectURL(m.blob); blobUrls.set(m.blob, u); }
  const t = m.blob.type || ''; const k = /^image\//.test(t) ? 'img' : /^audio\//.test(t) ? 'audio' : /^video\//.test(t) ? 'video' : '';
  return k ? { ...m, [k]: u } : m;
}
async function chatTask({ cmd, via, label, run }) {
  if (!nb) throw new Error('Sonucun sohbete düşmesi için önce bir not defteri aç.');
  if (cmd) chat.push({ id: uid(), at: Date.now(), role: 'user', cmd: true, text: cmd });
  const m = { id: uid(), role: 'assistant', via, text: `${label}…`, live: true, at: Date.now() };
  chat.push(m); renderChat(); /* Stüdyo sayfası açıksa kapanmaz: sonuç sohbette bekler */
  const set = (t) => { m.text = t; const n = $(`#msgs .msg[data-mid="${m.id}"] .mBd`); if (n) n.innerHTML = md(t); };
  try {
    const r = await run(set);
    delete m.live; Object.assign(m, r || {}); if (!m.text) m.text = label;
    return m;
  } catch (e) { delete m.live; m.err = true; m.text = String(e.message || e); throw e; } /* rozet hangi stüdyo olduğunu söyler */
  finally { if (chat.includes(m)) { renderChat(); persistChat(); } }
}
function webNode(m) {
  const head = el('div'); head.innerHTML = md(m.text || '');
  const rows = (m.web || []).map((r) => {
    const add = el('button', { type: 'button', className: 'btn sm', textContent: r.added ? 'Eklendi ✓' : 'Kaynak ekle', disabled: !!r.added });
    add.onclick = async () => { await addSource(r.title || r.url, `Kaynak: ${r.url}\n\n${r.content || r.snippet || ''}`, 'Web'); r.added = true; add.textContent = 'Eklendi ✓'; add.disabled = true; persistChat(); };
    return el('li', { className: 'webRes' }, el('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', textContent: r.title || r.url }), el('small', { textContent: r.url }),
      r.snippet ? el('span', { textContent: r.snippet.slice(0, 220) }) : null, el('div', { className: 'webAct' }, el('em', { textContent: r.content ? `${r.content.length} karakter okundu` : 'yalnızca özet' }), add));
  });
  return el('div', { className: 'webMsg' }, head, el('ul', { className: 'webList' }, ...rows));
}
function filesNode(m) {
  const head = el('div'); head.innerHTML = md(m.text || '');
  return el('div', { className: 'filesMsg' }, head, el('ul', { className: 'fileList' }, ...(m.files || []).map((f) => {
    let u = f.url; if (f.blob) { u = blobUrls.get(f.blob); if (!u) { u = URL.createObjectURL(f.blob); blobUrls.set(f.blob, u); } }
    const t = f.blob?.type || f.type || '';
    const thumb = /^image\//.test(t) ? el('img', { className: 'fileTh', src: u, alt: '', loading: 'lazy' }) : el('span', { className: 'fileTh fileExt', textContent: (f.name.split('.').pop() || '').slice(0, 4).toUpperCase() });
    return el('li', { className: 'fileRow' }, thumb, el('span', { className: 'fileNm' }, el('b', { textContent: f.name }), el('small', { textContent: fmtSize(f.blob?.size || f.size || 0) })), u ? el('a', { className: 'btn sm', href: u, download: f.name, textContent: 'İndir' }) : null);
  })));
}
/* Dönüştür ve benzeri stüdyolar: çıkan dosyalar sohbete (tek görsel/ses/video ise oynatıcı kartıyla) */
async function chatFiles(title, items, via = 'Dönüştür') {
  if (!nb || !items?.length) return;
  const one = items.length === 1 && /^(image|audio|video)\//.test(items[0].blob?.type || '');
  chat.push(one ? { id: uid(), role: 'assistant', via, at: Date.now(), blob: items[0].blob, text: `${title} · ${items[0].name}` }
    : { id: uid(), role: 'assistant', via, at: Date.now(), kind: 'files', text: `**${title}** · ${items.length} dosya`, files: items.map((x) => ({ name: x.name, blob: x.blob, url: x.blob ? undefined : x.url, size: x.size })) });
  renderChat(); await persistChat();
}

async function run({ userText, shownText, messages, cites, title, maxTokens, demo, reply: rq, atts, cmd }) {
  if (busy) return;
  busy = true; abortCtl = new AbortController();
  $('#send').hidden = true; $('#stop').hidden = false;
  chat.push({ id: uid(), at: Date.now(), role: 'user', text: shownText ?? userText, ...(cmd ? { cmd: true } : {}), ...(rq ? { reply: rq } : {}), ...(atts?.length ? { atts } : {}) });
  const reply = { id: uid(), role: 'assistant', text: '', live: true, cites, title, at: Date.now() };
  chat.push(reply); renderChat();
  const node = () => { const n = $(`#msgs .msg[data-mid="${reply.id}"]`); return n?.querySelector('.mBd') || n || el('div'); };
  try {
    await chatStream(messages, { maxTokens, signal: abortCtl.signal, demo, onToken: (t) => { reply.text += t; node().innerHTML = md(reply.text); $('#msgs').scrollTop = $('#msgs').scrollHeight; } });
    if (!reply.text.trim()) reply.text = '(Boş cevap geldi. Soruyu değiştirmeyi dene.)';
  } catch (e) { reply.err = true; reply.text = `Hata: ${e.message || e}`; }
  reply.live = false; busy = false; abortCtl = null;
  $('#send').hidden = false; $('#stop').hidden = true;
  renderChat(); persistChat(); return reply;
}

function buildChatMessages(question) {
  const on = enabledSources(); const hist = chat.filter((m) => !m.err).slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 1200) }));
  const extra = CFG.sys.trim() ? `\n\nKullanıcının ek talimatı: ${CFG.sys.trim().slice(0, 1200)}` : '';
  if (!on.length) return { messages: [{ role: 'system', content: 'Yardımsever bir asistansın. Türkçe, kısa ve net cevap ver.' + extra }, ...hist, { role: 'user', content: question }], cites: [] };
  const histChars = hist.reduce((n, h) => n + h.content.length, 0);
  let hits = search(question, on, 8); let used = 0; const picked = [];
  for (const h of hits) { if (used + h.text.length > budgetChars(histChars + question.length + 500)) break; picked.push(h); used += h.text.length; }
  const cites = picked.map((h, i) => ({ n: i + 1, title: h.src.title, text: h.text }));
  const ctx = cites.map((c) => `[${c.n}] (${c.title})\n${c.text}`).join('\n\n');
  const sys = 'Sen kullanıcının kaynaklarıyla çalışan bir araştırma yardımcısısın. Yalnızca aşağıdaki kaynak parçalarına dayanarak Türkçe cevap ver. Kullandığın her bilginin sonuna parça numarasını köşeli parantezle yaz, örneğin [1] veya [2][3]. Kaynaklarda cevap yoksa bunu açıkça söyle, uydurma.\n\nKAYNAK PARÇALARI:\n' + ctx;
  return { messages: [{ role: 'system', content: sys + extra }, ...hist, { role: 'user', content: question }], cites };
}
function demoAnswer(cites) {
  if (!cites.length) return 'Demo kipi: model yüklü değil. Gerçek cevap için üstten bir model yükle.';
  return 'Demo kipi — gerçek model yüklü değil. Sorunla en çok eşleşen kaynak parçaları:\n\n' + cites.slice(0, 3).map((c) => `- ${c.text.replace(/\s+/g, ' ').slice(0, 220)}… [${c.n}]`).join('\n');
}

async function ask(question, { reply: rq, atts } = {}) {
  const full = rq ? `(${rq.who} mesajına yanıt: "${(chat.find((m) => m.id === rq.id)?.text || rq.text).slice(0, 600)}")\n\n${question}` : question;
  const { messages, cites } = buildChatMessages(full);
  $('#ctxInfo').textContent = cites.length ? `${cites.length} kaynak parçası kullanıldı · bağlam ${engine.nctx}` : '';
  await run({ userText: question, messages, cites, maxTokens: CFG.maxTokens, demo: demoAnswer(cites), reply: rq, atts });
}

const STUDIO = [
  { id: 'ozet', ic: '📄', label: 'Özet', sub: 'Kısa genel bakış', p: 'Kaynakların kısa ve anlaşılır bir özetini yaz. Önce 2-3 cümlelik genel bakış, sonra en önemli noktalar madde madde.' },
  { id: 'fikir', ic: '💡', label: 'Ana fikirler', sub: 'Madde madde', p: 'Kaynaklardaki ana fikirleri ve önemli bulguları numaralı bir liste olarak çıkar. Her madde tek cümle olsun.' },
  { id: 'sss', ic: '❓', label: 'SSS', sub: 'Sık sorulan sorular', p: 'Bu kaynaklardan 6 adet sık sorulan soru ve kısa cevaplarını üret. Biçim: "S:" ve "C:".' },
  { id: 'rehber', ic: '📚', label: 'Çalışma rehberi', sub: 'Kavramlar + sorular', p: 'Bir çalışma rehberi hazırla: (1) Anahtar kavramlar ve kısa tanımları, (2) Tekrar için 5 kısa cevaplı soru, (3) Düşündürücü 2 soru.' },
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
  const title = `${t.label} — ${on.map((s) => s.title).join(', ').slice(0, 50)}`;
  const r = await run({ userText: t.label, shownText: t.label, cmd: true, messages: [{ role: 'system', content: sys }, { role: 'user', content: t.p }], cites: [], title, maxTokens: 900, demo: `Demo kipi — "${t.label}" çıktısı gerçek model ile üretilir.\n\n` + on.map((s) => `- ${s.title}: ${s.text.replace(/\s+/g, ' ').slice(0, 140)}…`).join('\n') });
  if (r && !r.err && r.text.trim() && engine.kind !== 'demo') await saveNote(title, r.text, t.ic);
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
  for (const f of files) { try { toast(`${f.name} okunuyor…`); await addSource(f.name, await readFile(f), /\.pdf$/i.test(f.name) ? 'PDF' : DOC_RX.test(f.name) ? f.name.split('.').pop().toUpperCase() : (MEDIA_RX.test(f.name) || /^(audio|video)\//.test(f.type)) ? 'Ses/Video' : 'Dosya'); toast(''); } catch (err) { toast(`${f.name} okunamadı: ${err.message || err}`); } }
}
$('#fileInput').onchange = async (e) => { const files = [...e.target.files]; e.target.value = ''; await ingestFiles(files); };
let noteMode = false;
const openText = (note) => { noteMode = note; $('#textHead').textContent = note ? 'Not oluştur' : 'Metin yapıştır'; $('#textSave').textContent = note ? 'Kaydet' : 'Ekle'; $('#textTitle').value = ''; $('#textBody').value = ''; $('#textDlg').showModal(); };
$('#addText').onclick = () => openText(false);
$('#addNote').onclick = () => openText(true);
$('#addNote2').onclick = () => openText(true);
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
  { const cap = capabilityNote(); if (cap.blocked) { $('#dlText').textContent = cap.text; return; } }
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
  } catch (e) { setModelUi(engine.kind === 'wllama' ? 'ok' : '', engine.kind === 'wllama' ? engine.label : 'Model yüklenmedi'); $('#dlText').textContent = /WebAssembly/i.test(String(e && e.message || e)) ? NO_WASM : `Yüklenemedi: ${e.message || e}`; }
  finally { btn.disabled = false; }
};

/* ---------------- Sohbet formu / sekmeler / dışa aktarım ---------------- */
const q = $('#q');
q.addEventListener('input', () => { q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 140) + 'px'; });
q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && (CFG.enterSend || e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#composer').requestSubmit(); } });
$('#composer').onsubmit = async (e) => {
  e.preventDefault(); const t = q.value.trim();
  if (t.startsWith('/') && runSlash(t)) return;
  if (t && !pending.length && !replyTo && naturalCmd(t)) return;
  if ((!t && !pending.length) || busy) return;
  if (t && needModel()) return;
  const atts = pending.map(({ name, size, sub, url }) => ({ name, size, sub: sub.split(' · ')[0], url: '' })); const files = pending; pending = []; renderPending();
  const rq = replyTo; cancelReply(); q.value = ''; q.style.height = 'auto'; closeCmds();
  for (const f of files) { if (f.url) URL.revokeObjectURL(f.url); if (f.ok) await ingestFiles([f.file]); }
  if (!t) { chat.push({ id: uid(), at: Date.now(), role: 'user', text: '', atts, ...(rq ? { reply: rq } : {}) }); renderChat(); persistChat(); toast(`${files.filter((f) => f.ok).length} dosya kaynak olarak eklendi.`); return; }
  ask(t, { reply: rq, atts });
};
$('#attBtn').onclick = () => $('#chatFile').click();
$('#chatFile').onchange = (e) => { const f = [...e.target.files]; e.target.value = ''; addPending(f); };
{ const pc = $('#panelChat'); let dn = 0;
  pc.addEventListener('dragenter', (e) => { if (e.dataTransfer?.types?.includes('Files')) { dn++; pc.classList.add('dropOn'); } });
  pc.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
  pc.addEventListener('dragleave', () => { if (--dn <= 0) { dn = 0; pc.classList.remove('dropOn'); } });
  pc.addEventListener('drop', (e) => { if (!e.dataTransfer?.files?.length) return; e.preventDefault(); dn = 0; pc.classList.remove('dropOn'); addPending([...e.dataTransfer.files]); });
  q.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])]; if (f.length) { e.preventDefault(); addPending(f); } }); }

/* ---------------- /komutlar (XML: BTT_CMD_CATALOG + .btt-cmd-slides-bar) ---------------- */
const CI = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CMDS = [
  { cmd: '/ozet', label: 'özet', title: 'Özet', hint: 'Seçili kaynakların kısa özeti', svg: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', run: () => studio(STUDIO[0]) },
  { cmd: '/fikir', label: 'fikirler', title: 'Ana fikirler', hint: 'Madde madde ana fikirler', svg: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', run: () => studio(STUDIO[1]) },
  { cmd: '/sss', label: 'sss', title: 'SSS', hint: 'Sık sorulan sorular ve cevapları', svg: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>', run: () => studio(STUDIO[2]) },
  { cmd: '/rehber', label: 'rehber', title: 'Çalışma rehberi', hint: 'Kavramlar ve tekrar soruları', svg: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>', run: () => studio(STUDIO[3]) },
  { cmd: '/sesli', label: 'sesli', title: 'Sesli özet', hint: 'İki kişilik sesli özet', svg: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/>', run: () => makeRich('podcast') },
  { cmd: '/harita', label: 'harita', title: 'Zihin haritası', hint: 'Renkli zihin haritası', svg: '<circle cx="12" cy="12" r="2.5"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="4.5" cy="18" r="2"/><circle cx="19.5" cy="18" r="2"/><path d="M6.2 7.2l4 3.3M17.8 7.2l-4 3.3M6.2 16.8l4-3.3M17.8 16.8l-4-3.3"/>', run: () => makeRich('map') },
  { cmd: '/gorsel', label: 'görsel', title: 'Görsel özet', hint: 'Bilgi grafiği', svg: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>', run: () => makeRich('infographic') },
  { cmd: '/kart', label: 'kartlar', title: 'Bilgi kartları', hint: 'Çevirmeli çalışma kartları', svg: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 6V4h14v14h-4"/>', run: () => makeRich('cards') },
  { cmd: '/quiz', label: 'quiz', title: 'Quiz', hint: 'Çoktan seçmeli test', svg: '<circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/>', run: () => makeRich('quiz') },
  /* Stüdyo komutları: iş Stüdyo'da yapılır, sonuç sohbete düşer (yerel sunucu gerekir) */
  { cmd: '/ciz', label: 'çiz', title: 'Görsel çiz', hint: 'Görsel stüdyosu · /ciz istem (boşsa kaynaklardan)', arg: 'opt', ex: '/ciz gün batımında kağıttan bir kayık', svg: '<path d="m14.5 4.5 5 5L9 20H4v-5z"/><path d="m12.5 6.5 5 5"/>', run: (a, raw) => studioCmd('image', a, raw) },
  { cmd: '/seslendir', label: 'seslendir', title: 'Seslendir', hint: 'Ses stüdyosu · metni ya da son cevabı seslendir', arg: 'opt', ex: '/seslendir Merhaba, hoş geldin', svg: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>', run: (a, raw) => studioCmd('tts', a, raw) },
  { cmd: '/muzik', label: 'müzik', title: 'Müzik üret', hint: 'Müzik stüdyosu · /muzik istem', arg: 'need', ex: '/muzik yağmur sesli sakin piyano', svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>', run: (a, raw) => studioCmd('music', a, raw) },
  { cmd: '/video', label: 'video', title: 'Video üret', hint: 'Video stüdyosu · /video istem', arg: 'need', ex: '/video sakin gölde süzülen kağıt kayık', svg: '<rect x="2.5" y="5" width="15" height="14" rx="3"/><path d="M17.5 10l4-2.5v9l-4-2.5"/>', run: (a, raw) => studioCmd('video', a, raw) },
  { cmd: '/dok', label: 'yazıya dök', title: 'Yazıya dök', hint: 'Yazıya dök stüdyosu · ses ya da videoyu metne çevir', svg: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>', run: (a, raw) => studioCmd('stt', a, raw) },
  { cmd: '/ara', label: 'web ara', title: 'Web’de ara', hint: 'Web stüdyosu · /ara konu', arg: 'need', ex: '/ara Osmanlı’da matbaa', svg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', run: (a, raw) => studioCmd('web', a, raw) },
  { cmd: '/ekle', label: 'ekle', title: 'Dosya ekle', hint: 'Sohbete dosya ekle (kaynak olur)', svg: '<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7"/>', run: () => $('#chatFile').click() },
  { cmd: '/not', label: 'not', title: 'Nota kaydet', hint: 'Son cevabı nota kaydet', svg: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 11h8M8 15h5"/>', run: () => { const i = chat.map((m) => m.role !== 'user' && !m.err && !m.live).lastIndexOf(true); if (i < 0) toast('Kaydedilecek cevap yok.'); else saveNote(chat[i].title || (chat[i - 1]?.text || 'Not').slice(0, 60), chat[i].text); } },
  { cmd: '/yanitla', label: 'yanıtla', title: 'Son cevaba yanıt', hint: 'Son cevabı alıntılayarak yaz', svg: '<path d="M10 8 5 12.5l5 4.5"/><path d="M5 12.5h9a5 5 0 0 1 5 5V19"/>', run: () => { const m = [...chat].reverse().find((x) => x.role !== 'user' && !x.err && !x.live); if (m) startReply(m); else toast('Yanıtlanacak cevap yok.'); } },
  { cmd: '/indir', label: 'indir', title: 'Sohbeti indir', hint: 'Sohbeti .md olarak indir', svg: '<path d="M12 3v12M7 10l5 5 5-5M5 19h14"/>', run: () => $('#expChat').click() },
  { cmd: '/model', label: 'model', title: 'Model seç', hint: 'Model penceresini aç', svg: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>', run: () => $('#modelDlg').showModal() },
  { cmd: '/temizle', label: 'temizle', title: 'Sohbeti temizle', hint: 'Bu defterin sohbetini sil', svg: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', run: () => $('#clearChat').click() },
];
const fold = (t) => t.toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]));
function runSlash(t) {
  const [, head, rest] = t.match(/^(\S+)\s*([\s\S]*)$/); const c = CMDS.find((x) => x.cmd === fold(head)); if (!c) return false;
  const arg = rest.trim();
  if (c.arg === 'need' && !arg) { askArg(c); return true; }
  q.value = ''; q.style.height = 'auto'; closeCmds(); c.run(arg, t.trim()); return true;
}
/* yanına bir şey yazılması gereken komut: yazı kutusuna konur, örnek gösterilir */
function askArg(c) { q.value = c.cmd + ' '; closeCmds(); q.focus(); q.setSelectionRange(q.value.length, q.value.length); toast(`${c.title}: yanına ne istediğini yaz, ör. ${c.ex}`); }
const plain = (t) => String(t || '').replace(/\[(\d+)\]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#>|]/g, '').replace(/\s+/g, ' ').trim();
const lastAnswer = () => [...chat].reverse().find((m) => m.role !== 'user' && !m.err && !m.live && !m.via && m.kind !== 'slides' && !m.img && !m.audio && !m.video && m.text);
/* sohbetten Stüdyo'ya emir: iş ilgili stüdyoda yapılır, komut ve sonuç sohbette görünür */
function studioCmd(kind, arg, raw) {
  const G = window.defterHub?.gen; if (!G) { toast('Stüdyolar yüklenemedi.'); return; }
  const [via, label] = { image: ['Görsel', 'Görsel üretiliyor'], tts: ['Ses', 'Seslendiriliyor'], music: ['Müzik', 'Müzik üretiliyor'], video: ['Video', 'Video üretiliyor'], web: ['Web', 'Aranıyor'], stt: ['Yazıya dök', 'Yazıya dökülüyor'] }[kind];
  const go = (run, cmd = raw) => chatTask({ cmd, via, label, run }).catch(() => {});
  if (kind === 'image') return go(async (set) => {
    let p = arg;
    if (!p) {
      const on = enabledSources(); if (!on.length) throw new Error('Ne çizilsin? /ciz yanına istemi yaz ya da önce kaynak seç.');
      await G.need('Görsel stüdyosu'); set('Kaynaklardan görsel istemi yazılıyor…');
      try { if (engine.kind === 'none' || engine.kind === 'demo') throw 0; p = await G.imagePrompt(on.map((s) => s.text.slice(0, 1500)).join('\n\n')); } catch { p = `clean editorial illustration about ${on.map((s) => s.title).join(', ').slice(0, 120)}`; }
    }
    return G.image({ prompt: p }, set);
  });
  if (kind === 'tts') return go(async (set) => { let t = arg; if (!t) { const m = lastAnswer(); if (!m) throw new Error('Seslendirilecek metin yok: /seslendir yanına metni yaz.'); t = plain(m.text); } return G.speech({ text: t.slice(0, 4000) }, set); });
  if (kind === 'music') return go((set) => G.music({ prompt: arg }, set));
  if (kind === 'video') return go((set) => G.video({ prompt: arg }, set));
  if (kind === 'web') return go(async (set) => G.webMsg(arg, await G.web(arg, set)));
  if (kind === 'stt') {
    const inp = el('input', { type: 'file', accept: 'audio/*,video/*' });
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; go(async (set) => { const t = await transcribe(f, { name: f.name, onPhase: set }); return { text: t ? `**Yazıya döküm · ${f.name}**\n\n${t}` : `${f.name}: konuşma bulunamadı.` }; }, `/dok ${f.name}`); };
    inp.click();
  }
}
/* komut balonundan yeniden üret: /komut, açık emir ya da Araçlar adı */
function redo(t) {
  if (t.startsWith('/') && runSlash(t)) return; if (naturalCmd(t)) return;
  const st = STUDIO.find((x) => x.label === t); if (st) return studio(st);
  const ty = Object.keys(TYPES).find((k) => TYPES[k].label === t); if (ty) return makeRich(ty);
  ask(t);
}
/* "/" olmadan yazılan açık emirler: "… çiz", "… resmini oluştur", "… seslendir", "… videosu üret", "… müziği üret", "web'de … ara" */
const NAT = [
  [/^(.{3,}?)\s+(?:resmi(?:ni)?|görseli(?:ni)?|fotoğrafı(?:nı)?|çizimi(?:ni)?)\s+(?:çiz|oluştur|üret|yap)\s*[.!]*$/i, 'image'],
  [/^(.{3,}?)\s+çiz\s*[.!]*$/i, 'image'],
  [/^(.{3,}?)\s+(?:videosu(?:nu)?)\s+(?:oluştur|üret|yap|çek)\s*[.!]*$/i, 'video'],
  [/^(.{3,}?)\s+(?:müziği(?:ni)?|müzik|şarkısı(?:nı)?|şarkı)\s+(?:oluştur|üret|yap|bestele)\s*[.!]*$/i, 'music'],
  [/^(?:bunu|son cevabı|cevabı|onu)\s+seslendir\s*[.!]*$/i, 'tts', ''],
  [/^seslendir\s*[:,-]\s*(.+)$/i, 'tts'],
  [/^(?:web(?:'?de|’?de)|internette|google'?da)\s+(.{2,}?)\s+(?:ara|araştır)\s*[.!]*$/i, 'web'],
];
function naturalCmd(t) {
  if (t.length > 400) return false;
  for (const [rx, kind, fixed] of NAT) { const m = t.match(rx); if (m) { q.value = ''; q.style.height = 'auto'; closeCmds(); studioCmd(kind, fixed ?? m[1].trim(), t); return true; } }
  return false;
}
/* Yazarken açılan komut listesi */
let cmdSel = 0, cmdList = [];
const cmdPop = $('#cmdPop');
function closeCmds() { cmdPop.hidden = true; q.removeAttribute('aria-activedescendant'); q.setAttribute('aria-expanded', 'false'); }
function showCmds() {
  const v = q.value; if (!/^\/\S*$/.test(v)) { closeCmds(); return; }
  cmdList = CMDS.filter((c) => c.cmd.startsWith(fold(v)) || fold(c.title).includes(fold(v.slice(1))));
  cmdSel = Math.min(cmdSel, Math.max(0, cmdList.length - 1));
  cmdPop.replaceChildren(...(cmdList.length ? cmdList.map((c, i) => el('button', { type: 'button', id: 'cmd-' + i, className: 'cmdOpt' + (i === cmdSel ? ' on' : ''), role: 'option', ariaSelected: String(i === cmdSel), tabIndex: -1, onmousedown: (e) => e.preventDefault(), onclick: () => pickCmd(i) },
    el('span', { className: 'cmdIc', innerHTML: CI(c.svg) }), el('code', { textContent: c.cmd }), el('span', { className: 'cmdHint', textContent: c.hint }))) : [el('div', { className: 'cmdNone', textContent: 'Komut bulunamadı' })]));
  cmdPop.hidden = false; q.setAttribute('aria-expanded', 'true'); if (cmdList.length) q.setAttribute('aria-activedescendant', 'cmd-' + cmdSel);
  cmdPop.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
}
function pickCmd(i) { const c = cmdList[i]; if (!c) return; if (c.arg) { askArg(c); return; } q.value = ''; q.style.height = 'auto'; closeCmds(); c.run('', c.cmd); }
q.addEventListener('input', () => { cmdSel = 0; showCmds(); });
q.addEventListener('blur', () => setTimeout(closeCmds, 120));
q.addEventListener('keydown', (e) => {
  if (cmdPop.hidden || !cmdList.length) { if (e.key === 'Escape' && replyTo) { e.stopPropagation(); cancelReply(); } return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); cmdSel = (cmdSel + (e.key === 'ArrowDown' ? 1 : -1) + cmdList.length) % cmdList.length; showCmds(); }
  else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); pickCmd(cmdSel); }
  else if (e.key === 'Escape') { e.stopPropagation(); closeCmds(); }
}, true);
/* XML: "/ Komutlar" aç-kapa düğmesi + yana kayan kare kutucuklar */
{ const bar = $('#cmdBar'), track = $('#cmdTrack'), tg = $('#cmdToggle');
  const KEY = 'defter-cmdbar'; let col; try { const v = localStorage.getItem(KEY); col = v === '1' ? true : v === '0' ? false : innerWidth <= 640; } catch { col = innerWidth <= 640; }
  const set = (c) => { bar.classList.toggle('collapsed', c); tg.setAttribute('aria-expanded', String(!c)); };
  set(col);
  tg.onclick = () => { const c = !bar.classList.contains('collapsed'); set(c); try { localStorage.setItem(KEY, c ? '1' : '0'); } catch {} };
  track.append(...CMDS.map((c) => el('button', { type: 'button', className: 'cmdTile', title: `${c.title} (${c.cmd})`, onclick: () => (c.arg ? askArg(c) : c.run('', c.cmd)) }, el('span', { className: 'cmdOrb', innerHTML: CI(c.svg) }), el('span', { className: 'cmdLbl', textContent: c.label }))));
}
$('#stop').onclick = () => abortCtl?.abort();
$('#clearChat').onclick = async () => { if (busy) return; chat = []; cancelReply(); await DB.set('chat:' + nb.id, []); renderChat(); };
function download(name, text) { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/markdown' })), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('#expChat').onclick = () => download('defter-sohbet.md', '# Class sohbeti\n\n' + chat.map((m) => (m.role === 'user' ? `${m.reply ? `> @${m.reply.who}: ${m.reply.text}\n\n` : ''}**Sen:** ${m.text}${m.atts?.length ? `\n\n📎 ${m.atts.map((a) => a.name).join(', ')}` : ''}` : `**Class:**\n\n${m.text}`) + (m.rx ? `\n\n${m.rx}` : '')).join('\n\n---\n\n') + '\n');
$('#expNotes').onclick = () => download('defter-notlar.md', '# Class notları\n\n' + notes.slice().sort((a, b) => a.addedAt - b.addedAt).map((n) => `## ${n.title}\n\n${n.text}`).join('\n\n---\n\n') + '\n');
function setTab(t) { if (window.defterSlide?.take(t)) return; $('#cols').dataset.tab = t; document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); }
document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
Object.entries(TYPES).forEach(([k, T]) => { const b = el('button', { className: 'btn tile' }, el('span', { className: 'tIc', innerHTML: SIC[k] || '' }), el('b', { textContent: T.label })); b.title = T.sub; b.onclick = () => makeRich(k); $('#studioBtns').append(b); });
STUDIO.forEach((t) => { const b = el('button', { className: 'btn tile' }, el('span', { className: 'tIc', innerHTML: SIC[t.id] || '' }), el('b', { textContent: t.label })); b.title = t.sub; b.onclick = () => studio(t); $('#studioBtns').append(b); });
/* Araçlar (Sesli özet, Zihin haritası, Quiz…): telefonda sohbetin üstündeki Tümü / Geçmiş / Tepkiler satırında kayan çipler */
{
  const rail = $('#chRail'), chip = (label, sub, ic, run) => { const b = el('button', { type: 'button', className: 'chGen', title: sub, ariaLabel: label, innerHTML: ic || '', onclick: run }); b.dataset.t = label; return b; };
  const sep = el('span', { className: 'chSep chGenSep' }); sep.setAttribute('aria-hidden', 'true');
  rail.append(sep, el('span', { className: 'chLbl', textContent: 'Araçlar' }),
    ...Object.entries(TYPES).map(([k, T]) => chip(T.label, T.sub, SIC[k], () => makeRich(k))),
    ...STUDIO.map((t) => chip(t.label, t.sub, SIC[t.id], () => studio(t))));
}

/* ---------------- Not defterleri (ana ekran) ---------------- */
const ICONS = ['📘', '🔬', '📚', '🧪', '🌍', '💡', '📊', '🎓'];
const home = { filter: 'all', sort: 'recent', query: '', more: false, shown: 0 };
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
  const list = visibleNotebooks(); const BATCH = 8; if (!home.shown) home.shown = BATCH;
  const mkCard = (n) => {
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
    return card;
  };
  let at = 0;
  const loadMore = () => { const next = list.slice(at, Math.min(list.length, at + (at ? BATCH : home.shown))); next.forEach((n) => grid.insertBefore(mkCard(n), sent || null)); at += next.length; home.shown = Math.max(home.shown, at); if (at >= list.length && sent) { sent.remove(); sent = null; } };
  let sent = null;
  if (list.length > home.shown) { sent = el('div', { className: 'nbSent', 'aria-hidden': 'true' }, el('span', { className: 'nbCard sk' }), el('span', { className: 'nbCard sk' })); grid.append(sent); }
  loadMore();
  home.off?.(); home.off = null;
  if (sent) {
    const hm = $('#home'); let raf = 0;
    const check = () => { raf = 0; if (!sent) return; const r = sent.firstChild.getBoundingClientRect(), b = hm.getBoundingClientRect(); if (r.top < b.bottom + 240) { loadMore(); if (sent) raf = requestAnimationFrame(check); } };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    hm.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    home.off = () => { hm.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
    on();
  }
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
  n.title = t.trim() || 'Adsız not defteri'; await DB.put('notebooks', n); if (nb && nb.id === n.id) { $('#nbTitle').value = n.title; document.title = `${n.title} — Class`; } if (!nb) renderHome();
}
async function deleteNb(n) {
  if (!confirm(`"${n.title}" not defteri, kaynakları ve notlarıyla birlikte silinsin mi?`)) return;
  for (const x of (await DB.all('sources')).filter((x) => x.nbId === n.id)) await DB.del('sources', x.id);
  for (const x of (await DB.all('notes')).filter((x) => x.nbId === n.id)) await DB.del('notes', x.id);
  for (const x of (await DB.all('outputs')).filter((x) => x.nbId === n.id)) await DB.del('outputs', x.id);
  await DB.del('notebooks', n.id); await DB.set('chat:' + n.id, []); await DB.set(histKey(n.id), []); notebooks = notebooks.filter((x) => x.id !== n.id);
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
  setView('nb'); $('#nbTitle').value = n.title; document.title = `${n.title} — Class`;
  if (location.hash !== '#nb-' + id) history.pushState(null, '', '#nb-' + id);
  cancelReply(); pending.forEach((f) => f.url && URL.revokeObjectURL(f.url)); pending = []; renderPending();
  setTab('chat'); renderSources(); renderNotes(); renderOutputs(); renderChat(); updateHistN();
}
function goHome() {
  if (busy) return; nb = null; sources = []; notes = []; outputs = []; chat = []; closeMenu();
  setView('home'); document.title = 'Class';
  if (location.hash) history.pushState(null, '', location.pathname + location.search);
  renderHome();
}
$('#backBtn').onclick = goHome;
$('#homeLink').onclick = (e) => { e.preventDefault(); goHome(); };
$('#newPill').onclick = createNb; $('#newNbBtn').onclick = createNb;
$('#nbTitle').onchange = async (e) => { if (!nb) return; nb.title = e.target.value.trim() || 'Adsız not defteri'; e.target.value = nb.title; document.title = `${nb.title} — Class`; await touchNb(); };
$('#nbTitle').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
window.addEventListener('popstate', () => { const m = location.hash.match(/^#nb-(.+)$/); if (m) openNb(m[1]); else { busy = false; goHome(); } });

// üst çubuk menüleri
$('#filterBtn').onclick = () => showMenu($('#filterBtn'), Object.entries(FILTERS).map(([k, v]) => ({ label: v, check: home.filter === k, run: () => { home.filter = k; home.more = false; home.shown = 0; renderHome(); } })), { align: 'left' });
$('#sortBtn').onclick = () => showMenu($('#sortBtn'), Object.entries(SORTS).map(([k, v]) => ({ label: v, check: home.sort === k, run: () => { home.sort = k; renderHome(); } })));
$('#searchBtn').onclick = () => { if (window.defterSearch) window.defterSearch.open(); else { $('#searchBar').hidden = false; $('#nbSearch').focus(); } };
$('#searchClose').onclick = () => { $('#searchBar').hidden = true; $('#nbSearch').value = ''; home.query = ''; renderHome(); };
$('#nbSearch').oninput = (e) => { home.query = e.target.value.trim(); home.more = false; home.shown = 0; renderHome(); };
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
    ...(window.defterShell?.menuItems() || []),
  ]);
};
$('#moreBtn').onclick = () => showMenu($('#moreBtn'), [
  { icon: 'edit', label: 'Başlığı düzenle', run: () => { $('#nbTitle').focus(); $('#nbTitle').select(); } },
  { icon: 'share', label: 'Notları indir (.md)', run: () => $('#expNotes').click() },
  { icon: 'share', label: 'Sohbeti indir (.md)', run: () => $('#expChat').click() },
  { icon: 'plus', label: 'Yeni sohbet', sub: 'Açık sohbet geçmişe taşınır', run: () => newChat() },
  { icon: 'chat', label: 'Sohbet geçmişi', run: () => openHist() },
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
  chat.push({ id: uid(), at: Date.now(), role: 'user', cmd: true, text: T.label }); renderChat(); setTab('chat');
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
    outputs.push(out); await DB.put('outputs', out); touchNb(); renderOutputs(); chat.push({ id: uid(), role: 'assistant', kind: 'slides', outId: out.id, text: `${T.emoji} ${out.title} (${T.label})`, at: Date.now() }); renderChat(); persistChat(); setTab('chat'); toast(`${T.label} hazır.`);
    studioFollow(out);
  } catch (e) {
    const msg = abortCtl?.signal.aborted ? 'Üretim durduruldu.' : `${T.label} üretilemedi: ${e.message || e}. Tekrar dene ya da daha büyük bir model seç.`;
    toast(msg); chat.push({ id: uid(), role: 'assistant', err: true, text: msg, at: Date.now() }); renderChat(); persistChat();
  }
  finally { busy = false; abortCtl = null; showGen(false); }
}
/* Araçlar → Stüdyo: Sesli özet Ses stüdyosunda iki sesli dosyaya, Görsel özet Görsel stüdyosunda resme dönüşür; sonuç sohbete düşer.
   Yerel sunucu yoksa atlanır (Sesli özet yine tarayıcının sesiyle dinlenebilir). */
async function studioFollow(out) {
  const H = window.defterHub; if (!H?.gen) return;
  if (!(await H.server()).ok) return;
  if (out.type === 'podcast' && out.data.turns?.length) {
    chatTask({ via: 'Ses', label: 'Ses stüdyosu seslendiriyor', run: async (set) => { const blob = await H.gen.podcast(out.data.turns, {}, set); out.audioBlob = blob; await DB.put('outputs', out); return { blob, text: `${out.title} · Sesli özet` }; } }).catch(() => {});
  } else if (out.type === 'infographic') {
    chatTask({ via: 'Görsel', label: 'Görsel stüdyosu çiziyor', run: async (set) => {
      set('Görsel istemi yazılıyor…'); let p;
      try { if (engine.kind === 'demo') throw 0; p = await H.gen.imagePrompt(`${out.title}\n${JSON.stringify(out.data).slice(0, 3000)}`); } catch { p = `clean editorial infographic illustration about ${out.title}`; }
      return H.gen.image({ prompt: p }, set);
    } }).catch(() => {});
  }
}

function renderOutputs() {
  const ul = $('#outList'); ul.replaceChildren();
  const all = [...outputs.filter((o) => TYPES[o.type]).map((o) => ({ o, at: o.createdAt })), ...notes.map((n) => ({ n, at: n.addedAt }))].sort((a, b) => b.at - a.at);
  all.forEach(({ o, n }) => {
    const T = o && TYPES[o.type]; const title = o ? o.title : n.title;
    const open = () => (o ? openOutput(o) : openNote(n));
    const menu = el('button', { type: 'button', className: 'x', title: 'Diğer', ariaLabel: `${title}: seçenekler`, innerHTML: IC.more || '⋯' });
    menu.onclick = (e) => { e.stopPropagation(); showMenu(menu, [
      { icon: 'expand', label: 'Aç', run: open },
      { icon: 'reply', label: 'Sohbette göster', run: () => (o ? outToChat(o) : noteToChat(n)) },
      ...(n ? [{ icon: 'share', label: 'Kopyala', run: () => navigator.clipboard?.writeText(n.text) }] : []),
      '-', { icon: 'trash', label: 'Sil', danger: true, run: async () => { if (o) { await DB.del('outputs', o.id); outputs = outputs.filter((x) => x.id !== o.id); renderOutputs(); } else await delNote(n); } },
    ]); };
    const li = el('li', { className: 'outItem', tabIndex: 0, role: 'button' }, el('span', { className: 'tIc', innerHTML: o ? SIC[o.type] || '' : noteIc(n) }), el('div', { className: 't' }, el('b', { textContent: title, title }), el('small', { textContent: `${o ? T.label : 'Not'} · ${fmtDate(o ? o.createdAt : n.addedAt)}` })), menu);
    li.onclick = open; li.onkeydown = (e) => { if (e.target === li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } };
    ul.append(li);
  });
  $('#outHint').hidden = all.length > 0;
  { const no = outputs.filter((o) => TYPES[o.type]).length; $('#noteCount').textContent = `${notes.length} not` + (no ? ` · ${no} çıktı` : ''); }
}

let vwCleanup = null;
function openOutput(o) {
  const dlg = $('#vwDlg'); const actions = $('#vwActions'); actions.replaceChildren(); $('#vwBody').replaceChildren(); $('#vwTitle').textContent = o.title;
  vwCleanup?.(); const r = renderOutput(o, actions); actions.prepend(el('button', { className: 'btn sm', type: 'button', textContent: 'Sohbette göster', onclick: () => { dlg.close(); outToChat(o); } })); $('#vwBody').append(r.node); vwCleanup = r.cleanup || null;
  if (!dlg.open) dlg.showModal();
}
$('#vwClose').onclick = () => $('#vwDlg').close();
$('#vwDlg').addEventListener('close', () => { vwCleanup?.(); vwCleanup = null; });

/* ---------------- Cihaz tanılama ---------------- */
function diagnose() {
  const ua = navigator.userAgent; const yes = (v) => (v ? 'var' : 'YOK');
  let wasmOk = 'YOK';
  try { if (typeof WebAssembly === 'object') wasmOk = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])) ? 'var (çalışıyor)' : 'var ama doğrulama başarısız'; } catch (e) { wasmOk = 'hata: ' + e.message; }
  const hint = [];
  if (/; wv\)/.test(ua) || /FBAN|FBAV|Instagram|WhatsApp|Line\/|Telegram|Snapchat|Twitter/i.test(ua)) hint.push('Uygulama içi tarayıcı (WebView) görünüyor; sayfayı Chrome\'da aç.');
  if (/VivoBrowser|vivo/i.test(ua) && /Browser/i.test(ua)) hint.push('Vivo Tarayıcı görünüyor; Chrome ya da Firefox dene.');
  if (typeof WebAssembly !== 'object') hint.push('WebAssembly yok: tarayıcıda JIT/V8 optimizasyonu kapalı olabilir ya da bu tarayıcı desteklemiyor.');
  return [
    `Tarayıcı kimliği: ${ua}`, `WebAssembly: ${wasmOk}`, `SharedArrayBuffer: ${yes(typeof SharedArrayBuffer !== 'undefined')}`, `crossOriginIsolated: ${window.crossOriginIsolated}`,
    `WebGPU: ${yes(navigator.gpu)}`, `Güvenli bağlam (https): ${window.isSecureContext}`, `Çekirdek sayısı: ${navigator.hardwareConcurrency || '?'}`, `Bellek (yaklaşık, GB): ${navigator.deviceMemory || '?'}`,
    `Depolama sürekli izni: ${navigator.storage?.persist ? 'desteklenir' : 'yok'}`, hint.length ? `\nİpucu: ${hint.join(' ')}` : '',
  ].filter((x) => x !== '').join('\n');
}
$('#diagBox').addEventListener('toggle', () => { if ($('#diagBox').open) $('#diag').textContent = diagnose(); });
$('#diagCopy').onclick = async () => { const t = diagnose(); try { await navigator.clipboard.writeText(t); $('#diagCopy').textContent = 'Kopyalandı'; } catch { $('#diag').textContent = t; const r = document.createRange(); r.selectNodeContents($('#diag')); getSelection().removeAllRanges(); getSelection().addRange(r); $('#diagCopy').textContent = 'Seçildi, elle kopyala'; } setTimeout(() => ($('#diagCopy').textContent = 'Kopyala'), 1800); };
$('#loadBtn').addEventListener('click', () => { if (typeof WebAssembly === 'undefined') { $('#diagBox').open = true; } });

/* ---------------- Tam ekran pencereler + çerez bildirimi ---------------- */
function fsInit(d) {
  if (d.querySelector(':scope > .fsBar')) return;
  const bar = document.createElement('div'); bar.className = 'fsBar';
  bar.innerHTML = '<b></b><button type="button" title="Kapat (Esc)" aria-label="Kapat (Esc)"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
  bar.firstChild.textContent = d.dataset.title || '';
  bar.lastChild.onclick = () => d.close();
  d.append(bar);
  d.addEventListener('click', (e) => { if (e.target === d || e.target.classList.contains('dlg')) d.close(); });
}
document.querySelectorAll('dialog.fs').forEach(fsInit);
/* Telefonda tam ekran pencereler Stüdyo sayfası şablonunda: üstte tutamaç (aşağı çekince kapanır), altta kapat çubuğu */
function fsGrip(d) {
  if (d.querySelector(':scope > .fsGrip')) return;
  const g = el('button', { type: 'button', className: 'fsGrip', title: 'Aşağı çekerek kapat', ariaLabel: 'Aşağı çekerek kapat' }, el('span'));
  g.addEventListener('pointerdown', (e) => {
    const y0 = e.clientY; let dy = 0; try { g.setPointerCapture(e.pointerId); } catch {} d.classList.add('fsDrag');
    const mv = (v) => { dy = Math.max(0, v.clientY - y0); d.style.transform = `translateY(${dy}px)`; };
    const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up); d.classList.remove('fsDrag'); d.style.transform = ''; if (dy > Math.min(160, d.offsetHeight * 0.25)) d.close(); };
    g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
  d.prepend(g);
}
document.querySelectorAll('dialog.fs').forEach(fsGrip);
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches?.('dialog.fs')) { fsGrip(n); n.querySelector(':scope > .fsBar') || fsInit(n); } }).observe(document.body, { childList: true });
const CK = 'defter_cookie_ok_v1';
(() => {
  let seen = false; try { seen = localStorage.getItem(CK) === '1'; } catch {}
  const d = $('#cookieDlg'); if (seen) return;
  const ok = () => { try { localStorage.setItem(CK, '1'); } catch {} };
  d.addEventListener('close', ok); $('#ckOk').onclick = () => d.close();
  d.showModal(); $('#ckOk').focus();
})();

/* ---------------- Başlangıç ---------------- */
(async () => {
  notebooks = await DB.all('notebooks');
  
  if (params.has('demo')) { engine.kind = 'demo'; setModelUi('ok', 'Demo kipi (model yok)'); }
  const m = location.hash.match(/^#nb-(.+)$/);
  if (m && notebooks.some((x) => x.id === m[1])) await openNb(m[1]); else { setView('home'); await renderHome(); }
  if (!crossOriginIsolated && !params.has('nocoi')) toast('Not: çok çekirdekli mod için sayfa bir kez yenilenebilir (service worker).');
  const cap = capabilityNote();
  if (cap.blocked) { $('#dlText').textContent = cap.text; $('#loadBtn').disabled = true; $('#loadBtn').title = 'Bu tarayıcıda WebAssembly kapalı'; }
  else navigator.storage?.estimate?.().then((e) => { if (e?.quota) $('#dlText').textContent = [cap.text, `Tarayıcı depolama kotası: ≈${(e.quota / 1e9).toFixed(1)} GB`].filter(Boolean).join(' '); });
})();

/* kabuk (shell.js) için köprü */
async function exportAll() { const o = { app: 'Class', version: 1, at: new Date().toISOString() }; for (const s of ['notebooks', 'sources', 'notes', 'outputs', 'kv']) o[s] = await DB.all(s); return o; }
async function importAll(o) {
  if (!o || o.app !== 'Class') throw new Error('Bu bir Class yedeği değil.');
  let n = 0; for (const s of ['notebooks', 'sources', 'notes', 'outputs', 'kv']) for (const v of o[s] || []) { await DB.put(s, v); n++; }
  notebooks = await DB.all('notebooks'); goHome(); return n;
}
async function complete(messages, opts = {}) { if (needModel()) throw new Error('Önce bir model ya da motor seçin.'); let t = ''; await chatStream(messages, { ...opts, onToken: (x) => { t += x; } }); return t; }
async function addSourceExt(title, text, kind) { if (!nb) throw new Error('Önce bir not defteri açın.'); await addSource(title, text, kind); }
async function addChatMedia(m) { if (!nb) throw new Error('Önce bir not defteri açın.'); chat.push({ id: uid(), role: 'assistant', at: Date.now(), ...m }); renderChat(); await persistChat(); }
function setEngine(kind, label, nctx) { engine.kind = kind; engine.label = label; if (nctx) engine.nctx = nctx; setModelUi(kind === 'none' ? '' : 'ok', label || 'Model yüklenmedi'); }
window.defterApp = { chatTask, chatFiles, lastAnswer: () => lastAnswer(), md, putOutput: async (o) => { await DB.put('outputs', o); }, openOutput, complete, addSource: addSourceExt, addChatMedia, transcribe, enabledSources: () => enabledSources(), toast, CFG, saveCfg, engine, setEngine, exportAll, importAll, diagnose, setTab, searchData: async () => ({ notebooks, sources: await DB.all('sources'), notes: await DB.all('notes') }), notebooks: () => notebooks, current: () => nb, openNb, createNb, goHome, showMenu, closeMenu, setTheme, getTheme, IC, openModel: () => $('#modelDlg').showModal() };
document.dispatchEvent(new Event('defter-ready'));
