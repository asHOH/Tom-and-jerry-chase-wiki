/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import {
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Custom runtime caching strategies (migrated from @ducanh2912/next-pwa config)
const customRuntimeCaching: RuntimeCaching[] = [
  // Version API - always network, never cache
  {
    matcher: ({ url }) => /^https?:\/\/[^/]+\/api\/version.*$/.test(url.href),
    handler: new NetworkOnly(),
  },
  // Images - stale while revalidate with 30 day expiration
  {
    matcher: ({ request }) => request.destination === 'image',
    handler: new StaleWhileRevalidate({
      cacheName: 'images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 2592000, // 30 days
        }),
      ],
    }),
  },
  // Static resources (JS/CSS) - stale while revalidate with 1 day expiration
  {
    matcher: ({ request }) => request.destination === 'script' || request.destination === 'style',
    handler: new StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
      ],
    }),
  },
  // API calls (except version) - network first with 5 minute cache
  {
    matcher: ({ url }) =>
      url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/version'),
    handler: new NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    }),
  },
];

// Merge custom caching with default Serwist caching strategies
// Custom rules come first to take precedence, then fall back to defaults
const runtimeCaching: RuntimeCaching[] = [...customRuntimeCaching, ...defaultCache];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline/',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Handle SKIP_WAITING message from client for version updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      event.waitUntil(
        self.registration.showNotification(data.title || '通知', {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          badge: data.badge || '/icon-192x192.png',
          data: data, // contains url to open
        })
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client && client.url === urlToOpen && 'focus' in client) {
          client.focus();
          return;
        }
      }
      if (self.clients.openWindow) {
        self.clients.openWindow(urlToOpen);
        return;
      }
    })
  );
});

serwist.addEventListeners();
