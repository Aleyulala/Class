/* Class: kütüphanesiz belge ve medya okuyucu.
   - DOCX / PPTX / XLSX / ODT / ODP / EPUB: ZIP içinden XML okunur (DecompressionStream 'deflate-raw').
   - Ses / video: tarayıcıda çözülür, 16 kHz mono WAV'a çevrilir, yerel sunucunun Whisper motoruna gönderilir. */

/* ---- ZIP (yalnızca okuma; merkezi dizinden) ---- */
async function unzip(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('ZIP dizini bulunamadı (dosya bozuk olabilir).');
  const count = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const files = new Map(); const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    files.set(name, { method, csize, off }); p += 46 + nlen + xlen + clen;
  }
  return {
    names: () => [...files.keys()],
    async text(name) {
      const f = files.get(name); if (!f) return null;
      const lnl = dv.getUint16(f.off + 26, true), lxl = dv.getUint16(f.off + 28, true);
      const data = u8.subarray(f.off + 30 + lnl + lxl, f.off + 30 + lnl + lxl + f.csize);
      if (f.method === 0) return dec.decode(data);
      if (f.method !== 8) throw new Error('Desteklenmeyen sıkıştırma yöntemi');
      const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(ds).text();
    },
  };
}
const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
const tidy = (s) => s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
/* Word: paragraf (w:p) başına satır, sekme ve satır sonu korunur */
function wordText(doc) {
  const out = [];
  doc.querySelectorAll('p').forEach((p) => { let s = ''; p.querySelectorAll('t, tab, br').forEach((n) => { s += n.localName === 't' ? n.textContent : n.localName === 'tab' ? '\t' : '\n'; }); out.push(s); });
  return out.join('\n');
}
async function docx(z) { const t = await z.text('word/document.xml'); if (!t) throw new Error('word/document.xml yok'); return tidy(wordText(xml(t))); }
async function pptx(z) {
  const slides = z.names().filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
  const out = [];
  for (const [i, n] of slides.entries()) { const d = xml(await z.text(n)); const paras = [...d.getElementsByTagNameNS('*', 'p')].map((p) => [...p.getElementsByTagNameNS('*', 't')].map((t) => t.textContent).join('')).filter(Boolean); out.push(`## Slayt ${i + 1}\n${paras.join('\n')}`); }
  return tidy(out.join('\n\n'));
}
async function xlsx(z) {
  const ss = await z.text('xl/sharedStrings.xml'); const shared = ss ? [...xml(ss).getElementsByTagNameNS('*', 'si')].map((s) => s.textContent) : [];
  const sheets = z.names().filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(); const out = [];
  for (const n of sheets) {
    const d = xml(await z.text(n)); out.push('## ' + n.split('/').pop().replace('.xml', ''));
    for (const r of d.getElementsByTagNameNS('*', 'row')) out.push([...r.getElementsByTagNameNS('*', 'c')].map((c) => { const v = c.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? c.textContent; return c.getAttribute('t') === 's' ? shared[+v] ?? '' : v; }).join('\t'));
  }
  return tidy(out.join('\n'));
}
async function odf(z) {
  const d = xml(await z.text('content.xml')); const out = [];
  d.querySelectorAll('h, p').forEach((p) => out.push(p.textContent));
  return tidy(out.join('\n'));
}
async function epub(z) {
  const c = xml(await z.text('META-INF/container.xml')); const opfPath = c.querySelector('rootfile')?.getAttribute('full-path'); if (!opfPath) throw new Error('EPUB içindekiler bulunamadı');
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const opf = xml(await z.text(opfPath)); const items = {}; opf.querySelectorAll('manifest > item').forEach((i) => (items[i.getAttribute('id')] = i.getAttribute('href')));
  const out = [];
  for (const ref of opf.querySelectorAll('spine > itemref')) {
    const href = items[ref.getAttribute('idref')]; if (!href) continue;
    const t = await z.text(decodeURIComponent(base + href)); if (!t) continue;
    const h = new DOMParser().parseFromString(t, 'text/html'); h.querySelectorAll('script,style').forEach((n) => n.remove()); h.body?.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,div,br,tr,blockquote').forEach((n) => n.append('\n'));
    out.push(h.body?.innerText || h.body?.textContent || '');
  }
  return tidy(out.join('\n\n'));
}
export const DOC_RX = /\.(docx|pptx|xlsx|odt|odp|ods|epub)$/i;
export const MEDIA_RX = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|webm|mp4|m4v|mov|mkv)$/i;
export async function readDoc(file) {
  const z = await unzip(await file.arrayBuffer()); const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'docx') return docx(z);
  if (ext === 'pptx') return pptx(z);
  if (ext === 'xlsx') return xlsx(z);
  if (ext === 'epub') return epub(z);
  return odf(z);
}

/* ---- Ses / video → 16 kHz mono WAV ---- */
export async function toWav16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error('Bu tarayıcı sesi çözemiyor.');
  const ctx = new AC(); let audio;
  try { audio = await ctx.decodeAudioData(await blob.arrayBuffer()); } catch { throw new Error('Ses/video çözülemedi (biçim desteklenmiyor olabilir).'); } finally { ctx.close?.(); }
  const rate = 16000, len = Math.ceil(audio.duration * rate);
  const off = new OfflineAudioContext(1, len, rate); const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
  const out = await off.startRendering(); return encodeWav([out.getChannelData(0)], rate);
}
export function encodeWav(channels, rate) {
  const n = channels[0].length, ch = channels.length, buf = new ArrayBuffer(44 + n * ch * 2), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true);
  let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, channels[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Blob([buf], { type: 'audio/wav' });
}
/* Birden çok ses dosyasını (URL) arka arkaya, aralarında kısa sessizlikle tek WAV'a birleştirir */
export async function joinAudio(urls, gapSec = 0.35, onStep) {
  const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const bufs = [];
  try { for (const [i, u] of urls.entries()) { onStep?.(i); const r = await fetch(u); if (!r.ok) throw new Error(`Ses alınamadı (${r.status})`); bufs.push(await ctx.decodeAudioData(await r.arrayBuffer())); } } finally { ctx.close?.(); }
  const rate = bufs[0]?.sampleRate || 24000, gap = Math.round(gapSec * rate);
  const total = bufs.reduce((n, b) => n + Math.round(b.duration * rate) + gap, 0); const out = new Float32Array(total); let p = 0;
  for (const b of bufs) {
    const d = b.sampleRate === rate ? b.getChannelData(0) : (() => { const src = b.getChannelData(0), k = b.sampleRate / rate, m = Math.round(src.length / k), r = new Float32Array(m); for (let i = 0; i < m; i++) r[i] = src[Math.min(src.length - 1, Math.round(i * k))]; return r; })();
    out.set(d, p); p += d.length + gap;
  }
  return encodeWav([out.subarray(0, p)], rate);
}
if (typeof window !== 'undefined') window.ClassExtract = { readDoc, toWav16k, joinAudio, encodeWav, DOC_RX, MEDIA_RX };
