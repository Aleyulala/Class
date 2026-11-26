// Yapılandırılmış Stüdyo çıktıları: şema, istem, doğrulama ve demo üreticileri.
// Model JSON döndürür (wllama json_schema ile biçime zorlanır); burada temizlenip sınırlanır.

const S = (o) => o;
export const TYPES = {
  podcast: { label: 'Sesli özet', sub: 'İki sesli sohbet', emoji: '🎧', max: 1100,
    prompt: 'Kaynaklara dayanarak iki kişinin (Ayşe ve Can) sohbet ettiği kısa bir podcast metni yaz. Samimi ama bilgili olsun, 12 ile 20 arası söz sırası, her söz en fazla 3 cümle. Yalnızca kaynaklardaki bilgileri kullan.',
    schema: S({ type: 'object', properties: { title: { type: 'string' }, turns: { type: 'array', items: { type: 'object', properties: { speaker: { type: 'string', enum: ['Ayşe', 'Can'] }, text: { type: 'string' } }, required: ['speaker', 'text'] } } }, required: ['title', 'turns'] }) },
  map: { label: 'Zihin haritası', sub: 'Görsel ana hat', emoji: '🧠', max: 900,
    prompt: 'Kaynakların zihin haritasını çıkar: ana konu başlığı, 4 ile 6 dal; her dalda 2 ile 4 kısa alt madde (en fazla 8 kelime).',
    schema: S({ type: 'object', properties: { title: { type: 'string' }, branches: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, children: { type: 'array', items: { type: 'string' } } }, required: ['title', 'children'] } } }, required: ['title', 'branches'] }) },
  infographic: { label: 'Görsel özet', sub: 'İndirilebilir bilgi kartı', emoji: '🖼️', max: 900,
    prompt: 'Kaynaklar için tek sayfalık bir bilgi grafiği (infografik) içeriği hazırla: kısa başlık, tek cümlelik alt başlık, 4 ile 6 ana nokta (her birinde uygun bir emoji, en fazla 4 kelimelik başlık ve en fazla 20 kelimelik açıklama) ve tek cümlelik çıkarım.',
    schema: S({ type: 'object', properties: { title: { type: 'string' }, subtitle: { type: 'string' }, points: { type: 'array', items: { type: 'object', properties: { emoji: { type: 'string' }, title: { type: 'string' }, text: { type: 'string' } }, required: ['emoji', 'title', 'text'] } }, takeaway: { type: 'string' } }, required: ['title', 'points'] }) },
  cards: { label: 'Bilgi kartları', sub: 'Çevir ve tekrar et', emoji: '🗂️', max: 1000,
    prompt: 'Kaynaklardan 10 adet bilgi kartı (flashcard) üret. Ön yüz kısa bir soru ya da kavram, arka yüz kısa ve doğru cevap (en fazla 2 cümle) olsun.',
    schema: S({ type: 'object', properties: { title: { type: 'string' }, cards: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'] } } }, required: ['title', 'cards'] }) },
  quiz: { label: 'Quiz', sub: 'Puanlı, çoktan seçmeli', emoji: '✅', max: 1100,
    prompt: 'Kaynaklara dayanan 6 çoktan seçmeli soru hazırla. Her soruda tam 4 şık, doğru şıkkın sıra numarası (0-3) ve tek cümlelik açıklama olsun.',
    schema: S({ type: 'object', properties: { title: { type: 'string' }, questions: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'integer' }, explanation: { type: 'string' } }, required: ['q', 'options', 'answer'] } } }, required: ['title', 'questions'] }) },
};

const str = (v, n = 300) => (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/\s+/g, ' ').trim().slice(0, n);
const arr = (v) => (Array.isArray(v) ? v : []);

