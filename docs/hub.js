/* Class Stüdyoları: eski stüdyonun (Sansürsüz Lokal AI Stüdyosu) yerel sunucu özellikleri, Plus UI panelleri olarak.
   Görsel (Stable Diffusion), Ses (Kokoro/EMA TTS), Yazıya dök (Whisper), Müzik, Video, Web (arama + adres), Modeller, Sistem.
   Her panel bir kez oluşturulur; hem "Stüdyolar" penceresinde hem çalışma alanında (dock) aynı öğe kullanılır. */
import { pi } from './icons.js';
import { pConvert, ICON as CONVERT_ICON } from './convert.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-') || n === 'list' || n === 'for') e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const A = () => window.defterApp;
const sv = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  image: sv('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.5-4.5L7 20"/>'),
  speak: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/>'),
  mic: sv('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>'),
  music: sv('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  video: pi('youtube'), web: pi('search-normal-1'), models: pi('labs'), system: pi('speedometer'),
};
const isLocal = () => /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
async function J(url, opt = {}) {
  if (srvState && !srvState.ok && url.startsWith('/')) throw Object.assign(new Error(OFF), { off: true });
  const o = { ...opt }; if (o.body && typeof o.body !== 'string' && !(o.body instanceof Blob)) { o.body = JSON.stringify(o.body); o.headers = { 'Content-Type': 'application/json', ...(o.headers || {}) }; }
  const r = await fetch(url, o); const t = await r.text(); let j = {};
  try { j = JSON.parse(t || '{}'); } catch { throw new Error('Yerel sunucu yanıt vermedi ya da bu uç yok.'); }
  if (!r.ok || j.ok === false) throw new Error(j.error || j.detail || `HTTP ${r.status}`); return j;
}
let srvState = null;
const OFF = 'Yerel sunucu bağlı değil';
async function server() { if (srvState) return srvState; if (!isLocal()) return (srvState = { ok: false, why: 'pages' }); try { const h = await J('/api/health'); return (srvState = { ok: true, h }); } catch { return (srvState = { ok: false, why: 'down' }); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- ortak arayüz parçaları ---------- */
const btn = (label, onclick, cls = '') => el('button', { type: 'button', className: 'btn ' + cls, textContent: label, onclick });
const sec = (title, ...k) => el('section', { className: 'hbSec' }, el('h4', { textContent: title }), ...k);
const field = (label, ctrl, sub) => el('label', { className: 'hbF' }, el('span', {}, label, sub ? el('small', { textContent: sub }) : null), ctrl);
const input = (p) => el('input', { className: 'stIn', ...p });
const area = (p) => el('textarea', { className: 'stIn', rows: 3, ...p });
const select = (opts, p = {}) => el('select', { className: 'stIn', ...p }, ...opts.map(([v, l, dis]) => el('option', { value: v, textContent: l, disabled: !!dis })));
function chips(opts, cur, on) { const w = el('div', { className: 'stSeg' }); opts.forEach(([v, l]) => { const b = el('button', { type: 'button', className: 'stSegB' + (v === cur ? ' on' : ''), textContent: l }); b.onclick = () => { [...w.children].forEach((x) => x.classList.toggle('on', x === b)); on(v); }; w.append(b); }); return w; }
function rangeF(min, max, step, val, fmt, on) { const o = el('output', { textContent: fmt(val) }); const r = el('input', { type: 'range', className: 'stRange', min, max, step, value: val }); r.oninput = () => { o.textContent = fmt(+r.value); on(+r.value); }; return el('span', { className: 'stRg' }, r, o); }
function status() { const s = el('div', { className: 'hbStat', role: 'status' }); s.set = (t, kind = '') => { if (t === OFF) return; s.textContent = t || ''; s.dataset.k = kind; }; return s; }
function bar() { const b = el('div', { className: 'hbBar', hidden: true }, el('i')); b.set = (pct) => { b.hidden = pct == null; b.firstChild.style.width = Math.max(0, Math.min(100, pct || 0)) + '%'; }; return b; }
/* Sunucu yokken: panelin ayar menüsü yine görünür; üstte ince bir durum şeridi, üretim düğmeleri pasif */
const offBar = () => el('div', { className: 'hbOff', role: 'note' }, el('i', { 'aria-hidden': 'true' }),
  el('span', {}, el('b', { textContent: OFF }), el('small', { textContent: 'Ayarlar hazır; üretim sunucu açılınca çalışır.' })));
const needSrv = (what) => el('div', { className: 'hbList' }, offBar(), el('p', { className: 'muted', textContent: `${what} sunucu bağlanınca çalışır.` }));
async function gate(root, what, build) {
  const s = await server(); const ui = build();
  if (s.ok) { root.replaceChildren(ui); return; }
  ui.querySelectorAll('.btn.primary').forEach((b) => { b.disabled = true; b.title = OFF; });
  ui.querySelectorAll('select').forEach((x) => { if (x.options.length === 1 && /yükleniyor/i.test(x.options[0].textContent)) x.options[0].textContent = 'Sunucu bağlanınca listelenir'; });
  ui.querySelectorAll('.hbList:empty, .hbKV:empty').forEach((x) => x.append(el('p', { className: 'muted', textContent: 'Sunucu bağlanınca görünür.' })));
  root.classList.add('isOff'); root.replaceChildren(offBar(), ui);
}
function saveBlobLink(url, name) { const a = el('a', { className: 'btn', href: url, download: name, textContent: 'İndir' }); return a; }

/* ---------- Stüdyo işleri: paneller, sohbet /komutları ve Araçlar aynı fonksiyonları kullanır ----------
   Not defteri açıksa her iş sohbete düşer: komut balonu → canlı ilerleme → sonuç (görsel / ses / video / metin). */
const cut = (t, n = 140) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
async function task(cmd, via, label, run, st, pb) {
  const local = (t, pct) => { st?.set(t); if (pct != null) pb?.set(pct); };
  const app = A();
  if (app?.current?.() && app.chatTask) return app.chatTask({ cmd, via, label, run: (chatSet) => run((t, pct) => { local(t, pct); chatSet(t); }) });
  return run(local);
}
const done = (st, msg = 'Hazır') => st.set(A()?.current?.() ? `${msg} · sonuç sohbete eklendi.` : `${msg}. Sonucun sohbete düşmesi için bir not defteri aç.`, 'ok');
async function need(what) { const s = await server(); if (!s.ok) throw Object.assign(new Error(`Yerel sunucu bağlı değil — ${what} Class yerel sunucuyla (başlatıcı) açılınca çalışır.`), { off: true }); }
async function firstModel(url, what, ok = (m) => m.installed !== false) { const ms = (await J(url)).models || []; const m = ms.find(ok); if (!m) throw new Error(`${what} modeli yok — Stüdyo › Modeller’den indir.`); return m; }

export async function genImage({ prompt, neg = '', model, w = 512, h = 512, steps = 20, cfg = 7, seed = -1 }, set = () => {}) {
  await need('Görsel stüdyosu');
  if (!model) { const m = await firstModel('/api/models', 'Görsel', () => true); model = m.filename || m.name; }
  set('Görsel motoru hazırlanıyor…', 0);
  await J('/api/restart-backend', { method: 'POST', body: { model, width: w, height: h, steps, cfgScale: cfg, sampler: 'euler_a', backend_type: 'auto', autoSwap: true } });
  for (let i = 0; i < 300; i++) { const b = await J('/api/backend-status'); if (b.ready) break; if (b.error) throw new Error(b.error); await sleep(1000); }
  set('Görsel üretiliyor…', 0); let over = false;
  const poll = setInterval(async () => { try { const g = await J('/api/generation-progress'); if (over) return; const p = g.totalSteps ? (g.step / g.totalSteps) * 100 : g.progress; set(g.step ? `Görsel üretiliyor… ${g.step}/${g.totalSteps || steps}` : 'Görsel üretiliyor…', p); } catch {} }, 800);
  try {
    const j = await J('/sdapi/v1/txt2img', { method: 'POST', body: { prompt, negative_prompt: neg, width: w, height: h, steps, cfg_scale: cfg, seed: seed >= 0 ? seed : Math.floor(Math.random() * 1e6), sampler_name: 'euler_a', batch_size: 1 } });
    const b64 = String(j.images?.[0] || j.data?.[0]?.b64_json || '').replace(/^data:[^;]+;base64,/, ''); if (!b64) throw new Error('Sunucu görsel döndürmedi.');
    return { img: 'data:image/png;base64,' + b64, text: prompt };
  } finally { over = true; clearInterval(poll); }
}
/* kaynaklardan ya da verilen metinden tek bir İngilizce görsel istemi */
export async function imagePrompt(text) {
  const t = await A().complete([{ role: 'system', content: 'Write ONE vivid, concise English prompt (max 60 words) for a Stable Diffusion illustration that represents the main idea of the text. Output only the prompt.' }, { role: 'user', content: String(text).slice(0, 3500) }], { maxTokens: 160, temperature: 0.7 });
  return t.trim().replace(/^"|"$/g, '');
}
export async function genSpeech({ text, voice, model, speed = 1 }, set = () => {}) {
  await need('Ses stüdyosu'); set('Seslendiriliyor…');
  const o = await speak(text, { voice: voice || undefined, model: model || undefined, speed });
  return { audio: o.url, text: cut(text, 120), name: o.audioFile || 'class-ses.wav' };
}
export async function genMusic({ prompt, model, duration = 10, mode = 'music' }, set = () => {}) {
  await need('Müzik stüdyosu');
  if (!model) model = (await firstModel('/api/music/models', 'Müzik')).id;
  set('Müzik üretiliyor… (modele göre 1-5 dakika)');
  const j = await J('/api/audio/music', { method: 'POST', body: { prompt, model, duration, mode } });
  return { audio: j.audioUrl || j.url, text: prompt, name: j.filename || 'class-muzik.wav', note: j.message };
}
export async function genVideo({ prompt, engine, duration = 3, res = '512x512' }, set = () => {}) {
  await need('Video stüdyosu');
  if (!engine) engine = (await firstModel('/api/video/models', 'Video')).id;
  set('Video hazırlanıyor…', 0);
  await J('/api/video/generate', { method: 'POST', body: { prompt, mode: 't2v', engine, duration, fps: 16, resolution: res } });
  for (let i = 0; i < 3600; i++) {
    await sleep(1500); const s = await J('/api/video/status');
    set(`${s.phase || 'Video üretiliyor'}${s.step ? ` · ${s.step}/${s.totalSteps || '?'}` : ''}${s.progress != null ? ` · %${Math.round(s.progress)}` : ''}`, s.progress);
    if (s.error) throw new Error(s.error);
    if (!s.active) { const url = s.video?.url; if (!url) throw new Error('Video adresi gelmedi.'); return { video: url, text: prompt, name: s.video?.name || 'class-video.mp4' }; }
  }
  throw new Error('Video çok uzun sürdü.');
}
export async function webSearch(query, set = () => {}) {
  await need('Web araması'); set('Aranıyor ve sayfalar okunuyor…');
  const j = await J('/api/web-search', { method: 'POST', body: { query, resultLimit: 6, fetchLimit: 4 } }); return j.sources || [];
}
/* web sonuçları sohbet mesajı olarak (içerik kısaltılarak saklanır; "Kaynak ekle" düğmesiyle eklenir) */
export const webMsg = (q, src) => ({ kind: 'web', web: src.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet || '', content: (r.content || '').slice(0, 8000) })), text: src.length ? `**“${q}”** için ${src.length} sonuç` : `“${q}” için sonuç bulunamadı.` });
/* iki sesli sesli özet: Ayşe kadın, Can erkek sesiyle; sesler birleştirilip tek WAV olur */
export function podVoices(vs) {
  const fem = (vs.find((v) => /ema_kadin|^tr.*f|female/i.test(v.id + ' ' + v.gender)) || vs[0])?.id;
  const mal = (vs.find((v) => /ema_erkek|antalia|^tr.*m|male/i.test(v.id + ' ' + v.gender) && !/female/i.test(v.gender || '')) || vs[1] || vs[0])?.id;
  return [fem, mal];
}
export async function podcastAudio(turns, { va, vb } = {}, set = () => {}) {
  await need('Ses stüdyosu');
  if (!va || !vb) { const [f, m] = podVoices((await ttsVoices()).voices || []); va = va || f; vb = vb || m; }
  const urls = [];
  for (const [k, t] of turns.entries()) { set(`Ses stüdyosu seslendiriyor… ${k + 1}/${turns.length}`, ((k + 1) / turns.length) * 100); urls.push((await speak(t.text, { voice: t.speaker === 'Can' ? vb : va })).url); }
  set('Sesler birleştiriliyor…'); return window.ClassExtract.joinAudio(urls, 0.35);
}

