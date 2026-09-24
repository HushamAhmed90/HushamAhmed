// Offline support. Change VERSION whenever any file changes.
const VERSION = 'bitaqa-2';
const FILES = [
  '/', '/index.html', '/app.css', '/manifest.webmanifest',
  '/src/main.js', '/src/sheet.js', '/src/schema.js', '/src/texts.js', '/src/lists.js', '/src/qr.js', '/src/pdf.js', '/src/vendor/qrcode.mjs',
  '/fonts/cairo-regular.woff2', '/fonts/cairo-semibold.woff2',
  '/img/emblem.png', '/img/owner.jpg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/_vercel/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
