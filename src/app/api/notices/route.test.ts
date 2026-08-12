import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';

import { GET, PUBLIC_NOTICES_CACHE_SECONDS } from './route';

jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { headers?: Record<string, string> }) => ({
      json: async () => body,
      headers: {
        get: (name: string) =>
          Object.entries(init?.headers ?? {}).find(
            ([key]) => key.toLowerCase() === name.toLowerCase()
          )?.[1] ?? null,
      },
    }),
  },
}));

describe('public notices route caching', () => {
  it('allows the CDN to reuse the anonymous empty response', async () => {
    jest.mocked(getOptionalSupabasePublicClient).mockReturnValue(undefined);

    const response = await GET();

    expect(PUBLIC_NOTICES_CACHE_SECONDS).toBe(5 * 60);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=60'
    );
    await expect(response.json()).resolves.toEqual({ notices: [] });
  });
});
