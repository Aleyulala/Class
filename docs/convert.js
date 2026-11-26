/* Class Dönüştürücü: yerel, gizli dosya dönüştürme (ZenConverter'dan esinlenildi; kod alınmadı, sıfırdan yazıldı).
   Tarayıcıda çalışan araçlar (telefon, el konsolu, PC, GitHub Pages):
     Görsel  JPG / PNG / WEBP / ICO / PDF, yeniden boyutlandırma, ×2–×4 büyütme, kalite
     PDF     görsellerden PDF, birleştir, sayfa seç / böl, döndür, sayfa sil, sıkıştır, metne ve görsele çevir
     Ses     ses ya da videodan WAV, kırp, açılış / kapanış, ses düzeyi, normalleştir, ters çevir, mono, örnekleme
     Video   kontak sayfası, GIF, kare yakala, sesi çıkar
     Altyazı SRT / VTT / LRC / ASS, kayma, karakter kodlaması
     Yazı tipi TTF / OTF ⇄ WOFF
     Belge   DOCX / PPTX / XLSX / ODT / EPUB / PDF / HTML → TXT / MD / HTML / yazdır (PDF)
     Gizlilik fotoğraftaki konum, tarih ve cihaz bilgisini göster ve yeniden kodlamadan sil
   Yerel sunucu + ffmpeg varsa (PC): MP4 / MKV / MOV / WebM, MP3 / M4A / FLAC / OPUS, sıkıştırma, kırpma, video meta verisi silme.
   Hiçbir dosya internete gönderilmez. */
import { readDoc, encodeWav, DOC_RX } from './extract.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null || v === false) continue; if (n.includes('-') || n === 'for') e.setAttribute(n, v === true ? '' : v); else e[n] = v; } e.append(...k.filter((x) => x != null && x !== false)); return e; };
const A = () => window.defterApp;
const sv = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const btn = (label, onclick, cls = '') => el('button', { type: 'button', className: 'btn ' + cls, textContent: label, onclick });
const sec = (title, ...k) => el('section', { className: 'hbSec' }, el('h4', { textContent: title }), ...k);
const field = (label, ctrl, sub) => el('label', { className: 'hbF' }, el('span', {}, label, sub ? el('small', { textContent: sub }) : null), ctrl);
const input = (p) => el('input', { className: 'stIn', ...p });
const select = (opts, p = {}) => el('select', { className: 'stIn', ...p }, ...opts.map(([v, l]) => el('option', { value: v, textContent: l })));
function chips(opts, cur, on) { const w = el('div', { className: 'stSeg', role: 'radiogroup' }); w.value = cur; opts.forEach(([v, l]) => { const b = el('button', { type: 'button', className: 'stSegB' + (v === cur ? ' on' : ''), role: 'radio', 'aria-checked': String(v === cur), textContent: l }); b.onclick = () => { [...w.children].forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); w.value = v; on?.(v); }; w.append(b); }); return w; }
function rangeF(min, max, step, val, fmt, on) { const o = el('output', { textContent: fmt(val) }); const r = el('input', { type: 'range', className: 'stRange', min, max, step, value: val }); r.oninput = () => { o.textContent = fmt(+r.value); on?.(+r.value); }; const w = el('span', { className: 'stRg' }, r, o); Object.defineProperty(w, 'value', { get: () => +r.value }); return w; }
function check(label, on = false) { const i = el('input', { type: 'checkbox', className: 'chk', checked: on }); const l = el('label', { className: 'hbRes cvChk' }, i, el('span', { textContent: label })); Object.defineProperty(l, 'checked', { get: () => i.checked }); return l; }
function status() { const s = el('div', { className: 'hbStat', role: 'status' }); s.set = (t, kind = '') => { s.textContent = t || ''; s.dataset.k = kind; }; return s; }
function bar() { const b = el('div', { className: 'hbBar', hidden: true }, el('i')); b.set = (pct) => { b.hidden = pct == null; b.firstChild.style.width = Math.max(0, Math.min(100, pct || 0)) + '%'; }; return b; }
const fmtB = (n) => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(n < 1073741824 ? 1 : 0) + ' MB');
const base = (n) => n.replace(/\.[^.]+$/, '') || 'dosya';
const ext = (n) => (n.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || '';
const p2 = (n) => String(n).padStart(2, '0');
const hms = (t) => { t = Math.max(0, t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = Math.floor(t % 60); return (h ? h + ':' + p2(m) : m) + ':' + p2(s); };
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : d; };
const tsec = (v) => { const s = String(v || '').trim(); if (!s) return 0; if (s.includes(':')) return s.split(':').map((x) => num(x)).reduce((a, b) => a * 60 + b, 0); return num(s); };
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ---------- ZIP (sıkıştırmasız, UTF-8 adlar) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = -1; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
export async function zip(files) {
  const enc = new TextEncoder(), parts = [], cen = [], seen = new Set(); let off = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    let name = f.name, i = 1; while (seen.has(name)) name = `${base(f.name)} (${i++})${ext(f.name) ? '.' + ext(f.name) : ''}`; seen.add(name);
    const data = new Uint8Array(await f.blob.arrayBuffer()), nm = enc.encode(name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    parts.push(lh.buffer, nm, data); cen.push(ch.buffer, nm); off += 30 + nm.length + data.length;
  }
  const cs = cen.reduce((n, b) => n + b.byteLength, 0); const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' });
}

/* ---------- ortak: dosya seçici ve sonuç listesi ---------- */
function picker(accept, multiple, hint, onChange) {
  const files = []; const inp = el('input', { type: 'file', accept, multiple, hidden: true });
  const list = el('ul', { className: 'cvList' });
  const zone = el('div', { className: 'cvDrop', tabIndex: 0, role: 'button', 'aria-label': 'Dosya seç ya da sürükleyip bırak' },
    el('span', { className: 'cvDropI', innerHTML: sv('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>', 22) }),
    el('b', { textContent: multiple ? 'Dosyaları seç ya da buraya bırak' : 'Dosya seç ya da buraya bırak' }), el('small', { textContent: hint }));
  zone.onclick = () => inp.click(); zone.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('over'); }; zone.ondragleave = () => zone.classList.remove('over');
  zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('over'); add([...e.dataTransfer.files]); };
  inp.onchange = () => { add([...inp.files]); inp.value = ''; };
  const key = (f) => `${f.name}|${f.size}|${f.lastModified}`;
  function add(fs) { if (!fs.length) return; if (!multiple) files.length = 0; const have = new Set(files.map(key)); for (const f of multiple ? fs : fs.slice(0, 1)) if (!have.has(key(f))) { files.push(f); have.add(key(f)); } render(); onChange?.(files); }
  const clr = el('button', { type: 'button', className: 'linkBtn cvClr', textContent: 'Listeyi temizle', hidden: true, onclick: () => { files.length = 0; render(); onChange?.(files); } });
  function render() {
    clr.hidden = files.length < 2;
    list.replaceChildren(...files.map((f, i) => el('li', { className: 'cvItem' },
      el('span', { className: 'cvName', textContent: f.name }), el('small', { textContent: fmtB(f.size) }),
      multiple && files.length > 1 ? el('button', { type: 'button', className: 'cvMini', title: 'Yukarı taşı', 'aria-label': `${f.name} yukarı taşı`, innerHTML: sv('<path d="m6 15 6-6 6 6"/>', 16), disabled: i === 0, onclick: () => { [files[i - 1], files[i]] = [files[i], files[i - 1]]; render(); } }) : null,
      el('button', { type: 'button', className: 'cvMini', title: 'Listeden çıkar', 'aria-label': `${f.name} listeden çıkar`, innerHTML: sv('<path d="M18 6 6 18M6 6l12 12"/>', 16), onclick: () => { files.splice(i, 1); render(); onChange?.(files); } }))));
  }
  return { el: el('div', { className: 'cvPick' }, zone, inp, list, clr), files, add };
}
function results() {
  const ul = el('ul', { className: 'cvOut' }), items = [], urls = [];
  const zipB = btn('Hepsini indir (.zip)', async () => { zipB.disabled = true; try { for (const it of items) if (!it.blob && it.url) it.blob = await (await fetch(it.url)).blob(); const z = await zip(items); const a = el('a', { href: URL.createObjectURL(z), download: 'class-donusturulen.zip' }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); } finally { zipB.disabled = false; } }, 'primary');
  zipB.hidden = true;
  const add = (name, blob, { text, note, url: link, size, type } = {}) => {
    const taken = new Set(items.map((x) => x.name)); let n0 = name, i = 2; while (taken.has(n0)) n0 = `${base(name)} (${i++})${ext(name) ? '.' + ext(name) : ''}`; name = n0;
    items.push({ name, blob, url: link }); const url = blob ? URL.createObjectURL(blob) : link; if (blob) urls.push(url); const bt = blob?.type || type || '';
    const thumb = /^image\//.test(bt) ? el('img', { className: 'cvThumb', src: url, alt: '', loading: 'lazy' }) : /^audio\//.test(bt) ? el('audio', { controls: true, src: url, preload: 'none' }) : /^video\//.test(bt) ? el('video', { className: 'cvThumb', controls: true, src: url, preload: 'metadata' }) : null;
    const extra = text ? el('button', { type: 'button', className: 'btn sm', textContent: 'Kaynak olarak ekle', onclick: async (e) => { try { await A().addSource(base(name), text, 'Dönüştür'); e.target.textContent = 'Eklendi ✓'; e.target.disabled = true; } catch (er) { e.target.textContent = er.message; } } }) : null;
    ul.append(el('li', { className: 'cvItem cvRes' }, thumb, el('span', { className: 'cvName' }, name, note ? el('small', { textContent: note }) : null), el('small', { textContent: fmtB(blob ? blob.size : size || 0) }), extra, el('a', { className: 'btn sm primary', href: url, download: name, textContent: 'İndir' })));
    zipB.hidden = items.length < 2;
  };
  const reset = () => { items.length = 0; urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); ul.replaceChildren(); zipB.hidden = true; };
  return { el: el('div', { className: 'cvResults' }, ul, zipB), add, reset, items };
}
/* her aracın kalıbı: açıklama, seçici, seçenekler, düğme, durum, sonuçlar */
function tool(intro, pick, opts, label, run) {
  const st = status(), pb = bar(), out = results();
  const go = btn(label, async () => {
    if (!pick.files.length) { st.set('Önce dosya seç.', 'err'); return; }
    go.disabled = true; out.reset(); pb.set(0); st.set('Çalışıyor…');
    try {
      await run({ files: [...pick.files], st, pb, out });
      const n = out.items.length, warn = st.dataset.k === 'err' ? st.textContent : '';
      if (warn) st.set(n ? `${n} dosya hazır · Uyarı: ${warn}` : warn, 'err'); else st.set(n ? `Hazır: ${n} dosya. Dosyalar yalnızca bu cihazda işlendi.` : 'Bitti.', 'ok');
    }
    catch (e) { console.error(e); st.set(e.message || String(e), 'err'); }
    finally { go.disabled = false; pb.set(null); }
  }, 'primary');
  return el('div', { className: 'cvTool' }, el('p', { className: 'muted cvIntro', textContent: intro }), pick.el, ...(opts ? [opts] : []), el('div', { className: 'stBtns' }, go), pb, st, out.el);
}

