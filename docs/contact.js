/* İletişim: Blogger'daki İletişim sohbeti gibi — bot mesajı, "Mesaj Yaz" adımları (Adınız / Konu / Mesajınız), Gönder.
   Sunucu yok: Gönder, ön doldurulmuş GitHub "yeni konu" sayfasını açar. E-posta toplanmaz. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const dlg = $('#contactDlg'); if (!dlg) throw new Error('contactDlg yok');
const ISSUE = 'https://github.com/Aleyulala/Class/issues/new';
const P = ['<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>', '<path d="M4 7h16M4 12h16M4 17h10"/>', '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'];
const ic = (p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const HOLD = ['Adınızı girin… (Enter)', 'Konuyu yazın… (Enter)', 'Mesajınızı yazın…'];
const NAME = ['Adınız', 'Konu', 'Mesajınız'];
let step = 0, vals = ['', '', ''], log = [];
const now = () => 'Şimdi';
function bubble(who, text, me) {
  return el('div', { className: 'msg c ' + (me ? 'me' : ''), 'data-t': text.toLowerCase() },
    el('div', { className: 'mHd' }, el('span', { className: 'mAv ' + (me ? 'u' : 'a'), textContent: me ? (vals[0] || 'S').slice(0, 2).toUpperCase() : 'CB' }),
      el('div', { className: 'mWho' }, el('div', { className: 'mNm' }, el('b', { textContent: who }), el('span', { className: 'mBadge', textContent: me ? 'Mesaj' : 'Ana Mesaj' }), me ? '' : el('span', { className: 'ctVer', title: 'Doğrulanmış', innerHTML: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.1 15.9 4 13l-.9-2.9 2.5-1.7 1-2.8 3 .2z"/><path d="m8.6 12 2.3 2.3 4.5-4.6" fill="none" stroke="#1e1e1e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' })), el('time', { className: 'mTi', textContent: (me ? 'Sen' : 'Class') + ' · ' + now() }))),
    el('div', { className: 'mBd', textContent: text }));
}
function renderLog() { const box = $('#ctMsgs'); box.replaceChildren(bubble('Class Bot', 'Merhaba! Bir sorunuz, öneriniz veya iletmek istediğiniz bir konu varsa aşağıdan adınızı yazarak başlayabilirsiniz.', false), ...log.map(([w, t, me]) => bubble(w, t, me))); box.scrollTop = box.scrollHeight; }
function setStep(s) {
  const inp = $('#ctInput'), area = $('#ctArea'); if (step === 2) vals[2] = area.value; else vals[step] = inp.value;
  step = s; const last = s === 2;
  inp.hidden = last; area.hidden = !last; inp.placeholder = HOLD[s]; area.placeholder = HOLD[s]; inp.setAttribute('aria-label', NAME[s]);
  inp.value = vals[s] || ''; area.value = vals[2] || ''; $('#ctIc').innerHTML = ic(P[s]);
  [...document.querySelectorAll('.ctStep')].forEach((b, i) => b.classList.toggle('on', i === s));
  $('#ctProg').style.width = (33 + 33 * s) + '%'; (last ? area : inp).focus();
}
function reset() { step = 0; vals = ['', '', '']; log = []; renderLog(); setStep(0); }
function send() {
  vals[step === 2 ? 2 : step] = step === 2 ? $('#ctArea').value : $('#ctInput').value;
  if (!vals[0].trim()) { setStep(0); $('#ctInput').focus(); return; }
  if (!vals[2].trim()) { setStep(2); $('#ctArea').focus(); return; }
  log.push([vals[0], (vals[1] ? vals[1] + ': ' : '') + vals[2], true]);
  const url = `${ISSUE}?title=${encodeURIComponent(vals[1] || 'İletişim: ' + vals[0])}&body=${encodeURIComponent(`${vals[2]}\n\n— ${vals[0]} (Class iletişim formu)`)}`;
  log.push(['Class Bot', 'Teşekkürler! Mesajınız hazır: açılan GitHub sayfasında “Submit new issue” düğmesine basarak gönderimi tamamlayın. E-posta ya da başka kişisel bilgi toplanmadı.', false]);
  renderLog(); window.open(url, '_blank', 'noopener');
  vals = ['', '', '']; setStep(0);
}
$('#ctInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); vals[step] = $('#ctInput').value; if (step < 1) setStep(step + 1); else setStep(2); } });
$('#ctArea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
document.querySelectorAll('.ctStep').forEach((b) => (b.onclick = () => setStep(+b.dataset.s)));
$('#ctSend').onclick = send; $('#ctReset').onclick = reset;
$('#ctSearch').addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); [...$('#ctMsgs').children].forEach((n) => (n.hidden = !!q && !(n.dataset.t || '').includes(q))); });
/* alt çubuk: #İletişim ● Class Bot */
const fb = dlg.querySelector('.fsBar b'); if (fb) fb.after(el('span', { className: 'ctChip' }, el('i'), 'Class Bot'));
dlg.addEventListener('close', () => { $('#ctSearch').value = ''; });
function open() { if (!dlg.open) dlg.showModal(); renderLog(); setStep(step); }
window.defterContact = { open };
