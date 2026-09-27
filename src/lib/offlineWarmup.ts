import { NAV_ITEMS } from '@/constants/navigation';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';

import { isOfflinePublicPage } from './offlineRoutes';

const OFFLINE_IMAGE_CACHE_NAME = 'images';
const IMAGE_PRELOAD_BATCH_SIZE = 6;

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

const navImageUrls = NAV_ITEMS.flatMap((group) => [
  ...(group.iconSrc ? [group.iconSrc] : []),
  ...group.children.map((item) => item.iconSrc),
]);
const characterImageUrls = [
  ...catCharacterIds.map((characterId) => `/images/cats/${characterId}.png`),
  ...mouseCharacterIds.map((characterId) => `/images/mice/${characterId}.png`),
];

const preferAvif = (imageUrl: string) => {
  const extensionIndex = imageUrl.lastIndexOf('.');
  return extensionIndex === -1 ? imageUrl : `${imageUrl.slice(0, extensionIndex)}.avif`;
};

export const getOfflineWarmupImageUrls = (useOptimizedImages: boolean) =>
  Array.from(
    new Set(
      [...navImageUrls, ...characterImageUrls].map((imageUrl) =>
        useOptimizedImages ? preferAvif(imageUrl) : imageUrl
      )
    )
  );

const preloadImage = async (imageUrl: string): Promise<void> => {
  await new Promise<void>((resolve) => {
    const image = new window.Image();
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      resolve();
    };

    image.onload = finish;
    image.onerror = finish;
    image.src = imageUrl;
  });
};

export const warmOfflineImages = async (useOptimizedImages: boolean): Promise<void> => {
  const connection = (navigator as NavigatorWithConnection).connection;
  if (!navigator.onLine || connection?.saveData || !('caches' in window)) return;

  const imageCache = await caches.open(OFFLINE_IMAGE_CACHE_NAME);
  const imageUrls = getOfflineWarmupImageUrls(useOptimizedImages);
  const missingImageUrls = (
    await Promise.all(
      imageUrls.map(async (imageUrl) => ((await imageCache.match(imageUrl)) ? null : imageUrl))
    )
  ).filter((imageUrl): imageUrl is string => imageUrl !== null);

  for (let index = 0; index < missingImageUrls.length; index += IMAGE_PRELOAD_BATCH_SIZE) {
    const batch = missingImageUrls.slice(index, index + IMAGE_PRELOAD_BATCH_SIZE);
    await Promise.allSettled(batch.map(preloadImage));
  }
};

// Client navigation caches RSC, but offline document navigation needs the HTML too.
export async function warmOfflinePage(pathname: string): Promise<void> {
  if (!navigator.onLine || !('caches' in window) || !isOfflinePublicPage(pathname)) return;

  const response = await fetch(pathname, { headers: { Accept: 'text/html' } });
  if (!response.ok) return;
  const html = new DOMParser().parseFromString(await response.text(), 'text/html');
  const urls = Array.from(
    html.querySelectorAll('script[src], link[rel="stylesheet"], link[as="script"]')
  ).map((element) => element.getAttribute('src') ?? element.getAttribute('href') ?? '');

  // Include lazy chunks loaded before this worker took control on the first visit.
  if (window.location.pathname === pathname) {
    urls.push(...performance.getEntriesByType('resource').map((entry) => entry.name));
  }
  const assets = new Set(urls.map((value) => new URL(value, window.location.origin).href));
  await Promise.all(
    Array.from(assets, async (asset) => {
      const url = new URL(asset);
      if (
        url.origin !== window.location.origin ||
        !/^\/_next\/static\/.+\.(?:js|css)$/.test(url.pathname)
      )
        return;
      if (!(await caches.match(asset))) await fetch(asset, { cache: 'force-cache' });
    })
  );
}
