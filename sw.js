// LifeLine Service Worker – offline-first
const VERSION = 'v1.0.0';
const STATIC_CACHE = `lifeline-static-${VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  // images (add more if you include more sizes)
  './images/lifeline-logo.png',
  './images/lifeline-192.png',
  './images/icon-home.png',
  './images/icon-gear.png',
  './images/icon-left.png',
  './images/icon-menu.png',
  './images/icon-back.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k.startsWith('lifeline-static-') && k !== STATIC_CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first for everything (perfect for fully offline content)
self.addEventListener('fetch', e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res=>{
      // Optional: cache new GET requests (defensive)
      if(req.method === 'GET' && res.ok){
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c=>c.put(req, clone));
      }
      return res;
    }).catch(()=> caches.match('./index.html')))
  );
});