// Cache version will be automatically replaced during build
const CACHE_VERSION = '__CACHE_VERSION__';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/factions/cat/',
  '/factions/mouse/',
  '/cards/cat/',
  '/cards/mouse/',
  '/icon.png',
  '/favicon.ico',
  '/images/icons/cat faction.png',
  '/images/icons/mouse faction.png',
  '/images/icons/cat knowledge card.png',
  '/images/icons/mouse knowledge card.png',
  '/manifest.webmanifest',
  '/offline.html',
];

// Assets that should never be cached
const NO_CACHE_ASSETS = ['/version.json', '/sw.js'];

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
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - for Next.js App Router, handle internal requests and navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Never cache version.json and sw.js to ensure they're always fresh
  if (NO_CACHE_ASSETS.some((asset) => url.pathname === asset)) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).catch(() => {
        // If network fails for critical assets, try cache as last resort
        return caches.match(request);
      })
    );
    return;
  }

  // Handle Next.js App Router internal requests
  if (url.pathname.startsWith('/_next/') || url.search.includes('__nextjs')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful Next.js internal responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // For failed Next.js requests, try cache first
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cached Next.js resource, notify client and serve app shell
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'OFFLINE_RESOURCE_NOT_CACHED',
                  url: request.url,
                });
              });
            });
            return caches.match('/');
          });
        })
    );
    return;
  }

  // For all other requests: try network first, fall back to cache
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
        // Network failed - try cache first
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, check if it's a route navigation
          if (request.mode === 'navigate') {
            // Check if we have the app shell to stay on current page
            return caches.match('/').then((indexResponse) => {
              if (indexResponse) {
                // Send message to client about uncached page
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({
                      type: 'OFFLINE_PAGE_NOT_CACHED',
                      url: request.url,
                    });
                  });
                });
                return indexResponse;
              }
              // Only fall back to offline page if no app shell available
              return caches.match('/offline.html');
            });
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
