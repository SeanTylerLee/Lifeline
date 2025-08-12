// Offline cache for Survive PWA
const CACHE = 'survive-v1';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json',
  // content
  './content/intro.md','./content/shelter.md','./content/fire.md','./content/water.md',
  './content/first_aid.md','./content/navigation.md','./content/foraging.md','./content/weather.md','./content/signals.md',
  // data
  './data/default_checklists.json',
  // icons
  './images/logo-192.png','./images/logo-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});