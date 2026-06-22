const CACHE = 'dieta-v15';
const ASSETS = ['/dieta-tracker/', '/dieta-tracker/index.html', '/dieta-tracker/manifest.json', '/dieta-tracker/sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  // NON skipWaiting: aspetta che l'utente confermi l'aggiornamento
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// Network-first solo per GET same-origin. Le chiamate a Microsoft Graph (GET/PUT) e
// le risorse cross-origin (CDN MSAL) passano senza essere intercettate né cachate.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
