/**
 * Utility function for handling offline-aware navigation
 * Can be used in non-hook contexts or event handlers
 */

/**
 * Check if a page is cached for offline navigation
 * @param targetPath - The path to check
 * @returns Promise<boolean> - true if cached, false if not
 */
export const isPageCached = async (targetPath: string): Promise<boolean> => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    const staticCache = cacheNames.find((key) => key.includes('static-'));
    const appRoutesCache = cacheNames.find((key) => key.includes('app-routes'));

    // Check both static cache and app routes cache
    for (const cacheName of [staticCache, appRoutesCache].filter(Boolean)) {
      if (cacheName) {
        const cache = await caches.open(cacheName);

        // Check exact path first
        let cached = await cache.match(targetPath);
        if (cached) return true;

        // For routes ending with /, also check without trailing slash
        if (targetPath.endsWith('/') && targetPath !== '/') {
          cached = await cache.match(targetPath.slice(0, -1));
          if (cached) return true;
        }

        // For routes not ending with /, also check with trailing slash
        if (!targetPath.endsWith('/')) {
          cached = await cache.match(targetPath + '/');
          if (cached) return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Navigate with offline check - standalone function version
 * @param targetPath - The path to navigate to
 * @param navigateFn - The navigation function (e.g., router.push)
 * @returns Promise<boolean> - true if navigation occurred, false if blocked
 */
export const navigate = async (
  targetPath: string,
  navigateFn: (path: string) => void
): Promise<boolean> => {
  // If online, always navigate
  if (navigator.onLine) {
    navigateFn(targetPath);
    return true;
  }

  // If offline, check cache first
  const cached = await isPageCached(targetPath);

  if (cached) {
    // Page is cached, safe to navigate
    navigateFn(targetPath);
    return true;
  } else {
    // Page not cached, show notification and stay - DO NOT navigate
    const decodedPath = decodeURIComponent(targetPath);
    window.dispatchEvent(
      new CustomEvent('offline-navigation-blocked', {
        detail: {
          targetPath,
          message: `页面 "${decodedPath}" 未缓存，请在联网时访问`,
        },
      })
    );
    return false;
  }
};

/**
 * Dispatch offline navigation blocked event
 * @param targetPath - The path that was blocked
 * @param customMessage - Optional custom message
 */
export const dispatchNavigationBlocked = (targetPath: string, customMessage?: string): void => {
  const decodedPath = decodeURIComponent(targetPath);
  const message = customMessage || `页面 "${decodedPath}" 未缓存，请在联网时访问`;

  window.dispatchEvent(
    new CustomEvent('offline-navigation-blocked', {
      detail: {
        targetPath,
        message,
      },
    })
  );
};
