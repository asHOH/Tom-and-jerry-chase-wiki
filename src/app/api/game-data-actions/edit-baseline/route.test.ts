import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';

import { GET } from './route';

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedGameDataSnapshot: jest.fn(),
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

const mockGetPublishedGameDataSnapshot = getPublishedGameDataSnapshot as jest.MockedFunction<
  typeof getPublishedGameDataSnapshot
>;

describe('GET /api/game-data-actions/edit-baseline', () => {
  it('returns the complete published baseline and revision without approved rows', async () => {
    mockGetPublishedGameDataSnapshot.mockResolvedValue({
      revision: 'v1:published',
      actionRevision: 'v1:actions',
      buildIdentity: 'build',
      data: {
        achievements: { cat: {}, mouse: {} },
        characters: {},
        cards: {},
        entities: {},
        buffs: {},
        items: {},
        fixtures: {},
        maps: {},
        modes: {},
        specialSkills: { cat: {}, mouse: {} },
      },
    });

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      revision: 'v1:published',
      data: expect.objectContaining({
        characters: {},
        items: {},
        maps: {},
      }),
    });
    expect(body).not.toHaveProperty('rows');
    expect(body).not.toHaveProperty('actions');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
