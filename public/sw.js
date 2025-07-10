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
    // But only handle actual Next.js static files, not API routes
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
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
              // For critical JavaScript chunks, show notification but let them fail
              if (url.pathname.includes('/chunks/') && url.pathname.endsWith('.js')) {
                fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' }).catch(() => {
                  // Network is truly down, show offline notification for JS chunks
                  self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => {
                      client.postMessage({
                        type: 'OFFLINE_RESOURCE_NOT_CACHED',
                        url: request.url,
                      });
                    });
                  });
                });
              }
              // Never serve HTML for JS/CSS/other resources - preserve MIME types
              throw new Error('Next.js resource not cached and network failed');
            });
          })
      );
      return;
    }
    // For other _next/ paths (like API routes), let them pass through normally
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
          if (request.mode === 'navigate') {
            // Don't serve app shell for uncached routes when offline
            // Instead, let the navigation be handled by client-side logic
            // This prevents the stuck loading state
            const pathname = url.pathname;

            // Check if this is a known route that should be cached
            const knownRoutes = [
              '/',
              '/factions/cat/',
              '/factions/mouse/',
              '/cards/cat/',
              '/cards/mouse/',
            ];

            // If it's a known route that should be cached, check if we have it
            if (knownRoutes.includes(pathname)) {
              return caches.match('/').then((indexResponse) => {
                if (indexResponse) {
                  // Notify client that this route isn't cached
                  self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => {
                      client.postMessage({
                        type: 'NAVIGATION_TO_UNCACHED_ROUTE',
                        pathname: pathname,
                      });
                    });
                  });
                  return indexResponse;
                }
                return caches.match('/offline.html');
              });
            }

            // For unknown routes, serve app shell or offline page
            return caches.match('/').then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
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
