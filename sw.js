// Offline support. Change VERSION whenever any file changes.
const VERSION = 'bitaqa-89';
const FILES = [
  '/', '/index.html', '/app.css', '/manifest.webmanifest',
  '/src/main.js', '/src/va.js', '/src/sheet.js', '/src/schema.js', '/src/texts.js', '/src/lists.js', '/src/qr.js', '/src/pdf.js', '/src/consular.js', '/src/missions.js', '/src/translit.js', '/src/guides.js', '/src/natur.js', '/src/vendor/qrcode.mjs',
  '/fonts/cairo-regular.woff2', '/fonts/cairo-semibold.woff2', '/privacy.html', '/privacy.css', '/track.html', '/track.css', '/src/track.js', '/src/track-core.js', '/src/push.js', '/src/theme.js',
  '/img/emblem.png', '/img/iraq-emblem.png', '/img/owner.jpg', '/img/og.jpg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/badge-72.png',
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
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/_vercel/') || url.pathname === '/content.json' || url.pathname.startsWith('/api/')) return;
  if (e.request.mode === 'navigate') {
    // Weak signal: don't leave an empty screen while the network hangs. After 3.5 s the
    // saved copy is shown; the fresh page is still fetched and used next time.
    const net = fetch(e.request);
    const saved = () => caches.match('/index.html');
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
      const timer = setTimeout(() => saved().then(finish), 3500);
      net.then((r) => { clearTimeout(timer); finish(r); })
        .catch(() => { clearTimeout(timer); saved().then((r) => finish(r || Response.error())); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});

// Phone notifications (consulate notices, appointment reminders).
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'هشام للمعاملات', {
    body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/badge-72.png',
    tag: d.tag || undefined, dir: 'rtl', lang: 'ar', data: { url: d.url || '/' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.startsWith(self.location.origin));
    if (open) { open.focus(); return open.navigate ? open.navigate(url).catch(() => {}) : null; }
    return self.clients.openWindow(url);
  }));
});
