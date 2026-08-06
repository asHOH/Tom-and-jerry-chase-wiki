/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import {
  CacheFirst,
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

const isScriptOrStyleRequest = (request: Request) =>
  request.destination === 'script' || request.destination === 'style';

const LEGACY_API_CACHE_NAME = 'api-cache';
const PUBLIC_API_CACHE_NAME = 'public-api-cache-v1';
const CACHEABLE_PUBLIC_API_PATHS = new Set([
  '/api/categories',
  '/api/comments',
  '/api/entities/export',
  '/api/game-data-actions/public',
  '/api/options',
]);
const NON_PUBLIC_ARTICLE_API_SEGMENTS = new Set(['edit-pending', 'pending', 'preview', 'submit']);

const isCacheablePublicApiPath = (pathname: string) => {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const articlePathMatch = normalizedPath.match(/^\/api\/articles\/([^/]+)(?:\/history)?$/);
  const articleId = articlePathMatch?.[1];

  return (
    CACHEABLE_PUBLIC_API_PATHS.has(normalizedPath) ||
    normalizedPath.startsWith('/api/echoflow/') ||
    normalizedPath.startsWith('/api/goto/') ||
    (articleId !== undefined && !NON_PUBLIC_ARTICLE_API_SEGMENTS.has(articleId))
  );
};

// Bump this when generated tile contents change without changing their URLs.
const MAP_TILE_CACHE_VERSION = 1;

// Custom runtime caching strategies (migrated from @ducanh2912/next-pwa config)
const customRuntimeCaching: RuntimeCaching[] = [
  // Version API - always network, never cache
  {
    matcher: ({ url }) => /^https?:\/\/[^/]+\/api\/version.*$/.test(url.href),
    handler: new NetworkOnly(),
  },
  // Map tiles are numerous and immutable within a cache version, so keep them out of the shared image cache.
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/images/map-tiles/'),
    handler: new CacheFirst({
      cacheName: `map-tiles-v${MAP_TILE_CACHE_VERSION}`,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 450,
          maxAgeSeconds: 2592000, // 30 days
        }),
      ],
    }),
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
  // Extension/AV-injected third-party scripts should not enter app static caches.
  {
    matcher: ({ request, sameOrigin }) => !sameOrigin && isScriptOrStyleRequest(request),
    handler: new NetworkOnly(),
  },
  // Static resources (JS/CSS) - stale while revalidate with 1 day expiration
  {
    matcher: ({ request, sameOrigin }) => sameOrigin && isScriptOrStyleRequest(request),
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
  // Private and unclassified APIs must never enter Cache Storage. Keeping this rule deny-by-default
  // prevents new authenticated endpoints from being cached unless they are explicitly reviewed above.
  {
    matcher: ({ sameOrigin, url }) =>
      url.pathname.startsWith('/api/') && (!sameOrigin || !isCacheablePublicApiPath(url.pathname)),
    handler: new NetworkOnly(),
  },
  // Explicitly public API reads - network first with 5 minute cache
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && isCacheablePublicApiPath(url.pathname),
    handler: new NetworkFirst({
      cacheName: PUBLIC_API_CACHE_NAME,
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

self.addEventListener('activate', (event) => {
  event.waitUntil(self.caches.delete(LEGACY_API_CACHE_NAME));
});

serwist.addEventListeners();