/* ---------- görsel yardımcıları ---------- */
async function loadImg(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {}
  const url = URL.createObjectURL(file);
  try { const im = new Image(); im.src = url; await im.decode(); return im; }
  catch { throw new Error(`${file.name}: bu tarayıcı bu görseli açamıyor${/heic|heif/i.test(file.name) ? ' (HEIC için Safari kullanın ya da PC’de Gelişmiş araçla dönüştürün)' : ''}.`); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
}
const dims = (im) => [im.width || im.naturalWidth, im.height || im.naturalHeight];
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function drawTo(im, w, h, bg) {
  if (w * h > 120e6 || Math.max(w, h) > 16384) throw new Error(`Çıktı çok büyük (${Math.round(w)}×${Math.round(h)}). Daha küçük bir büyütme seçin.`);
  const [sw, sh] = dims(im); let src = im;
  const c = canvas(w, h), x = c.getContext('2d'); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  /* büyük küçültmelerde adım adım yarıya inerek daha keskin sonuç */
  if (sw / w >= 2 && sh / h >= 2) { let cw = sw, ch = sh, t = im; while (cw / 2 >= w && ch / 2 >= h) { cw = Math.round(cw / 2); ch = Math.round(ch / 2); const s = canvas(cw, ch), sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(t, 0, 0, cw, ch); t = s; } src = t; }
  x.drawImage(src, 0, 0, c.width, c.height); return c;
}
const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Bu tarayıcı bu biçimi yazamıyor: ' + type))), type, q));
async function toIco(im) {
  const sizes = [16, 24, 32, 48, 64, 128, 256], pngs = [];
  for (const s of sizes) { const c = canvas(s, s), x = c.getContext('2d'), [w, h] = dims(im), k = Math.min(s / w, s / h); x.imageSmoothingQuality = 'high'; x.drawImage(im, (s - w * k) / 2, (s - h * k) / 2, w * k, h * k); pngs.push(new Uint8Array(await (await toBlob(c, 'image/png')).arrayBuffer())); }
  const hd = new DataView(new ArrayBuffer(6 + 16 * sizes.length)); hd.setUint16(2, 1, true); hd.setUint16(4, sizes.length, true); let off = 6 + 16 * sizes.length;
  sizes.forEach((s, i) => { const o = 6 + 16 * i; hd.setUint8(o, s >= 256 ? 0 : s); hd.setUint8(o + 1, s >= 256 ? 0 : s); hd.setUint16(o + 4, 1, true); hd.setUint16(o + 6, 32, true); hd.setUint32(o + 8, pngs[i].length, true); hd.setUint32(o + 12, off, true); off += pngs[i].length; });
  return new Blob([hd.buffer, ...pngs], { type: 'image/x-icon' });
}

/* ---------- EXIF okuma (JPEG / PNG / WEBP içindeki TIFF bloğu) ---------- */
function tiff(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); const le = dv.getUint16(0) === 0x4949; const g16 = (o) => dv.getUint16(o, le), g32 = (o) => dv.getUint32(o, le);
  const SZ = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const ifd = (o) => {
    const out = {}; if (!o || o + 2 > u8.length) return out; const n = g16(o);
    for (let i = 0; i < n; i++) {
      const e = o + 2 + i * 12; if (e + 12 > u8.length) break; const tag = g16(e), type = g16(e + 2), cnt = g32(e + 4), size = (SZ[type] || 1) * cnt; const vo = size > 4 ? g32(e + 8) : e + 8; if (vo + size > u8.length) continue;
      if (type === 2) out[tag] = new TextDecoder().decode(u8.subarray(vo, vo + cnt)).replace(/\0+$/, '').trim();
      else if (type === 3) out[tag] = cnt === 1 ? g16(vo) : [...Array(cnt)].map((_, j) => g16(vo + 2 * j));
      else if (type === 4) out[tag] = cnt === 1 ? g32(vo) : [...Array(cnt)].map((_, j) => g32(vo + 4 * j));
      else if (type === 5 || type === 10) out[tag] = [...Array(cnt)].map((_, j) => { const a = type === 5 ? g32(vo + 8 * j) : dv.getInt32(vo + 8 * j, le), b = type === 5 ? g32(vo + 8 * j + 4) : dv.getInt32(vo + 8 * j + 4, le); return b ? a / b : 0; });
    }
    return out;
  };
  const i0 = ifd(g32(4)); const ex = i0[0x8769] ? ifd(i0[0x8769]) : {}; const gps = i0[0x8825] ? ifd(i0[0x8825]) : {};
  return { i0, ex, gps };
}
function exifBlock(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (dv.getUint16(0) === 0xffd8) { /* JPEG */
    let o = 2; while (o + 4 < u8.length && u8[o] === 0xff) { const m = u8[o + 1], len = dv.getUint16(o + 2); if (m === 0xda) break; if (m === 0xe1 && String.fromCharCode(...u8.subarray(o + 4, o + 8)) === 'Exif') return u8.subarray(o + 10, o + 2 + len); o += 2 + len; }
  } else if (dv.getUint32(0) === 0x89504e47) { /* PNG eXIf */
    let o = 8; while (o + 8 < u8.length) { const len = dv.getUint32(o), type = String.fromCharCode(...u8.subarray(o + 4, o + 8)); if (type === 'eXIf') return u8.subarray(o + 8, o + 8 + len); o += 12 + len; }
  } else if (String.fromCharCode(...u8.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...u8.subarray(8, 12)) === 'WEBP') {
    let o = 12; while (o + 8 < u8.length) { const id = String.fromCharCode(...u8.subarray(o, o + 4)), len = dv.getUint32(o + 4, true); if (id === 'EXIF') { const b = u8.subarray(o + 8, o + 8 + len); return String.fromCharCode(...b.subarray(0, 4)) === 'Exif' ? b.subarray(6) : b; } o += 8 + len + (len & 1); }
  }
  return null;
}
function exifInfo(u8) {
  const b = exifBlock(u8); if (!b) return null; let t; try { t = tiff(b); } catch { return null; }
  const { i0, ex, gps } = t; const rows = [];
  const dms = (v, ref) => (Array.isArray(v) && v.length >= 3 ? (v[0] + v[1] / 60 + v[2] / 3600) * (/[SW]/.test(ref || '') ? -1 : 1) : null);
  const lat = dms(gps[2], gps[1]), lon = dms(gps[4], gps[3]);
  if (lat != null && lon != null) rows.push(['Konum', `${lat.toFixed(5)}, ${lon.toFixed(5)}`, true]);
  if (gps[6]) rows.push(['Yükseklik', `${Math.round(gps[6][0])} m`, true]);
  const when = ex[0x9003] || i0[0x0132]; if (when) rows.push(['Çekim zamanı', when, true]);
  const dev = [i0[0x010f], i0[0x0110]].filter(Boolean).join(' '); if (dev) rows.push(['Cihaz', dev, true]);
  if (ex[0xa434]) rows.push(['Lens', ex[0xa434], false]);
  if (ex[0xa431]) rows.push(['Seri no', ex[0xa431], true]);
  if (i0[0x0131]) rows.push(['Yazılım', i0[0x0131], false]);
  if (i0[0x013b]) rows.push(['Sanatçı', i0[0x013b], true]);
  if (i0[0x8298]) rows.push(['Telif', i0[0x8298], false]);
  return rows;
}
/* yeniden kodlamadan meta veri silme */
function stripMeta(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); const parts = [];
  if (dv.getUint16(0) === 0xffd8) {
    parts.push(u8.subarray(0, 2)); let o = 2;
    while (o + 4 <= u8.length) {
      if (u8[o] !== 0xff) throw new Error('JPEG yapısı okunamadı.');
      const m = u8[o + 1]; if (m === 0xda) { parts.push(u8.subarray(o)); break; }
      if (m === 0xff) { o++; continue; }
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { parts.push(u8.subarray(o, o + 2)); o += 2; continue; }
      const len = dv.getUint16(o + 2); const drop = m === 0xe1 || m === 0xed || m === 0xfe || (m >= 0xe3 && m <= 0xef && m !== 0xee);
      if (!drop) parts.push(u8.subarray(o, o + 2 + len)); o += 2 + len;
    }
    return { blob: new Blob(parts, { type: 'image/jpeg' }), how: 'JPEG: EXIF, XMP, IPTC ve yorumlar silindi; görüntü yeniden kodlanmadı.' };
  }
  if (dv.getUint32(0) === 0x89504e47) {
    parts.push(u8.subarray(0, 8)); let o = 8;
    while (o + 8 <= u8.length) { const len = dv.getUint32(o), type = String.fromCharCode(...u8.subarray(o + 4, o + 8)); if (!['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'].includes(type)) parts.push(u8.subarray(o, o + 12 + len)); o += 12 + len; if (type === 'IEND') break; }
    return { blob: new Blob(parts, { type: 'image/png' }), how: 'PNG: metin, EXIF ve zaman blokları silindi; görüntü yeniden kodlanmadı.' };
  }
  if (String.fromCharCode(...u8.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...u8.subarray(8, 12)) === 'WEBP') {
    const chunks = []; let o = 12;
    while (o + 8 <= u8.length) { const id = String.fromCharCode(...u8.subarray(o, o + 4)), len = dv.getUint32(o + 4, true), end = o + 8 + len + (len & 1); if (id !== 'EXIF' && id !== 'XMP ') { const c = u8.slice(o, Math.min(end, u8.length)); if (id === 'VP8X') c[8] &= ~0x0c; chunks.push(c); } o = end; }
    const size = 4 + chunks.reduce((n, c) => n + c.length, 0); const h = new Uint8Array(12); h.set(u8.subarray(0, 12)); new DataView(h.buffer).setUint32(4, size, true);
    return { blob: new Blob([h, ...chunks], { type: 'image/webp' }), how: 'WEBP: EXIF ve XMP silindi; görüntü yeniden kodlanmadı.' };
  }
  return null;
}

