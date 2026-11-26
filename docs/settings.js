/* Class: Ayarlar paneli + Kurulum sihirbazı + yapay zekâ motoru (tarayıcı / yerel sunucu / OpenAI uyumlu API).
   Eski stüdyodaki ayarların Class'a uyarlanmış hâli. Her şey yalnızca bu tarayıcıda saklanır. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-') || n === 'list') e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const A = () => window.defterApp;
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const VERSION = '24';
const svg = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICO = {
  look: svg('<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 1 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.7-10-8.7z"/>'),
  cpu: svg('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  data: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  dev: svg('<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M11 18h2"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>', 18),
};
const isLocalHost = () => /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
const dark = () => { const t = A().getTheme(); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches); };

/* ---------- görünüm tercihleri: yazı boyutu, hareket, ayna ---------- */
function applyPrefs() {
  const r = document.documentElement;
  r.style.setProperty('--uiZoom', String(lsGet('class-zoom', 1)));
  r.classList.toggle('uiZoom', lsGet('class-zoom', 1) !== 1);
  r.classList.toggle('noMotion', lsGet('class-motion', 'auto') === 'off');
}
applyPrefs();

/* ---------- ortak denetimler ---------- */
function seg(name, opts, cur, onPick) {
  const w = el('div', { className: 'stSeg', role: 'radiogroup', 'aria-label': name });
  opts.forEach(([v, l]) => { const b = el('button', { type: 'button', className: 'stSegB' + (v === cur ? ' on' : ''), role: 'radio', 'aria-checked': v === cur ? 'true' : 'false', textContent: l }); b.onclick = () => { [...w.children].forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); onPick(v); }; w.append(b); });
  return w;
}
function sw(label, on, onChange, sub) {
  const inp = el('input', { type: 'checkbox', checked: !!on }); inp.onchange = () => onChange(inp.checked);
  return el('label', { className: 'stRow stSw' }, el('span', { className: 'stL' }, el('b', { textContent: label }), sub ? el('small', { textContent: sub }) : null), el('span', { className: 'stTg' }, inp, el('i')));
}
function row(label, ctrl, sub) { return el('div', { className: 'stRow' }, el('span', { className: 'stL' }, el('b', { textContent: label }), sub ? el('small', { textContent: sub }) : null), ctrl); }
function range(min, max, step, val, fmt, onCh) {
  const out = el('output', { textContent: fmt(val) }); const r = el('input', { type: 'range', min, max, step, value: val, className: 'stRange' });
  r.oninput = () => { out.textContent = fmt(+r.value); onCh(+r.value); }; return el('span', { className: 'stRg' }, r, out);
}
function card(id, icon, title, ...kids) { return el('section', { className: 'stCard', id: 'st-' + id }, el('h3', { className: 'stH' }, el('span', { innerHTML: icon }), title), ...kids); }
function btn(label, onclick, cls = '') { return el('button', { type: 'button', className: 'btn ' + cls, textContent: label, onclick }); }
function fsDialog(id, title) {
  const d = el('dialog', { className: 'fs set', id, 'data-title': title });
  const bar = el('div', { className: 'fsBar' }, el('b', { textContent: title }), el('button', { type: 'button', title: 'Kapat (Esc)', 'aria-label': 'Kapat (Esc)', innerHTML: ICO.close, onclick: () => d.close() }));
  const body = el('div', { className: 'dlg stBody' }); d.append(body, bar); document.body.append(d);
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  return { d, body };
}

