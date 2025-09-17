// sw.js
const VERSION = 'v7'; // ⬅️ bump this on every deploy
const CACHE_NAME = `nflpool-${VERSION}`;

// Add only the minimal shell that must be offline
const PRECACHE = [
  '/',             // if your server rewrites to index.html
  '/index.html',
  '/css/style.css',
  '/css/index.css',
  '/js/firebaseConfig.js',
  '/js/script.js',
  // add other *critical* files that must be kept in sync
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting(); // take over ASAP
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim(); // control uncontrolled pages
});

// Cache-first for precached shell, network-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    // For files we intentionally precache: cache-first
    const url = new URL(request.url);
    const isPrecached = PRECACHE.some(path => url.pathname === path);

    if (isPrecached) {
      const cached = await caches.match(request);
      if (cached) return cached;
      const fresh = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
      return fresh;
    }

    // For everything else: network-first with fallback to cache
    try {
      const fresh = await fetch(request, { cache: 'no-store' });
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
      return fresh;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      // last resort
      return Response.error();
    }
  })());
});