/* ---------- kitaplıklar (yalnızca gerekince yüklenir) ---------- */
let PL = null, PJ = null;
const pdfLib = async () => (PL ||= await import('./vendor/pdf-lib/pdf-lib.esm.min.js'));
async function pdfjs() { if (PJ) return PJ; PJ = await import('./vendor/pdfjs/pdf.min.mjs'); PJ.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', location.href).href; return PJ; }
async function loadPdf(file) {
  const { PDFDocument } = await pdfLib();
  try { return await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); }
  catch (e) { throw new Error(/encrypt/i.test(e.message) ? `${file.name}: parolalı PDF’ler desteklenmiyor.` : `${file.name}: PDF okunamadı (${e.message}).`); }
}
/* "1-3, 5, 8-" → [0,1,2,4,7,…] */
function pages(spec, n) {
  const s = String(spec || '').trim(); if (!s) return [...Array(n).keys()];
  const out = []; for (const part of s.split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/); if (m) { const a = m[1] ? +m[1] : 1, b = m[2] ? +m[2] : n; for (let i = Math.max(1, a); i <= Math.min(n, b); i++) out.push(i - 1); }
    else if (/^\d+$/.test(part)) { const i = +part; if (i >= 1 && i <= n) out.push(i - 1); } else throw new Error(`Sayfa aralığı anlaşılamadı: “${part}”. Örnek: 1-3, 5, 8-`);
  }
  if (!out.length) throw new Error('Seçilen aralıkta sayfa yok.'); return out;
}
async function pdfOut(doc, name) { return { name, blob: new Blob([await doc.save({ useObjectStreams: true })], { type: 'application/pdf' }) }; }

/* ---------- ses ---------- */
async function decodeAudio(file) {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error('Bu tarayıcı sesi çözemiyor.');
  const ctx = new AC(); try { return await ctx.decodeAudioData(await file.arrayBuffer()); } catch { throw new Error(`${file.name}: ses çözülemedi (biçim desteklenmiyor olabilir; PC’de Gelişmiş aracı deneyin).`); } finally { ctx.close?.(); }
}
export async function processAudio(buf, o = {}) {
  const sr = o.rate || buf.sampleRate, s = Math.max(0, o.start || 0), e = Math.min(buf.duration, o.end > 0 ? o.end : buf.duration);
  if (e - s <= 0.01) throw new Error('Bitiş zamanı başlangıçtan sonra olmalı.');
  const ch = o.mono ? 1 : Math.min(2, buf.numberOfChannels), dur = e - s, len = Math.ceil(dur * sr);
  const off = new OfflineAudioContext(ch, len, sr), src = off.createBufferSource(), g = off.createGain(); src.buffer = buf; src.connect(g).connect(off.destination);
  const v = o.gain ?? 1, fi = Math.min(o.fadeIn || 0, dur / 2), fo = Math.min(o.fadeOut || 0, dur / 2);
  g.gain.setValueAtTime(fi > 0 ? 0 : v, 0); if (fi > 0) g.gain.linearRampToValueAtTime(v, fi);
  if (fo > 0) { g.gain.setValueAtTime(v, dur - fo); g.gain.linearRampToValueAtTime(0, dur); }
  src.start(0, s, dur); const out = await off.startRendering();
  const chans = [...Array(out.numberOfChannels)].map((_, i) => out.getChannelData(i));
  if (o.reverse) chans.forEach((c) => c.reverse());
  if (o.normalize) { let pk = 0; for (const c of chans) for (let i = 0; i < c.length; i++) { const a = Math.abs(c[i]); if (a > pk) pk = a; } if (pk > 0) { const k = 0.98 / pk; for (const c of chans) for (let i = 0; i < c.length; i++) c[i] *= k; } }
  return encodeWav(chans, sr);
}

/* ---------- video ---------- */
function loadVideo(file) {
  return new Promise((res, rej) => {
    const v = el('video', { muted: true, playsInline: true, preload: 'auto' }); v.muted = true; v.src = URL.createObjectURL(file);
    const to = setTimeout(() => rej(new Error(`${file.name}: video açılamadı (zaman aşımı).`)), 20000);
    v.onloadeddata = () => { clearTimeout(to); if (!v.videoWidth) rej(new Error(`${file.name}: videoda görüntü yok ya da kodlama desteklenmiyor.`)); else res(v); };
    v.onerror = () => { clearTimeout(to); rej(new Error(`${file.name}: bu tarayıcı bu videoyu açamıyor (MKV / HEVC için PC’de Gelişmiş aracı kullanın).`)); };
  });
}
const seek = (v, t) => new Promise((res) => { let ok = false; const done = () => { if (ok) return; ok = true; v.removeEventListener('seeked', done); setTimeout(res, 20); }; v.addEventListener('seeked', done); v.currentTime = Math.min(Math.max(0, t), Math.max(0, v.duration - 0.04)); setTimeout(done, 4000); });
const freeVideo = (v) => { URL.revokeObjectURL(v.src); v.removeAttribute('src'); v.load(); };