/* ---------- Görsel (Stable Diffusion) ---------- */
function pImage() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Görsel üretimi', () => {
    const st = status(), pb = bar(), grid = el('div', { className: 'hbGrid' });
    const model = select([['', 'Modeller yükleniyor…']]); const prompt = area({ placeholder: 'Ne çizilsin? (İngilizce istem daha iyi sonuç verir)', rows: 4 }); const neg = input({ placeholder: 'İstenmeyenler (ör. blurry, text, watermark)' });
    let ratio = '1:1', base = 512, steps = 20, cfg = 7; const seed = input({ type: 'number', value: -1, style: 'max-width:140px' });
    J('/api/models').then((j) => { const ms = j.models || []; model.replaceChildren(...(ms.length ? ms.map((m) => el('option', { value: m.filename || m.name, textContent: (m.name || m.filename) + (m.size ? ` · ${m.size}` : '') })) : [el('option', { value: '', textContent: 'Görsel modeli yok — Modeller sekmesinden indirin' })])); }).catch((e) => st.set(e.message, 'err'));
    const wh = () => { const [a, b] = ratio.split(':').map(Number); const k = Math.sqrt(a / b); return [Math.round((base * k) / 64) * 64, Math.round(base / k / 64) * 64]; };
    const suggest = btn('Kaynaklardan istem öner', async () => {
      const on = A().enabledSources(); if (!on.length) { st.set('Önce bir not defterinde kaynak seçin.', 'err'); return; }
      st.set('İstem yazılıyor…'); try { prompt.value = await imagePrompt(on.map((s) => s.text.slice(0, 1500)).join('\n\n')); st.set(''); } catch (e) { st.set(e.message, 'err'); }
    });
    const go = btn('Üret', async () => {
      if (!prompt.value.trim()) { st.set('Bir istem yazın.', 'err'); return; } if (!model.value) { st.set('Önce bir görsel modeli indirin.', 'err'); return; }
      const [w, h] = wh(), cap = prompt.value.trim(); go.disabled = true; pb.set(0);
      try {
        const r = await task(`/ciz ${cut(cap)}`, 'Görsel', 'Görsel üretiliyor', (set) => genImage({ prompt: cap, neg: neg.value.trim(), model: model.value, w, h, steps, cfg, seed: +seed.value }, set), st, pb);
        grid.prepend(el('figure', { className: 'hbImg' }, el('img', { src: r.img, alt: cap }), el('figcaption', {}, el('small', { textContent: `${w}×${h} · ${steps} adım` }), el('span', { className: 'stBtns' }, saveBlobLink(r.img, `class-gorsel-${Date.now()}.png`)))));
        done(st);
      } catch (e) { st.set('Üretilemedi: ' + e.message, 'err'); } finally { pb.set(null); go.disabled = false; }
    }, 'primary');
    return el('div', {}, sec('İstem', field('Model', model), prompt, el('div', { className: 'stBtns' }, suggest), field('Olumsuz istem', neg)),
      sec('Boyut ve kalite', field('Oran', chips([['1:1', '1:1 Kare'], ['4:3', '4:3'], ['16:9', '16:9 Yatay'], ['9:16', '9:16 Dikey']], ratio, (v) => (ratio = v))), field('Çözünürlük', chips([[512, '512'], [768, '768'], [1024, '1024 HD']], base, (v) => (base = v))),
        field('Adım', rangeF(4, 50, 1, steps, (v) => v + ' adım', (v) => (steps = v))), field('İstem bağlılığı (CFG)', rangeF(1, 15, 0.5, cfg, (v) => v.toFixed(1), (v) => (cfg = v))), field('Tohum', seed, '-1 rastgele')),
      el('div', { className: 'stBtns' }, go), pb, st, grid);
  });
  return root;
}

