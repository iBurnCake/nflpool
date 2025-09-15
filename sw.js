self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));


self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req, { cache: 'reload' }));
    return;
  }

  if (/\.(?:mjs|js|css)$/.test(url.pathname)) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }
});
