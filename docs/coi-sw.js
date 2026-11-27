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
  const CACHE = 'defter-shell-v1';
  /* Chromium ve Firefox'ta COEP "credentialless": başka sitelerin resimleri (yazar avatarları, alt bilgi fotoğrafı,
     site simgeleri) CORP başlığı olmadan da yüklenir, sayfa yine çapraz köken yalıtımlı kalır (SharedArrayBuffer çalışır).
     Safari bunu desteklemez; orada require-corp kalır ve resimler CORS ile istenir. */
  const UA = self.navigator.userAgent || '';
  const CRED = /(Chrome|Chromium|Firefox)\//.test(UA) && !/(CriOS|FxiOS|EdgiOS)/.test(UA);
  const COEP = CRED ? 'credentialless' : 'require-corp';
  self.addEventListener('fetch', (e) => {
    let r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    const same = r.method === 'GET' && new URL(r.url).origin === self.location.origin;
    if (!same && r.mode === 'no-cors') {
      if (CRED) r = new Request(r, { credentials: 'omit' });
      else if (r.destination === 'image') {
        const orig = r;
        e.respondWith(fetch(r.url, { mode: 'cors', credentials: 'omit' }).then((res) => (res.ok ? wrap(res) : fetch(orig))).catch(() => fetch(orig)));
        return;
      }
    }
    e.respondWith(
      fetch(r)
        .then((res) => { if (same && res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)).catch(() => {}); } return wrap(res); })
        .catch(async (err) => { if (same) { const m = await caches.match(r); if (m) return wrap(m); } throw err; })
    );
  });
  function wrap(res) {
      if (res.status === 0) return res;
      const h = new Headers(res.headers);
      h.set('Cross-Origin-Embedder-Policy', COEP);
      h.set('Cross-Origin-Opener-Policy', 'same-origin');
      h.set('Cross-Origin-Resource-Policy', 'cross-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }
} else {
  (() => {
    if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
    if (new URLSearchParams(location.search).has('nocoi')) return;
    navigator.serviceWorker
      .register(document.currentScript ? document.currentScript.src : 'coi-sw.js')
      .then((reg) => {
        if (window.crossOriginIsolated === false) {
          reg.addEventListener('updatefound', () => location.reload());
          if (reg.active && !navigator.serviceWorker.controller) location.reload();
        }
      })
      .catch((e) => console.warn('coi-sw kaydedilemedi', e));
  })();
}