/* GIF: ortak palet (medyan kesim) + düzenli titreme + LZW */
function medianCut(px, max = 255) {
  const n = px.length / 3; let boxes = [Uint32Array.from({ length: n }, (_, i) => i)];
  const rng = (b) => { const mn = [255, 255, 255], mx = [0, 0, 0]; for (const i of b) for (let c = 0; c < 3; c++) { const v = px[i * 3 + c]; if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; } const r = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]; const ch = r.indexOf(Math.max(...r)); return { ch, size: r[ch] }; };
  const info = new Map(boxes.map((b) => [b, rng(b)]));
  while (boxes.length < max) {
    let bi = -1, best = 0; boxes.forEach((b, i) => { if (b.length < 2) return; const s = info.get(b).size * Math.sqrt(b.length); if (s > best) { best = s; bi = i; } });
    if (bi < 0) break; const b = boxes[bi], ch = info.get(b).ch; const arr = Array.from(b).sort((p, q) => px[p * 3 + ch] - px[q * 3 + ch]); const m = arr.length >> 1;
    const l = Uint32Array.from(arr.slice(0, m)), r = Uint32Array.from(arr.slice(m)); boxes.splice(bi, 1, l, r); info.set(l, rng(l)); info.set(r, rng(r));
  }
  return boxes.map((b) => { let r = 0, g = 0, bl = 0; for (const i of b) { r += px[i * 3]; g += px[i * 3 + 1]; bl += px[i * 3 + 2]; } const k = b.length || 1; return [Math.round(r / k), Math.round(g / k), Math.round(bl / k)]; });
}
function mapper(pal) {
  const cache = new Int16Array(32768).fill(-1);
  return (r, g, b) => { const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3); let v = cache[k]; if (v >= 0) return v; let bd = 1e12; for (let i = 0; i < pal.length; i++) { const p = pal[i], d = (p[0] - r) ** 2 * 3 + (p[1] - g) ** 2 * 4 + (p[2] - b) ** 2 * 2; if (d < bd) { bd = d; v = i; } } cache[k] = v; return v; };
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.5) * 24);
function lzw(ix, min = 8) {
  const out = []; let cur = 0, bits = 0; const emit = (c, s) => { cur |= c << bits; bits += s; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  const clear = 1 << min, eoi = clear + 1; let size = min + 1, next = eoi + 1, dict = new Map();
  emit(clear, size); let pre = ix[0];
  for (let i = 1; i < ix.length; i++) {
    const k = ix[i], key = pre * 256 + k, c = dict.get(key); if (c !== undefined) { pre = c; continue; }
    emit(pre, size);
    if (next === 4096) { emit(clear, size); dict = new Map(); size = min + 1; next = eoi + 1; }
    else { if (next >= 1 << size) size++; dict.set(key, next++); }
    pre = k;
  }
  emit(pre, size); emit(eoi, size); if (bits > 0) out.push(cur & 255); return Uint8Array.from(out);
}
function gifBlob(frames, w, h, pal, delayCs) {
  const head = []; const u16 = (v) => head.push(v & 255, (v >> 8) & 255); const str = (s) => { for (const c of s) head.push(c.charCodeAt(0)); };
  str('GIF89a'); u16(w); u16(h); head.push(0xf7, 0, 0); for (let i = 0; i < 256; i++) { const p = pal[i] || [0, 0, 0]; head.push(p[0], p[1], p[2]); }
  head.push(0x21, 0xff, 11); str('NETSCAPE2.0'); head.push(3, 1, 0, 0, 0);
  const parts = [Uint8Array.from(head)];
  for (const f of frames) {
    parts.push(Uint8Array.of(0x21, 0xf9, 4, 0x04, delayCs & 255, (delayCs >> 8) & 255, 0, 0, 0x2c, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0, 8));
    const d = lzw(f, 8); for (let i = 0; i < d.length; i += 255) { const n = Math.min(255, d.length - i); parts.push(Uint8Array.of(n), d.subarray(i, i + n)); } parts.push(Uint8Array.of(0));
  }
  parts.push(Uint8Array.of(0x3b)); return new Blob(parts, { type: 'image/gif' });
}

/* ---------- altyazı ---------- */
const SUB_RX = /\.(srt|vtt|lrc|ass|ssa)$/i;
function subParse(text, fmt) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'); const cues = [];
  const T = (s) => s.trim().replace(',', '.').split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
  if (fmt === 'srt' || fmt === 'vtt') {
    for (const blk of text.split(/\n{2,}/)) { const lines = blk.split('\n'); const i = lines.findIndex((l) => l.includes('-->')); if (i < 0) continue; const [a, b] = lines[i].split('-->'); const t = lines.slice(i + 1).join('\n').trim(); if (t) cues.push({ s: T(a), e: T(b.trim().split(/\s+/)[0]), t }); }
  } else if (fmt === 'ass' || fmt === 'ssa') {
    let fields = null; for (const l of text.split('\n')) { if (/^Format:/i.test(l) && fields === null && /Start/i.test(l)) fields = l.slice(7).split(',').map((x) => x.trim().toLowerCase()); else if (/^Dialogue:/i.test(l) && fields) { const parts = l.slice(9).split(','); const raw = parts.slice(fields.length - 1).join(','), v = Object.fromEntries(fields.map((f, i) => [f, (parts[i] || '').trim()])); const t = raw.replace(/\{[^}]*\}/g, '').replace(/\\N|\\n/g, '\n').replace(/\\h/g, ' ').trim(); if (t) cues.push({ s: T(v.start), e: T(v.end), t }); } }
  } else if (fmt === 'lrc') {
    let offset = 0; const tmp = [];
    for (const l of text.split('\n')) { const om = l.match(/^\[offset:\s*([+-]?\d+)\]/i); if (om) { offset = +om[1] / 1000; continue; } const tags = [...l.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)]; if (!tags.length) continue; const t = l.replace(/\[[^\]]*\]/g, '').trim(); for (const m of tags) tmp.push({ s: +m[1] * 60 + num(m[2].replace(':', '.')), t }); }
    tmp.sort((a, b) => a.s - b.s); tmp.forEach((c, i) => { c.s = Math.max(0, c.s - offset); c.e = i + 1 < tmp.length ? Math.max(c.s + 0.5, tmp[i + 1].s - offset) : c.s + 4; if (c.t) cues.push(c); });
  }
  return cues;
}
function subWrite(cues, fmt) {
  const ms = (t) => Math.max(0, Math.round(t * 1000)); const hh = (t, sep) => { const m = ms(t); return `${p2(Math.floor(m / 3600000))}:${p2(Math.floor(m / 60000) % 60)}:${p2(Math.floor(m / 1000) % 60)}${sep}${String(m % 1000).padStart(3, '0')}`; };
  const plain = (t) => t.replace(/<[^>]+>/g, '');
  if (fmt === 'srt') return cues.map((c, i) => `${i + 1}\n${hh(c.s, ',')} --> ${hh(c.e, ',')}\n${c.t}`).join('\n\n') + '\n';
  if (fmt === 'vtt') return 'WEBVTT\n\n' + cues.map((c) => `${hh(c.s, '.')} --> ${hh(c.e, '.')}\n${c.t}`).join('\n\n') + '\n';
  if (fmt === 'lrc') return cues.map((c) => { const m = ms(c.s); return `[${p2(Math.floor(m / 60000))}:${p2(Math.floor(m / 1000) % 60)}.${p2(Math.floor((m % 1000) / 10))}]${plain(c.t).replace(/\n/g, ' ')}`; }).join('\n') + '\n';
  const at = (t) => { const c = Math.round(Math.max(0, t) * 100); return `${Math.floor(c / 360000)}:${p2(Math.floor(c / 6000) % 60)}:${p2(Math.floor(c / 100) % 60)}.${p2(c % 100)}`; };
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,3,1,2,60,60,50,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` +
    cues.map((c) => `Dialogue: 0,${at(c.s)},${at(c.e)},Default,,0,0,0,,${plain(c.t).replace(/\n/g, '\\N')}`).join('\n') + '\n';
}
async function readText(file, enc) {
  const buf = await file.arrayBuffer();
  if (enc && enc !== 'auto') return new TextDecoder(enc).decode(buf);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('windows-1254').decode(buf); }
}

/* ---------- yazı tipi: TTF / OTF ⇄ WOFF ---------- */
const z = async (u8, mode, dir) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(dir === 'c' ? new CompressionStream(mode) : new DecompressionStream(mode))).arrayBuffer());
async function sfntToWoff(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), flavor = dv.getUint32(0), n = dv.getUint16(4);
  if (![0x00010000, 0x4f54544f, 0x74727565].includes(flavor)) throw new Error('Bu dosya TTF / OTF değil.');
  const tabs = []; for (let i = 0; i < n; i++) { const o = 12 + 16 * i; tabs.push({ tag: dv.getUint32(o), sum: dv.getUint32(o + 4), off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) }); }
  tabs.sort((a, b) => a.tag - b.tag); let sfntSize = 12 + 16 * n;
  for (const t of tabs) { const raw = u8.subarray(t.off, t.off + t.len); const c = await z(raw, 'deflate', 'c'); t.data = c.length < raw.length ? c : raw; sfntSize += (t.len + 3) & ~3; }
  let off = 44 + 20 * n; const dir = new DataView(new ArrayBuffer(44 + 20 * n)); const body = [];
  tabs.forEach((t, i) => { const o = 44 + 20 * i; dir.setUint32(o, t.tag); dir.setUint32(o + 4, off); dir.setUint32(o + 8, t.data.length); dir.setUint32(o + 12, t.len); dir.setUint32(o + 16, t.sum); body.push(t.data); const pad = (4 - (t.data.length & 3)) & 3; if (pad) body.push(new Uint8Array(pad)); off += t.data.length + pad; });
  dir.setUint32(0, 0x774f4646); dir.setUint32(4, flavor); dir.setUint32(8, off); dir.setUint16(12, n); dir.setUint32(16, sfntSize); dir.setUint16(20, 1);
  return new Blob([dir.buffer, ...body], { type: 'font/woff' });
}
async function woffToSfnt(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); if (dv.getUint32(0) === 0x774f4632) throw new Error('WOFF2 (Brotli) şu an tarayıcıda açılamıyor; WOFF, TTF ve OTF destekleniyor.');
  if (dv.getUint32(0) !== 0x774f4646) throw new Error('Bu dosya WOFF değil.');
  const flavor = dv.getUint32(4), n = dv.getUint16(12), tabs = [];
  for (let i = 0; i < n; i++) { const o = 44 + 20 * i, t = { tag: dv.getUint32(o), off: dv.getUint32(o + 4), clen: dv.getUint32(o + 8), len: dv.getUint32(o + 12), sum: dv.getUint32(o + 16) }; const raw = u8.subarray(t.off, t.off + t.clen); t.data = t.clen < t.len ? await z(raw, 'deflate', 'd') : raw; tabs.push(t); }
  let p = 1, e = 0; while (p * 2 <= n) { p *= 2; e++; }
  const hd = new DataView(new ArrayBuffer(12 + 16 * n)); hd.setUint32(0, flavor); hd.setUint16(4, n); hd.setUint16(6, p * 16); hd.setUint16(8, e); hd.setUint16(10, n * 16 - p * 16);
  let off = 12 + 16 * n; const body = [];
  tabs.forEach((t, i) => { const o = 12 + 16 * i; hd.setUint32(o, t.tag); hd.setUint32(o + 4, t.sum); hd.setUint32(o + 8, off); hd.setUint32(o + 12, t.len); body.push(t.data); const pad = (4 - (t.len & 3)) & 3; if (pad) body.push(new Uint8Array(pad)); off += t.len + pad; });
  return { blob: new Blob([hd.buffer, ...body], { type: flavor === 0x4f54544f ? 'font/otf' : 'font/ttf' }), ext: flavor === 0x4f54544f ? 'otf' : 'ttf' };
}

/* ---------- belge ---------- */
async function docText(file) {
  if (DOC_RX.test(file.name)) return readDoc(file);
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return pdfText(file, false);
  const t = await readText(file);
  if (/\.html?$/i.test(file.name) || /html/.test(file.type)) { const d = new DOMParser().parseFromString(t, 'text/html'); d.querySelectorAll('script,style,noscript').forEach((n) => n.remove()); d.body?.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,div,br,tr').forEach((n) => n.append('\n')); return (d.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim(); }
  if (SUB_RX.test(file.name)) return subParse(t, ext(file.name)).map((c) => c.t).join('\n');
  return t;
}
async function pdfText(file, mdHeads) {
  const pj = await pdfjs(); const doc = await pj.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; let out = '';
  for (let i = 1; i <= doc.numPages; i++) { const tc = await (await doc.getPage(i)).getTextContent(); const t = tc.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n').trim(); out += (mdHeads ? `## Sayfa ${i}\n\n` : '') + t + '\n\n'; }
  return out.trim();
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function htmlDoc(title, text) {
  const body = A()?.md ? A().md(text) : text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1b1f26}h1,h2,h3{line-height:1.25}pre,code{background:#f1f2f5;border-radius:6px}pre{padding:12px;overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:4px 8px}@media print{body{margin:0}}</style></head><body><h1>${esc(title)}</h1>\n${body}\n</body></html>`;
}
function printHtml(html) {
  const w = window.open('', '_blank');
  if (w) { w.document.open(); w.document.write(html); w.document.close(); w.onload = () => setTimeout(() => w.print(), 200); setTimeout(() => { try { w.print(); } catch {} }, 800); return; }
  const f = el('iframe', { style: 'position:fixed;width:0;height:0;border:0;right:0;bottom:0' }); document.body.append(f); f.srcdoc = html; f.onload = () => { f.contentWindow.print(); setTimeout(() => f.remove(), 60000); };
}

/* ======================= ARAÇLAR ======================= */
const IMG_ACCEPT = 'image/*,.heic,.heif,.ico,.jfif';
function tImage() {
  const pick = picker(IMG_ACCEPT, true, 'JPG, PNG, WEBP, GIF (ilk kare), BMP, ICO; HEIC tarayıcı açabiliyorsa');
  const fmt = chips([['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WEBP'], ['ico', 'ICO'], ['pdf', 'PDF']], 'jpg');
  const size = select([['1', 'Orijinal boyut'], ['0.75', '%75'], ['0.5', '%50'], ['0.25', '%25'], ['w1920', 'En fazla 1920 px'], ['w1280', 'En fazla 1280 px'], ['w720', 'En fazla 720 px'], ['2', 'Büyüt ×2'], ['3', 'Büyüt ×3'], ['4', 'Büyüt ×4']]);
  const q = rangeF(0.4, 1, 0.02, 0.9, (v) => Math.round(v * 100) + '%');
  const bg = check('Saydam alanları beyaz yap (JPG ve PDF’te her zaman)', false);
  const onePdf = check('PDF’te hepsini tek dosyada birleştir', true);
  const opts = sec('Ayarlar', field('Çıktı biçimi', fmt), field('Boyut', size, 'Büyütme yumuşak (çift doğrusal) ölçekleme kullanır'), field('Kalite (JPG / WEBP)', q), bg, onePdf);
  return tool('Görselleri biçim değiştirerek, küçülterek ya da büyüterek dönüştür. Konum ve cihaz bilgisi gibi meta veriler yeni dosyaya taşınmaz.', pick, opts, 'Dönüştür', async ({ files, st, pb, out }) => {
    const f = fmt.value, sz = size.value;
    const target = (w, h) => { if (sz.startsWith('w')) { const m = +sz.slice(1); const k = Math.min(1, m / Math.max(w, h)); return [w * k, h * k]; } return [w * +sz, h * +sz]; };
    if (f === 'pdf') {
      const { PDFDocument } = await pdfLib(); let doc = await PDFDocument.create({ updateMetadata: false }); const single = onePdf.checked;
      for (const [i, file] of files.entries()) {
        st.set(`${i + 1}/${files.length}: ${file.name}`); pb.set((i / files.length) * 100); await tick();
        const im = await loadImg(file); const [w, h] = target(...dims(im)); const c = drawTo(im, w, h, '#ffffff'); const jpg = await toBlob(c, 'image/jpeg', q.value);
        const img = await doc.embedJpg(await jpg.arrayBuffer()); const pw = (c.width * 72) / 96, ph = (c.height * 72) / 96; doc.addPage([pw, ph]).drawImage(img, { x: 0, y: 0, width: pw, height: ph });
        if (!single) { const r = await pdfOut(doc, base(file.name) + '.pdf'); out.add(r.name, r.blob); doc = await PDFDocument.create({ updateMetadata: false }); }
      }
      if (single) { const r = await pdfOut(doc, files.length === 1 ? base(files[0].name) + '.pdf' : 'gorseller.pdf'); out.add(r.name, r.blob, { note: `${files.length} sayfa` }); }
      return;
    }
    for (const [i, file] of files.entries()) {
      st.set(`${i + 1}/${files.length}: ${file.name}`); pb.set((i / files.length) * 100); await tick();
      const im = await loadImg(file); let blob;
      if (f === 'ico') blob = await toIco(im);
      else { const [w, h] = target(...dims(im)); const c = drawTo(im, w, h, f === 'jpg' || bg.checked ? '#ffffff' : null); const type = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[f]; blob = await toBlob(c, type, q.value); if (blob.type !== type) { st.set(`Bu tarayıcı ${f.toUpperCase()} yazamıyor; PNG olarak kaydedildi.`, 'err'); } }
      const e2 = blob.type === 'image/png' && f !== 'png' && f !== 'ico' ? 'png' : f; out.add(`${base(file.name)}.${e2}`, blob, { note: f === 'ico' ? '16–256 px, 7 boyut' : null });
    }
  });
}
function tPdf() {
  const pick = picker('application/pdf,.pdf,image/*', true, 'PDF dosyaları (birleştirmede sırayı oklarla ayarla) ya da görseller');
  const mode = select([['merge', 'Birleştir (sıradaki PDF’leri tek dosya yap)'], ['images', 'Görsellerden PDF'], ['pick', 'Sayfa seç (yeni PDF)'], ['split', 'Her sayfayı ayrı PDF yap'], ['rotate', 'Döndür'], ['delete', 'Sayfa sil'], ['compress', 'Sıkıştır (görüntüye çevirerek)'], ['text', 'Metne çevir (TXT / MD)'], ['toimg', 'Sayfaları görsele çevir (PNG / JPG)'], ['clean', 'Başlık, yazar ve meta veriyi temizle']]);
  const range = input({ placeholder: 'Sayfalar: ör. 1-3, 5, 8-  (boş: hepsi)' });
  const rot = chips([['90', '90° sağa'], ['180', '180°'], ['270', '90° sola']], '90');
  const qual = chips([['hq', 'Yüksek kalite'], ['mid', 'Dengeli'], ['small', 'Küçük dosya']], 'mid');
  const tfmt = chips([['md', 'Markdown'], ['txt', 'Düz metin']], 'md');
  const ifmt = chips([['png', 'PNG'], ['jpg', 'JPG']], 'png');
  const page = chips([['fit', 'Görsel boyutunda'], ['a4', 'A4 sayfaya sığdır']], 'fit');
  const rows = { range: field('Sayfa aralığı', range), rot: field('Açı', rot), qual: field('Sıkıştırma', qual, 'Metin seçilemez hale gelir; taranmış belgelerde en çok kazanç'), tfmt: field('Metin biçimi', tfmt), ifmt: field('Görsel biçimi', ifmt), page: field('Sayfa boyutu', page) };
  const NEED = { merge: [], images: ['page'], pick: ['range'], split: ['range'], rotate: ['range', 'rot'], delete: ['range'], compress: ['qual'], text: ['tfmt'], toimg: ['range', 'ifmt'], clean: [] };
  const sync = () => Object.entries(rows).forEach(([k, r]) => (r.hidden = !NEED[mode.value].includes(k)));
  mode.onchange = sync; sync();
  const note = el('p', { className: 'hint', textContent: 'Parolalı PDF açma / parola koyma ve OCR (görüntüden metin) bu sürümde yok.' });
  return tool('PDF’leri birleştir, böl, döndür, sıkıştır ya da metne ve görsele çevir. Hepsi bu cihazda yapılır.', pick, sec('İşlem', field('Ne yapılsın?', mode), ...Object.values(rows), note), 'Uygula', async ({ files, st, pb, out }) => {
    const m = mode.value; const { PDFDocument, degrees } = await pdfLib();
    const pdfs = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf'), imgs = files.filter((f) => !pdfs.includes(f));
    if (m === 'images') {
      if (!imgs.length) throw new Error('Görsel seç.'); const doc = await PDFDocument.create({ updateMetadata: false });
      for (const [i, f] of imgs.entries()) {
        st.set(`${i + 1}/${imgs.length}: ${f.name}`); pb.set((i / imgs.length) * 100); await tick();
        const im = await loadImg(f), [w, h] = dims(im); const jpg = await toBlob(drawTo(im, w, h, '#ffffff'), 'image/jpeg', 0.9); const img = await doc.embedJpg(await jpg.arrayBuffer());
        if (page.value === 'a4') { const land = w > h, pw = land ? 841.89 : 595.28, ph = land ? 595.28 : 841.89, mg = 24, k = Math.min((pw - 2 * mg) / w, (ph - 2 * mg) / h); doc.addPage([pw, ph]).drawImage(img, { x: (pw - w * k) / 2, y: (ph - h * k) / 2, width: w * k, height: h * k }); }
        else { const pw = (w * 72) / 96, ph = (h * 72) / 96; doc.addPage([pw, ph]).drawImage(img, { x: 0, y: 0, width: pw, height: ph }); }
      }
      const r = await pdfOut(doc, imgs.length === 1 ? base(imgs[0].name) + '.pdf' : 'gorseller.pdf'); out.add(r.name, r.blob, { note: `${imgs.length} sayfa` }); return;
    }
    if (!pdfs.length) throw new Error('PDF seç.');
    if (m === 'merge') {
      if (pdfs.length < 2) throw new Error('Birleştirmek için en az iki PDF seç.'); const doc = await PDFDocument.create({ updateMetadata: false }); let n = 0;
      for (const [i, f] of pdfs.entries()) { st.set(`${i + 1}/${pdfs.length}: ${f.name}`); pb.set((i / pdfs.length) * 100); const src = await loadPdf(f); const cp = await doc.copyPages(src, src.getPageIndices()); cp.forEach((p) => doc.addPage(p)); n += cp.length; }
      const r = await pdfOut(doc, 'birlesik.pdf'); out.add(r.name, r.blob, { note: `${pdfs.length} dosya · ${n} sayfa` }); return;
    }
    for (const [fi, f] of pdfs.entries()) {
      st.set(`${fi + 1}/${pdfs.length}: ${f.name}`); pb.set((fi / pdfs.length) * 100); await tick();
      if (m === 'text') { const t = await pdfText(f, tfmt.value === 'md'); out.add(`${base(f.name)}.${tfmt.value}`, new Blob([t], { type: tfmt.value === 'md' ? 'text/markdown' : 'text/plain' }), { text: t, note: t ? null : 'Metin bulunamadı (taranmış PDF olabilir)' }); continue; }
      if (m === 'toimg' || m === 'compress') {
        const pj = await pdfjs(); const src = await pj.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        const idx = m === 'toimg' ? pages(range.value, src.numPages) : [...Array(src.numPages).keys()];
        const Q = { hq: [2, 0.85], mid: [1.5, 0.7], small: [1.1, 0.5] }[qual.value]; const scale = m === 'toimg' ? 2 : Q[0];
        const doc = m === 'compress' ? await PDFDocument.create({ updateMetadata: false }) : null;
        for (const [k, i] of idx.entries()) {
          st.set(`${f.name}: sayfa ${i + 1}/${src.numPages}`); pb.set(((fi + k / idx.length) / pdfs.length) * 100);
          const pg = await src.getPage(i + 1), vp = pg.getViewport({ scale }), c = canvas(vp.width, vp.height), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
          await pg.render({ canvasContext: x, viewport: vp }).promise;
          if (m === 'toimg') { const type = ifmt.value === 'png' ? 'image/png' : 'image/jpeg'; out.add(`${base(f.name)}-s${i + 1}.${ifmt.value}`, await toBlob(c, type, 0.9)); }
          else { const img = await doc.embedJpg(await (await toBlob(c, 'image/jpeg', Q[1])).arrayBuffer()); const v1 = pg.getViewport({ scale: 1 }); doc.addPage([v1.width, v1.height]).drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height }); }
          c.width = c.height = 1;
        }
        if (doc) { const r = await pdfOut(doc, base(f.name) + '-sikistirilmis.pdf'); const pct = Math.round((1 - r.blob.size / f.size) * 100); out.add(r.name, r.blob, { note: pct > 0 ? `%${pct} küçüldü` : 'Bu belge zaten küçük; orijinali kullanın' }); }
        continue;
      }
      const src = await loadPdf(f), n = src.getPageCount();
      if (m === 'pick') { const doc = await PDFDocument.create({ updateMetadata: false }); (await doc.copyPages(src, pages(range.value, n))).forEach((p) => doc.addPage(p)); const r = await pdfOut(doc, base(f.name) + '-secilen.pdf'); out.add(r.name, r.blob, { note: `${doc.getPageCount()} sayfa` }); }
      else if (m === 'split') { for (const i of pages(range.value, n)) { const doc = await PDFDocument.create({ updateMetadata: false }); const [p] = await doc.copyPages(src, [i]); doc.addPage(p); const r = await pdfOut(doc, `${base(f.name)}-s${i + 1}.pdf`); out.add(r.name, r.blob); } }
      else if (m === 'rotate') { const set = new Set(pages(range.value, n)); src.getPages().forEach((p, i) => { if (set.has(i)) p.setRotation(degrees((p.getRotation().angle + +rot.value) % 360)); }); const r = await pdfOut(src, base(f.name) + '-dondurulmus.pdf'); out.add(r.name, r.blob); }
      else if (m === 'delete') { const del = new Set(pages(range.value, n)); if (!range.value.trim()) throw new Error('Silinecek sayfaları yaz (ör. 2, 4-5).'); if (del.size >= n) throw new Error('Tüm sayfalar silinemez.'); [...del].sort((a, b) => b - a).forEach((i) => src.removePage(i)); const r = await pdfOut(src, base(f.name) + '-duzenlenmis.pdf'); out.add(r.name, r.blob, { note: `${n - del.size} sayfa kaldı` }); }
      else if (m === 'clean') { const { PDFName } = await pdfLib(); const info = src.getInfoDict(); ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Trapped'].forEach((k) => info.delete(PDFName.of(k))); try { src.catalog.delete(PDFName.of('Metadata')); } catch {} const r = await pdfOut(src, base(f.name) + '-temiz.pdf'); out.add(r.name, r.blob, { note: 'Başlık, yazar, konu, oluşturan, tarihler ve XMP silindi' }); }
    }
  });
}
function tAudio() {
  const pick = picker('audio/*,video/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.flac,.wav,.webm,.mp4,.mov', true, 'Ses ya da video (videodan ses çıkarır). Çıktı: WAV');
  const start = input({ placeholder: '0 ya da 1:30', inputMode: 'decimal' }), end = input({ placeholder: 'sonuna kadar', inputMode: 'decimal' });
  const fi = input({ value: '0', inputMode: 'decimal' }), fo = input({ value: '0', inputMode: 'decimal' });
  const gain = rangeF(0, 3, 0.05, 1, (v) => (v === 0 ? 'sessiz' : Math.round(v * 100) + '%'));
  const rate = select([['', 'Orijinal örnekleme'], ['48000', '48 kHz'], ['44100', '44.1 kHz'], ['32000', '32 kHz'], ['22050', '22 kHz'], ['16000', '16 kHz (konuşma)']]);
  const mono = check('Mono yap'), norm = check('Normalleştir (en yüksek seviyeye çek)'), rev = check('Ters çevir');
  const opts = sec('Ayarlar', el('div', { className: 'cvRow2' }, field('Başlangıç', start, 'saniye ya da dk:sn'), field('Bitiş', end)), el('div', { className: 'cvRow2' }, field('Açılış (sn)', fi), field('Kapanış (sn)', fo)), field('Ses düzeyi', gain), field('Örnekleme', rate), mono, norm, rev,
    el('p', { className: 'hint', textContent: 'MP3, M4A, FLAC, OPUS çıktısı için PC’de “Gelişmiş” aracını kullanın (yerel sunucu + ffmpeg).' }));
  return tool('Sesi kırp, aç / kapat (fade), ses düzeyini değiştir, mono yap, ters çevir ya da videodan sesi çıkar.', pick, opts, 'Dönüştür', async ({ files, st, pb, out }) => {
    for (const [i, f] of files.entries()) {
      st.set(`${i + 1}/${files.length}: ${f.name} çözülüyor…`); pb.set((i / files.length) * 100); await tick();
      const buf = await decodeAudio(f); st.set(`${i + 1}/${files.length}: ${f.name} işleniyor…`);
      const wav = await processAudio(buf, { start: tsec(start.value), end: tsec(end.value), fadeIn: num(fi.value), fadeOut: num(fo.value), gain: gain.value, mono: mono.checked, normalize: norm.checked, reverse: rev.checked, rate: +rate.value || 0 });
      out.add(base(f.name) + '.wav', wav, { note: `${hms(buf.duration)} → WAV` });
    }
  });
}
function tVideo() {
  const pick = picker('video/*,.mp4,.webm,.mov,.m4v,.mkv', true, 'MP4, WEBM, MOV (tarayıcının açabildiği videolar)');
  const mode = chips([['sheet', 'Kontak sayfası'], ['gif', 'GIF'], ['frame', 'Kare yakala'], ['audio', 'Sesi çıkar (WAV)']], 'sheet');
  const start = input({ placeholder: '0', inputMode: 'decimal' }), end = input({ placeholder: 'sonuna kadar', inputMode: 'decimal' });
  const grid = select([['3x3', '3 × 3'], ['4x4', '4 × 4'], ['4x6', '4 × 6'], ['5x5', '5 × 5'], ['6x8', '6 × 8']], { value: '4x4' }); grid.value = '4x4';
  const sw = select([['1280', '1280 px'], ['1920', '1920 px'], ['2560', '2560 px']]); sw.value = '1920';
  const sbg = chips([['dark', 'Koyu'], ['light', 'Açık'], ['transparent', 'Saydam (PNG)']], 'dark');
  const sfmt = chips([['jpg', 'JPG'], ['png', 'PNG']], 'jpg');
  const ts = check('Zaman damgası', true), head = check('Başlık bilgisi (ad, süre, çözünürlük)', true);
  const gw = select([['240', '240 px'], ['320', '320 px'], ['480', '480 px'], ['640', '640 px']]); gw.value = '480';
  const gfps = chips([['5', '5 fps'], ['10', '10 fps'], ['15', '15 fps']], '10');
  const gdur = input({ value: '5', inputMode: 'decimal' });
  const at = input({ placeholder: '0', inputMode: 'decimal' }); const ffmt = chips([['png', 'PNG'], ['jpg', 'JPG']], 'png');
  const G = {
    sheet: [field('Izgara (sütun × satır)', grid), field('Genişlik', sw), field('Arka plan', sbg), field('Biçim', sfmt), ts, head],
    gif: [field('Genişlik', gw), field('Kare hızı', gfps), field('Süre (sn, en fazla 15)', gdur)],
    frame: [field('Zaman', at, 'saniye ya da dk:sn'), field('Biçim', ffmt)], audio: [],
  };
  const extra = el('div', { className: 'cvSub' }); const rng = el('div', { className: 'cvRow2' }, field('Başlangıç', start, 'saniye ya da dk:sn'), field('Bitiş', end));
  const sync = () => { extra.replaceChildren(...G[mode.value]); rng.hidden = mode.value === 'frame'; };
  mode.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setTimeout(sync))); sync();
  const opts = sec('Ayarlar', field('Ne yapılsın?', mode), rng, extra, el('p', { className: 'hint', textContent: 'Biçim değiştirme (MP4 / MKV / WEBM), sıkıştırma ve birleştirme için PC’de “Gelişmiş” aracını kullanın.' }));
  return tool('Videodan kontak sayfası, GIF ya da tek kare çıkar; sesini ayır.', pick, opts, 'Oluştur', async ({ files, st, pb, out }) => {
    for (const [fi2, f] of files.entries()) {
      const P = (x) => pb.set(((fi2 + x) / files.length) * 100);
      if (mode.value === 'audio') { st.set(`${f.name}: ses çözülüyor…`); const buf = await decodeAudio(f); out.add(base(f.name) + '.wav', await processAudio(buf, { start: tsec(start.value), end: tsec(end.value) })); continue; }
      st.set(`${f.name} açılıyor…`); const v = await loadVideo(f);
      try {
        const s = Math.min(tsec(start.value), v.duration), e = end.value.trim() ? Math.min(v.duration, tsec(end.value)) : v.duration; if (mode.value !== 'frame' && e - s <= 0.05) throw new Error('Bitiş zamanı başlangıçtan sonra olmalı.');
        if (mode.value === 'frame') { await seek(v, tsec(at.value)); const c = canvas(v.videoWidth, v.videoHeight); c.getContext('2d').drawImage(v, 0, 0); out.add(`${base(f.name)}-${hms(v.currentTime).replace(/:/g, '-')}.${ffmt.value}`, await toBlob(c, ffmt.value === 'png' ? 'image/png' : 'image/jpeg', 0.92)); continue; }
        if (mode.value === 'sheet') {
          const [cols, rows] = grid.value.split('x').map(Number), W = +sw.value, n = cols * rows, gap = Math.round(W / 160), pad = gap * 2, tw = Math.floor((W - pad * 2 - gap * (cols - 1)) / cols), th = Math.round((tw * v.videoHeight) / v.videoWidth), hh = head.checked ? Math.round(W / 22) : 0;
          const c = canvas(W, pad * 2 + hh + rows * th + (rows - 1) * gap), x = c.getContext('2d'); const light = sbg.value === 'light', fg = light ? '#1b1f26' : '#fffdfc';
          if (sbg.value !== 'transparent') { x.fillStyle = light ? '#f1f2f5' : '#1e1e1e'; x.fillRect(0, 0, c.width, c.height); }
          const F = Math.round(W / 96);
          if (hh) { x.fillStyle = sbg.value === 'transparent' ? '#000' : fg; x.font = `600 ${Math.round(F * 1.25)}px Inter, system-ui, sans-serif`; x.fillText(f.name, pad, pad + F * 1.3); x.globalAlpha = 0.7; x.font = `${F}px Inter, system-ui, sans-serif`; x.fillText(`${hms(v.duration)} · ${v.videoWidth}×${v.videoHeight} · ${fmtB(f.size)}`, pad, pad + F * 2.9); x.globalAlpha = 1; }
          for (let i = 0; i < n; i++) {
            const t = s + ((e - s) * (i + 0.5)) / n; st.set(`${f.name}: kare ${i + 1}/${n}`); P(i / n); await seek(v, t);
            const cx = pad + (i % cols) * (tw + gap), cy = pad + hh + Math.floor(i / cols) * (th + gap); x.save(); x.beginPath(); x.roundRect ? x.roundRect(cx, cy, tw, th, Math.round(gap * 0.8)) : x.rect(cx, cy, tw, th); x.clip(); x.drawImage(v, cx, cy, tw, th); x.restore();
            if (ts.checked) { const lbl = hms(t); x.font = `600 ${Math.round(F * 0.85)}px Inter, system-ui, sans-serif`; const lw = x.measureText(lbl).width + F * 0.8, lh = F * 1.4; x.fillStyle = 'rgba(0,0,0,.62)'; x.fillRect(cx + tw - lw - F * 0.4, cy + th - lh - F * 0.4, lw, lh); x.fillStyle = '#fff'; x.fillText(lbl, cx + tw - lw, cy + th - F * 0.75); }
          }
          const png = sfmt.value === 'png' || sbg.value === 'transparent'; out.add(`${base(f.name)}-kontak.${png ? 'png' : 'jpg'}`, await toBlob(c, png ? 'image/png' : 'image/jpeg', 0.9), { note: `${cols}×${rows} kare` }); continue;
        }
        /* GIF */
        const fps = +gfps.value, dur = Math.min(15, Math.max(0.2, num(gdur.value, 5)), e - s), n = Math.max(1, Math.round(dur * fps)); const W = Math.min(+gw.value, v.videoWidth), H = Math.max(2, Math.round((W * v.videoHeight) / v.videoWidth / 2) * 2);
        const c = canvas(W, H), x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high';
        st.set(`${f.name}: renkler hesaplanıyor…`); const samp = []; for (let k = 0; k < 6; k++) { await seek(v, s + (dur * (k + 0.5)) / 6); x.drawImage(v, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data; for (let p = 0; p < d.length; p += 4 * 7) samp.push(d[p], d[p + 1], d[p + 2]); }
        const pal = medianCut(Uint8Array.from(samp), 256), map = mapper(pal), frames = [];
        for (let k = 0; k < n; k++) {
          st.set(`${f.name}: kare ${k + 1}/${n}`); P((k / n) * 0.95); await seek(v, s + k / fps); x.drawImage(v, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data, ix = new Uint8Array(W * H);
          for (let yy = 0, p = 0, q2 = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++, p += 4, q2++) { const o = BAYER[((yy & 3) << 2) | (xx & 3)]; ix[q2] = map(Math.max(0, Math.min(255, d[p] + o)), Math.max(0, Math.min(255, d[p + 1] + o)), Math.max(0, Math.min(255, d[p + 2] + o))); }
          frames.push(ix); if (k % 4 === 0) await tick();
        }
        st.set(`${f.name}: GIF yazılıyor…`); await tick(); out.add(`${base(f.name)}.gif`, gifBlob(frames, W, H, pal, Math.round(100 / fps)), { note: `${W}×${H} · ${n} kare · ${fps} fps` });
      } finally { freeVideo(v); }
    }
  });
}
function tSub() {
  const pick = picker('.srt,.vtt,.lrc,.ass,.ssa,text/plain', true, 'SRT, VTT, LRC, ASS / SSA');
  const fmt = chips([['srt', 'SRT'], ['vtt', 'VTT'], ['lrc', 'LRC'], ['ass', 'ASS']], 'srt');
  const enc = select([['auto', 'Otomatik (UTF-8, değilse Türkçe)'], ['utf-8', 'UTF-8'], ['windows-1254', 'Windows-1254 (Türkçe)'], ['iso-8859-9', 'ISO-8859-9 (Türkçe)'], ['windows-1252', 'Windows-1252 (Batı)'], ['gb18030', 'GB18030 (Çince)'], ['windows-1256', 'Windows-1256 (Arapça)']]);
  const shift = input({ value: '0', inputMode: 'decimal' });
  return tool('Altyazı ve şarkı sözü dosyalarını birbirine çevir; zamanlamayı kaydır, bozuk Türkçe karakterleri düzelt. Çıktı her zaman UTF-8.', pick, sec('Ayarlar', field('Çıktı', fmt), field('Karakter kodlaması', enc, 'Ş, ğ, ı bozuk görünüyorsa Windows-1254 seç'), field('Zaman kaydır (sn)', shift, 'Ör. 1.5 ileri, -0.8 geri')), 'Dönüştür', async ({ files, out, st }) => {
    for (const f of files) {
      const from = ext(f.name) === 'ssa' ? 'ass' : ext(f.name); if (!['srt', 'vtt', 'lrc', 'ass'].includes(from)) { st.set(`${f.name}: uzantıdan biçim anlaşılamadı.`, 'err'); continue; }
      const cues = subParse(await readText(f, enc.value), from); if (!cues.length) throw new Error(`${f.name}: satır bulunamadı.`);
      const d = num(shift.value); cues.forEach((c) => { c.s = Math.max(0, c.s + d); c.e = Math.max(c.s + 0.1, c.e + d); });
      const t = subWrite(cues, fmt.value); out.add(`${base(f.name)}.${fmt.value}`, new Blob([t], { type: 'text/plain;charset=utf-8' }), { note: `${cues.length} satır`, text: cues.map((c) => c.t).join('\n') });
    }
  });
}
function tFont() {
  const pick = picker('.ttf,.otf,.woff,.woff2,font/*', true, 'TTF, OTF, WOFF');
  const to = chips([['woff', 'WOFF (web için)'], ['sfnt', 'TTF / OTF (masaüstü)']], 'woff');
  return tool('Yazı tiplerini web (WOFF) ve masaüstü (TTF / OTF) biçimleri arasında çevir. Çıktı uzantısı yazı tipinin türüne göre seçilir.', pick, sec('Ayarlar', field('Çıktı', to)), 'Dönüştür', async ({ files, out, st }) => {
    for (const f of files) {
      const u8 = new Uint8Array(await f.arrayBuffer()); const isWoff = /^wOF/.test(String.fromCharCode(...u8.subarray(0, 4)));
      if (to.value === 'woff') { const src = isWoff ? new Uint8Array(await (await woffToSfnt(u8)).blob.arrayBuffer()) : u8; const b = await sfntToWoff(src); out.add(base(f.name) + '.woff', b, { note: `%${Math.max(0, Math.round((1 - b.size / u8.length) * 100))} küçüldü` }); }
      else if (isWoff) { const r = await woffToSfnt(u8); out.add(`${base(f.name)}.${r.ext}`, r.blob); }
      else st.set(`${f.name} zaten TTF / OTF; atlandı.`, 'err');
    }
  });
}
function tDoc() {
  const pick = picker('.docx,.pptx,.xlsx,.odt,.odp,.ods,.epub,.pdf,.html,.htm,.md,.txt,.csv,.json,.srt,.vtt', true, 'Word, PowerPoint, Excel, ODT, EPUB, PDF, HTML, Markdown, TXT');
  const fmt = chips([['md', 'Markdown'], ['txt', 'Düz metin'], ['html', 'HTML'], ['print', 'Yazdır / PDF']], 'md');
  const addSrc = check('Ayrıca açık not defterine kaynak olarak ekle', false);
  return tool('Belgeleri metin, Markdown ya da HTML’e çevir; “Yazdır / PDF” ile tarayıcının PDF olarak kaydet seçeneğini kullan. Düzen ve görseller korunmaz, metin korunur.', pick, sec('Ayarlar', field('Çıktı', fmt), addSrc), 'Dönüştür', async ({ files, st, pb, out }) => {
    let printed = '';
    for (const [i, f] of files.entries()) {
      st.set(`${i + 1}/${files.length}: ${f.name}`); pb.set((i / files.length) * 100);
      const t = (await docText(f)).trim(); if (!t) { st.set(`${f.name}: metin bulunamadı.`, 'err'); continue; }
      if (addSrc.checked) { try { await A().addSource(base(f.name), t, 'Dönüştür'); } catch (e) { st.set(e.message, 'err'); } }
      if (fmt.value === 'print') { printed += (printed ? '\n\n---\n\n' : '') + (files.length > 1 ? `# ${base(f.name)}\n\n` : '') + t; continue; }
      const type = { md: 'text/markdown', txt: 'text/plain', html: 'text/html' }[fmt.value];
      out.add(`${base(f.name)}.${fmt.value}`, new Blob([fmt.value === 'html' ? htmlDoc(base(f.name), t) : t], { type: type + ';charset=utf-8' }), { text: t, note: `${t.length.toLocaleString('tr')} karakter` });
    }
    if (printed) { printHtml(htmlDoc(files.length === 1 ? base(files[0].name) : 'Class belgeleri', printed)); st.set('Yazdırma penceresi açıldı: “Hedef” olarak “PDF olarak kaydet”i seç.', 'ok'); }
  });
}
function tMeta() {
  const report = el('div', { className: 'cvMeta' });
  const show = async (files) => {
    report.replaceChildren(); for (const f of files.slice(0, 20)) {
      const rows = exifInfo(new Uint8Array(await f.slice(0, 4 * 1048576).arrayBuffer()));
      report.append(el('div', { className: 'cvMetaF' }, el('b', { textContent: f.name }), rows && rows.length ? el('dl', {}, ...rows.flatMap(([k, v, risk]) => [el('dt', { className: risk ? 'risk' : '', textContent: k }), el('dd', { textContent: v })])) : el('small', { textContent: 'Okunabilir konum, tarih ya da cihaz bilgisi yok.' })));
    }
  };
  const pk = picker('image/jpeg,image/png,image/webp,image/*,.heic,.heif', true, 'JPG, PNG, WEBP (yeniden kodlamadan); diğerleri yeniden kodlanarak', (fs) => show(fs));
  return tool('Fotoğraflardaki konum (GPS), çekim zamanı ve cihaz bilgisini gör, paylaşmadan önce sil. Asıl dosyan değişmez; temiz bir kopya indirirsin.', pk, sec('Dosyadaki bilgiler', report), 'Meta veriyi sil', async ({ files, st, pb, out }) => {
    for (const [i, f] of files.entries()) {
      pb.set((i / files.length) * 100); const u8 = new Uint8Array(await f.arrayBuffer()); let r = null; try { r = stripMeta(u8); } catch {}
      if (r) out.add(`${base(f.name)}-temiz.${ext(f.name) || 'jpg'}`, r.blob, { note: r.how });
      else { st.set(`${f.name}: yeniden kodlanarak temizlendi.`); const im = await loadImg(f), [w, h] = dims(im); out.add(`${base(f.name)}-temiz.jpg`, await toBlob(drawTo(im, w, h, '#fff'), 'image/jpeg', 0.95), { note: 'Yeniden kodlandı (JPG); tüm meta veri silindi' }); }
    }
    show(files);
  });
}
/* ---------- Gelişmiş: yerel sunucu + ffmpeg ---------- */
const isLocal = () => /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
function tAdv() {
  const root = el('div', { className: 'cvTool' }, el('p', { className: 'muted', textContent: 'Kontrol ediliyor…' }));
  (async () => {
    let s = null; if (isLocal()) { try { const r = await fetch('/api/convert/status'); s = await r.json(); } catch {} }
    if (!s?.ok) { root.replaceChildren(el('div', { className: 'hbNeed' }, el('b', { textContent: 'Gelişmiş dönüştürme için yerel sunucu gerekir' }), el('p', { textContent: isLocal() ? 'Sunucuya ulaşılamadı. Class’ı windows.bat / linux.sh / mac.sh ile açtığından emin ol.' : 'Bu sayfa GitHub Pages’ten açıldı. MP4 / MKV / MOV / WEBM ve MP3 / M4A / FLAC / OPUS dönüştürme bilgisayarındaki ffmpeg ile yapılır: depoyu indirip başlatıcıyla aç.' }), el('a', { className: 'btn', href: 'https://github.com/Aleyulala/Class#readme', target: '_blank', rel: 'noopener noreferrer', textContent: 'Kurulum rehberi' }))); return; }
    if (!s.ffmpeg) { root.replaceChildren(el('div', { className: 'hbNeed' }, el('b', { textContent: 'ffmpeg bulunamadı' }), el('p', { textContent: 'Bilgisayarına ffmpeg kur ve Class’ı yeniden başlat. Windows: “winget install Gyan.FFmpeg” · macOS: “brew install ffmpeg” · Linux: “sudo apt install ffmpeg”.' }))); return; }
    const pick = picker('video/*,audio/*,.mkv,.mov,.avi,.wmv,.flv,.ts,.m2ts,.3gp,.flac,.opus,.wma,.ogg,.m4a,.aac,.mp3,.wav', true, 'Her biçim (ffmpeg ne açıyorsa)');
    const kind = chips([['video', 'Video'], ['audio', 'Ses']], 'video');
    const vfmt = chips([['mp4', 'MP4 (H.264)'], ['mp4h265', 'MP4 (H.265)'], ['mkv', 'MKV'], ['mov', 'MOV'], ['webm', 'WEBM (VP9)']], 'mp4');
    const afmt = chips([['mp3', 'MP3'], ['m4a', 'M4A'], ['flac', 'FLAC'], ['opus', 'OPUS'], ['wav', 'WAV']], 'mp3');
    const qual = chips([['high', 'Yüksek kalite'], ['balanced', 'Dengeli'], ['small', 'Küçük dosya']], 'balanced');
    const res = select([['', 'Orijinal çözünürlük'], ['2160', '4K (2160p)'], ['1080', '1080p'], ['720', '720p'], ['480', '480p']]);
    const fps = select([['', 'Orijinal kare hızı'], ['60', '60 fps'], ['30', '30 fps'], ['24', '24 fps']]);
    const abr = select([['320', '320 kbps'], ['256', '256 kbps'], ['192', '192 kbps'], ['128', '128 kbps'], ['96', '96 kbps']]); abr.value = '192';
    const start = input({ placeholder: '0 ya da 1:30', inputMode: 'decimal' }), end = input({ placeholder: 'sonuna kadar', inputMode: 'decimal' });
    const strip = check('Meta veriyi sil (konum, cihaz, tarih)', true), noAudio = check('Sesi kaldır', false);
    const vRows = [field('Biçim', vfmt), field('Kalite', qual), field('Çözünürlük', res), field('Kare hızı', fps), noAudio], aRows = [field('Biçim', afmt), field('Bit hızı (MP3 / M4A / OPUS)', abr)];
    const box = el('div', { className: 'cvSub' }); const sync = () => box.replaceChildren(...(kind.value === 'video' ? vRows : aRows));
    kind.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setTimeout(sync))); sync();
    const opts = sec('Ayarlar', field('Çıktı türü', kind), box, el('div', { className: 'cvRow2' }, field('Başlangıç', start), field('Bitiş', end)), strip, el('small', { className: 'hint', textContent: `ffmpeg ${s.version || ''} · dosyalar bilgisayarında işlenir, internete gönderilmez.` }));
    const cancel = btn('İptal', async () => { cancel.disabled = true; try { await fetch('/api/convert/cancel', { method: 'POST' }); } catch {} }, 'danger'); cancel.hidden = true;
    const t = tool('Video ve sesi bilgisayarındaki ffmpeg ile her biçime çevir, sıkıştır, kırp, çözünürlüğünü değiştir.', pick, opts, 'Dönüştür', async ({ files, st, pb, out }) => {
      cancel.hidden = false; cancel.disabled = false;
      try { for (const [i, f] of files.entries()) {
        const o = kind.value === 'video' ? { kind: 'video', format: vfmt.value, quality: qual.value, height: +res.value || 0, fps: +fps.value || 0, noAudio: noAudio.checked } : { kind: 'audio', format: afmt.value, bitrate: +abr.value };
        Object.assign(o, { start: tsec(start.value), end: tsec(end.value), stripMeta: strip.checked });
        st.set(`${i + 1}/${files.length}: ${f.name} gönderiliyor…`); pb.set(0);
        let poll = setInterval(async () => { try { const p = await (await fetch('/api/convert/progress')).json(); if (p.active) { pb.set(p.percent); st.set(`${i + 1}/${files.length}: ${f.name} · %${Math.round(p.percent || 0)}${p.speed ? ' · ' + p.speed : ''}`); } } catch {} }, 1000);
        try {
          const r = await fetch(`/api/convert/media?name=${encodeURIComponent(f.name)}&opts=${encodeURIComponent(JSON.stringify(o))}`, { method: 'POST', body: f, headers: { 'Content-Type': 'application/octet-stream' } });
          const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
          const type = /\.(mp3|m4a|opus|flac|wav)$/i.test(j.name) ? 'audio/' : 'video/';
          out.add(j.name, null, { url: j.url, size: j.size, type, note: `${fmtB(f.size)} → ${fmtB(j.size)}` });
        } finally { clearInterval(poll); }
      } } finally { cancel.hidden = true; }
    });
    t.querySelector('.stBtns').append(cancel);
    root.replaceChildren(t);
  })();
  return root;
}

