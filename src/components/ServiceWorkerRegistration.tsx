// Client-side service worker registration
'use client';

import { useEffect, useState } from 'react';
import NotificationTooltip from './ui/NotificationTooltip';

export const ServiceWorkerRegistration: React.FC = () => {
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'OFFLINE_PAGE_NOT_CACHED') {
          const url = new URL(event.data.url);
          setNotification({
            show: true,
            message: `页面 "${url.pathname}" 未缓存，请在联网时访问`,
            type: 'warning',
          });
        } else if (event.data?.type === 'OFFLINE_RESOURCE_NOT_CACHED') {
          setNotification({
            show: true,
            message: '部分内容未缓存，可能无法正常显示',
            type: 'warning',
          });
        }
      });

      window.addEventListener('load', async () => {
        try {
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
    }
  }, []);

  return (
    <NotificationTooltip
      message={notification.message}
      show={notification.show}
      onHide={() => setNotification({ ...notification, show: false })}
      type={notification.type}
      duration={5000}
    />
  );
};
