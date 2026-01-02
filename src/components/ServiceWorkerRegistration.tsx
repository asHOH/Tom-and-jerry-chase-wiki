// Client-side service worker registration
'use client';

import { useEffect } from 'react';

import { useToast } from '@/context/ToastContext';

export const ServiceWorkerRegistration: React.FC = () => {
  const { warning, info } = useToast();

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    let disposed = false;

    const handleBlockedNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message;
      if (message) {
        warning(message);
      }
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; pathname?: string } | undefined;
      if (data?.type === 'OFFLINE_RESOURCE_NOT_CACHED') {
        if (navigator.onLine) {
          warning('部分内容暂时无法加载');
        } else {
          warning('部分内容未缓存，可能无法正常显示');
        }
      } else if (data?.type === 'NAVIGATION_TO_UNCACHED_ROUTE') {
        const pathname = data.pathname;
        warning(`页面 "${pathname ?? ''}" 未缓存，请在联网时访问`);
      }
    };

    const precacheRoutesBestEffort = async () => {
      if (!('caches' in window)) return;

      try {
        const cache = await caches.open('app-routes');
        const urls = ['/', '/factions/cat/', '/factions/mouse/'];

        await Promise.allSettled(
          urls.map(async (url) => {
            try {
              await cache.add(url);
            } catch {
              // Best-effort: never fail the app due to cache/storage quirks (iOS/private mode).
            }
          })
        );
      } catch {
        // Best-effort
      }
    };

    const cleanupOldWorkersBestEffort = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map((existing) => existing.unregister()));
      } catch {
        // Best-effort
      }

      if (!('caches' in window)) return;
      try {
        const cacheKeys = await caches.keys();
        await Promise.allSettled(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      } catch {
        // Best-effort
      }
    };

    const registerServiceWorker = async () => {
      try {
        const swResponse = await fetch('/sw.js', {
          method: 'GET',
          cache: 'no-store',
        });

        const contentType = swResponse.headers.get('content-type') ?? '';
        const isJavaScript = contentType.includes('javascript');

        if (!swResponse.ok || !isJavaScript) {
          console.warn('Skipping service worker registration: /sw.js returned', swResponse.status);
          await cleanupOldWorkersBestEffort();
          if (!disposed) {
            info('当前环境暂未启用离线缓存功能');
          }
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('Service Worker registered successfully:', registration.scope);

        // Best-effort warmup; do not crash on iOS storage restrictions.
        await precacheRoutesBestEffort();

        // Best-effort: request a single update check. VersionChecker coordinates reload behavior.
        void registration.update().catch(() => {
          // Swallow to avoid unhandled promise rejections (iOS Safari can be strict here).
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    window.addEventListener('offline-navigation-blocked', handleBlockedNavigation);
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    const onLoad = () => {
      void registerServiceWorker();
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener('offline-navigation-blocked', handleBlockedNavigation);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('load', onLoad);
    };
  }, [warning, info]);

  return null;
};