/* ---------- Ses (TTS) ---------- */
let voicesCache = null;
async function ttsVoices() { if (voicesCache) return voicesCache; const [s, m] = await Promise.all([J('/api/tts/status').catch(() => ({})), J('/api/tts/models').catch(() => ({}))]); voicesCache = { voices: s.voices || m.voices || [], models: m.models || [], settings: s.settings || {} }; return voicesCache; }
export async function speak(text, { voice, model, speed = 1 } = {}) { const j = await J('/api/tts/speak', { method: 'POST', body: { text, voice, model, speed } }); return j.output; }
function pTts() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Seslendirme', () => {
    const st = status(), out = el('div', { className: 'hbOut' }); let speed = 1;
    const voice = select([['', 'Sesler yükleniyor…']]); const model = select([['', 'Sunucunun varsayılanı']]);
    ttsVoices().then(({ voices, models }) => {
      voice.replaceChildren(...(voices.length ? voices.map((v) => el('option', { value: v.id, textContent: `${v.name || v.id}${v.language ? ' · ' + v.language : ''}${v.gender ? ' · ' + (v.gender === 'Female' ? 'Kadın' : v.gender === 'Male' ? 'Erkek' : v.gender) : ''}` })) : [el('option', { value: '', textContent: srvState?.ok ? 'Ses bulunamadı' : 'Sunucu bağlanınca listelenir' })]));
      model.append(...models.map((m) => el('option', { value: m.filename || m.id, textContent: (m.name || m.id) + (m.installed === false ? ' (indirilmemiş)' : ''), disabled: m.installed === false })));
    }).catch((e) => st.set(e.message, 'err'));
    const text = area({ rows: 6, placeholder: 'Seslendirilecek metin' });
    const go = btn('Seslendir', async () => {
      if (!text.value.trim()) { st.set('Metin yazın.', 'err'); return; } go.disabled = true; st.set('Ses üretiliyor…');
      const t = text.value.trim();
      try { const r = await task(`/seslendir ${cut(t)}`, 'Ses', 'Seslendiriliyor', (set) => genSpeech({ text: t, voice: voice.value, model: model.value, speed }, set), st); out.replaceChildren(el('audio', { controls: true, src: r.audio }), el('div', { className: 'stBtns' }, saveBlobLink(r.audio, r.name))); done(st); }
      catch (e) { st.set('Seslendirilemedi: ' + e.message, 'err'); } finally { go.disabled = false; }
    }, 'primary');
    return el('div', {}, sec('Ses', field('Ses', voice), field('Model', model), field('Hız', rangeF(0.5, 1.6, 0.05, 1, (v) => v.toFixed(2) + '×', (v) => (speed = v)))), sec('Metin', text, el('div', { className: 'stBtns' }, go)), st, out);
  });
  return root;
}

