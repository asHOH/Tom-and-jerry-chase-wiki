import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieRecord = { name: string; value: string; options?: Record<string, unknown> };
type CookieController = {
  getAll: () => CookieRecord[];
  setAll: (cookies: CookieRecord[]) => void;
};

jest.mock('next/server', () => {
  class MockCookies {
    private readonly values = new Map<string, CookieRecord>();

    constructor(cookieHeader?: string) {
      cookieHeader
        ?.split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => {
          const [name, ...valueParts] = entry.split('=');
          if (name) this.set(name, valueParts.join('='));
        });
    }

    getAll() {
      return Array.from(this.values.values());
    }

    get(name: string) {
      return this.values.get(name);
    }

    set(name: string, value: string, options?: Record<string, unknown>) {
      const record = options === undefined ? { name, value } : { name, value, options };
      this.values.set(name, record);
    }
  }

  class MockNextRequest {
    readonly cookies: MockCookies;

    constructor(
      readonly url: string,
      init?: { headers?: { cookie?: string } }
    ) {
      this.cookies = new MockCookies(init?.headers?.cookie);
    }
  }

  class MockNextResponse {
    readonly cookies = new MockCookies();

    static json(_body: unknown) {
      return new MockNextResponse();
    }

    static next(_init?: unknown) {
      return new MockNextResponse();
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((_url, _key, options) => ({ options })),
}));

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  },
}));

jest.mock('./fetch-retry', () => ({
  fetchWithRetry: jest.fn(),
}));

describe('supabase ssr clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('binds route handler cookie writes to the provided response', async () => {
    const { createSupabaseRouteClient } = await import('./ssrClient');
    const request = new NextRequest('https://example.test/api/auth/login', {
      headers: { cookie: 'existing=1' },
    });
    const response = NextResponse.json({ ok: true });

    createSupabaseRouteClient(request, response);

    const cookies = jest.mocked(createServerClient).mock.calls[0]?.[2]?.cookies as
      CookieController | undefined;
    if (!cookies) throw new Error('Expected Supabase cookies adapter');

    expect(cookies.getAll()).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'existing', value: '1' })])
    );

    cookies.setAll([
      {
        name: 'sb-session',
        value: 'token',
        options: { path: '/', httpOnly: true },
      },
    ]);

    expect(response.cookies.get('sb-session')?.value).toBe('token');
  });

  it('mirrors proxy cookie writes to the request and returned response', async () => {
    const { createSupabaseProxyClient } = await import('./ssrClient');
    const request = new NextRequest('https://example.test/articles', {
      headers: { cookie: 'existing=1' },
    });

    const proxyClient = createSupabaseProxyClient(request);
    const cookies = jest.mocked(createServerClient).mock.calls[0]?.[2]?.cookies as
      CookieController | undefined;
    if (!cookies) throw new Error('Expected Supabase cookies adapter');

    cookies.setAll([
      {
        name: 'sb-session',
        value: 'token',
        options: { path: '/', httpOnly: true },
      },
    ]);

    expect(request.cookies.get('sb-session')?.value).toBe('token');
    expect(proxyClient.getResponse().cookies.get('sb-session')?.value).toBe('token');
  });
});
