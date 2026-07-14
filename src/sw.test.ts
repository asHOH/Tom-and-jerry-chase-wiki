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

const findFirstMatchingRoute = (url: string, destination: RequestDestination) => {
  const parsedUrl = new URL(url, self.location.href);
  const request = { destination } as Request;
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

  it('should keep same-origin map tiles in a dedicated cache-first cache', () => {
    const mapTileRoute = findFirstMatchingRoute(
      '/images/map-tiles/classic-home-i/4/0/0.avif',
      'image'
    );

    expect(mapTileRoute?.handler.strategyName).toBe('CacheFirst');
    expect(mapTileRoute?.handler.options).toMatchObject({
      cacheName: 'map-tiles-v1',
      plugins: [
        {
          options: {
            maxAgeSeconds: 2592000,
            maxEntries: 450,
          },
        },
      ],
    });
    expect(
      findFirstMatchingRoute('/images/maps/经典之家.avif', 'image')?.handler.strategyName
    ).toBe('StaleWhileRevalidate');
  });
});
