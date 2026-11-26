// Defter — tarayıcıda çalışan, kaynaklarla sohbet eden yerel yapay zekâ arayüzü.
// Model: wllama (llama.cpp'nin WASM/WebGPU sürümü). Hiçbir veri sunucuya gönderilmez.

const $ = (s, r = document) => r.querySelector(s);
const el = (t, props = {}, ...kids) => { const e = Object.assign(document.createElement(t), props); kids.flat().forEach((k) => e.append(k)); return e; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const params = new URLSearchParams(location.search);

/* ---------------- Depolama (IndexedDB) ---------------- */
const DB = (() => {
  let p;
  const open = () => (p ||= new Promise((res, rej) => {
    const r = indexedDB.open('defter', 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('sources', { keyPath: 'id' }); d.createObjectStore('notes', { keyPath: 'id' }); d.createObjectStore('kv', { keyPath: 'key' }); };
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

async function chatStream(messages, { maxTokens = 700, temperature = 0.3, signal, onToken, demo }) {
  if (engine.kind === 'demo') {
    const text = demo || 'Demo kipi: model yüklü değil.';
    for (let i = 0; i < text.length; i += 6) { if (signal?.aborted) break; onToken(text.slice(i, i + 6)); await new Promise((r) => setTimeout(r, 12)); }
    return;
  }
  const stream = await engine.wllama.createChatCompletion({ messages, stream: true, max_tokens: maxTokens, temperature, abortSignal: signal });
  for await (const chunk of stream) { const d = chunk?.choices?.[0]?.delta?.content; if (d) onToken(d); if (signal?.aborted) break; }
}

/* ---------------- Durum ---------------- */
let sources = [], notes = [], chat = [], busy = false, abortCtl = null;
const enabledSources = () => sources.filter((s) => s.enabled !== false);
const budgetChars = (reserve = 0) => Math.max(1500, Math.round((engine.nctx - 900) * 2.4) - reserve);

/* ---------------- Görünüm ---------------- */
function renderSources() {
  const ul = $('#srcList'); ul.replaceChildren();
  sources.forEach((s) => {
    const cb = el('input', { type: 'checkbox', checked: s.enabled !== false, ariaLabel: `${s.title} kaynağını kullan` });
    cb.onchange = async () => { s.enabled = cb.checked; await DB.put('sources', s); renderSources(); };
    const del = el('button', { className: 'x', title: 'Kaldır', ariaLabel: `${s.title} kaynağını kaldır`, textContent: '✕' });
    del.onclick = async () => { await DB.del('sources', s.id); sources = sources.filter((x) => x.id !== s.id); renderSources(); };
    ul.append(el('li', {}, cb, el('div', { className: 't' }, el('b', { textContent: s.title, title: s.title }), el('small', { textContent: `${s.kind} · ${(s.text.length / 1000).toFixed(1)}k karakter` })), del));
  });
  const on = enabledSources().length;
  $('#srcCount').textContent = `${sources.length} kaynak · ${on} seçili`;
  $('#srcHint').hidden = sources.length > 0;
  $('#selAll').checked = sources.length > 0 && on === sources.length;
  $('#q').placeholder = on ? 'Seçili kaynaklara bir soru sor…' : 'Bir şey sor (kaynak seçili değil, normal sohbet)…';
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
    const save = el('button', { className: 'btn sm', textContent: 'Nota kaydet' });
    save.onclick = () => saveNote(m.title || (chat[i - 1]?.text || 'Not').slice(0, 60), m.text);
    d.append(el('div', { className: 'acts' }, save));
  }
  return d;
}
async function saveNote(title, text) { const n = { id: uid(), title, text, addedAt: Date.now() }; notes.push(n); await DB.put('notes', n); renderNotes(); toast('Nota kaydedildi'); }
function toast(t) { $('#ctxInfo').textContent = t; }
function setModelUi(state, label) {
  $('#modelDot').className = `dot ${state}`; $('#modelLabel').textContent = label; $('#modelBtn').textContent = state === 'ok' ? 'Modeli değiştir' : 'Model seç';
}

/* ---------------- Üretim akışı ---------------- */
function needModel() {
  if (engine.kind === 'wllama' || engine.kind === 'demo') return false;
  $('#modelDlg').showModal(); return true;
}
async function persistChat() { await DB.set('chat', chat.filter((m) => !m.live).slice(-60)); }

async function run({ userText, shownText, messages, cites, title, maxTokens, demo }) {
  if (busy) return;
  busy = true; abortCtl = new AbortController();
  $('#send').hidden = true; $('#stop').hidden = false;
  chat.push({ role: 'user', text: shownText ?? userText });
  const reply = { role: 'assistant', text: '', live: true, cites, title };
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
  { id: 'quiz', label: 'Quiz', sub: 'Çoktan seçmeli', p: 'Kaynaklara dayanan 5 çoktan seçmeli soru hazırla. Her soruda A, B, C, D şıkları olsun; sorunun altında "Doğru cevap:" yaz.' },
  { id: 'harita', label: 'Zihin haritası', sub: 'Ana hat', p: 'Kaynakların zihin haritasını iç içe madde işaretli bir ana hat olarak çıkar: ana konu, 4-6 dal, her dalda 2-4 alt madde.' },
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
  const s = { id: uid(), title, text, kind, enabled: true, addedAt: Date.now() }; sources.push(s); await DB.put('sources', s); renderSources();
}
$('#addFile').onclick = () => $('#fileInput').click();
$('#fileInput').onchange = async (e) => {
  for (const f of e.target.files) { try { toast(`${f.name} okunuyor…`); await addSource(f.name, await readFile(f), /\.pdf$/i.test(f.name) ? 'PDF' : 'Dosya'); toast(''); } catch (err) { toast(`${f.name} okunamadı: ${err.message || err}`); } }
  e.target.value = '';
};
$('#addText').onclick = () => { $('#textTitle').value = ''; $('#textBody').value = ''; $('#textDlg').showModal(); };
$('#textSave').onclick = async () => { await addSource($('#textTitle').value.trim() || 'Yapıştırılan metin', $('#textBody').value, 'Metin'); $('#textDlg').close(); };
$('#selAll').onchange = async (e) => { for (const s of sources) { s.enabled = e.target.checked; await DB.put('sources', s); } renderSources(); };

/* ---------------- Model penceresi ---------------- */
const presetBox = $('#presets');
PRESETS.forEach((p, i) => presetBox.append(el('label', { className: 'preset' }, el('input', { type: 'radio', name: 'preset', value: p.id, checked: i === 1 }), el('div', {}, el('b', { textContent: p.name }), el('small', { textContent: p.note })))));
$('#modelBtn').onclick = () => $('#modelDlg').showModal();
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
$('#clearChat').onclick = async () => { if (busy) return; chat = []; await DB.set('chat', []); renderChat(); };
function download(name, text) { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/markdown' })), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('#expChat').onclick = () => download('defter-sohbet.md', '# Defter sohbeti\n\n' + chat.map((m) => (m.role === 'user' ? `**Sen:** ${m.text}` : `**Defter:**\n\n${m.text}`)).join('\n\n---\n\n') + '\n');
$('#expNotes').onclick = () => download('defter-notlar.md', '# Defter notları\n\n' + notes.slice().sort((a, b) => a.addedAt - b.addedAt).map((n) => `## ${n.title}\n\n${n.text}`).join('\n\n---\n\n') + '\n');
function setTab(t) { $('#cols').dataset.tab = t; document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); }
document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
STUDIO.forEach((t) => { const b = el('button', { className: 'btn' }, el('b', { textContent: t.label }), el('small', { textContent: t.sub })); b.onclick = () => studio(t); $('#studioBtns').append(b); });

/* ---------------- Başlangıç ---------------- */
(async () => {
  [sources, notes, chat] = await Promise.all([DB.all('sources'), DB.all('notes'), DB.get('chat').then((c) => c || [])]);
  sources.sort((a, b) => a.addedAt - b.addedAt); renderSources(); renderNotes(); renderChat();
  const last = await DB.get('lastModel'); if (last) $('#modelLabel').textContent = `Son model: ${last.label} (yüklemek için "Model seç")`;
  if (params.has('demo')) { engine.kind = 'demo'; setModelUi('ok', 'Demo kipi (model yok)'); }
  if (!crossOriginIsolated && !params.has('nocoi')) $('#ctxInfo').textContent = 'Not: çok çekirdekli mod için sayfa bir kez yenilenebilir (service worker).';
  navigator.storage?.estimate?.().then((e) => { if (e?.quota) $('#dlText').textContent = `Tarayıcı depolama kotası: ≈${(e.quota / 1e9).toFixed(1)} GB`; });
})();
