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

const mockGetPublishedGameDataSnapshot = jest.mocked(getPublishedGameDataSnapshot);

describe('GET /api/chat/game-data', () => {
  it('returns only the published domains available to the chat tool', async () => {
    mockGetPublishedGameDataSnapshot.mockResolvedValue({
      revision: 'v1:published',
      actionRevision: 'v1:actions',
      buildIdentity: 'build',
      data: {
        achievements: { cat: {}, mouse: {} },
        characters: { __published_chat_character__: {} },
        cards: {},
        entities: {},
        buffs: {},
        items: {},
        fixtures: {},
        maps: {},
        modes: {},
        specialSkills: { cat: {}, mouse: {} },
      },
    } as never);

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      revision: 'v1:published',
      data: {
        characters: { __published_chat_character__: {} },
        cards: {},
        specialSkills: { cat: {}, mouse: {} },
        items: {},
        entities: {},
        buffs: {},
      },
    });
    expect(JSON.stringify(body)).not.toContain('achievements');
    expect(JSON.stringify(body)).not.toContain('maps');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
