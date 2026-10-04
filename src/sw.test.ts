type MatcherInput = {
  request: Request;
  sameOrigin: boolean;
  url: URL;
};

type RuntimeRoute = {
  handler: {
    options?: unknown;
    strategyName: string;
  };
  matcher: (input: MatcherInput) => boolean;
};

type SerwistConfig = {
  runtimeCaching: RuntimeRoute[];
};

const mockAddEventListeners = jest.fn();
let mockCapturedConfig: SerwistConfig | undefined;
const mockSerwist = jest.fn((config: SerwistConfig) => ({
  addEventListeners: mockAddEventListeners,
  config,
}));

jest.mock('@serwist/next/worker', () => ({
  defaultCache: [],
}));

jest.mock('serwist', () => {
  class MockStrategy {
    readonly options: unknown;
    readonly strategyName: string;

    constructor(strategyName: string, options?: unknown) {
      this.strategyName = strategyName;
      this.options = options;
    }
  }

  return {
    CacheFirst: class extends MockStrategy {
      constructor(options?: unknown) {
        super('CacheFirst', options);
      }
    },
    ExpirationPlugin: jest.fn((options?: unknown) => ({ options })),
    NetworkFirst: class extends MockStrategy {
      constructor(options?: unknown) {
        super('NetworkFirst', options);
      }
    },
    NetworkOnly: class extends MockStrategy {
      constructor(options?: unknown) {
        super('NetworkOnly', options);
      }
    },
    Serwist: mockSerwist,
    StaleWhileRevalidate: class extends MockStrategy {
      constructor(options?: unknown) {
        super('StaleWhileRevalidate', options);
      }
    },
  };
});

const getRuntimeCaching = () => {
  if (!mockCapturedConfig) {
    throw new Error('Serwist was not initialized');
  }
  return mockCapturedConfig.runtimeCaching;
};

const findFirstMatchingRoute = (url: string, destination: RequestDestination, headers = {}) => {
  const parsedUrl = new URL(url, self.location.href);
  const request = { destination, headers: new Headers(headers) } as Request;
  return getRuntimeCaching().find((route) =>
    route.matcher({
      request,
      sameOrigin: parsedUrl.origin === self.location.origin,
      url: parsedUrl,
    })
  );
};

describe('service worker runtime caching', () => {
  beforeAll(async () => {
    mockSerwist.mockImplementation((config: SerwistConfig) => {
      mockCapturedConfig = config;
      return {
        addEventListeners: mockAddEventListeners,
        config,
      };
    });
    Object.assign(self, { __SW_MANIFEST: [] });
    await import('./sw');
  });

  it('should cache same-origin script and style resources only', () => {
    expect(
      findFirstMatchingRoute('/_next/static/chunks/app.js', 'script')?.handler.strategyName
    ).toBe('StaleWhileRevalidate');

    expect(
      findFirstMatchingRoute(
        'https://me.kis.v2.scr.kaspersky-labs.com/FD126C42/main.js?attr=test',
        'script'
      )?.handler.strategyName
    ).toBe('NetworkOnly');
  });

  it('uses the same document cache for warmup and navigation without mixing in RSC', () => {
    for (const route of [
      findFirstMatchingRoute('/factions/mouse/', 'document'),
      findFirstMatchingRoute('/factions/mouse/', '', { Accept: 'text/html' }),
    ]) {
      expect(route?.handler.strategyName).toBe('NetworkFirst');
      expect(route?.handler.options).toMatchObject({ cacheName: 'app-routes' });
    }
    expect(findFirstMatchingRoute('/factions/mouse/', '', { RSC: '1' })).toBeUndefined();
    expect(
      findFirstMatchingRoute('/_next/static/chunks/lazy.js', '')?.handler.options
    ).toMatchObject({ cacheName: 'static-resources' });
  });

  it.each([
    '/admin/',
    '/articles/new/',
    '/articles/pending/',
    '/articles/preview/',
    '/articles/123/edit/',
    '/settings/',
    '/notifications/',
    '/characters/user/draft/',
  ])('keeps private workflow %s out of both HTML and RSC caches', (url) => {
    expect(findFirstMatchingRoute(url, 'document')?.handler.strategyName).toBe('NetworkOnly');
    expect(findFirstMatchingRoute(url, '', { RSC: '1' })?.handler.strategyName).toBe('NetworkOnly');
  });

  it.each([
    '/api/auth/me',
    '/api/notifications',
    '/api/notifications/email',
    '/api/notifications/preferences',
    '/api/articles/pending',
    '/api/articles/preview?token=secret',
    '/api/articles/submit',
    '/api/articles/edit-pending/version-id',
    '/api/moderation/pending',
    '/api/game-data-actions/admin?status=all',
    '/api/site-images',
    '/api/uploads/rte-image',
    'https://api.example.test/api/options',
  ])('should never cache private API response %s', (url) => {
    expect(findFirstMatchingRoute(url, '')?.handler.strategyName).toBe('NetworkOnly');
  });

  it.each([
    '/api/articles/article-id',
    '/api/articles/article-id/history',
    '/api/categories',
    '/api/comments?scope=article&targetId=article-id',
    '/api/echoflow/items/cheese',
    '/api/entities/export',
    '/api/game-data-actions/public',
    '/api/goto/cheese',
    '/api/options',
  ])('should cache explicitly public API response %s', (url) => {
    const route = findFirstMatchingRoute(url, '');

    expect(route?.handler.strategyName).toBe('NetworkFirst');
    expect(route?.handler.options).toMatchObject({ cacheName: 'public-api-cache-v1' });
  });
});
