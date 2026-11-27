/* Yazarlar: Saved'in ve Blogger şablonlarının başlığındaki "Yazarlar" menüsü, birebir.
   Avatar, ad, onay rozeti, rol ve açıklama; karta dokununca yazarın bloğu açılır.
   Bilgisayarda sağ üstte kart, telefonda alttan açılan sayfa (tutamaçla aşağı çekince kapanır). */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, p = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(p)) { if (v == null) continue; if (n.includes('-')) e.setAttribute(n, v); else e[n] = v; } e.append(...k); return e; };
const A = () => window.defterApp;

const AUTHORS = [
  {
    name: 'NEGRONN',
    role: 'Sanal Alem İçerik Yazarı',
    avatar: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEitPixdLUVLiPrAHHj7qc2zjaiK8Vh0PDfop1AvNC9IKYKGL1kyIoCe0B7u6BRjBg8n-ErQ5hSrf8-YsRxmHpz3YLSedBi92U8DUasXt9BFR9AFA5pg1GieJyqc6AyLSDIqEwMtNJCE8CJK2mq93wD5n4dY6uIVCrG8xTRnTQG84WczZA/w512-h512-p-k-no-nu/Kare_imgupscaler.ai_v2(Pro)_2K.png',
    url: 'https://negronshow.blogspot.com/',
    bio: 'Sanal alem ile alakalı içerik yazarı.',
  },
  {
    name: 'Ali Yıldız',
    role: 'Gerçek Hayat İçerik Yazarı',
    avatar: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjjT58R28e7lYqePX68NeRvRxlbijCtpeymV7MkfiBfZWKmruNrWeVitd8DBa2ByAOq1YQn4a_c5xbQY-eTs5qiYIj2OufpVa9iesFBKFzd2fQWF9MY6I6c75SY3Qd5huzOLyf6xH5E-xxcU-VQgi-6MTmVZziAbzjjJsousPItL3jGsA/w60-h60-p-k-no-nu/140423179.jpeg',
    url: 'https://aleyulala.blogspot.com/',
    bio: 'Gerçek hayatla alakalı içerik yazarı.',
  },
];

const PRF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7"/></svg>';
const VER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.56 10.739-1.36-1.58c-.26-.3-.47-.86-.47-1.26v-1.7c0-1.06-.87-1.93-1.93-1.93h-1.7c-.39 0-.96-.21-1.26-.47l-1.58-1.36c-.69-.59-1.82-.59-2.52 0l-1.57 1.37c-.3.25-.87.46-1.26.46H6.18c-1.06 0-1.93.87-1.93 1.93v1.71c0 .39-.21.95-.46 1.25l-1.35 1.59c-.58.69-.58 1.81 0 2.5l1.35 1.59c.25.3.46.86.46 1.25v1.71c0 1.06.87 1.93 1.93 1.93h1.73c.39 0 .96.21 1.26.47l1.58 1.36c.69.59 1.82.59 2.52 0l1.58-1.36c.3-.26.86-.47 1.26-.47h1.7c1.06 0 1.93-.87 1.93-1.93v-1.7c0-.39.21-.96.47-1.26l1.36-1.58c.58-.69.58-1.83-.01-2.52Zm-5.4-.63-4.83 4.83a.75.75 0 0 1-1.06 0l-2.42-2.42a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l1.89 1.89 4.3-4.3c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06Z"/></svg>';
const X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

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
  A()?.closeMenu?.();
  bd = el('div', { className: 'auBd', onclick: close });
  pop = el('div', { className: 'popX popAuthors', role: 'dialog', 'aria-label': 'Yazarlar' },
    el('div', { className: 'popH', 'data-drag': '1' }, el('span', { textContent: 'Yazarlar' }),
      el('button', { type: 'button', className: 'popClose', 'aria-label': 'Kapat', title: 'Kapat', innerHTML: X, onclick: close })),
    el('div', { className: 'popBody' }, ...AUTHORS.map((a) => el('a', { className: 'prfAuthorBlock', href: a.url, target: '_blank', rel: 'noreferrer' },
      el('div', { className: 'prfTopRow' },
        el('img', { className: 'im', src: a.avatar, alt: a.name, width: 39, height: 39, loading: 'lazy', referrerPolicy: 'no-referrer', decoding: 'async' }),
        el('div', { className: 'prfHeadMeta' },
          el('span', { className: 'prfName' }, a.name, el('span', { className: 'prfVer', innerHTML: VER, title: 'Doğrulanmış yazar' })),
          el('span', { className: 'prfRole', textContent: a.role }))),
      el('p', { className: 'prfBio', textContent: a.bio })))));
  if (window.defterSheet?.phone()) window.defterSheet.sheetize(pop, { close });
  else {
    const r = (btn || $('#top')).getBoundingClientRect(), hb = $('#top')?.getBoundingClientRect().bottom || r.bottom;
    pop.style.top = Math.round(Math.max(r.bottom, hb) - 2) + 'px';
  }
  document.body.append(bd, pop);
  btn?.classList.add('is-active'); btn?.setAttribute('aria-expanded', 'true');
  document.addEventListener('keydown', key, true);
  pop.querySelector('.popClose').focus({ preventScroll: true });
}

/* Başlıktaki düğme: Saved'deki gibi yalnızca ana ekranda (not defteri açıkken gizli) */
function build() {
  const tr = $('#top .tr'); if (!tr || $('#authorsBtn')) return;
  btn = el('button', { type: 'button', className: 'ib auBtn', id: 'authorsBtn', 'aria-label': 'Yazarlar', title: 'Yazarlar & Profil', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', innerHTML: PRF, onclick: open });
  tr.insertBefore(btn, $('#searchBtn') || tr.firstChild);
  const home = $('#home');
  const sync = () => { const off = !!home && home.hidden; btn.hidden = off; if (off) close(); };
  if (home) new MutationObserver(sync).observe(home, { attributes: true, attributeFilter: ['hidden'] });
  sync();
}
window.defterAuthors = { open, close, list: AUTHORS };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
