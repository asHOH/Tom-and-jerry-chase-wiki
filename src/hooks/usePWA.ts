'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    // Initialize
    setIsOnline(navigator.onLine);
    checkInstalled();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  };

  const navigateOfflineSafe = async (path: string) => {
    if (isOnline) {
      router.push(path);
      return true;
    }

    // For offline navigation, let next-pwa handle the caching logic
    try {
      router.push(path);
      return true;
    } catch (error) {
      console.warn('Offline navigation failed:', error);
      return false;
    }
  };

  return {
    isOnline,
    isInstalled,
    canInstall: !!installPrompt,
    installApp,
    navigateOfflineSafe,
  };
};
