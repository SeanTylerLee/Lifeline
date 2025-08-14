// ==================== SERVICE WORKER ====================
const CACHE_NAME = 'lifeline-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/images/logo.png',
  '/images/knot-square.png',
  '/images/knot-bowline.png',
  '/images/knot-clove.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install SW and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate SW and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache or fetch
      return response || fetch(event.request).then(fetchRes => {
        // Optional: Cache new requests
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      }).catch(() => {
        // Optional: Fallback for images
        if (event.request.destination === 'image') {
          return caches.match('/images/logo.png');
        }
      });
    })
  );
});