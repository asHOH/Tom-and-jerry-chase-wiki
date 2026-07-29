import { fetchPublishedChatGameData } from './chatGameDataClient';

describe('fetchPublishedChatGameData', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loads the no-store published tool projection', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        revision: 'v1:published',
        data: {
          characters: { __published_chat_character__: {} },
          cards: {},
          specialSkills: { cat: {}, mouse: {} },
          items: {},
          entities: {},
          buffs: {},
        },
      }),
    });

    await expect(fetchPublishedChatGameData()).resolves.toEqual(
      expect.objectContaining({ revision: 'v1:published' })
    );
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/game-data', { cache: 'no-store' });
  });

  it('rejects invalid tool data without exposing a partial projection', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        revision: 'v1:published',
        data: { characters: {} },
      }),
    });

    await expect(fetchPublishedChatGameData()).rejects.toThrow('聊天游戏数据响应格式无效');
  });
});
