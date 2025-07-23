'use client';

/**
 * Simple Route Preloading for App Router
 * Preloads critical pages during idle time
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PreloadingProviderProps {
  children: React.ReactNode;
}

export default function PreloadingProvider({ children }: PreloadingProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we should preload (respect user preferences)
    const shouldPreload = () => {
      if (typeof window === 'undefined') return false;

      // Respect data saver mode
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection;
      if (connection?.saveData) return false;

      // Respect reduced data preference
      if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return false;

      return true;
    };

    if (!shouldPreload()) return;

    // Simple route preloading with delay
    const preloadRoutes = () => {
      const routes = [
        '/characters/cat',
        '/characters/mouse',
        '/cards',
        '/special-skills',
        '/items',
      ];

      routes.forEach((route, index) => {
        // Stagger the preloading
        setTimeout(() => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        }, index * 500); // 500ms between each preload
      });
    };

    // Start preloading after 3 seconds to avoid interfering with page load
    const timeoutId = setTimeout(preloadRoutes, 3000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return <>{children}</>;
}
