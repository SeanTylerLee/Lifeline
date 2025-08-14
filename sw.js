// sw.js -- Service Worker with Background Sync

const CACHE_NAME = "lifeline-tools-cache-v2";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/app.js", "/sw.js", "/manifest.json",
  "/images/icon-192.png", "/images/icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/suncalc/1.9.0/suncalc.min.js"
];

// ===== Install =====
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ===== Activate =====
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== Fetch =====
self.addEventListener("fetch", event => {
  const request = event.request;

  // Background Sync for API requests
  if (request.method === "GET" && request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Promise((resolve, reject) => {
          saveForSync(request).then(() => reject("Queued for sync"));
        });
      })
    );
    return;
  }

  // Default cache-first for other resources
  event.respondWith(
    caches.match(request).then(res => res || fetch(request).then(fetchRes => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(request, fetchRes.clone());
        return fetchRes;
      });
    }).catch(() => {
      if (request.destination === "document") {
        return caches.match("/index.html");
      }
    }))
  );
});

// ===== Save requests for sync =====
async function saveForSync(request) {
  const body = await request.clone().text();
  const stored = { url: request.url, method: request.method, body };
  const db = await openSyncDB();
  const tx = db.transaction("requests", "readwrite");
  tx.objectStore("requests").add(stored);
  return tx.complete;
}

// ===== Open IndexedDB =====
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sync-requests", 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("requests")) {
        db.createObjectStore("requests", { autoIncrement: true });
      }
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e);
  });
}

// ===== Sync Event =====
self.addEventListener("sync", event => {
  if (event.tag === "sync-api-requests") {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction("requests", "readonly");
  const store = tx.objectStore("requests");
  const allRequests = await store.getAll();

  for (let req of allRequests) {
    try {
      await fetch(req.url, {
        method: req.method,
        body: req.body
      });
    } catch (err) {
      console.error("Sync failed for", req.url);
    }
  }

  // Clear the queue
  const txClear = db.transaction("requests", "readwrite");
  txClear.objectStore("requests").clear();
}