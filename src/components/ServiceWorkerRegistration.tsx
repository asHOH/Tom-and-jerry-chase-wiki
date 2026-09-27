// Client-side service worker registration
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { OFFLINE_WARMUP_ROUTES } from '@/lib/offlineRoutes';
import { useToast } from '@/context/ToastContext';
import { env } from '@/env';

export const ServiceWorkerRegistration: React.FC = () => {
  const { warning, info } = useToast();
  const pathname = usePathname();
  const warmedController = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    let disposed = false;
    const warmContent = async () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;
      const { warmOfflinePage, warmOfflineImages } = await import('@/lib/offlineWarmup');
      if (disposed) return;
      const warmStartup = warmedController.current !== controller;
      warmedController.current = controller;
      const routes = new Set(warmStartup ? [...OFFLINE_WARMUP_ROUTES, pathname] : [pathname]);
      const results = await Promise.allSettled([
        ...Array.from(routes, warmOfflinePage),
        ...(warmStartup
          ? [warmOfflineImages(env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION !== '1')]
          : []),
      ]);
      for (const result of results) {
        if (result.status === 'rejected')
          console.warn('Unable to warm offline content:', result.reason);
      }
    };
    const onControl = () => {
      void warmContent().catch((error) => console.warn('Unable to start offline warmup:', error));
    };
    // Installation can take longer than five seconds. Control, not a timer, starts warmup.
    navigator.serviceWorker.addEventListener('controllerchange', onControl);
    onControl();
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControl);
    };
  }, [pathname]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    let disposed = false;

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

        // Best-effort: request a single update check. VersionChecker coordinates reload behavior.
        void registration.update().catch(() => {
          // Swallow to avoid unhandled promise rejections (iOS Safari can be strict here).
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

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
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('load', onLoad);
    };
  }, [warning, info]);

  return null;
};