/* ---------- Yazıya dök (Whisper) ---------- */
function pStt() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Yazıya dökme', () => {
    const st = status(); let blob = null, name = 'kayit.wav', rec = null, chunks = [];
    const file = input({ type: 'file', accept: 'audio/*,video/*' }); file.onchange = () => { blob = file.files[0] || null; name = blob?.name || name; st.set(blob ? `${name} seçildi.` : ''); };
    const lang = select([['auto', 'Otomatik algıla'], ['tr', 'Türkçe'], ['en', 'İngilizce'], ['de', 'Almanca'], ['fr', 'Fransızca'], ['es', 'İspanyolca'], ['it', 'İtalyanca'], ['ru', 'Rusça'], ['ar', 'Arapça'], ['ja', 'Japonca'], ['ko', 'Korece'], ['zh', 'Çince']]);
    const micB = btn('Mikrofonla kaydet', async () => {
      if (rec) { rec.stop(); return; }
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(s); chunks = []; rec.ondataavailable = (e) => chunks.push(e.data); rec.onstop = () => { s.getTracks().forEach((t) => t.stop()); blob = new Blob(chunks, { type: rec.mimeType }); name = 'mikrofon.webm'; rec = null; micB.textContent = 'Mikrofonla kaydet'; st.set('Kayıt hazır.', 'ok'); }; rec.start(); micB.textContent = 'Kaydı durdur'; st.set('Kaydediliyor…'); }
      catch (e) { st.set('Mikrofon açılamadı: ' + e.message, 'err'); }
    });
    const out = area({ rows: 8, placeholder: 'Metin burada görünecek', readOnly: false });
    const go = btn('Yazıya dök', async () => {
      if (!blob) { st.set('Önce bir ses/video dosyası seçin ya da kaydedin.', 'err'); return; } go.disabled = true;
      try {
        await task(`/dok ${name}`, 'Yazıya dök', 'Yazıya dökülüyor', async (set) => { out.value = await A().transcribe(blob, { language: lang.value, name, onPhase: (t) => set(t) }); return { text: out.value ? `**Yazıya döküm · ${name}**\n\n${out.value}` : `${name}: konuşma bulunamadı.` }; }, st);
        if (out.value) done(st); else st.set('Konuşma bulunamadı.', 'err');
      }
      catch (e) { st.set(e.message, 'err'); } finally { go.disabled = false; }
    }, 'primary');
    const add = btn('Kaynak olarak ekle', async () => { if (!out.value.trim()) return; try { await A().addSource(name.replace(/\.[^.]+$/, '') + ' (yazıya döküm)', out.value, 'Ses/Video'); st.set('Kaynak eklendi.', 'ok'); } catch (e) { st.set(e.message, 'err'); } });
    const copy = btn('Kopyala', () => navigator.clipboard?.writeText(out.value));
    return el('div', {}, sec('Ses ya da video', file, el('div', { className: 'stBtns' }, micB), field('Dil', lang)), el('div', { className: 'stBtns' }, go), st, sec('Sonuç', out, el('div', { className: 'stBtns' }, add, copy)));
  });
  return root;
}

