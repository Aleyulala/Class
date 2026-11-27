/* Class tek sohbet asistanı (Gemini / Google AI Studio gibi):
   Kullanıcı tek bir sohbette yazar; TEK bir model cevap verir ve gerektiğinde araçları (stüdyolar, kaynaklar,
   web, notlar) kendisi, SIRAYLA çağırır. Her adımın sonucu (görsel, ses, video, quiz, web sonuçları…) aynı
   sohbette görünür. Aynı anda birden çok modele mesaj gönderilmez; bir mesajda en fazla MAX_STEPS araç adımı.
   - API modelleri (Gemini, OpenAI, OpenRouter, Groq, Ollama, LM Studio…): OpenAI uyumlu "tools" ile.
     Sağlayıcı araçları desteklemezse kendiliğinden metin protokolüne geçer.
   - Çevrimdışı (yerel sunucu, tarayıcıdaki model): metin protokolü — model "ARAÇ {…}" satırıyla araç ister. */

const MAX_STEPS = 6;
const H = () => window.defterHub;

/* Araçlar (Sesli özet, Quiz…) adları */
const KINDS = {
  summary: ['ozet', 'Özet'], key_ideas: ['fikir', 'Ana fikirler'], faq: ['sss', 'SSS'], study_guide: ['rehber', 'Çalışma rehberi'],
  audio_overview: ['podcast', 'Sesli özet'], mind_map: ['map', 'Zihin haritası'], infographic: ['infographic', 'Görsel özet'],
  flashcards: ['cards', 'Bilgi kartları'], quiz: ['quiz', 'Quiz'],
};
const str = (v, n = 4000) => String(v ?? '').slice(0, n);

