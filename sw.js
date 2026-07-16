// Food Diary Service Worker
const CACHE_NAME = 'food-diary-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://accounts.google.com/gsi/client',
  'https://apis.google.com/js/api.js',
  'https://www.gstatic.com/mobilesdk/160503_mobilesdk/logo/2x/googleg_color_18dp.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't cache Google Drive API calls
  if (url.hostname === 'www.googleapis.com' || url.hostname === 'accounts.google.com') {
    return; // let the browser handle it normally
  }

  // Cache-first for app shell, network-first for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});