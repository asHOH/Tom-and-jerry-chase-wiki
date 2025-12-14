// Client-side service worker registration
'use client';

import { useEffect } from 'react';

import { useToast } from '@/context/ToastContext';

export const ServiceWorkerRegistration: React.FC = () => {
  const { warning, info } = useToast();

  useEffect(() => {
    // Cleanup function
    let cleanup: (() => void) | undefined;

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Listen for blocked navigation events
      const handleBlockedNavigation = (event: CustomEvent) => {
        const { message } = event.detail;
        warning(message);
      };

      window.addEventListener(
        'offline-navigation-blocked',
        handleBlockedNavigation as EventListener
      );

      cleanup = () => {
        window.removeEventListener(
          'offline-navigation-blocked',
          handleBlockedNavigation as EventListener
        );
      };

      // Listen for service worker messages (for resource failures)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'OFFLINE_RESOURCE_NOT_CACHED') {
          if (navigator.onLine) {
            warning('部分内容暂时无法加载');
          } else {
            warning('部分内容未缓存，可能无法正常显示');
          }
        } else if (event.data?.type === 'NAVIGATION_TO_UNCACHED_ROUTE') {
          // Handle navigation to uncached route - this helps prevent stuck loading
          const pathname = event.data.pathname;
          warning(`页面 "${pathname}" 未缓存，请在联网时访问`);
        }
      });

      window.addEventListener('load', async () => {
        try {
          const swResponse = await fetch('/sw.js', {
            method: 'GET',
            cache: 'no-store',
          });

          const isJavaScript = swResponse.headers.get('content-type')?.includes('javascript');

          if (!swResponse.ok || !isJavaScript) {
            console.warn(
              'Skipping service worker registration: /sw.js returned',
              swResponse.status
            );

            // Ensure previously installed workers do not keep intercepting requests
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((existing) => existing.unregister()));

            if ('caches' in window) {
              const cacheKeys = await caches.keys();
              await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
            }

            info('当前环境暂未启用离线缓存功能');

            return;
          }

          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none', // Always check for SW updates
          });

          console.log('Service Worker registered successfully:', registration.scope);

          // Pre-cache the main app shell and navigation routes for offline browsing
          if ('caches' in window) {
            // Note: This will be updated by the service worker anyway, but helps with initial load
            caches.open('app-routes').then((cache) => {
              cache.addAll([
                '/',
                '/factions/cat/',
                '/factions/mouse/',
                '/cards/cat/',
                '/cards/mouse/',
              ]);
            });
          }

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content available, automatically refresh
                    console.log('New version detected, refreshing page...');
                    window.location.reload();
                  } else {
                    // First time installation
                    console.log('Content cached for offline use');
                  }
                }
              });
            }
          });

          // Force immediate update check
          registration.update();

          // Check for updates more frequently
          setInterval(() => {
            registration.update();
          }, 30000); // Every 30 seconds
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });

      // Cleanup event listener
      return () => {
        if (cleanup) cleanup();
      };
    }

    // Return empty cleanup function if not in production
    return () => {};
  }, [warning, info]);

  return null;
};
