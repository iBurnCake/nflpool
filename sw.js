// sw.js
const APP_VERSION = '2025-09-17-01'; // 🔁 bump on every deploy
const CACHE_NAME  = `nflpool-${APP_VERSION}`;

// Only cache the minimal shell you truly need offline
const PRECACHE = [
  '/',                 // if your hosting rewrites to index.html
  '/index.html',
  '/css/style.css',
  '/css/index.css',
  '/js/firebaseConfig.js',
  '/js/script.js',
];

// Allow sending a manual message to activate now
self.addEventListener('message', (evt) => {
  if (evt.data === 'SKIP_WAITING') self.skipWaiting();
});

// Install: pre-cache shell and take over immediately
self.addEventListener('install', (evt) => {
  evt.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Use reload requests so we don't pull from HTTP cache
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
  })());
  self.skipWaiting();
});

// Activate: purge older versions and claim clients
self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

/**
 * Fetch strategy:
 * - HTML/documents (navigations): network-first (avoid stale pages), fallback to cache.
 * - Everything else (CSS/JS/images): cache-first (stale-while-revalidate).
 */
self.addEventListener('fetch', (evt) => {
  const { request } = evt;

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html') ||
    request.destination === 'document';

  if (isHTML) {
    // Network-first to ensure latest HTML and module graph
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

  // Assets: cache-first, update in background (stale-while-revalidate)
  evt.respondWith((async () => {
    const cached = await caches.match(request);
    const cache  = await caches.open(CACHE_NAME);

    const fetchAndUpdate = fetch(request).then((resp) => {
      // Only cache successful, basic/opaque responses
      if (resp && (resp.type === 'basic' || resp.type === 'opaque') && resp.status === 200) {
        cache.put(request, resp.clone());
      }
      return resp;
    }).catch(() => undefined);

    // Serve cache immediately if present; otherwise wait for network
    return cached || (await fetchAndUpdate) || Response.error();
  })());
});
