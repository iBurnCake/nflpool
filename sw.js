// sw.js  (place at your site root)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Always bypass cache for same-origin JS/CSS (and HTML navigations)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only touch your own files (ignore CDNs/other domains)
  if (url.origin !== location.origin) return;

  // Fresh HTML each visit (navigations)
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req, { cache: 'reload' }));
    return;
  }

  // Fresh module/static assets each visit
  if (/\.(?:mjs|js|css)$/.test(url.pathname)) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Everything else: let the browser handle normally
});