/* ---------- Müzik / ses efekti ---------- */
function pMusic() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Müzik üretimi', () => {
    const st = status(), out = el('div', { className: 'hbOut' }); let dur = 10, mode = 'music';
    const model = select([['', 'Modeller yükleniyor…']]);
    J('/api/music/models').then((j) => { const ms = j.models || []; model.replaceChildren(...ms.map((m) => el('option', { value: m.id, textContent: m.name + (m.installed ? '' : ' (indirilmemiş)') }))); }).catch((e) => st.set(e.message, 'err'));
    const prompt = area({ rows: 4, placeholder: 'ör. calm lo-fi piano with soft rain, 80 bpm' });
    const go = btn('Üret', async () => {
      if (!prompt.value.trim()) { st.set('Bir istem yazın.', 'err'); return; } go.disabled = true; st.set('Üretiliyor… (modele göre 1-5 dakika)');
      const p = prompt.value.trim();
      try { const r = await task(`/muzik ${cut(p)}`, 'Müzik', 'Müzik üretiliyor', (set) => genMusic({ prompt: p, model: model.value, duration: dur, mode }, set), st); out.replaceChildren(el('audio', { controls: true, src: r.audio }), el('div', { className: 'stBtns' }, saveBlobLink(r.audio, r.name))); done(st, r.note || 'Hazır'); }
      catch (e) { st.set(e.message, 'err'); } finally { go.disabled = false; }
    }, 'primary');
    return el('div', {}, sec('Müzik', field('Model', model), field('Tür', chips([['music', 'Müzik'], ['sfx', 'Ses efekti']], mode, (v) => (mode = v))), field('Süre', chips([[5, '5 sn'], [10, '10 sn'], [20, '20 sn'], [30, '30 sn']], dur, (v) => (dur = v))), prompt), el('div', { className: 'stBtns' }, go), st, out);
  });
  return root;
}

/* ---------- Video ---------- */
function pVideo() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Video üretimi', () => {
    const st = status(), pb = bar(), out = el('div', { className: 'hbOut' }); let dur = 3, res = '512x512';
    const model = select([['', 'Modeller yükleniyor…']]);
    J('/api/video/models').then((j) => { const ms = j.models || []; model.replaceChildren(...ms.map((m) => el('option', { value: m.id, textContent: `${m.name}${m.tierLabel ? ' · ' + m.tierLabel : ''}${m.installed === false ? ' (indirilmemiş)' : ''}` }))); }).catch((e) => st.set(e.message, 'err'));
    const prompt = area({ rows: 4, placeholder: 'ör. a paper boat drifting on a calm lake at sunset' });
    const go = btn('Üret', async () => {
      if (!prompt.value.trim()) { st.set('Bir istem yazın.', 'err'); return; } go.disabled = true; pb.set(0); const p = prompt.value.trim();
      try {
        const r = await task(`/video ${cut(p)}`, 'Video', 'Video üretiliyor', (set) => genVideo({ prompt: p, engine: model.value, duration: dur, res }, set), st, pb);
        out.replaceChildren(el('video', { controls: true, src: r.video, playsInline: true }), el('div', { className: 'stBtns' }, saveBlobLink(r.video, r.name))); done(st);
      } catch (e) { st.set(e.message, 'err'); } finally { pb.set(null); go.disabled = false; }
    }, 'primary');
    return el('div', {}, sec('Video', field('Motor', model), field('Süre', chips([[2, '2 sn'], [3, '3 sn'], [5, '5 sn']], dur, (v) => (dur = v))), field('Çözünürlük', chips([['512x512', 'Kare'], ['768x432', 'Yatay'], ['432x768', 'Dikey']], res, (v) => (res = v))), prompt), el('div', { className: 'stBtns' }, go), pb, st, out);
  });
  return root;
}

