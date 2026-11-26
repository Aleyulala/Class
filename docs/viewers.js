// Stüdyo çıktılarının görüntüleyicileri: bilgi kartları, quiz, zihin haritası, görsel özet, sesli özet.
const el = (t, props = {}, ...kids) => { const e = Object.assign(document.createElement(t), props); kids.flat().forEach((k) => e.append(k)); return e; };
const NS = 'http://www.w3.org/2000/svg';
const font = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function download(name, blob) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
const slug = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cikti';

/* ---------------- Bilgi kartları ---------------- */
function viewCards(d) {
  let i = 0, flipped = false, known = new Set();
  const card = el('button', { className: 'fc', type: 'button', ariaLabel: 'Kartı çevir' });
  const count = el('div', { className: 'fcN' }); const prev = el('button', { className: 'btn', type: 'button', textContent: '← Önceki' }); const next = el('button', { className: 'btn', type: 'button', textContent: 'Sonraki →' });
  const knownBtn = el('button', { className: 'btn primary', type: 'button', textContent: 'Biliyorum' });
  const draw = () => {
    const c = d.cards[i]; card.classList.toggle('back', flipped);
    card.replaceChildren(el('small', { textContent: flipped ? 'Cevap' : 'Soru / kavram' }), el('div', { className: 'fcT', textContent: flipped ? c.back : c.front }), el('span', { className: 'fcH', textContent: 'Çevirmek için dokun' }));
    count.textContent = `${i + 1} / ${d.cards.length} · ${known.size} biliniyor`; prev.disabled = i === 0; next.disabled = i === d.cards.length - 1; knownBtn.textContent = known.has(i) ? 'Bilmiyorum' : 'Biliyorum';
  };
  card.onclick = () => { flipped = !flipped; draw(); };
  prev.onclick = () => { i--; flipped = false; draw(); }; next.onclick = () => { i++; flipped = false; draw(); };
  knownBtn.onclick = () => { known.has(i) ? known.delete(i) : known.add(i); draw(); };
  const key = (e) => { if (e.key === 'ArrowRight' && !next.disabled) next.click(); else if (e.key === 'ArrowLeft' && !prev.disabled) prev.click(); else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); card.click(); } };
  document.addEventListener('keydown', key); draw();
  return { node: el('div', { className: 'vwCards' }, card, count, el('div', { className: 'row' }, prev, knownBtn, next)), cleanup: () => document.removeEventListener('keydown', key) };
}

/* ---------------- Quiz ---------------- */
function viewQuiz(d) {
  let i = 0, score = 0, picked = null; const done = [];
  const box = el('div', { className: 'vwQuiz' });
  const draw = () => {
    box.replaceChildren();
    if (i >= d.questions.length) {
      box.append(el('div', { className: 'qRes' }, el('b', { textContent: `Sonuç: ${score} / ${d.questions.length}` }), el('span', { className: 'muted', textContent: score === d.questions.length ? 'Hepsi doğru!' : 'Yanlışları gözden geçirip tekrar dene.' })));
      const again = el('button', { className: 'btn primary', type: 'button', textContent: 'Yeniden başla' }); again.onclick = () => { i = 0; score = 0; picked = null; draw(); }; box.append(again); return;
    }
    const q = d.questions[i]; box.append(el('small', { className: 'muted', textContent: `Soru ${i + 1} / ${d.questions.length}` }), el('div', { className: 'qQ', textContent: q.q }));
    q.options.forEach((o, k) => {
      const b = el('button', { className: 'qOpt', type: 'button', disabled: picked !== null }, el('span', { className: 'qL', textContent: 'ABCD'[k] }), el('span', { textContent: o }));
      if (picked !== null) { if (k === q.answer) b.classList.add('ok'); else if (k === picked) b.classList.add('bad'); }
      b.onclick = () => { picked = k; if (k === q.answer) score++; draw(); }; box.append(b);
    });
    if (picked !== null) { if (q.explanation) box.append(el('div', { className: 'qExp', textContent: q.explanation })); const nx = el('button', { className: 'btn primary', type: 'button', textContent: i === d.questions.length - 1 ? 'Sonucu gör' : 'Sonraki soru' }); nx.onclick = () => { i++; picked = null; draw(); }; box.append(nx); }
  };
  draw(); return { node: box };
}

