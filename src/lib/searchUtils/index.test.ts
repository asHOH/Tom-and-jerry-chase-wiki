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
    itemGroups: { group: { name: '道具组合' } },
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

  it('returns every match across sources and preserves stable ties', async () => {
    const results = await search('奶酪');
    expect(results).toHaveLength(25);
    expect(results.map((result) => result.type)).toEqual([
      ...Array(7).fill('item'),
      ...Array(6).fill('entity'),
      ...Array(6).fill('map'),
      ...Array(6).fill('fixture'),
    ]);
    expect(results.slice(0, 7).map((result) => 'name' in result && result.name)).toEqual(
      Array.from({ length: 7 }, (_, i) => `奶酪道具${i}`)
    );
    expect(results.every((result) => !result.isPinyinMatch)).toBe(true);
  });

  it.each(['  NAI LAO  ', "nai'lao"])('normalizes pinyin query %s', async (query) => {
    const results = await search(query);
    expect(results).toHaveLength(25);
    expect(results.every((result) => result.isPinyinMatch)).toBe(true);
  });

  it.each(['', '   ', '没有匹配结果', "'"])('returns no results for %j', async (query) => {
    expect(await search(query)).toEqual([]);
  });

  it('keeps aliases and their context separate from the display name', async () => {
    expect((await search('cheese'))[0]).toMatchObject({
      type: 'item',
      name: '奶酪道具0',
      matchContext: '奶酪道具0 (cheese)',
    });
  });

  it('preserves the description excerpt around a case-insensitive match', async () => {
    expect(await search('target')).toEqual([
      expect.objectContaining({
        type: 'item',
        matchContext: 'prefix TARGET trailing',
      }),
    ]);
  });

  it.each([
    ['召唤文本', 'entity'],
    ['技能简称', 'entity'],
    ['雪夜', 'map'],
    ['皮肤描述', 'map'],
    ['特殊规则', 'mode'],
    ['详细规则', 'mode'],
    ['知识卡', 'card'],
    ['卡片等级', 'card'],
    ['叠加效果', 'buff'],
    ['普通别名', 'buff'],
    ['help', 'doc'],
  ])('preserves domain-specific matching for %s', async (query, type) => {
    expect(await search(query as string)).toEqual([
      expect.objectContaining({ type, isPinyinMatch: false }),
    ]);
  });

  it('excludes regex buff aliases and retains detailed-buff links', async () => {
    expect(await search('模板别名')).toEqual([]);
    expect(await search('护盾')).toEqual([
      expect.objectContaining({
        type: 'buff',
        name: '护盾',
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
    ['技能甲', '技能甲'],
    ['技能别名', '技能甲'],
    ['等级内容', '技能甲'],
  ])(
    'links to the first equally relevant character skill for %s',
    async (query, matchedSkillName) => {
      expect(await search(query as string)).toEqual([
        expect.objectContaining({
          type: 'character',
          id: '汤姆',
          matchedSkillName,
          href: `/characters/tom#Skill:${encodeURIComponent(matchedSkillName)}`,
        }),
      ]);
    }
  );

  it.each([
    ['汤姆', '/characters/tom'],
    ['知识卡', '/cards/card'],
    ['共同特技', '/special-skills/cat/a'],
    ['道具组合', `/itemGroups/${encodeURIComponent('道具组合')}`],
    ['片段道具', '/items/excerpt'],
    ['衍生物', '/entities/special'],
    ['状态', '/buffs/buff'],
    ['雪夜', '/maps/special'],
    ['奶酪组件0', '/fixtures/0'],
    ['模式', '/modes/mode'],
    ['共同成就', '/achievements/cat/a'],
    ['帮助文档', '/help/'],
    ['护盾', '/items/example/#buff-1'],
  ])(
    'ranks the exact name %s above partial names, aliases, and prose across sources',
    async (query, href) => {
      const results = await performSearch(query, {
        ...gameData,
        items: {
          ...gameData.items,
          partial: { ...gameData.items.excerpt!, name: `${query}扩展`, imageUrl: '' },
          alias: { ...gameData.items.excerpt!, name: '别名条目', aliases: [query], imageUrl: '' },
          prose: {
            ...gameData.items.excerpt!,
            name: '说明条目',
            description: `包含${query}的说明`,
            imageUrl: '',
          },
        },
      });
      expect(results[0]).toMatchObject({ href });
      expect(results.map((result) => result.href)).toEqual(
        expect.arrayContaining(['/items/partial', '/items/alias', '/items/prose'])
      );
      const position = (destination: string) =>
        results.findIndex((result) => result.href === destination);
      expect(position('/items/partial')).toBeLessThan(position('/items/alias'));
      expect(position('/items/alias')).toBeLessThan(position('/items/prose'));
    }
  );

  it.each([
    ['tangmu', '/characters/tom'],
    ['zhishika', '/cards/card'],
    ['hudun', '/items/example/#buff-1'],
  ])('ranks the pinyin name %s above a literal description match', async (query, href) => {
    const results = await performSearch(query, {
      ...gameData,
      items: {
        prose: {
          ...gameData.items.excerpt!,
          name: '说明条目',
          description: `包含 ${query} 的说明`,
          imageUrl: '',
        },
      },
    });
    expect(results[0]).toMatchObject({ href, isPinyinMatch: true });
    expect(results.at(-1)).toMatchObject({ href: '/items/prose', isPinyinMatch: false });
  });

  it('chooses a stronger later field and its skill destination over an earlier prose match', async () => {
    const character = gameData.characters.tom!;
    const results = await performSearch('技能乙', {
      ...gameData,
      characters: {
        tom: {
          ...character,
          description: '有关技能乙的介绍',
          skills: [{ ...character.skills[0]!, name: '技能乙扩展' }, character.skills[1]!],
        },
      },
      entities: {
        special: {
          ...gameData.entities.special!,
          description: '有关技能乙的介绍',
          skills: [{ ...gameData.entities.special!.skills![0]!, name: '技能乙' }],
        },
      },
    });
    expect(results[0]).toMatchObject({
      href: `/characters/tom#Skill:${encodeURIComponent('技能乙')}`,
      matchContext: '技能乙',
    });
    expect(results[1]).toMatchObject({ href: '/entities/special', matchContext: '技能乙' });
  });

  it('ranks literal names above pinyin names and descriptions above details', async () => {
    const results = await performSearch('hudun', {
      ...gameData,
      items: {
        detail: { ...gameData.items.excerpt!, name: '详情条目', detailedDescription: 'hudun' },
        prose: { ...gameData.items.excerpt!, name: '说明条目', description: '包含 hudun 的说明' },
        pinyin: { ...gameData.items.excerpt!, name: '护盾' },
        literal: { ...gameData.items.excerpt!, name: 'hudun' },
      },
    });
    expect(results.filter((result) => result.type === 'item').map((result) => result.href)).toEqual(
      ['/items/literal', '/items/pinyin', '/items/prose', '/items/detail']
    );
  });
});
