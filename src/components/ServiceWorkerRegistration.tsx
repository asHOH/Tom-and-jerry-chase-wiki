// Client-side service worker registration
'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none', // Always check for SW updates
          });

          console.log('Service Worker registered successfully:', registration.scope);

          // Pre-cache the main app shell and navigation routes for offline browsing
          if ('caches' in window) {
            const cacheName = `static-dev-20250710-212745`;
            console.log('Pre-caching routes with cache name:', cacheName);
            caches
              .open(cacheName)
              .then((cache) => {
                const routes = [
                  '/',
                  '/factions/cat/',
                  '/factions/mouse/',
                  '/cards/cat/',
                  '/cards/mouse/',
                ];
                console.log('Pre-caching routes:', routes);
                return cache.addAll(routes);
              })
              .then(() => {
                console.log('Routes pre-cached successfully');
              })
              .catch((error) => {
                console.error('Failed to pre-cache routes:', error);
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
    }
  }, []);

  return null;
};
