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
    const cacheName = await caches
      .keys()
      .then((keys) => keys.find((key) => key.includes('static-')));

    if (cacheName) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(targetPath);
      return !!cached;
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
 */
export const navigate = async (
  targetPath: string,
  navigateFn: (path: string) => void
): Promise<void> => {
  // If online, always navigate
  if (navigator.onLine) {
    navigateFn(targetPath);
    return;
  }

  // If offline, check cache first
  const cached = await isPageCached(targetPath);

  if (cached) {
    // Page is cached, safe to navigate
    navigateFn(targetPath);
  } else {
    // Page not cached, show notification and stay
    const decodedPath = decodeURIComponent(targetPath);
    window.dispatchEvent(
      new CustomEvent('offline-navigation-blocked', {
        detail: {
          targetPath,
          message: `页面 "${decodedPath}" 未缓存，请在联网时访问`,
        },
      })
    );
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
