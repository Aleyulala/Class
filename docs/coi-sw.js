/*
 * GitHub Pages COOP/COEP başlığı gönderemez. Çok iş parçacıklı WASM (SharedArrayBuffer) için gereken
 * başlıkları bu service worker ekler. Sayfa ilk açılışta bir kez yenilenir.
 */
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'deregister') {
      self.registration.unregister().then(() => self.clients.matchAll()).then((cs) => cs.forEach((c) => c.navigate(c.url)));
    }
  });
  self.addEventListener('fetch', (e) => {
    const r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    e.respondWith(
      fetch(r)
        .then((res) => {
          if (res.status === 0) return res;
          const h = new Headers(res.headers);
          h.set('Cross-Origin-Embedder-Policy', 'require-corp');
          h.set('Cross-Origin-Opener-Policy', 'same-origin');
          h.set('Cross-Origin-Resource-Policy', 'cross-origin');
          return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
        })
        .catch((err) => { console.error(err); throw err; })
    );
  });
} else {
  (() => {
    if (window.crossOriginIsolated !== false || !window.isSecureContext || !('serviceWorker' in navigator)) return;
    if (new URLSearchParams(location.search).has('nocoi')) return;
    navigator.serviceWorker
      .register(document.currentScript ? document.currentScript.src : 'coi-sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => location.reload());
        if (reg.active && !navigator.serviceWorker.controller) location.reload();
      })
      .catch((e) => console.warn('coi-sw kaydedilemedi', e));
  })();
}
