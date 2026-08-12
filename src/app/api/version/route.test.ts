import { dynamic, GET, revalidate } from './route';

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

describe('version route', () => {
  it('is generated once per deployment instead of consuming runtime compute', () => {
    expect(dynamic).toBe('force-static');
    expect(revalidate).toBe(false);
  });

  it('returns deployment version metadata without allowing browser caching', async () => {
    const response = await GET();
    const body = (await response.json()) as { version?: string; environment?: string };

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(body.version).toBeTruthy();
    expect(body.environment).toBeTruthy();
  });
});
