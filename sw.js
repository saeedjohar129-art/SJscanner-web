// SJscanner service worker: keeps the app working offline.
const VERSION = 'sj-v1';
const SHELL = [
  './', 'index.html', 'styles.css?v=1', 'app.js?v=1', 'worker.js?v=1', 'manifest.webmanifest',
  'icons/logo.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png',
  'fonts/IBMPlexSansArabic-Regular.ttf', 'fonts/IBMPlexSansArabic-SemiBold.ttf', 'fonts/IBMPlexSansArabic-Bold.ttf',
];
const RUNTIME = 'sj-runtime-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // OCR engine and language files from the CDN: cache after first download.
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.endsWith('tessdata.projectnaptha.com')) {
    e.respondWith(
      caches.open(RUNTIME).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // Pages: network first so updates show up, cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(VERSION).then((c) => c.put('index.html', cp)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // Static files: cache first.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
