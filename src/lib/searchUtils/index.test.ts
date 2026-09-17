import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import { createApprovedActionSnapshot } from '@/lib/gameData/published/approvedActionSnapshot';
import { selectPublishedGameData } from '@/lib/gameData/published/selectPublishedDomain';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { performSearch } from './index';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/data', () => {
  const records = (count: number, prefix: string) =>
    Object.fromEntries(
      Array.from({ length: count }, (_, index) => [
        index,
        {
          name: `奶酪${prefix}${index}`,
          aliases: ['cheese'],
          imageUrl: '/test.png',
        },
      ])
    );
  return {
    items: {
      ...records(7, '道具'),
      excerpt: { name: '片段道具', description: 'Before. lead，prefix TARGET trailing' },
    },
    fixtures: records(6, '组件'),
    entities: {
      ...records(6, '衍生物'),
      special: {
        name: '衍生物',
        create: '召唤文本',
        skills: [{ name: '衍生技能', aliases: ['技能简称'] }],
      },
    },
    maps: {
      ...records(6, '地图'),
      special: { name: '地图', mapSkin: [{ name: '雪夜', description: '皮肤描述' }] },
    },
    modes: { mode: { name: '模式', rules: '特殊规则', detailedRules: '详细规则' } },
    cards: {
      card: { id: '知识卡', description: '卡片描述', levels: [{ description: '卡片等级' }] },
    },
    buffs: {
      buff: { name: '状态', aliases: ['#模板别名', '%模板别名', '普通别名'], stack: '叠加效果' },
    },
    achievements: {
      cat: { a: { name: '共同成就', factionId: 'cat' } },
      mouse: { a: { name: '共同成就', factionId: 'mouse' } },
    },
    specialSkills: {
      cat: { a: { name: '共同特技', factionId: 'cat' } },
      mouse: { a: { name: '共同特技', factionId: 'mouse' } },
    },
    itemGroups: {},
  };
});
jest.mock('@/data/static', () => ({
  characters: {
    tom: {
      id: '汤姆',
      description: '角色介绍',
      imageUrl: '/tom.png',
      skills: [
        { name: '技能甲', aliases: ['技能别名'], skillLevels: [{ description: '等级内容' }] },
        { name: '技能乙', aliases: ['技能别名'], skillLevels: [{ description: '等级内容' }] },
      ],
      catPositioningTags: [],
      mousePositioningTags: [],
    },
  },
}));
jest.mock('@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl', () => ({
  getItemGroupImageUrl: () => '/group.png',
}));
jest.mock('@/lib/singleItemTools', () => ({ getSingleItemHref: () => '/items/example/' }));
jest.mock('@/features/buffs/data/buffMappingTable', () => ({
  buffMappingTable: { 'example|item': [1] },
}));
jest.mock('@/features/buffs/data/allBuffDetailedDescriptions.json', () => ({
  '1': '“护盾”详细状态说明',
}));
jest.mock('@/data/generated/docPages.json', () => [
  { title: '帮助文档', slug: 'help', path: '/help/' },
]);

const gameData = {
  ...jest.requireMock('@/data'),
  ...jest.requireMock('@/data/static'),
  traits: {},
} as PublishedGameDataByType;
const search = (query: string) => performSearch(query, gameData);