export function createAgent(d) {
  /* ---------- araç tanımları ---------- */
  const TOOLS = [
    { name: 'search_sources', label: 'Kaynaklarda ara', desc: 'Kullanıcının seçili kaynaklarında (PDF, metin, web sayfası…) arar; ilgili parçaları [n] numaralarıyla döndürür. Kaynaklara dayanan sorularda önce bunu kullan.',
      params: { query: ['string', 'Aranacak konu ya da soru'] }, need: ['query'], avail: (c) => c.sources,
      run: async ({ query }, x) => {
        const hits = d.searchMore(str(query, 300), 5); if (!hits.length) return 'Kaynaklarda eşleşen parça bulunamadı.';
        const lines = hits.map((h) => { let c = x.cites.find((y) => y.text === h.text); if (!c) { c = { n: x.cites.length + 1, title: h.src.title, text: h.text }; x.cites.push(c); } return `[${c.n}] (${c.title}) ${h.text}`; });
        x.steps.push(`Kaynaklarda arandı: “${str(query, 60)}”`); return lines.join('\n\n');
      } },
    { name: 'create_study_material', label: 'Araçlar', desc: 'Seçili kaynaklardan çalışma materyali üretir ve sohbette gösterir: summary (özet), key_ideas (ana fikirler), faq (SSS), study_guide (çalışma rehberi), audio_overview (iki kişilik sesli özet), mind_map (zihin haritası), infographic (görsel özet), flashcards (bilgi kartları), quiz.',
      params: { kind: ['string', 'Materyal türü', Object.keys(KINDS)] }, need: ['kind'], avail: (c) => c.sources,
      run: async ({ kind }, x) => {
        const k = KINDS[kind]; if (!k) return `Bilinmeyen tür: ${kind}. Geçerli türler: ${Object.keys(KINDS).join(', ')}`;
        const m = await d.chatTask({ via: 'Araçlar', label: `${k[1]} hazırlanıyor`, run: (set) => d.studyMaterial(k[0], x.signal, set) });
        return m.kind === 'slides' ? `${k[1]} hazır: “${m.title || m.text}”. Sohbette slayt kartı olarak gösterildi.` : `${k[1]} hazır ve sohbette gösterildi; nota da kaydedildi. Başı: ${str(m.text, 1200)}`;
      } },
    { name: 'generate_image', label: 'Görsel', desc: 'Görsel stüdyosuyla resim çizer ve sohbette gösterir. İstemi ayrıntılı ve tercihen İngilizce yaz.',
      params: { prompt: ['string', 'Çizilecek şeyin ayrıntılı tarifi'] }, need: ['prompt'], avail: (c) => c.image,
      run: async ({ prompt }) => { await d.chatTask({ via: 'Görsel', label: 'Görsel üretiliyor', run: (set) => H().gen.image({ prompt: str(prompt, 1000) }, set) }); return 'Görsel üretildi ve sohbette gösterildi.'; } },
    { name: 'text_to_speech', label: 'Ses', desc: 'Ses stüdyosuyla metni seslendirir; ses dosyası sohbette oynatıcıyla görünür.',
      params: { text: ['string', 'Seslendirilecek metin'] }, need: ['text'], avail: (c) => c.tts,
      run: async ({ text }) => { await d.chatTask({ via: 'Ses', label: 'Seslendiriliyor', run: (set) => H().gen.speech({ text: str(text, 4000) }, set) }); return 'Seslendirildi; ses sohbette gösterildi.'; } },
    { name: 'generate_music', label: 'Müzik', desc: 'Müzik stüdyosuyla kısa müzik ya da ses efekti üretir (istem İngilizce olursa daha iyi).',
      params: { prompt: ['string', 'Müziğin tarifi (tür, tempo, enstrüman, hava)'] }, need: ['prompt'], avail: (c) => c.music,
      run: async ({ prompt }) => { await d.chatTask({ via: 'Müzik', label: 'Müzik üretiliyor', run: (set) => H().gen.music({ prompt: str(prompt, 500) }, set) }); return 'Müzik üretildi ve sohbette gösterildi.'; } },
    { name: 'generate_video', label: 'Video', desc: 'Video stüdyosuyla birkaç saniyelik video üretir (istem İngilizce olursa daha iyi).',
      params: { prompt: ['string', 'Videonun tarifi'] }, need: ['prompt'], avail: (c) => c.video,
      run: async ({ prompt }) => { await d.chatTask({ via: 'Video', label: 'Video üretiliyor', run: (set) => H().gen.video({ prompt: str(prompt, 500) }, set) }); return 'Video üretildi ve sohbette gösterildi.'; } },
    { name: 'web_search', label: 'Web', desc: 'Web’de arar; sonuçlar sohbette "Kaynak ekle" düğmeleriyle görünür. Sana başlık, adres ve içerik özeti döner.',
      params: { query: ['string', 'Arama sorgusu'] }, need: ['query'], avail: (c) => c.web,
      run: async ({ query }) => {
        let src = []; const q = str(query, 200);
        await d.chatTask({ via: 'Web', label: 'Aranıyor', run: async (set) => { src = await H().gen.web(q, set); return H().gen.webMsg(q, src); } });
        if (!src.length) return 'Sonuç bulunamadı.';
        return src.slice(0, 6).map((r, i) => `${i + 1}. ${r.title || r.url} — ${r.url}\n${str(r.content || r.snippet, 900)}`).join('\n\n');
      } },
    { name: 'read_webpage', label: 'Sayfa', desc: 'Bir web sayfasının metnini okur; add_as_source=true ise sayfayı kaynak olarak da ekler.',
      params: { url: ['string', 'http(s) ile başlayan adres'], add_as_source: ['boolean', 'Kaynak olarak eklensin mi'] }, need: ['url'], avail: () => true,
      run: async ({ url, add_as_source }, x) => {
        const u = str(url, 600).trim(); if (!/^https?:\/\//i.test(u)) return 'Geçerli bir http(s) adresi ver.';
        const p = await H().gen.page(u);
        if (add_as_source) { await d.addSource(p.title, `Kaynak: ${u}\n\n${p.text}`, 'Web'); x.steps.push(`Kaynak eklendi: ${str(p.title, 60)}`); } else x.steps.push(`Sayfa okundu: ${str(p.title, 60)}`);
        return `${p.title}\n\n${str(p.text, 6000)}`;
      } },
    { name: 'save_note', label: 'Not', desc: 'Bir metni not defterinin notlarına kaydeder.',
      params: { title: ['string', 'Not başlığı'], text: ['string', 'Not içeriği'] }, need: ['title', 'text'], avail: () => true,
      run: async ({ title, text }, x) => { await d.saveNote(str(title, 120) || 'Not', str(text, 20000)); x.steps.push(`Nota kaydedildi: ${str(title, 60)}`); return 'Not kaydedildi.'; } },
  ];
  const schema = (t) => ({ type: 'function', function: { name: t.name, description: t.desc, parameters: { type: 'object', properties: Object.fromEntries(Object.entries(t.params).map(([k, [type, description, en]]) => [k, { type, description, ...(en ? { enum: en } : {}) }])), required: t.need } } });

  /* hangi araçlar şu an kullanılabilir */
  async function caps() {
    let srv = false; try { srv = !!(await H()?.server())?.ok; } catch {}
    const api = H()?.gen?.apiCaps?.() || {};
    return { sources: d.sources().length > 0, image: srv || !!api.image, tts: srv || !!api.tts, music: srv, video: srv, web: srv };
  }

  const sysText = (tools, native) => [
    'Sen Class’ın tek sohbet asistanısın. Kullanıcıyla Türkçe konuşursun; gerektiğinde aşağıdaki araçları kendin, sırayla kullanırsın ve her şey bu sohbette olur.',
    'Kurallar: Gerekmedikçe araç kullanma. Bir istek için gereken araçları tek tek, sırayla çağır; aynı aracı gereksiz tekrarlama. Bir mesajda en fazla ' + MAX_STEPS + ' araç adımı.',
    'Araç sonuçları (görsel, ses, video, quiz, web sonuçları…) kullanıcıya sohbette zaten gösterilir; cevabında onları kopyalama, kısaca ne yaptığını söyle.',
    'Kaynaklardan bilgi verirken parça numarasını [1] gibi yaz; kaynaklarda yoksa açıkça söyle, uydurma.',
    native ? '' : 'ARAÇ KULLANIMI: Bir araç gerekiyorsa cevabın YALNIZCA tek satır olsun: ARAÇ {"name": "araç_adı", "arguments": {…}}\nAracın sonucu sana "ARAÇ SONUCU" olarak gelir; sonra kullanıcıya cevap ver ya da gerekiyorsa başka bir araç iste.\nAraçlar:\n' +
      tools.map((t) => `- ${t.name} ${JSON.stringify(Object.fromEntries(Object.entries(t.params).map(([k, [ty, ds, en]]) => [k, en ? en.join('|') : `${ty}: ${ds}`])))} — ${t.desc}`).join('\n'),
  ].filter(Boolean).join('\n\n');

  /* ---------- model çağrısı: OpenAI uyumlu, araç çağrılarıyla (akışlı) ---------- */
  async function callNative(messages, tools, { signal, onToken }) {
    const C = d.CFG; const base = C.api.base.replace(/\/+$/, '');
    const body = { model: C.api.model || undefined, messages, stream: true, temperature: C.temperature, max_tokens: Math.max(C.maxTokens, 900), ...(tools.length ? { tools: tools.map(schema), tool_choice: 'auto' } : {}) };
    const res = await fetch(base + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(C.api.key ? { Authorization: 'Bearer ' + C.api.key } : {}) }, body: JSON.stringify(body), signal });
    if (!res.ok) { let m = `HTTP ${res.status}`; try { const j = await res.json(); m = j.error?.message || j.error || j.message || m; if (typeof m !== 'string') m = JSON.stringify(m); } catch {} throw Object.assign(new Error(m), { status: res.status }); }
    let text = ''; const calls = [];
    const eat = (c) => {
      const x = c?.delta || c?.message || {};
      if (typeof x.content === 'string' && x.content) { text += x.content; onToken(x.content); }
      for (const tc of x.tool_calls || []) {
        let i = Number.isInteger(tc.index) ? tc.index : tc.id ? calls.findIndex((y) => y.id === tc.id) : -1; if (i < 0) i = calls.length;
        const cur = (calls[i] ||= { id: '', name: '', args: '' });
        if (tc.id) cur.id = tc.id; if (tc.function?.name) cur.name += tc.function.name;
        const a = tc.function?.arguments; if (a != null) cur.args += typeof a === 'string' ? a : JSON.stringify(a);
      }
    };
    if (!res.body || !/event-stream/.test(res.headers.get('content-type') || '')) { const j = await res.json(); eat(j.choices?.[0]); }
    else {
      const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '', end = false;
      while (!end) {
        const { done, value } = await rd.read(); buf += dec.decode(value || new Uint8Array(), { stream: !done });
        const evs = buf.split(/\r?\n\r?\n/); buf = done ? '' : evs.pop() || '';
        for (const ev of evs) {
          const data = ev.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n').trim();
          if (!data) continue; if (data === '[DONE]') { end = true; break; }
          try { eat(JSON.parse(data).choices?.[0]); } catch {}
        }
        if (done) break;
      }
      try { rd.cancel(); } catch {}
    }
    return { text, calls: calls.filter((c) => c.name).map((c, k) => ({ id: c.id || `call_${Date.now()}_${k}`, name: c.name, args: parseArgs(c.args) })) };
  }
  const parseArgs = (s) => { if (s && typeof s === 'object') return s; try { return JSON.parse(s || '{}') || {}; } catch { return {}; } };

  /* ---------- metin protokolü (çevrimdışı modeller ya da araç desteklemeyen sağlayıcılar) ---------- */
  function findCall(t) {
    const s = String(t || ''); const at = s.search(/ARA[ÇC]\s*:?\s*(?:```(?:json)?\s*)?\{/i); const from = at >= 0 ? s.indexOf('{', at) : s.trimStart().startsWith('{') ? s.indexOf('{') : -1;
    if (from < 0) return null;
    let dep = 0, inS = false, esc = false;
    for (let i = from; i < s.length; i++) {
      const ch = s[i];
      if (inS) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inS = false; continue; }
      if (ch === '"') inS = true; else if (ch === '{') dep++; else if (ch === '}' && --dep === 0) {
        try { const j = JSON.parse(s.slice(from, i + 1)); const name = j.name || j.tool || j.araç; if (!name) return null; return { name, args: parseArgs(j.arguments ?? j.args ?? j.parameters ?? {}), before: at > 0 ? s.slice(0, at).trim() : '' }; } catch { return null; }
      }
    }
    return null;
  }
  async function callText(messages, { signal, onToken }) {
    let full = '', shown = '';
    await d.chatStream(messages, { signal, maxTokens: Math.max(d.CFG.maxTokens, 900), onToken: (t) => {
      full += t; const head = full.trimStart();
      if (/^(ARA[ÇC]|\{|```)/i.test(head) || /\bARA[ÇC]\s*\{/i.test(full)) return; /* araç satırı kullanıcıya akmaz */
      const add = full.slice(shown.length); shown = full; onToken(add);
    } });
    const c = findCall(full);
    return { text: c ? c.before : full, calls: c ? [{ id: `txt_${Date.now()}`, name: c.name, args: c.args }] : [], raw: full };
  }

  /* ---------- döngü ---------- */
  const nativeOff = new Set(); /* araç çağırmayı desteklemeyen sağlayıcı + model */
  async function run(question, { messages, cites, signal, onLive }) {
    const c = await caps(); const tools = TOOLS.filter((t) => t.avail(c));
    const key = `${d.CFG.api.base}|${d.CFG.api.model}`;
    let native = d.engine.kind === 'openai' && !nativeOff.has(key);
    const x = { cites: [...(cites || [])], steps: [], signal };
    const base = messages[0]; const sysBase = base.content;
    const msgs = [...messages]; msgs[0] = { ...base, content: sysText(tools, native) + '\n\n' + sysBase };
    let live = onLive.start(), used = 0;
    for (let turn = 0; ; turn++) {
      const last = used >= MAX_STEPS;
      const onToken = (t) => { live.text += t; onLive.update(live); };
      let r;
      try {
        if (native) r = await callNative(msgs, last ? [] : tools, { signal, onToken });
        else r = await callText(last ? [...msgs, { role: 'user', content: 'Araç sınırına ulaşıldı; artık araç kullanmadan kısaca cevap ver.' }] : msgs, { signal, onToken });
      } catch (e) {
        if (native && !signal?.aborted && [400, 404, 422].includes(e.status) && turn === 0 && tools.length) { nativeOff.add(key); native = false; msgs[0] = { ...base, content: sysText(tools, false) + '\n\n' + sysBase }; live.text = ''; continue; }
        throw e;
      }
      if (signal?.aborted) break;
      if (!r.calls.length || last) { live.text = r.text || live.text; break; }
      /* araç adımları: önce o ana kadarki yazı ayrı balon olarak kalır, sonuçlar altına gelir */
      live.text = r.text || ''; onLive.close(live);
      const calls = r.calls.slice(0, MAX_STEPS - used);
      if (native) msgs.push({ role: 'assistant', content: r.text || null, tool_calls: calls.map((k) => ({ id: k.id, type: 'function', function: { name: k.name, arguments: JSON.stringify(k.args) } })) });
      else msgs.push({ role: 'assistant', content: r.raw });
      for (const k of calls) {
        used++; const t = tools.find((y) => y.name === k.name);
        let out;
        if (!t) out = `Bu araç şu an yok: ${k.name}. Kullanılabilir araçlar: ${tools.map((y) => y.name).join(', ') || 'yok'}.`;
        else { try { out = await t.run(k.args || {}, x); } catch (e) { out = `Araç hatası (${t.label}): ${e.message || e}`; } }
        if (native) msgs.push({ role: 'tool', tool_call_id: k.id, content: str(out, 8000) });
        else msgs.push({ role: 'user', content: `ARAÇ SONUCU (${k.name}):\n${str(out, 6000)}\n\nŞimdi kullanıcıya Türkçe cevap ver ya da gerekiyorsa başka bir araç iste.` });
        if (signal?.aborted) break;
      }
      if (signal?.aborted) break;
      live = onLive.start();
    }
    live.cites = x.cites; if (x.steps.length) live.steps = x.steps;
    return live;
  }
  return { run, caps, tools: () => TOOLS.map((t) => t.name), findCall };
}
