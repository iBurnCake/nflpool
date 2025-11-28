const APP_VERSION = '2025-11-27-05'; // bump now
const CACHE_NAME  = `nflpool-${APP_VERSION}`;

const PRECACHE = [
  '/',            
  '/index.html',
  '/css/style.css',
  '/css/index.css',
  '/js/firebaseConfig.js',
  '/js/script.js',
  '/housePicks.html',
];

self.addEventListener('message', (evt) => {
  if (evt.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (evt) => {
  evt.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evt) => {
  const { request } = evt;

  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html') ||
    request.destination === 'document';

  if (isHTML) {
    evt.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(request);
        return cached || Response.error();
      }
    })());
    return;
  }

  evt.respondWith((async () => {
    const cached = await caches.match(request);
    const cache  = await caches.open(CACHE_NAME);

    const fetchAndUpdate = fetch(request).then((resp) => {
      if (resp && (resp.type === 'basic' || resp.type === 'opaque') && resp.status === 200) {
        cache.put(request, resp.clone());
      }
      return resp;
    }).catch(() => undefined);

    return cached || (await fetchAndUpdate) || Response.error();
  })());
});
