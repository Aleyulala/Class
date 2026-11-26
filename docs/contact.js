/* İletişim: Blogger'daki İletişim sohbeti gibi — bot mesajı, "Mesaj Yaz" adımları (Adınız / Konu / Mesajınız), Gönder.
   Sunucu yok: Gönder, ön doldurulmuş GitHub "yeni konu" sayfasını açar. E-posta toplanmaz. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const dlg = $('#contactDlg'); if (!dlg) throw new Error('contactDlg yok');
const ISSUE = 'https://github.com/Aleyulala/Class/issues/new';
const P = ['<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>', '<path d="M22 10v3c0 4-2 6-6 6H8c-4 0-6-2-6-6V8c0-4 2-6 6-6h6"/><path d="m6 9 3.4 2.6a2 2 0 0 0 2.4 0L15 9"/>', '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'];
const ic = (p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const HOLD = ['Adınızı girin… (Enter)', 'E-posta (isteğe bağlı, yayımlanmaz) (Enter)', 'Mesajınızı yazın…'];
const NAME = ['Adınız', 'E-posta', 'Mesajınız'];
let step = 0, vals = ['', '', ''], log = [];
const now = () => 'Şimdi';
const VER = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.1 15.9 4 13l-.9-2.9 2.5-1.7 1-2.8 3 .2z"/><path d="m8.6 12 2.3 2.3 4.5-4.6" fill="none" stroke="#1e1e1e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SM = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 8-4"/><path d="M8.5 14c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8M9 9.5h.01M15 9.5h.01M19 2v4M17 4h4"/></svg>';
const LK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10.9c2.3 2.3 2.3 5.9 0 8.1s-5.9 2.3-8.1 0c-2.2-2.2-2.2-5.8 0-8.1"/><path d="M10.6 13.4c-2.3-2.3-2.3-6.1 0-8.5s6.1-2.3 8.5 0c2.3 2.3 2.3 6.1 0 8.5"/></svg>';
const RP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8 5 12.5l5 4.5"/><path d="M5 12.5h9a5 5 0 0 1 5 5V19"/></svg>';
function bubble(who, text, me) {
  const sm = el('button', { type: 'button', className: 'ctGh', title: 'Tepki ekle', 'aria-label': 'Tepki ekle', innerHTML: SM });
  sm.onclick = () => { const on = sm.classList.toggle('on'); sm.innerHTML = on ? '👍' : SM; };
  const lk = el('button', { type: 'button', className: 'ctGh', title: 'Bağlantıyı kopyala', 'aria-label': 'Bağlantıyı kopyala', innerHTML: LK, onclick: () => navigator.clipboard?.writeText(location.href.split('#')[0] + '#iletisim').catch(() => {}) });
  const rp = el('button', { type: 'button', className: 'ctGh', title: 'Yanıtla', 'aria-label': 'Yanıtla', innerHTML: RP, onclick: () => setStep(step) });
  return el('div', { className: 'ctM' + (me ? ' me' : ''), 'data-t': text.toLowerCase() },
    el('span', { className: 'ctAv' + (me ? ' u' : ''), textContent: me ? (vals[0] || 'S').slice(0, 2).toUpperCase() : 'CB', 'aria-hidden': 'true' }),
    el('div', { className: 'ctMc' },
      el('div', { className: 'ctNm' }, el('b', { textContent: who }), el('span', { className: 'ctBadge', textContent: me ? 'Mesaj' : 'Ana Mesaj' }), me ? '' : el('span', { className: 'ctVer', title: 'Doğrulanmış', innerHTML: VER }), el('span', { className: 'ctWho', textContent: (me ? 'Sen' : 'Class') + ' · ' + now() })),
      el('div', { className: 'ctTx', textContent: text }),
      el('div', { className: 'ctAct' }, sm, el('span', { className: 'ctSp' }), lk, rp)));
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
  log.push([vals[0], vals[2], true]);
  const url = `${ISSUE}?title=${encodeURIComponent('İletişim: ' + vals[0])}&body=${encodeURIComponent(`${vals[2]}\n\n— ${vals[0]} (Class iletişim formu)`)}`;
  log.push(['Class Bot', 'Teşekkürler! Mesajınız hazır: açılan GitHub sayfasında “Submit new issue” düğmesine basarak gönderimi tamamlayın. E-posta adresiniz herkese açık konuya eklenmedi.', false]);
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