/* ---------------- Zihin haritası (SVG) ---------------- */
const tw = (s, size) => Math.min(240, Math.max(60, Math.round(s.length * size * 0.56) + 28));
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
export function mapSvg(d) {
  const H = 38, GAP = 12, BG = 26, X1 = 40, rw = tw(clip(d.title, 28), 17);
  const colors = ['#60cdff', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#f472b6', '#38bdf8'];
  const blocks = d.branches.map((b) => ({ b, h: Math.max(H, b.children.length * (H + GAP) - GAP), w: tw(clip(b.title, 28), 15), cw: Math.max(0, ...b.children.map((c) => tw(clip(c, 34), 13))) }));
  const total = blocks.reduce((n, x) => n + x.h, 0) + BG * (blocks.length - 1);
  const bx = 20 + rw + 70; const maxBw = Math.max(...blocks.map((x) => x.w)); const cx = bx + maxBw + 56; const maxCw = Math.max(...blocks.map((x) => x.cw));
  const W = cx + maxCw + 24, Ht = total + 40;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('xmlns', NS); svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`); svg.setAttribute('width', W); svg.setAttribute('height', Ht); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `Zihin haritası: ${d.title}`);
  const add = (tag, attrs, text) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; svg.append(n); return n; };
  add('rect', { width: W, height: Ht, fill: '#171a24', rx: 18 });
  const ry = Ht / 2; let y = 20;
  const node = (x, cy, w, h, label, fill, stroke, color, size, weight) => { add('rect', { x, y: cy - h / 2, width: w, height: h, rx: 12, fill, stroke, 'stroke-width': 1.5 }); const t = add('text', { x: x + w / 2, y: cy + size * 0.35, 'text-anchor': 'middle', fill: color, 'font-size': size, 'font-weight': weight, 'font-family': font }, clip(label, size > 14 ? 28 : 34)); const ti = document.createElementNS(NS, 'title'); ti.textContent = label; t.append(ti); };
  blocks.forEach((blk, k) => {
    const col = colors[k % colors.length]; const cy = y + blk.h / 2;
    add('path', { d: `M${20 + rw} ${ry} C ${20 + rw + 35} ${ry}, ${bx - 35} ${cy}, ${bx} ${cy}`, fill: 'none', stroke: col, 'stroke-width': 2.2, opacity: 0.85 });
    blk.b.children.forEach((c, j) => { const ccy = y + j * (H + GAP) + H / 2; add('path', { d: `M${bx + blk.w} ${cy} C ${bx + blk.w + 28} ${cy}, ${cx - 28} ${ccy}, ${cx} ${ccy}`, fill: 'none', stroke: col, 'stroke-width': 1.6, opacity: 0.6 }); node(cx, ccy, tw(clip(c, 34), 13), H - 4, c, '#1f2330', col, '#e8eaed', 13, 400); });
    node(bx, cy, blk.w, H, blk.b.title, '#232838', col, '#ffffff', 15, 600); y += blk.h + BG;
  });
  node(20, ry, rw, 46, d.title, '#22345a', '#60cdff', '#ffffff', 17, 700);
  return svg;
}
export function svgToPng(svg, scale = 2) {
  return new Promise((res, rej) => {
    const xml = new XMLSerializer().serializeToString(svg); const w = +svg.getAttribute('width'), h = +svg.getAttribute('height');
    const img = new Image(); img.onload = () => { const c = el('canvas'); c.width = w * scale; c.height = h * scale; const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(img, 0, 0); c.toBlob((b) => (b ? res(b) : rej(new Error('PNG oluşturulamadı'))), 'image/png'); };
    img.onerror = () => rej(new Error('Görsel oluşturulamadı')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}
function viewMap(d, out, actions) {
  const svg = mapSvg(d); const wrap = el('div', { className: 'vwMap' }, svg);
  const b = el('button', { className: 'btn', type: 'button', textContent: 'PNG indir' }); b.onclick = async () => { try { download(`${slug(d.title)}-harita.png`, await svgToPng(svg)); } catch (e) { alert(e.message); } }; actions.append(b);
  return { node: wrap };
}

/* ---------------- Görsel özet (canvas, PNG indirilebilir) ---------------- */
function wrap(g, text, maxW) { const words = text.split(' '); const lines = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function drawInfographic(d) {
  const W = 1080, P = 56; const c = el('canvas'); const g = c.getContext('2d');
  const measure = () => {
    let y = P; g.font = `800 58px ${font}`; y += wrap(g, d.title, W - 2 * P).length * 68; if (d.subtitle) { g.font = `400 30px ${font}`; y += wrap(g, d.subtitle, W - 2 * P).length * 40 + 8; }
    y += 36; d.points.forEach((p) => { g.font = `400 28px ${font}`; const tl = wrap(g, p.text, W - 2 * P - 150).length; y += Math.max(110, 24 + 40 + tl * 38 + 22) + 20; });
    if (d.takeaway) { g.font = `600 30px ${font}`; y += wrap(g, d.takeaway, W - 2 * P - 60).length * 42 + 70; } return y + P - 10;
  };
  const H = measure(); c.width = W; c.height = H;
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#22345a'); bg.addColorStop(1, '#141824'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 20; x < W; x += 24) for (let y = 20; y < H; y += 24) g.fillRect(x, y, 2, 2);
  let y = P; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffffff'; g.font = `800 58px ${font}`;
  wrap(g, d.title, W - 2 * P).forEach((l) => { y += 58; g.fillText(l, P, y); y += 10; });
  if (d.subtitle) { g.fillStyle = 'rgba(255,255,255,.72)'; g.font = `400 30px ${font}`; wrap(g, d.subtitle, W - 2 * P).forEach((l) => { y += 36; g.fillText(l, P, y); y += 4; }); y += 8; }
  y += 36;
  d.points.forEach((p) => {
    g.font = `400 28px ${font}`; const tl = wrap(g, p.text, W - 2 * P - 150); const h = Math.max(110, 24 + 40 + tl.length * 38 + 22);
    g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, P, y, W - 2 * P, h, 22); g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, P + 22, y + 22, 76, 76, 20); g.fill(); g.font = `44px ${font}`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(p.emoji, P + 60, y + 76); g.textAlign = 'left';
    g.fillStyle = '#60cdff'; g.font = `700 32px ${font}`; g.fillText(p.title, P + 122, y + 52); g.fillStyle = '#e8eaed'; g.font = `400 28px ${font}`; tl.forEach((l, k) => g.fillText(l, P + 122, y + 52 + 38 * (k + 1)));
    y += h + 20;
  });
  if (d.takeaway) { g.font = `600 30px ${font}`; const tl = wrap(g, d.takeaway, W - 2 * P - 60); const h = tl.length * 42 + 40; g.fillStyle = '#60cdff'; rr(g, P, y, W - 2 * P, h, 22); g.fill(); g.fillStyle = '#0d1b24'; tl.forEach((l, k) => g.fillText(l, P + 30, y + 52 + 42 * k)); }
  return c;
}
function viewInfographic(d, out, actions) {
  const c = drawInfographic(d); c.className = 'vwImg';
  const b = el('button', { className: 'btn', type: 'button', textContent: 'PNG indir' }); b.onclick = () => c.toBlob((bl) => download(`${slug(d.title)}-gorsel.png`, bl), 'image/png'); actions.append(b);
  return { node: el('div', { className: 'vwImgWrap' }, c) };
}

/* ---------------- Sesli özet (tarayıcının konuşma sentezi) ---------------- */
function viewPodcast(d) {
  const synth = window.speechSynthesis; let idx = -1, playing = false, rate = 1, token = 0;
  const lines = d.turns.map((t, i) => el('div', { className: `pcLine ${t.speaker === 'Can' ? 'b' : 'a'}`, tabIndex: 0 }, el('b', { textContent: t.speaker }), el('span', { textContent: t.text }))); lines.forEach((l, i) => { l.onclick = () => start(i); });
  const status = el('div', { className: 'muted pcSt' });
  const playBtn = el('button', { className: 'btn primary', type: 'button', textContent: '▶ Dinle' }); const stopBtn = el('button', { className: 'btn', type: 'button', textContent: '■ Durdur' });
  const speed = el('select', { ariaLabel: 'Hız' }, ...[0.8, 1, 1.2, 1.4].map((v) => el('option', { value: v, selected: v === 1, textContent: `${v}×` }))); speed.onchange = () => { rate = +speed.value; };
  let voices = []; const load = () => { voices = (synth?.getVoices() || []); }; load(); if (synth) synth.onvoiceschanged = load;
  const pick = (speaker) => { const tr = voices.filter((v) => /^tr/i.test(v.lang)); const pool = tr.length ? tr : voices; if (!pool.length) return null; const fem = pool.find((v) => /female|kad[ıi]n|yelda|filiz|emel/i.test(v.name)); const mal = pool.find((v) => /male|erkek|tolga|cem/i.test(v.name) && !/female/i.test(v.name)); return speaker === 'Can' ? (mal || pool[pool.length > 1 ? 1 : 0]) : (fem || pool[0]); };
  const mark = (i) => { lines.forEach((l, k) => l.classList.toggle('on', k === i)); if (lines[i]) lines[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  function start(i) {
    if (!synth) { status.textContent = 'Bu tarayıcı konuşma sentezini desteklemiyor.'; return; }
    synth.cancel(); const my = ++token; playing = true; playBtn.textContent = '⏸ Duraklat'; idx = i;
    const speak = (k) => {
      if (my !== token) return; if (k >= d.turns.length) { playing = false; idx = -1; mark(-1); playBtn.textContent = '▶ Baştan dinle'; return; }
      idx = k; mark(k); const t = d.turns[k]; const u = new SpeechSynthesisUtterance(t.text); const v = pick(t.speaker); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'tr-TR'; u.rate = rate; u.pitch = t.speaker === 'Can' ? 0.85 : 1.15; u.onend = () => speak(k + 1); u.onerror = () => speak(k + 1); synth.speak(u);
    };
    status.textContent = voices.length ? '' : 'Cihazında yüklü ses bulunamadı; varsayılan ses kullanılıyor.'; speak(i);
  }
  playBtn.onclick = () => { if (!synth) return start(0); if (playing && synth.speaking && !synth.paused) { synth.pause(); playBtn.textContent = '▶ Sürdür'; } else if (synth.paused) { synth.resume(); playBtn.textContent = '⏸ Duraklat'; } else start(0); };
  stopBtn.onclick = () => { token++; synth?.cancel(); playing = false; mark(-1); playBtn.textContent = '▶ Dinle'; };
  return { node: el('div', { className: 'vwPod' }, el('div', { className: 'row' }, playBtn, stopBtn, speed), status, el('div', { className: 'pcList' }, lines), el('p', { className: 'hint small', textContent: 'Sesler cihazının konuşma sentezinden gelir (ses dosyası olarak indirilemez). Bir satıra dokunarak oradan başlayabilirsin.' })), cleanup: () => { token++; synth?.cancel(); } };
}

export function renderOutput(out, actions) {
  const d = out.data;
  const r = { cards: viewCards, quiz: viewQuiz, map: viewMap, infographic: viewInfographic, podcast: viewPodcast }[out.type](d, out, actions);
  return r;
}
