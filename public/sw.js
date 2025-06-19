// Cache version will be automatically replaced during build
const CACHE_VERSION = 'dev-20250619-200855';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/icon.png',
  '/favicon.ico',
  '/images/icons/cat faction.png',
  '/images/icons/mouse faction.png',
  '/images/icons/cat knowledge card.png',
  '/images/icons/mouse knowledge card.png',
  '/manifest.webmanifest',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete all caches that don't match current version
              return !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service worker activated with version:', CACHE_VERSION);
        return self.clients.claim();
      })
  );
});

// Fetch event - for static site, use network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For all requests: try network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((fetchResponse) => {
        // If successful, update cache with new content (but not for HEAD requests)
        if (fetchResponse.status === 200 && request.method === 'GET') {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return fetchResponse;
      })
      .catch(() => {
        // Network failed - try cache, with offline fallback for navigation
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, return offline page if no cache
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // For other requests, let it fail
          throw new Error('Network and cache both failed');
        });
      })
  );
});

// Handle background sync (for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync logic here
      console.log('Background sync triggered')
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      data: data.data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});
