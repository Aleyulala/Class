/* Çeviri: Saved'in sağ üstündeki Çeviri düğmesi ve özelliği, birebir.
   Dil seçilince sayfa Google Çeviri ile o dile çevrilir; "Türkçe" asıl metne döner.
   Seçilen dil googtrans çerezinde durur; sayfa yenilenince çeviri kendiliğinden yeniden uygulanır. */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };

const LANGUAGES = [
  ['tr', 'Türkçe'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['ru', 'Русский'],
  ['ar', 'العربية'], ['it', 'Italiano'], ['ja', '日本語'], ['ko', '한국어'], ['pt', 'Português'], ['zh-CN', '中文'],
];
const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M.5,2V18A1.5,1.5,0,0,0,2,19.5H17L10.5.5H2A1.5,1.5,0,0,0,.5,2Z"/><path d="M12,4.5H22A1.5,1.5,0,0,1,23.5,6V22A1.5,1.5,0,0,1,22,23.5H13.5l-1.5-4"/><line x1="17" x2="13.5" y1="19.5" y2="23.5"/><g class="trAc"><line x1="14.5" x2="21.5" y1="10.5" y2="10.5"/><line x1="17.5" x2="17.5" y1="9.5" y2="10.5"/><path d="M20,10.5c0,1.1-1.77,4.42-4,6"/><path d="M16,13c.54,1.33,4,4.5,4,4.5"/></g></svg>';
const TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const cookieLang = () => { const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/); const v = m && decodeURIComponent(m[1]).split('/').pop(); return v || 'tr'; };
function setCookie(v) {
  const h = location.hostname, exp = v ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 UTC', val = v ? `/auto/${v}` : '';
  document.cookie = `googtrans=${val}; path=/${exp}`;
  if (h && h !== 'localhost' && !/^[\d.]+$/.test(h)) { document.cookie = `googtrans=${val}; domain=.${h}; path=/${exp}`; document.cookie = `googtrans=${val}; domain=${h}; path=/${exp}`; }
}
/* Google Çeviri bileşeni: yalnızca bir dil seçildiğinde (ya da çerezde Türkçe dışında bir dil varken) yüklenir */
function loadWidget(lang) {
  const apply = () => { const s = $('.goog-te-combo'); if (s && lang) { s.value = lang; s.dispatchEvent(new Event('change')); return true; } return false; };
  if ($('#google-translate-script')) { if (!apply()) location.reload(); return; }
  if (!$('#google_translate_element')) document.body.append(el('div', { id: 'google_translate_element', hidden: true }));
  window.googleTranslateElementInit = () => {
    try {
      new window.google.translate.TranslateElement({ pageLanguage: 'tr', autoDisplay: false }, 'google_translate_element');
      let n = 0; const t = setInterval(() => { if (apply() || ++n > 20) clearInterval(t); }, 250);
    } catch (e) { console.warn('Google Çeviri başlatılamadı', e); }
  };
  document.body.append(el('script', { id: 'google-translate-script', src: 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit', async: true }));
}
function select(code) {
  close();
  if (code === 'tr') { setCookie(''); location.reload(); return; }
  setCookie(code); loadWidget(code); sync();
}

let btn = null, pop = null, bd = null;
function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); btn?.focus(); } }
function close() {
  if (!pop) return;
  pop.remove(); bd?.remove(); pop = bd = null;
  btn?.classList.remove('is-active'); btn?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', key, true);
}
function open() {
  if (pop) { close(); return; }
  window.defterApp?.closeMenu?.(); window.defterAuthors?.close?.();
  const cur = cookieLang();
  bd = el('div', { className: 'auBd', onclick: close });
  pop = el('div', { className: 'popX popTrans notranslate', role: 'menu', 'aria-label': 'Çeviri', translate: 'no' },
    el('div', { className: 'popH', 'data-drag': '1' }, el('span', { textContent: 'Çeviri' })),
    el('div', { className: 'popBody popList' }, ...LANGUAGES.map(([code, name]) => el('button', {
      type: 'button', className: 'popItem', role: 'menuitemradio', 'aria-checked': String(code === cur), lang: code, onclick: () => select(code),
    }, el('span', { className: 'popTick', innerHTML: code === cur ? TICK : '' }), el('span', { textContent: name })))));
  if (window.defterSheet?.phone()) window.defterSheet.sheetize(pop, { close });
  else { const hb = $('#top')?.getBoundingClientRect().bottom || 58; pop.style.top = Math.round(hb - 2) + 'px'; }
  document.body.append(bd, pop);
  btn?.classList.add('is-active'); btn?.setAttribute('aria-expanded', 'true');
  document.addEventListener('keydown', key, true);
  (pop.querySelector('[aria-checked="true"]') || pop.querySelector('.popItem'))?.focus({ preventScroll: true });
}
function sync() { if (btn) { const c = cookieLang(); btn.title = c === 'tr' ? 'Dili Çevir' : 'Dili Çevir · ' + (LANGUAGES.find(([k]) => k === c)?.[1] || c); } }

/* Başlıkta en sağdaki düğme (Saved'deki gibi) */
function build() {
  const tr = $('#top .tr'); if (!tr || $('#transBtn')) return;
  btn = el('button', { type: 'button', className: 'ib trBtn notranslate', id: 'transBtn', 'aria-label': 'Dili Çevir', title: 'Dili Çevir', 'aria-haspopup': 'menu', 'aria-expanded': 'false', translate: 'no', innerHTML: ICON, onclick: open });
  const label = $('#modelLabel', tr);
  tr.insertBefore(btn, label && label.parentElement === tr ? label : null);
  sync();
  const c = cookieLang(); if (c !== 'tr') loadWidget(c);
}
window.defterTranslate = { open, close, select, current: cookieLang, languages: LANGUAGES };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
