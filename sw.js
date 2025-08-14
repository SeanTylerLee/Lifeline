// ===== Service Worker for LifeLine =====
const CACHE_NAME = 'lifeline-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/images/lifeline-logo.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://unpkg.com/suncalc/suncalc.js'
];

// Install Event -- cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event -- clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event -- serve from cache first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache new requests (except cross-origin map tiles that change often)
        if (e.request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Optional: fallback for offline
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});