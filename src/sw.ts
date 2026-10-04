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

import { isOfflinePublicPage, OFFLINE_PAGE_CACHE_NAME } from './lib/offlineRoutes';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const isScriptOrStyleRequest = (request: Request) =>
  request.destination === 'script' || request.destination === 'style';
const isSceneMapRedirect = (pathname: string) => /^\/maps\/[^/]+\/interactive\/?$/.test(pathname);

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

// Custom runtime caching strategies (migrated from @ducanh2912/next-pwa config)
const customRuntimeCaching: RuntimeCaching[] = [
  // Keep private workflows out of the default HTML/RSC caches too.
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/_next/') &&
      (!isOfflinePublicPage(url.pathname) || isSceneMapRedirect(url.pathname)),
    handler: new NetworkOnly(),
  },
  // Warmup fetches HTML with Accept: text/html. RSC payloads stay in separate caches.
  {
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      isOfflinePublicPage(url.pathname) &&
      request.headers.get('RSC') !== '1' &&
      (request.destination === 'document' ||
        request.headers.get('Accept')?.includes('text/html') === true),
    handler: new NetworkFirst({
      cacheName: OFFLINE_PAGE_CACHE_NAME,
      networkTimeoutSeconds: 3,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
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
  // Extension/AV-injected third-party scripts should not enter app static caches.
  {
    matcher: ({ request, sameOrigin }) => !sameOrigin && isScriptOrStyleRequest(request),
    handler: new NetworkOnly(),
  },
  // Static resources (JS/CSS) - stale while revalidate with 1 day expiration
  {
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      (isScriptOrStyleRequest(request) || /^\/_next\/static\/.+\.(?:js|css)$/.test(url.pathname)),
    handler: new StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
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
  event.waitUntil(
    (async () => {
      const names = await self.caches.keys();
      await Promise.all(
        names
          .filter((name) => name === LEGACY_API_CACHE_NAME || name.startsWith('map-tiles-v'))
          .map((name) => self.caches.delete(name))
      );
      if (names.includes(OFFLINE_PAGE_CACHE_NAME)) {
        const pages = await self.caches.open(OFFLINE_PAGE_CACHE_NAME);
        const requests = await pages.keys();
        await Promise.all(
          requests
            .filter((request) => isSceneMapRedirect(new URL(request.url).pathname))
            .map((request) => pages.delete(request))
        );
      }
    })()
  );
});

serwist.addEventListeners();
