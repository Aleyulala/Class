/* Aşağı kaydırdıkça belirme (Blogger yorumlarındaki gibi): öğeler görünüm alanına girince yumuşakça yukarı kayarak belirir.
   Ekranın ilk görünen kısmı hemen açılır (kademeli); altı kaydırınca gelir. Hareket azaltma tercihi varsa hepsi hemen görünür. */
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.classList.contains('noMotion');
const SEL = ['#home .chipsRow', '#home .hRow', '#home .newPill', '#home .nbCard:not(.sk)', '#home .nbNew', '#home .ftrBrand', '#home .ftrLinks', '#home .ftrSec', '#home .ftrFeed', '#home .ntfBar',
  '#msgs .msg.c', '#msgs .welcome', '#ctMsgs .ctM', '#ctForm', '#studioBtns .btn', '#outList li', '#noteList li', '#srcList li'];
let io = null; const seen = new Set();
function pick(root) { return root.matches ? SEL.some((s) => root.matches(s)) : false; }
function arm(n, i) {
  if (n.dataset.rv) return; n.dataset.rv = '1';
  if (reduce || !io) return;
  if (n.dataset.mid && seen.has(n.dataset.mid)) return; /* yeniden çizilen eski mesajlar tekrar oynamasın */
  n.classList.add('rv'); n.style.setProperty('--rvd', Math.min(i, 8) * 55 + 'ms'); io.observe(n);
}
function scan(root = document) {
  let i = 0; for (const s of SEL) root.querySelectorAll(s).forEach((n) => arm(n, i++));
}
if ('IntersectionObserver' in window && !reduce) {
  io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.dataset.mid) seen.add(e.target.dataset.mid); } }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
}
scan();
/* sonradan eklenenler: defter kartları, mesajlar, çıktılar */
new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { if (n.nodeType !== 1) return; if (pick(n)) arm(n, 0); n.querySelectorAll && SEL.forEach((s) => n.querySelectorAll(s).forEach((x, i) => arm(x, i))); }); })
  .observe(document.body, { childList: true, subtree: true });