/* ---------- yapay zekâ motoru ---------- */
async function getJSON(url, opt) { const r = await fetch(url, opt); const t = await r.text(); let j = {}; try { j = JSON.parse(t || '{}'); } catch { throw new Error('Sunucu geçersiz yanıt verdi'); } if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`); return j; }
async function serverStatus() { if (!isLocalHost()) return null; try { return await getJSON('/api/llm/status'); } catch { return null; } }
async function restoreEngine() {
  const C = A().CFG;
  if (C.engine === 'openai' && C.api.base) A().setEngine('openai', `API · ${C.api.model || new URL(C.api.base, location.href).host}`, C.ctx);
  else if (C.engine === 'server') { const s = await serverStatus(); if (s?.ready) A().setEngine('server', 'Yerel sunucu · ' + String(s.settings?.model || '').split(/[\\/]/).pop(), C.ctx); }
}
function engineCard(onDone) {
  const C = A().CFG; const st = el('p', { className: 'stNote', id: 'engNote' });
  const upd = () => { const e = A().engine; st.textContent = e.kind === 'none' ? 'Şu an model yüklü değil.' : `Etkin: ${e.label || e.kind}`; };
  upd();
  /* tarayıcı */
  const browser = el('div', { className: 'stOpt' }, el('b', { textContent: 'Tarayıcıda model (WebAssembly / WebGPU)' }), el('small', { textContent: 'İnternetsiz çalışır; model bir kez indirilir. Telefonda küçük model önerilir.' }),
    el('div', { className: 'stBtns' }, btn('Model seç ve yükle', () => { C.engine = 'wllama'; A().saveCfg(); A().openModel(); onDone?.(); }, 'primary'), btn('Demo kipi (model yok)', () => { A().setEngine('demo', 'Demo kipi (model yok)'); upd(); onDone?.(); })));
  /* yerel sunucu */
  const srvBox = el('div', { className: 'stSrv' });
  const server = el('div', { className: 'stOpt' }, el('b', { textContent: 'Yerel sunucu (Class başlatıcısı)' }),
    el('small', { textContent: isLocalHost() ? 'windows.bat / linux.sh / mac.sh ile açtığın sunucunun LLM motorunu kullanır; bilgisayarın GPU’su ile çok daha hızlıdır.' : 'Bu sayfa GitHub Pages’ten açıldı. Yerel sunucu için Class’ı başlatıcıyla (windows.bat / linux.sh / mac.sh) aç; adres localhost olur.' }),
    srvBox);
  if (isLocalHost()) srvBox.append(btn('Sunucuya bağlan', () => connectServer(srvBox, upd)));
  /* OpenAI uyumlu */
  const base = el('input', { className: 'stIn', placeholder: 'http://localhost:1234/v1', value: C.api.base, 'aria-label': 'API adresi' });
  const key = el('input', { className: 'stIn', type: 'password', placeholder: 'Anahtar (gerekmiyorsa boş)', value: C.api.key, autocomplete: 'off', 'aria-label': 'API anahtarı' });
  const model = el('input', { className: 'stIn', placeholder: 'model adı (ör. qwen2.5-7b-instruct)', value: C.api.model, 'aria-label': 'Model adı', list: 'apiModels' });
  const dl = el('datalist', { id: 'apiModels' }); const apiMsg = el('small', { className: 'stMsg' });
  const api = el('div', { className: 'stOpt' }, el('b', { textContent: 'OpenAI uyumlu API (LM Studio, Ollama, OpenRouter…)' }),
    el('small', { textContent: 'LM Studio: http://localhost:1234/v1 · Ollama: http://localhost:11434/v1 (OLLAMA_ORIGINS gerekir). Anahtar yalnızca bu tarayıcıda saklanır.' }),
    base, key, model, dl,
    el('div', { className: 'stBtns' }, btn('Modelleri getir', async () => {
      apiMsg.textContent = 'Bağlanılıyor…';
      try { const j = await getJSON(base.value.replace(/\/+$/, '') + '/models', { headers: key.value ? { Authorization: 'Bearer ' + key.value } : {} }); const ids = (j.data || j.models || []).map((m) => m.id || m.name).filter(Boolean); dl.replaceChildren(...ids.map((i) => el('option', { value: i }))); if (!model.value && ids[0]) model.value = ids[0]; apiMsg.textContent = `${ids.length} model bulundu.`; }
      catch (e) { apiMsg.textContent = 'Bağlanılamadı: ' + e.message + ' (adres, CORS ayarı ya da anahtar).'; }
    }), btn('Kaydet ve kullan', () => {
      if (!base.value.trim()) { apiMsg.textContent = 'Önce API adresini yaz.'; return; }
      C.engine = 'openai'; C.api = { base: base.value.trim(), key: key.value.trim(), model: model.value.trim() }; A().saveCfg();
      A().setEngine('openai', `API · ${C.api.model || new URL(C.api.base, location.href).host}`, C.ctx); upd(); apiMsg.textContent = 'Kaydedildi. Sohbet artık bu API ile çalışır.'; onDone?.();
    }, 'primary')), apiMsg);
  return [st, browser, server, api];
}
async function connectServer(box, upd) {
  box.replaceChildren(el('small', { className: 'stMsg', textContent: 'Sunucu yoklanıyor…' }));
  try {
    const [s, m] = await Promise.all([getJSON('/api/llm/status'), getJSON('/api/llm/models')]);
    const models = (m.models || []).map((x) => (typeof x === 'string' ? x : x.filename || x.name)).filter(Boolean);
    if (!models.length) { box.replaceChildren(el('small', { className: 'stMsg', textContent: 'Sunucuda dil modeli yok. app/llm-models klasörüne .gguf model koy ya da eski stüdyonun model indiricisiyle indir.' })); return; }
    const sel = el('select', { className: 'stIn', 'aria-label': 'Sunucu modeli' }, ...models.map((x) => el('option', { value: x, textContent: x, selected: String(s.settings?.model || '').endsWith(x) })));
    const msg = el('small', { className: 'stMsg', textContent: s.ready ? 'Sunucuda model hazır.' : 'Model seçip başlat.' });
    const go = btn(s.ready ? 'Bu modeli kullan' : 'Başlat ve kullan', async () => {
      const C = A().CFG; go.disabled = true; msg.textContent = 'Model yükleniyor (büyük modellerde 1-2 dakika sürebilir)…';
      try {
        const cur = String(s.settings?.model || '');
        if (!(s.ready && cur.endsWith(sel.value))) {
          await getJSON('/api/llm/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: sel.value, contextSize: C.ctx }) });
          for (let i = 0; i < 150; i++) { const t = await getJSON('/api/llm/status'); if (t.ready) break; if (t.error) throw new Error(t.error); await new Promise((r) => setTimeout(r, 1200)); }
        }
        C.engine = 'server'; A().saveCfg(); A().setEngine('server', 'Yerel sunucu · ' + sel.value, C.ctx); upd(); msg.textContent = 'Hazır. Sohbet artık yerel sunucuyla çalışır.';
      } catch (e) { msg.textContent = 'Başlatılamadı: ' + e.message; } finally { go.disabled = false; }
    }, 'primary');
    box.replaceChildren(sel, el('div', { className: 'stBtns' }, go), msg);
  } catch (e) { box.replaceChildren(el('small', { className: 'stMsg', textContent: 'Sunucuya ulaşılamadı: ' + e.message }), btn('Tekrar dene', () => connectServer(box, upd))); }
}

/* ---------- Ayarlar paneli ---------- */
let SET = null;
function openSettings(section) {
  if (!SET) SET = fsDialog('setDlg', '#Ayarlar');
  const { d, body } = SET; const C = A().CFG;
  const colors = (window.defterTheme?.colors || []).map(([hex, name]) => {
    const cur = lsGet('class-theme-color', ''); const b = el('button', { type: 'button', className: 'tcDot' + (hex === cur ? ' on' : ''), title: name, 'aria-label': name });
    b.style.background = hex || (dark() ? '#60cdff' : '#1a73e8');
    b.onclick = () => { lsSet('class-theme-color', hex); window.defterTheme?.apply(); body.querySelectorAll('.stColors .tcDot').forEach((x) => x.classList.toggle('on', x === b)); }; return b;
  });
  const est = el('small', { textContent: 'Hesaplanıyor…' });
  navigator.storage?.estimate?.().then((e) => { est.textContent = e ? `${((e.usage || 0) / 1e6).toFixed(1)} MB kullanılıyor · kota ≈ ${((e.quota || 0) / 1e9).toFixed(1)} GB` : 'Bilinmiyor'; }).catch(() => (est.textContent = 'Bilinmiyor'));
  const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const dataMsg = el('small', { className: 'stMsg' });
  file.onchange = async () => { const f = file.files[0]; if (!f) return; try { const n = await A().importAll(JSON.parse(await f.text())); dataMsg.textContent = `${n} kayıt geri yüklendi.`; } catch (e) { dataMsg.textContent = 'Yüklenemedi: ' + e.message; } file.value = ''; };
  const scr = () => `${innerWidth}×${innerHeight} · DPR ${devicePixelRatio} · ${innerWidth > innerHeight ? 'yatay' : 'dikey'} · ${matchMedia('(pointer:coarse)').matches ? 'dokunmatik' : 'fare'}${navigator.getGamepads && [...navigator.getGamepads()].some(Boolean) ? ' · oyun kolu bağlı' : ''}`;
  const diag = el('pre', { className: 'cite stDiag', textContent: A().diagnose() });
  body.replaceChildren(
    el('div', { className: 'stTop' }, el('h2', { textContent: 'Ayarlar' }), el('p', { className: 'muted', textContent: 'Görünüm, yapay zekâ motoru, sohbet ve veriler. Her şey yalnızca bu cihazda saklanır.' }),
      el('nav', { className: 'stNav' }, ...[['look', 'Görünüm'], ['engine', 'Motor'], ['chat', 'Sohbet'], ['data', 'Veri'], ['device', 'Cihaz'], ['about', 'Hakkında']].map(([k, l]) => btn(l, () => body.querySelector('#st-' + k)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 'sm')))),
    card('look', ICO.look, 'Görünüm',
      row('Tema', seg('Tema', [['dark', 'Koyu'], ['light', 'Açık'], ['system', 'Cihaz']], A().getTheme(), (v) => A().setTheme(v))),
      el('div', { className: 'stRow stCol' }, el('span', { className: 'stL' }, el('b', { textContent: 'Tema rengi' }), el('small', { textContent: 'Düğmeler, seçili sekme ve vurgular' })), el('div', { className: 'stColors' }, ...colors)),
      row('Yazı ve arayüz boyutu', seg('Boyut', [[0.9, 'Küçük'], [1, 'Normal'], [1.1, 'Büyük'], [1.2, 'Çok büyük']], lsGet('class-zoom', 1), (v) => { lsSet('class-zoom', v); applyPrefs(); })),
      sw('Animasyonlar', lsGet('class-motion', 'auto') !== 'off', (on) => { lsSet('class-motion', on ? 'auto' : 'off'); applyPrefs(); }, 'Kapalıyken kaydırma belirmesi ve geçişler durur'),
      sw('Ayna (sağdan sola)', document.documentElement.dir === 'rtl', (on) => { document.documentElement.dir = on ? 'rtl' : 'ltr'; try { localStorage.setItem('class-dir', on ? 'rtl' : 'ltr'); } catch {} }),
      sw('CLASS & SAVED şeridi', !(lsGet('class-ntf-x', 0) > Date.now() - 864e5), (on) => { lsSet('class-ntf-x', on ? 0 : Date.now() + 3650 * 864e5); }, 'Ana sayfanın üstündeki bağlantı şeridi (yenileyince uygulanır)')),
    card('engine', ICO.cpu, 'Yapay zekâ motoru', ...engineCard()),
    card('chat', ICO.chat, 'Sohbet',
      row('Yaratıcılık (sıcaklık)', range(0, 1.5, 0.05, C.temperature, (v) => v.toFixed(2), (v) => { C.temperature = v; A().saveCfg(); }), 'Düşük: kaynağa sadık · Yüksek: daha serbest'),
      row('En uzun cevap', range(128, 4096, 64, C.maxTokens, (v) => v + ' token', (v) => { C.maxTokens = v; A().saveCfg(); })),
      row('Bağlam (sunucu / API)', seg('Bağlam', [[4096, '4K'], [8192, '8K'], [16384, '16K'], [32768, '32K']], C.ctx, (v) => { C.ctx = v; A().saveCfg(); if (['server', 'openai'].includes(A().engine.kind)) A().engine.nctx = v; }), 'Daha çok kaynak parçası sığar; model desteklemeli'),
      el('div', { className: 'stRow stCol' }, el('span', { className: 'stL' }, el('b', { textContent: 'Ek talimat (sistem)' }), el('small', { textContent: 'Her cevapta uygulanır. Ör. “Kısa cevap ver, madde madde yaz.”' })),
        (() => { const t = el('textarea', { className: 'stIn', rows: 3, value: C.sys, maxLength: 1200, placeholder: 'İsteğe bağlı' }); t.oninput = () => { C.sys = t.value; A().saveCfg(); }; return t; })()),
      sw('Enter ile gönder', C.enterSend, (on) => { C.enterSend = on; A().saveCfg(); }, 'Kapalıyken Ctrl+Enter gönderir, Enter yeni satır açar')),
    card('data', ICO.data, 'Veri ve yedek',
      row('Depolama', est),
      el('div', { className: 'stBtns' },
        btn('Kalıcı depolama iste', async () => { const ok = await navigator.storage?.persist?.(); dataMsg.textContent = ok ? 'Tarayıcı verileri kalıcı tutacak.' : 'Tarayıcı izin vermedi (uygulamayı kurmak yardımcı olur).'; }),
        btn('Yedeği indir (.json)', async () => { const o = await A().exportAll(); const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })), download: `class-yedek-${new Date().toISOString().slice(0, 10)}.json` }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); dataMsg.textContent = 'Yedek indirildi.'; }),
        btn('Yedeği yükle', () => file.click()), file,
        btn('Tüm verileri sil', async () => { if (!confirm('Tüm not defterleri, kaynaklar, notlar ve sohbetler bu cihazdan silinsin mi? Geri alınamaz.')) return; indexedDB.deleteDatabase('defter'); try { Object.keys(localStorage).filter((k) => /^(class|defter)/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch {} location.reload(); }, 'danger')),
      dataMsg),
    card('device', ICO.dev, 'Cihaz',
      row('Ekran', el('small', { textContent: scr() })),
      diag, el('div', { className: 'stBtns' }, btn('Tanılamayı kopyala', () => navigator.clipboard?.writeText(diag.textContent)))),
    card('about', ICO.info, 'Hakkında',
      row('Sürüm', el('small', { textContent: 'Class v' + VERSION + ' · yerel, gizli, açık kaynak' })),
      el('div', { className: 'stBtns' }, btn('Klavye ve oyun kolu', () => window.defterHelp?.()), window.defterShell?.wide?.() ? btn('Pencere düzeni aç / kapat', () => { d.close(); window.defterShell.toggleWm(); }) : null, window.defterShell?.standalone?.() ? null : btn('Uygulama olarak kur', () => { d.close(); window.defterShell?.install(); }), btn('Kurulumu yeniden başlat', () => { d.close(); openSetup(); }), el('a', { className: 'btn', href: 'https://github.com/Aleyulala/Class', target: '_blank', rel: 'noopener noreferrer', textContent: 'GitHub' }))));
  if (!d.open) d.showModal();
  if (section) setTimeout(() => body.querySelector('#st-' + section)?.scrollIntoView({ block: 'start' }), 60);
}

/* ---------- Kurulum sihirbazı (ilk açılış) ---------- */
let SU = null;
function openSetup() {
  if (!SU) SU = fsDialog('setupDlg', '#Kurulum');
  const { d, body } = SU; let step = 0;
  const mem = navigator.deviceMemory || 0, wasm = typeof WebAssembly === 'object', gpu = !!navigator.gpu;
  const rec = !wasm ? 'Bu tarayıcıda WebAssembly kapalı: model yerine yerel sunucu ya da API kullan (Chrome’da “JavaScript optimizer” açık olmalı).'
    : mem && mem <= 4 ? 'Önerilen: Qwen2.5 1.5B (yaklaşık 1 GB). Daha büyük modeller bu cihazda yavaş kalabilir.'
    : gpu ? 'Önerilen: Qwen2.5 3B ya da Llama 3.2 3B (WebGPU ile hızlı).' : 'Önerilen: Qwen2.5 1.5B ya da 3B (işlemciyle çalışır).';
  const chip = (ok, t) => el('span', { className: 'suChip ' + (ok ? 'ok' : 'no'), textContent: (ok ? '✓ ' : '✕ ') + t });
  const steps = [
    () => [el('h2', { textContent: 'Class’a hoş geldin' }), el('p', { className: 'muted', textContent: 'Kaynaklarını yükle, onlarla sohbet et, özet, quiz, bilgi kartı ve zihin haritası çıkar. Her şey bu cihazda kalır. Önce görünümü seç.' }),
      row('Tema', seg('Tema', [['dark', 'Koyu'], ['light', 'Açık'], ['system', 'Cihaz']], A().getTheme(), (v) => A().setTheme(v))),
      row('Yazı boyutu', seg('Boyut', [[0.9, 'Küçük'], [1, 'Normal'], [1.1, 'Büyük']], lsGet('class-zoom', 1), (v) => { lsSet('class-zoom', v); applyPrefs(); }))],
    () => [el('h2', { textContent: 'Cihazın' }), el('p', { className: 'muted', textContent: 'Yapay zekânın bu cihazda nasıl çalışacağını belirlemek için kısa bir kontrol.' }),
      el('div', { className: 'suChips' }, chip(wasm, 'WebAssembly'), chip(gpu, 'WebGPU'), chip(mem === 0 || mem > 4, mem ? `Bellek ≈ ${mem} GB` : 'Bellek bilinmiyor'), chip(true, `${navigator.hardwareConcurrency || '?'} çekirdek`), chip(true, `${innerWidth}×${innerHeight}`)),
      el('p', { className: 'stNote', textContent: rec })],
    () => [el('h2', { textContent: 'Yapay zekâ motoru' }), el('p', { className: 'muted', textContent: 'Birini seç; sonra Ayarlar’dan değiştirebilirsin.' }), ...engineCard(() => {})],
    () => [el('h2', { textContent: 'Hazırsın' }), el('p', { className: 'muted', textContent: 'İlk not defterini oluştur, bir PDF ya da metin ekle ve soru sor. Ayarlar her zaman sağ üstteki dişlide.' }),
      el('div', { className: 'stBtns' }, btn('Yeni not defteri oluştur', () => { finish(); A().createNb(); }, 'primary'), btn('Ana sayfaya dön', () => finish()))],
  ];
  const dots = el('div', { className: 'suDots' }, ...steps.map(() => el('i')));
  const back = btn('Geri', () => go(step - 1)), next = btn('İleri', () => go(step + 1), 'primary'), skip = btn('Atla', () => finish());
  const box = el('div', { className: 'suBox' });
  function finish() { lsSet('class-setup-done', VERSION); d.close(); }
  function go(s) {
    step = Math.max(0, Math.min(steps.length - 1, s)); box.replaceChildren(...steps[step]());
    [...dots.children].forEach((x, i) => x.classList.toggle('on', i === step)); back.hidden = step === 0; next.hidden = step === steps.length - 1; skip.textContent = step === steps.length - 1 ? 'Kapat' : 'Atla';
  }
  body.replaceChildren(el('div', { className: 'suHead' }, el('span', { className: 'suLogo', textContent: 'C' }), dots), box, el('div', { className: 'suNav' }, back, skip, next));
  d.addEventListener('close', () => lsSet('class-setup-done', VERSION), { once: true });
  go(0); if (!d.open) d.showModal();
}

/* ---------- başlangıç ---------- */
function boot() {
  restoreEngine();
  const g = $('#gearBtn'); if (g) { g.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); openSettings(); }; g.title = 'Ayarlar'; g.setAttribute('aria-label', 'Ayarlar'); }
  const tb = $('#tuneBtn'); if (tb) tb.onclick = () => openSettings('engine');
  window.defterSettings = { open: openSettings, setup: openSetup };
  if (!lsGet('class-setup-done', 0) && !new URLSearchParams(location.search).has('nosetup')) {
    const ck = $('#cookieDlg'); const start = () => setTimeout(() => { if (!document.querySelector('dialog[open]')) openSetup(); }, 400);
    if (ck?.open) ck.addEventListener('close', start, { once: true }); else start();
  }
}
if (window.defterApp) boot(); else document.addEventListener('defter-ready', boot, { once: true });