/** Model çıktısından JSON ayıkla (kod çiti, öncesi/sonrası metin, sondaki virgüller) */
export function parseJson(text) {
  let t = String(text || '').replace(/```(?:json)?/gi, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Çıktıda JSON bulunamadı');
  t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1')); }
}

export function normalize(type, d) {
  const title = str(d.title, 90) || TYPES[type].label;
  if (type === 'podcast') {
    const turns = arr(d.turns).map((t) => ({ speaker: /can/i.test(str(t.speaker, 20)) ? 'Can' : 'Ayşe', text: str(t.text, 420) })).filter((t) => t.text).slice(0, 26);
    if (turns.length < 2) throw new Error('Sohbet metni çok kısa');
    return { title, turns };
  }
  if (type === 'map') {
    const branches = arr(d.branches).map((b) => ({ title: str(b.title, 50), children: arr(b.children).map((c) => str(c, 60)).filter(Boolean).slice(0, 5) })).filter((b) => b.title).slice(0, 7);
    if (branches.length < 2) throw new Error('Harita için yeterli dal yok');
    return { title, branches };
  }
  if (type === 'infographic') {
    const points = arr(d.points).map((p) => ({ emoji: str(p.emoji, 4) || '•', title: str(p.title, 40), text: str(p.text, 160) })).filter((p) => p.title || p.text).slice(0, 6);
    if (points.length < 2) throw new Error('Görsel için yeterli nokta yok');
    return { title, subtitle: str(d.subtitle, 140), points, takeaway: str(d.takeaway, 200) };
  }
  if (type === 'cards') {
    const cards = arr(d.cards).map((c) => ({ front: str(c.front, 200), back: str(c.back, 360) })).filter((c) => c.front && c.back).slice(0, 16);
    if (cards.length < 2) throw new Error('Yeterli kart üretilemedi');
    return { title, cards };
  }
  const questions = arr(d.questions).map((q) => {
    const options = arr(q.options).map((o) => str(o, 160)).filter(Boolean).slice(0, 4);
    let answer = Number.isInteger(q.answer) ? q.answer : parseInt(q.answer, 10);
    if (!(answer >= 0 && answer < options.length)) answer = 0;
    return { q: str(q.q, 260), options, answer, explanation: str(q.explanation, 260) };
  }).filter((q) => q.q && q.options.length >= 2).slice(0, 10);
  if (questions.length < 1) throw new Error('Yeterli soru üretilemedi');
  return { title, questions };
}

/* ---- Demo kipi: model olmadan, kaynak metinlerinden örnek çıktı ---- */
function sentences(sources) {
  const out = [];
  sources.forEach((s) => s.text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).forEach((x) => { x = x.trim(); if (x.length > 25 && x.length < 260) out.push({ t: x, src: s.title }); }));
  return out.slice(0, 40);
}
export function demo(type, sources) {
  const ss = sentences(sources); const names = sources.map((s) => s.title);
  const title = names[0] ? names[0].replace(/\.\w+$/, '') : 'Örnek';
  const pad = ss.length ? ss : [{ t: 'Kaynaklarda okunabilir cümle bulunamadı.', src: title }];
  const emojis = ['📌', '🔎', '💡', '📊', '🧩', '🎯'];
  if (type === 'podcast') return { title, turns: pad.slice(0, 10).map((s, i) => ({ speaker: i % 2 ? 'Can' : 'Ayşe', text: i === 0 ? `Bugün ${title} üzerine konuşuyoruz. ${s.t}` : s.t })) };
  if (type === 'map') return { title, branches: pad.slice(0, 5).map((s, i) => ({ title: s.src.replace(/\.\w+$/, '').slice(0, 30) + ` ${i + 1}`, children: [s.t.slice(0, 50), (pad[i + 1] || s).t.slice(0, 50)] })) };
  if (type === 'infographic') return { title, subtitle: 'Demo kipi örnek görseli', points: pad.slice(0, 5).map((s, i) => ({ emoji: emojis[i % 6], title: `Nokta ${i + 1}`, text: s.t.slice(0, 120) })), takeaway: pad[0].t.slice(0, 140) };
  if (type === 'cards') return { title, cards: pad.slice(0, 8).map((s, i) => ({ front: `Kart ${i + 1}: ${s.t.split(/[,;:]/)[0].slice(0, 60)} …`, back: s.t })) };
  return { title, questions: pad.slice(0, 5).map((s, i) => { const opts = [s.t.slice(0, 70), (pad[(i + 1) % pad.length].t).slice(0, 70), 'Hiçbiri', 'Hepsi']; return { q: `Kaynağa göre hangisi doğrudur? (${i + 1})`, options: opts, answer: 0, explanation: `Kaynak: ${s.src}` }; }) };
}
