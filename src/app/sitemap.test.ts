import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';

import sitemap from './sitemap';

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedGameDataSnapshot: jest.fn(),
}));

jest.mock('@/constants/seo', () => ({
  SITE_URL: 'https://www.tjwiki.test',
}));

jest.mock('@/features/characters/utils/ranking', () => ({
  RANKABLE_PROPERTIES: [],
}));

jest.mock('@/features/items/data/itemGroups', () => ({
  __esModule: true,
  default: {
    泰菲类角色: {},
    '投掷道具-广义': {},
  },
}));

jest.mock('@/features/mechanics/sections', () => ({
  mechanicsSectionsList: [],
}));

jest.mock('@/features/usages/sections', () => ({
  usagesSectionsList: [],
}));

const getPublishedGameDataSnapshotMock = jest.mocked(getPublishedGameDataSnapshot);

describe('game data sitemap', () => {
  beforeEach(() => {
    getPublishedGameDataSnapshotMock.mockResolvedValue({
      data: {
        achievements: { cat: {}, mouse: {} },
        buffs: {},
        cards: {},
        characters: {},
        entities: {},
        fixtures: {},
        items: {},
        maps: {},
        modes: {},
        specialSkills: {
          cat: { 应急治疗: {} },
          mouse: { 急速翻滚: {} },
        },
      },
    } as never);
  });

  it('encodes special-skill route segments without encoding their separator', async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain(
      'https://www.tjwiki.test/special-skills/cat/%E5%BA%94%E6%80%A5%E6%B2%BB%E7%96%97/'
    );
    expect(urls).toContain(
      'https://www.tjwiki.test/special-skills/mouse/%E6%80%A5%E9%80%9F%E7%BF%BB%E6%BB%9A/'
    );
    expect(urls.some((url) => url.includes('%2F'))).toBe(false);
  });

  it('includes the item-group catalog and every item-group detail route', async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain('https://www.tjwiki.test/itemGroups/');
    expect(urls).toContain(
      'https://www.tjwiki.test/itemGroups/%E6%B3%B0%E8%8F%B2%E7%B1%BB%E8%A7%92%E8%89%B2/'
    );
    expect(urls).toContain(
      'https://www.tjwiki.test/itemGroups/%E6%8A%95%E6%8E%B7%E9%81%93%E5%85%B7-%E5%B9%BF%E4%B9%89/'
    );
  });
});
