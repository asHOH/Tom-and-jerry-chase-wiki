'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commitSha: string;
  buildTime: string;
  timestamp: string;
  environment: 'vercel' | 'ci' | 'development';
  generatedAt: string;
}

export const VersionChecker: React.FC = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // Load initial version info
    const loadInitialVersion = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-cache' });
        if (response.ok) {
          const versionInfo: VersionInfo = await response.json();
          setCurrentVersion(versionInfo.version);
          console.log('Initial version loaded:', versionInfo.version);
        }
      } catch (error) {
        console.log('Failed to load initial version:', error);
      }
    };

    loadInitialVersion();
  }, []);

  useEffect(() => {
    if (!currentVersion) return;

    // Check for updates every 2 minutes
    const checkForUpdates = async () => {
      try {
        // Check version.json for updates
        const response = await fetch('/version.json?_t=' + Date.now(), {
          cache: 'no-cache',
        });

        if (response.ok) {
          const versionInfo: VersionInfo = await response.json();

          if (versionInfo.version !== currentVersion) {
            console.log(`Version update detected: ${currentVersion} → ${versionInfo.version}`);
            setShowUpdateNotice(true);

            // Update service worker if available
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                registration.update();
              }
            }

            // Auto-reload after showing notice for 3 seconds
            setTimeout(() => {
              window.location.reload();
            }, 3000);

            return;
          }
        }

        // Fallback: Original HEAD request method
        const headResponse = await fetch('/?_t=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache',
        });

        if (headResponse.ok && 'serviceWorker' in navigator) {
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
  }, [currentVersion]);

  // Listen for service worker updates (fallback method)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        if (!showUpdateNotice) {
          setShowUpdateNotice(true);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    // Return empty cleanup function if service worker not available
    return () => {};
  }, [showUpdateNotice]);

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