/* ---------- Web: kaynak keşfet + adresten ekle ---------- */
function pWeb() {
  const root = el('div', { className: 'hbP' }); const st = status(); const list = el('div', { className: 'hbList' });
  const q = input({ placeholder: 'Konu ara (ör. Osmanlı’da kölelik tarihi)', type: 'search' });
  const url = input({ placeholder: 'https://… sayfa adresi', type: 'url' });
  const search = btn('Ara', async () => {
    if (!q.value.trim()) return; const s = await server(); if (!s.ok) { list.replaceChildren(needSrv('Web araması')); return; }
    search.disabled = true; const qq = q.value.trim();
    try {
      await task(`/ara ${cut(qq)}`, 'Web', 'Aranıyor', async (set) => {
        const src = await webSearch(qq, set);
        list.replaceChildren(...src.map((r) => { const cb = el('input', { type: 'checkbox', checked: !!r.content }); const row = el('label', { className: 'hbRes' }, cb, el('span', {}, el('b', { textContent: r.title || r.url }), el('small', { textContent: r.url }), el('span', { textContent: (r.snippet || '').slice(0, 220) }), el('em', { textContent: r.content ? `${r.content.length} karakter içerik okundu` : 'yalnızca özet' }))); row._r = r; row._cb = cb; return row; }));
        if (src.length) list.append(el('div', { className: 'stBtns' }, btn('Seçilenleri kaynak ekle', async () => { let n = 0; for (const row of list.querySelectorAll('.hbRes')) if (row._cb.checked) { const r = row._r; await A().addSource(r.title || r.url, `Kaynak: ${r.url}\n\n${r.content || r.snippet || ''}`, 'Web'); n++; } st.set(`${n} kaynak eklendi.`, 'ok'); }, 'primary')));
        st.set(src.length ? `${src.length} sonuç.` : 'Sonuç bulunamadı.', src.length ? 'ok' : 'err');
        return webMsg(qq, src);
      }, st);
    } catch (e) { st.set(e.message, 'err'); } finally { search.disabled = false; }
  }, 'primary');
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') search.click(); });
  const addUrl = btn('Sayfayı ekle', async () => {
    const u = url.value.trim(); if (!/^https?:\/\//i.test(u)) { st.set('http(s) ile başlayan bir adres yazın.', 'err'); return; }
    if (/youtu\.?be/i.test(u)) { st.set('YouTube için: videonun sesini indirip “Yazıya dök” sekmesine ekleyin; altyazı varsa metni yapıştırın.', 'err'); return; }
    addUrl.disabled = true; st.set('Sayfa okunuyor…');
    try {
      let title = u, text = '';
      const s = await server();
      if (s.ok) { const j = await J('/api/fetch-url', { method: 'POST', body: { url: u } }); title = j.title; text = j.text; }
      else { const r = await fetch(u); const h = new DOMParser().parseFromString(await r.text(), 'text/html'); h.querySelectorAll('script,style,nav,footer,header,aside').forEach((n) => n.remove()); title = h.title || u; text = (h.body?.innerText || h.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim(); }
      if (!text) throw new Error('Sayfada okunabilir metin bulunamadı.');
      await A().addSource(title, `Kaynak: ${u}\n\n${text}`, 'Web'); st.set(`“${title}” kaynak olarak eklendi.`, 'ok'); url.value = '';
      if (A()?.current?.()) A().chatTask({ via: 'Web', label: 'Kaynak eklendi', run: async () => ({ text: `**Kaynak eklendi:** [${title.replace(/[[\]]/g, '')}](${u}) · ${text.length} karakter` }) }).catch(() => {});
    } catch (e) { st.set(srvState?.ok ? 'Eklenemedi: ' + e.message : 'Tarayıcı bu siteyi doğrudan okuyamadı (CORS). Yerel sunucuyla açınca her site eklenebilir.', 'err'); }
    finally { addUrl.disabled = false; }
  }, 'primary');
  root.append(sec('Kaynak keşfet (web araması)', el('div', { className: 'hbRow' }, q, search)), list, sec('Adresten kaynak ekle', el('div', { className: 'hbRow' }, url, addUrl)), st);
  return root;
}

/* ---------- Model Merkezi ---------- */
function pModels() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Model Merkezi', () => {
    const st = status(), pb = bar(), dl = el('div', { className: 'hbDl' });
    const inst = el('div', { className: 'hbList' }), rec = el('div', { className: 'hbList' }), res = el('div', { className: 'hbList' }), hw = el('div', { className: 'hbKV' }), other = el('div', { className: 'hbList' });
    const fmtB = (b) => (b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b > 1e6 ? (b / 1e6).toFixed(0) + ' MB' : '');
    const loadInst = () => J('/api/llm/models').then((j) => {
      const rows = (j.models || []).map((m) => {
        const f = typeof m === 'string' ? m : m.filename || m.name;
        const use = btn('Kullan', async () => { st.set('Model başlatılıyor…'); try { await J('/api/llm/start', { method: 'POST', body: { model: f, contextSize: A().CFG.ctx } }); for (let i = 0; i < 150; i++) { const s = await J('/api/llm/status'); if (s.ready) break; if (s.error) throw new Error(s.error); await sleep(1200); } A().CFG.engine = 'server'; A().saveCfg(); A().setEngine('server', 'Yerel sunucu · ' + f, A().CFG.ctx); st.set('Sohbet artık bu modelle çalışır.', 'ok'); } catch (e) { st.set(e.message, 'err'); } });
        const del = btn('Sil', async () => { if (!confirm(`${f} silinsin mi?`)) return; try { await J('/api/llm/delete-model', { method: 'POST', body: { filename: f } }); loadInst(); } catch (e) { st.set(e.message, 'err'); } }, 'danger');
        return el('div', { className: 'hbItem' }, el('span', {}, el('b', { textContent: m.displayName || f }), el('small', { textContent: m.size || fmtB(m.sizeBytes) || '' })), el('span', { className: 'stBtns' }, use, del));
      });
      inst.replaceChildren(...(rows.length ? rows : [el('p', { className: 'muted', textContent: 'Henüz model yok.' })]));
    }).catch((e) => st.set(e.message, 'err'));
    const download = async (url, filename, extra = {}) => { try { const j = await J('/api/llm/download-model', { method: 'POST', body: { url, filename, ...extra } }); st.set(j.message || 'İndirme sıraya alındı.', 'ok'); track(); } catch (e) { st.set(e.message, 'err'); } };
    let tracking = false;
    async function track() {
      if (tracking) return; tracking = true;
      try { for (;;) { const p = await J('/api/download-progress'); if (!p.active && !(p.queue || []).length) { pb.set(null); dl.replaceChildren(); if (p.error) st.set('İndirme hatası: ' + p.error, 'err'); loadInst(); break; } pb.set(p.percent ?? p.progress); dl.replaceChildren(el('span', { textContent: `${p.displayName || p.filename || ''} · %${Math.round(p.percent ?? p.progress ?? 0)} · ${p.speed_mb_s ? p.speed_mb_s + ' MB/s' : p.speed || ''}${(p.queue || []).length ? ` · sırada ${p.queue.length}` : ''}` }), btn('İptal', () => J('/api/cancel-download', { method: 'POST', body: { cancelAll: false } }).catch(() => {}), 'sm')); if (!root.isConnected) break; await sleep(1500); } }
      finally { tracking = false; }
    }
    J('/api/llm/recommend?useCase=chat&limit=8').then((j) => { const r = j.recommendations || []; rec.replaceChildren(...(r.length ? r.map((m) => el('div', { className: 'hbItem' }, el('span', {}, el('b', { textContent: m.name || m.displayName || m.id || m.filename }), el('small', { textContent: [m.size, m.fit || m.reason || m.note, m.params].filter(Boolean).join(' · ') })), m.url ? btn('İndir', () => download(m.url, m.filename)) : null)) : [el('p', { className: 'muted', textContent: 'Öneri yok.' })])); }).catch(() => rec.replaceChildren(el('p', { className: 'muted', textContent: 'Öneriler alınamadı.' })));
    const q = input({ type: 'search', placeholder: 'Hugging Face’te GGUF ara (ör. qwen2.5 7b instruct)' });
    const find = btn('Ara', async () => { find.disabled = true; st.set('Aranıyor…'); try { const j = await J('/api/huggingface/models?query=' + encodeURIComponent(q.value.trim()) + '&page=1'); const ms = j.models || []; res.replaceChildren(...ms.slice(0, 30).map((m) => el('div', { className: 'hbItem' }, el('span', {}, el('b', { textContent: m.name || m.filename }), el('small', { textContent: [m.repositoryFilename || m.filename, m.size || fmtB(m.sizeBytes), m.downloads ? m.downloads + ' indirme' : ''].filter(Boolean).join(' · ') })), m.url ? btn('İndir', () => download(m.url, m.filename, { projectorUrl: m.projectorUrl || '', projectorFilename: m.projectorFilename || '' })) : null))); st.set(ms.length ? `${ms.length} sonuç.` : 'Sonuç yok.', ms.length ? 'ok' : ''); } catch (e) { st.set(e.message, 'err'); } finally { find.disabled = false; } }, 'primary');
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') find.click(); });
    J('/api/hardware-specs').then((h) => { const L = { cpu_name: 'İşlemci', cpu_cores_physical: 'Fiziksel çekirdek', cpu_cores_logical: 'Mantıksal çekirdek', ram_total_gb: 'RAM (GB)', gpu_name: 'Ekran kartı', gpu_vram_gb: 'VRAM (GB)', tier: 'Donanım sınıfı' }, T = { low: 'Giriş', mid: 'Orta', high: 'Yüksek' }; const kv = Object.entries(h).filter(([k, v]) => k !== 'ok' && ['string', 'number'].includes(typeof v)).map(([k, v]) => [L[k] || k, k === 'tier' ? T[v] || v : v]).slice(0, 12); hw.replaceChildren(...kv.map(([k, v]) => el('div', {}, el('small', { textContent: k }), el('b', { textContent: String(v) })))); }).catch(() => hw.replaceChildren(el('small', { textContent: 'Donanım bilgisi alınamadı.' })));
    const kindList = async (label, list, dlUrl) => { try { const j = await J(list); const ms = j.models || []; other.append(el('h5', { textContent: label }), ...ms.map((m) => el('div', { className: 'hbItem' }, el('span', {}, el('b', { textContent: m.name || m.id || m.filename }), el('small', { textContent: [m.approxSize || m.size, m.language].filter(Boolean).join(' · ') })), m.installed ? el('em', { textContent: 'yüklü' }) : btn('İndir', async () => { try { const r = await J(dlUrl, { method: 'POST', body: { model: m.id || m.filename } }); st.set(r.message || 'İndirme başladı.', 'ok'); track(); } catch (e) { st.set(e.message, 'err'); } })))); } catch {} };
    loadInst(); track(); kindList('Konuşma (Whisper)', '/api/speech/models', '/api/speech/download-model'); kindList('Seslendirme (TTS)', '/api/tts/models', '/api/tts/download-model');
    return el('div', {}, sec('Donanım', hw), pb, dl, st, sec('Yüklü metin modelleri', inst), sec('Bu bilgisayar için önerilen', rec), sec('Hugging Face’te ara', el('div', { className: 'hbRow' }, q, find), res), sec('Ses modelleri', other));
  });
  return root;
}