/* ---------- panel ---------- */
const TOOLS = [
  ['image', 'Görsel', tImage, '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.5-4.5L7 20"/>'],
  ['pdf', 'PDF', tPdf, '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'],
  ['audio', 'Ses', tAudio, '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'],
  ['video', 'Video', tVideo, '<rect x="2" y="5" width="15" height="14" rx="3"/><path d="m17 10 5-3v10l-5-3"/>'],
  ['sub', 'Altyazı', tSub, '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 15h4M13 15h5M6 11h8M16 11h2"/>'],
  ['font', 'Yazı tipi', tFont, '<path d="M4 20 10 4h1l6 16M6.5 14h8"/><path d="M17 20h3"/>'],
  ['doc', 'Belge', tDoc, '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>'],
  ['meta', 'Gizlilik', tMeta, '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'],
  ['adv', 'Gelişmiş', tAdv, '<path d="M4 17 10 11 4 5M12 19h8"/>'],
];
export const ICON = sv('<path d="M4 7h11l-3-3M20 17H9l3 3"/>');
export function pConvert() {
  const nav = el('div', { className: 'cvNav hbTabs', role: 'tablist', 'aria-label': 'Dönüştürme araçları' }), body = el('div', { className: 'cvBody' }), made = {};
  const show = (k) => {
    if (!TOOLS.some((t) => t[0] === k)) k = 'image'; lsSet('class-cv-tool', k);
    nav.querySelectorAll('.hbTab').forEach((b) => { const on = b.dataset.id === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const t = TOOLS.find((x) => x[0] === k); body.replaceChildren((made[k] ||= t[2]()));
  };
  TOOLS.forEach(([k, l, , ic]) => nav.append(el('button', { type: 'button', className: 'hbTab', role: 'tab', 'data-id': k, innerHTML: sv(ic, 16), onclick: () => show(k) }, el('span', { textContent: l }))));
  show(lsGet('class-cv-tool', 'image'));
  return el('div', { className: 'hbP cvP' }, nav, body);
}
if (typeof window !== 'undefined') window.ClassConvert = { zip, processAudio, subParse, subWrite, exifInfo, stripMeta, sfntToWoff, woffToSfnt, pages, lzw, gifBlob, medianCut };
