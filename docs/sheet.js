/* Yeni nesil bağlam menüsü: telefonda menüler ekranın altından açılır (Blogger şablonlarındaki gibi).
   Üstteki tutamaçtan ya da başlıktan aşağı çekince kapanır, az çekilirse yerine döner. Bilgisayarda olduğu gibi kalır. */
const MQ = matchMedia('(max-width: 900px)');
export const phone = () => MQ.matches;

export function sheetize(m, { close, title } = {}) {
  if (m.classList.contains('cSheet')) return m;
  m.classList.add('cSheet');
  const g = document.createElement('div');
  g.className = 'cGrip'; g.setAttribute('aria-hidden', 'true'); g.append(document.createElement('span'));
  const parts = [g];
  if (title) { const h = document.createElement('div'); h.className = 'cHead'; h.textContent = title; parts.push(h); }
  m.prepend(...parts);
  let gone = 0;
  m.addEventListener('pointerdown', (e) => {
    if (!phone() || e.button > 0 || !e.target.closest?.('.cGrip, .cHead, [data-drag]')) return;
    const id = e.pointerId, y0 = e.clientY, t0 = performance.now(), h = m.offsetHeight || 1;
    let dy = 0, moved = false;
    try { m.setPointerCapture(id); } catch {}
    const mv = (v) => {
      if (v.pointerId !== id) return;
      dy = Math.max(0, v.clientY - y0);
      if (!moved && dy > 4) { moved = true; m.style.transition = 'none'; m.style.animation = 'none'; }
      if (moved) { m.style.transform = `translateY(${dy}px)`; if (v.cancelable) v.preventDefault(); }
    };
    const up = (v) => {
      if (v.pointerId !== id) return;
      m.removeEventListener('pointermove', mv); m.removeEventListener('pointerup', up); m.removeEventListener('pointercancel', up);
      if (!moved) return;
      gone = Date.now();
      const fast = dy / Math.max(1, performance.now() - t0) > 0.5 && dy > 30;
      m.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)';
      if (v.type === 'pointerup' && (dy > Math.min(140, h * 0.25) || fast)) {
        m.style.transform = 'translateY(105%)';
        setTimeout(() => close?.(), 180);
      } else m.style.transform = '';
    };
    m.addEventListener('pointermove', mv); m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
  });
  /* sürüklemenin sonundaki tıklama bir seçeneği çalıştırmasın */
  m.addEventListener('click', (e) => { if (Date.now() - gone < 350) { e.preventDefault(); e.stopPropagation(); } }, true);
  return m;
}

window.defterSheet = { sheetize, phone };