/* ---------- Sistem ---------- */
function pSystem() {
  const root = el('div', { className: 'hbP' });
  gate(root, 'Sistem', () => {
    const st = status(), diag = el('pre', { className: 'cite stDiag', textContent: '…' }), upd = el('div', { className: 'hbList' }), clean = el('div', { className: 'hbList' });
    J('/api/diagnostics').then((d) => (diag.textContent = JSON.stringify(d, null, 2).slice(0, 6000))).catch((e) => (diag.textContent = e.message));
    const tok = input({ type: 'password', placeholder: 'hf_… (kilitli modelleri indirmek için)', autocomplete: 'off' });
    const tokState = el('small', { className: 'stMsg' }); J('/api/hf-token').then((j) => (tokState.textContent = j.hasToken || j.token || j.configured ? 'Kayıtlı bir anahtar var.' : 'Kayıtlı anahtar yok.')).catch(() => {});
    const loadClean = () => J('/api/cleanup-candidates').then((j) => { const c = j.candidates || j.items || []; clean.replaceChildren(...(c.length ? c.map((x) => { const cb = el('input', { type: 'checkbox' }); const r = el('label', { className: 'hbRes' }, cb, el('span', {}, el('b', { textContent: x.label || x.name || x.id }), el('small', { textContent: [x.size || x.sizeLabel, x.path || x.reason].filter(Boolean).join(' · ') }))); r._id = x.id; r._cb = cb; return r; }) : [el('p', { className: 'muted', textContent: 'Temizlenecek bir şey yok.' })])); }).catch(() => {});
    loadClean();
    return el('div', {}, st,
      sec('Güncelleme', el('div', { className: 'stBtns' }, btn('Güncelleme var mı?', async () => { try { const j = await J('/api/updater/check'); upd.replaceChildren(el('p', { textContent: j.message || (j.updateAvailable ? `Yeni sürüm: ${j.latest || ''}` : 'Güncel.') })); if (j.updateAvailable) upd.append(btn('Güncelle', async () => { if (!confirm('Güncelleme uygulansın mı? Sunucu yeniden başlar.')) return; try { const r = await J('/api/updater/apply', { method: 'POST', body: {} }); st.set(r.message || 'Uygulandı.', 'ok'); } catch (e) { st.set(e.message, 'err'); } }, 'primary')); } catch (e) { st.set(e.message, 'err'); } })), upd),
      sec('Hugging Face anahtarı', tok, el('div', { className: 'stBtns' }, btn('Kaydet', async () => { try { await J('/api/hf-token', { method: 'POST', body: { token: tok.value.trim() } }); tok.value = ''; tokState.textContent = 'Kaydedildi (yalnızca bu bilgisayarda).'; } catch (e) { st.set(e.message, 'err'); } }, 'primary'), btn('Sil', async () => { try { await J('/api/hf-token', { method: 'DELETE' }); tokState.textContent = 'Silindi.'; } catch (e) { st.set(e.message, 'err'); } })), tokState),
      sec('Disk temizliği', clean, el('div', { className: 'stBtns' }, btn('Seçilenleri temizle', async () => { const ids = [...clean.querySelectorAll('.hbRes')].filter((r) => r._cb.checked).map((r) => r._id); if (!ids.length) return; try { const j = await J('/api/cleanup', { method: 'POST', body: { ids } }); st.set(j.message || 'Temizlendi.', 'ok'); loadClean(); } catch (e) { st.set(e.message, 'err'); } }, 'danger'))),
      sec('Tanılama', diag));
  });
  return root;
}