describe('performSearch', () => {
  it('finds an approved alias through published replay and links to the record key', async () => {
    const decoded = decodeStoredActionRow({
      id: 'approved-alias',
      entry: { op: 'set', path: 'tom.aliases', newValue: ['已发布别名'] },
    });
    if (!decoded.success) throw new Error(decoded.error.message);
    const actions = createApprovedActionSnapshot([
      { entityType: 'characters', status: 'approved', decodedRow: decoded.value },
    ]);
    const published = {
      ...gameData,
      characters: selectPublishedGameData('characters', gameData.characters, actions),
    };

    expect(await search('已发布别名')).toEqual([]);
    expect(await performSearch('已发布别名', published)).toEqual([
      expect.objectContaining({ id: '汤姆', href: '/characters/tom' }),
    ]);
    expect(await search('已发布别名')).toEqual([]);
  });

  it.each([
    ['汤姆', '/characters/tom'],
    ['技能甲', `/characters/tom#Skill:${encodeURIComponent('技能甲')}`],
    ['知识卡', '/cards/card'],
    ['片段道具', '/items/excerpt'],
    ['召唤文本', '/entities/special'],
    ['叠加效果', '/buffs/buff'],
    ['雪夜', '/maps/special'],
    ['奶酪组件0', '/fixtures/0'],
    ['特殊规则', '/modes/mode'],
    ['help', '/help/'],
  ])('returns a destination for %s', async (query, href) => {
    expect(await search(query)).toEqual([expect.objectContaining({ href })]);
  });

  it('returns arrays, preserves stable ties, and limits each source to five and the total to twenty', async () => {
    const results = await search('奶酪');
    expect(results).toHaveLength(20);
    expect(results.map((result) => result.type)).toEqual([
      ...Array(5).fill('item'),
      ...Array(5).fill('entity'),
      ...Array(5).fill('map'),
      ...Array(5).fill('fixture'),
    ]);
    expect(results.slice(0, 5).map((result) => 'name' in result && result.name)).toEqual(
      Array.from({ length: 5 }, (_, i) => `奶酪道具${i}`)
    );
    expect(results.every((result) => result.priority === 1 && !result.isPinyinMatch)).toBe(true);
  });

  it.each(['  NAI LAO  ', "nai'lao"])('normalizes pinyin query %s', async (query) => {
    const results = await search(query);
    expect(results).toHaveLength(20);
    expect(results.every((result) => result.priority === 0.95 && result.isPinyinMatch)).toBe(true);
  });

  it.each(['', '   ', '没有匹配结果', "'"])('returns no results for %j', async (query) => {
    expect(await search(query)).toEqual([]);
  });

  it('keeps aliases and their context separate from the display name', async () => {
    expect((await search('cheese'))[0]).toMatchObject({
      type: 'item',
      name: '奶酪道具0',
      matchContext: '奶酪道具0 (cheese)',
      priority: 0.9,
    });
  });

  it('preserves the description excerpt around a case-insensitive match', async () => {
    expect(await search('target')).toEqual([
      expect.objectContaining({
        type: 'item',
        matchContext: 'prefix TARGET trailing',
        priority: 0.8,
      }),
    ]);
  });

  it.each([
    ['召唤文本', 'entity', 0.6],
    ['技能简称', 'entity', 0.34],
    ['雪夜', 'map', 0.6],
    ['皮肤描述', 'map', 0.5],
    ['特殊规则', 'mode', 0.6],
    ['详细规则', 'mode', 0.5],
    ['知识卡', 'card', 0.2],
    ['卡片等级', 'card', 0.14],
    ['叠加效果', 'buff', 0.6],
    ['普通别名', 'buff', 0.9],
    ['help', 'doc', 0.9],
  ])('preserves domain-specific matching for %s', async (query, type, priority) => {
    expect(await search(query as string)).toEqual([
      expect.objectContaining({ type, priority, isPinyinMatch: false }),
    ]);
  });

  it('excludes regex buff aliases and retains detailed-buff links and ranking', async () => {
    expect(await search('模板别名')).toEqual([]);
    expect(await search('护盾')).toEqual([
      expect.objectContaining({
        type: 'buff',
        name: '护盾',
        priority: -0.9,
        detailedBuffId: '1',
        href: '/items/example/#buff-1',
      }),
    ]);
  });

  it.each(['共同成就', '共同特技'])('retains both factions for %s', async (query) => {
    const route = query === '共同成就' ? 'achievements' : 'special-skills';
    expect(await search(query)).toEqual([
      expect.objectContaining({ factionId: 'cat', href: `/${route}/cat/a` }),
      expect.objectContaining({ factionId: 'mouse', href: `/${route}/mouse/a` }),
    ]);
  });

  it.each([
    ['技能甲', '技能甲', 0.9],
    ['技能别名', '技能乙', 0.84],
    ['等级内容', '技能乙', 0.2],
  ])(
    'preserves character skill navigation and precedence for %s',
    async (query, matchedSkillName, priority) => {
      expect(await search(query as string)).toEqual([
        expect.objectContaining({ type: 'character', id: '汤姆', matchedSkillName, priority }),
      ]);
    }
  );
});
