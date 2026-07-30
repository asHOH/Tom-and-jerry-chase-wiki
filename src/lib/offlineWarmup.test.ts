import { existsSync } from 'node:fs';
import path from 'node:path';

import { getOfflineWarmupImageUrls, warmOfflineImages } from './offlineWarmup';

const setOnlineStatus = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: online,
  });
};

describe('offlineWarmup', () => {
  const originalCaches = window.caches;
  const originalImage = window.Image;

  afterEach(() => {
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: originalCaches,
    });
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: originalImage,
    });
    setOnlineStatus(true);
  });

  it('should include unique optimized navigation and character images', () => {
    const imageUrls = getOfflineWarmupImageUrls(true);

    expect(imageUrls).toContain('/images/icons/cat-faction.avif');
    expect(imageUrls).toContain('/images/cats/汤姆.avif');
    expect(imageUrls).toContain('/images/mice/杰瑞.avif');
    expect(imageUrls.every((imageUrl) => imageUrl.endsWith('.avif'))).toBe(true);
    expect(new Set(imageUrls).size).toBe(imageUrls.length);
  });

  it('should retain original image formats when optimization is disabled', () => {
    const imageUrls = getOfflineWarmupImageUrls(false);

    expect(imageUrls).toContain('/images/icons/cat-faction.png');
    expect(imageUrls).toContain('/images/cats/汤姆.png');
    expect(imageUrls).toContain('/images/mice/杰瑞.png');
  });

  it('should reference existing source image assets', () => {
    const missingImageUrls = getOfflineWarmupImageUrls(false).filter((imageUrl) => {
      const relativePath = decodeURIComponent(imageUrl).replace(/^\//, '');
      return !existsSync(path.join(process.cwd(), 'public', relativePath));
    });

    expect(missingImageUrls).toEqual([]);
  });

  it('should preload only images missing from the runtime cache', async () => {
    const missingImageUrl = '/images/cats/汤姆.avif';
    const loadedImageUrls: string[] = [];
    const match = jest.fn(async (imageUrl: string) =>
      imageUrl === missingImageUrl ? undefined : ({} as Response)
    );
    const open = jest.fn(async () => ({ match }));

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(imageUrl: string) {
        loadedImageUrls.push(imageUrl);
        queueMicrotask(() => this.onload?.());
      }
    }

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { open },
    });
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: MockImage,
    });
    setOnlineStatus(true);

    await warmOfflineImages(true);

    expect(open).toHaveBeenCalledWith('images');
    expect(loadedImageUrls).toEqual([missingImageUrl]);
  });
});