/* ---------- panel kaydı + Stüdyolar penceresi ---------- */
export const PANELS = [
  { id: 'image', title: 'Görsel', icon: IC.image, make: pImage },
  { id: 'tts', title: 'Ses', icon: IC.speak, make: pTts },
  { id: 'stt', title: 'Yazıya dök', icon: IC.mic, make: pStt },
  { id: 'music', title: 'Müzik', icon: IC.music, make: pMusic },
  { id: 'video', title: 'Video', icon: IC.video, make: pVideo },
  { id: 'convert', title: 'Dönüştür', icon: CONVERT_ICON, make: pConvert },
  { id: 'web', title: 'Web', icon: IC.web, make: pWeb },
  { id: 'models', title: 'Modeller', icon: IC.models, make: pModels },
  { id: 'system', title: 'Sistem', icon: IC.system, make: pSystem },
];
const made = {};
export function panelEl(id) { const p = PANELS.find((x) => x.id === id); if (!p) return null; if (!made[id]) { made[id] = el('div', { className: 'hbPanel', 'data-panel': id }, p.make()); } return made[id]; }
let H = null;
function hubDialog() {
  if (H) return H;
  const d = el('dialog', { className: 'fs set hub', id: 'hubDlg', 'data-title': '#Stüdyolar' });
  const tabs = el('div', { className: 'hbTabs', role: 'tablist', 'aria-label': 'Stüdyolar' });
  const body = el('div', { className: 'hbBody' }); const chip = el('span', { className: 'ctChip' }, el('i'), 'Sunucu');
  const bar2 = el('div', { className: 'fsBar' }, el('b', { textContent: '#Stüdyolar' }), chip, el('button', { type: 'button', title: 'Kapat (Esc)', 'aria-label': 'Kapat (Esc)', innerHTML: sv('<path d="M18 6 6 18M6 6l12 12"/>'), onclick: () => d.close() }));
  d.append(el('div', { className: 'dlg stBody hbWrap' }, tabs, body), bar2); document.body.append(d);
  PANELS.forEach((p) => { const b = el('button', { type: 'button', className: 'hbTab', role: 'tab', 'data-id': p.id, innerHTML: p.icon }, el('span', { textContent: p.title })); b.onclick = () => show(p.id); tabs.append(b); });
  function show(id) { try { localStorage.setItem('class-hub-tab', id); } catch {} tabs.querySelectorAll('.hbTab').forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }); const pe = panelEl(id); if (pe.closest('#dkWrap')) { body.replaceChildren(el('p', { className: 'hint', textContent: 'Bu stüdyo pencere düzeninde açık.' })); return; } body.replaceChildren(pe); }
  server().then((s) => { chip.lastChild.textContent = s.ok ? 'Yerel sunucu bağlı' : 'Sunucu yok'; chip.classList.toggle('off', !s.ok); });
  H = { d, show }; return H;
}
export function openHub(id) {
  let t = id; if (!t) { try { t = localStorage.getItem('class-hub-tab'); } catch {} } if (!PANELS.some((p) => p.id === t)) t = 'image';
  if (window.defterDock?.openHub(t)) { try { localStorage.setItem('class-hub-tab', t); } catch {} return; } /* pencere düzeni açıksa sekme olarak açılır */
  if (window.defterSlide?.openHub(t)) return; /* telefonda kayan modda alttan docker sayfası */
  const h = hubDialog(); h.show(t); if (!h.d.open) h.d.showModal();
}
window.defterHub = { open: openHub, panelEl, PANELS, speak, server, ttsVoices, gen: { need, image: genImage, imagePrompt, speech: genSpeech, music: genMusic, video: genVideo, web: webSearch, webMsg, podcast: podcastAudio, podVoices } };

/* Stüdyo panelinin üstündeki şerit ve kaynak düğmeleri */
function wire() {
  const strip = $('#hbStrip'); if (strip && !strip.childElementCount) strip.append(...PANELS.map((p) => el('button', { type: 'button', className: 'hbChip', title: p.title, innerHTML: p.icon, onclick: () => openHub(p.id) }, el('span', { textContent: p.title }))));
  $('#addWeb')?.addEventListener('click', () => openHub('web'));
  $('#dlgWeb')?.addEventListener('click', () => { $('#srcDlg')?.close(); openHub('web'); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
