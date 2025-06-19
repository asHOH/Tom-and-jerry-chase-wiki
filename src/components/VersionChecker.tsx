'use client';

import { useEffect, useState } from 'react';

export const VersionChecker: React.FC = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);

  useEffect(() => {
    // Check for updates every 2 minutes
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/?_t=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache',
        });

        if (response.ok && 'serviceWorker' in navigator) {
          // Force service worker to check for updates
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.update();
          }
        }
      } catch (error) {
        console.log('Update check failed:', error);
      }
    };

    // Initial check after 30 seconds
    const initialTimer = setTimeout(checkForUpdates, 30000);

    // Then check every 2 minutes
    const interval = setInterval(checkForUpdates, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdateNotice(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    }
  }, []);

  if (!showUpdateNotice) return null;

  return (
    <div className='fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
      <div className='flex items-center space-x-2'>
        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
        <span>正在更新到最新版本...</span>
      </div>
    </div>
  );
};
