/* Ana sayfa slaytı: Saved'deki resimli slayt (BloggerHeroSlider) ile birebir.
   10 görsel, 5 saniyede bir kendiliğinden geçer; üzerine gelince / dokununca durur.
   Kaydırarak (parmak ya da fare), ← → tuşlarıyla ve alttaki iki çizgiyle gezilir; F ya da sağ üstteki düğme tam ekranda açar.
   Sol alttaki bağlantı düğmesi slaytın Blogger etiket sayfasını açar. */
import { open as openMedia } from './player.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=85`;
const B = (l) => 'https://negronshow.blogspot.com/search/label/' + l;
/* Saved'deki BLOGGER_SLIDES ile aynı (Blogger sec_Carousel: Image01–Image10) */
const SLIDES = [
  ['Sinema', 'Video', U('1536440136628-849c177e76a1'), B('%C3%B6neri')],
  ['NSONE', 'Keşif', U('1508739773434-c26b3d09e071'), B('videolar')],
  ['Oyun', 'Eğlence', U('1538481199705-c710c4e965fc'), B('oyun')],
  ['Sistem', 'Terminal', U('1587202372775-e229f172b9d7'), B('bilgisayar')],
  ['YapayZeka', 'İnovasyon', U('1620712943543-bcc4688e7485'), B('teknoloji')],
  ['Mobil', 'Android', U('1556656793-08538906a9f8'), B('telefon')],
  ['Kod', 'Yazılım', U('1555066931-4365d14bab8c'), B('programlama')],
  ['Medya', 'Televizyon', U('1461151304267-38535e780c79'), B('televizyon')],
  ['Tasarım', 'Sanat', U('1579783900882-c0d3dad7b119'), B('sanat')],
  ['Finans', 'Ekonomi', U('1642543492481-44e81e3914a7'), B('ticaret')],
];
const FALLBACK = U('1526374965328-7f61d4dc18c5');
const ZOOM = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

function build() {
  const home = $('.homeIn'); if (!home || $('#sldW')) return;
  let cur = 0, dir = 1, paused = false, timer = 0, resume = 0;
  const slides = SLIDES.map(([title, sub, img], i) => {
    const im = el('img', { className: 'sldI', src: img, alt: title, draggable: false, decoding: 'async', loading: i ? 'lazy' : 'eager' });
    im.onerror = () => { if (im.dataset.fb !== '1') { im.dataset.fb = '1'; im.src = FALLBACK; } else im.style.visibility = 'hidden'; };
    return el('div', { className: 'sldA' + (i ? '' : ' is-active'), 'aria-hidden': i ? 'true' : 'false' }, el('div', { className: 'sldBg' }), im, el('div', { className: 'sldGrad' }));
  });
  const t = el('span', { className: 't' }), c = el('span', { className: 'c' });
  const link = el('a', { className: 'sldL', target: '_blank', rel: 'noopener noreferrer' });
  const prev = el('button', { type: 'button', className: 'car-btn', 'aria-label': 'Önceki slayt', title: 'Önceki Slayt' });
  const next = el('button', { type: 'button', className: 'car-btn active', 'aria-label': 'Sonraki slayt', title: 'Sonraki Slayt' });
  const zoom = el('button', { type: 'button', className: 'sldZoom', title: 'Tam Ekran Vitrini', 'aria-label': 'Tam Ekran Vitrini', innerHTML: ZOOM });
  const w = el('div', { className: 'sldW', id: 'sldW', tabIndex: 0, role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Öne çıkanlar' },
    ...slides, zoom, el('div', { className: 'sldTitleWrap' }, link, el('div', { className: 'sldT' }, t, c)), el('div', { className: 'car-nav' }, prev, next));

  const show = (i, d = 1) => {
    slides[cur].classList.remove('is-active'); slides[cur].setAttribute('aria-hidden', 'true');
    cur = (i + SLIDES.length) % SLIDES.length; dir = d;
    slides[cur].classList.add('is-active'); slides[cur].setAttribute('aria-hidden', 'false');
    const [title, sub, , href] = SLIDES[cur];
    t.textContent = title; c.textContent = sub; link.href = href; link.title = title; link.setAttribute('aria-label', title + ' etiketini aç');
    prev.classList.toggle('active', dir < 0); next.classList.toggle('active', dir > 0);
    restart();
  };
  /* Tam ekran açıkken ya da sayfa görünmezken durur (Saved / Blogger startAutoPlay ile aynı) */
  const restart = () => { clearInterval(timer); if (!paused) timer = setInterval(() => { if (!document.hidden && !document.documentElement.classList.contains('cpOpen') && !$('#home')?.hidden) show(cur + 1, 1); }, 5000); };
  const pause = (v) => { paused = v; restart(); };
  const viewer = () => { const [title, , img] = SLIDES[cur]; openMedia({ img: slides[cur].querySelector('img').src || img, title, type: 'image' }); };

  prev.onclick = (e) => { e.stopPropagation(); show(cur - 1, -1); };
  next.onclick = (e) => { e.stopPropagation(); show(cur + 1, 1); };
  zoom.onclick = (e) => { e.stopPropagation(); viewer(); };
  link.onclick = (e) => e.stopPropagation();

  /* Parmakla ya da fareyle kaydırma; 28px'ten fazla sürüklenirse slayt değişir, tıklama tam ekran açmaz */
  let x0 = null, x1 = null, dragged = false;
  w.addEventListener('pointerdown', (e) => { if (e.button > 0 || e.target.closest('a,button')) return; x0 = x1 = e.clientX; dragged = false; clearTimeout(resume); pause(true); });
  w.addEventListener('pointermove', (e) => { if (x0 == null) return; x1 = e.clientX; if (Math.abs(x1 - x0) > 8) dragged = true; });
  const end = (e) => {
    if (x0 == null) return;
    const d = x0 - (x1 ?? x0); x0 = x1 = null;
    if (dragged && Math.abs(d) > 28) show(cur + (d > 0 ? 1 : -1), d > 0 ? 1 : -1);
    if (e.pointerType !== 'mouse') resume = setTimeout(() => pause(false), 1000);
  };
  w.addEventListener('pointerup', end); w.addEventListener('pointercancel', end);
  w.addEventListener('click', (e) => { if (dragged) { dragged = false; return; } if (!e.target.closest('a,button')) viewer(); });
  w.addEventListener('mouseenter', () => pause(true));
  w.addEventListener('mouseleave', () => { x0 = null; pause(false); });
  w.addEventListener('dragstart', (e) => e.preventDefault());
  w.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); viewer(); }
  });

  const ntf = $('#ntf', home);
  if (ntf && ntf.parentElement === home) ntf.after(w); else home.prepend(w);
  show(0, 1);
}
window.defterHero = { slides: SLIDES };
if (window.defterApp) build(); else document.addEventListener('defter-ready', build, { once: true });
setTimeout(build, 0);
