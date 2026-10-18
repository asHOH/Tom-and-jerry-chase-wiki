import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import {
  buildChatReferenceCatalog,
  CHAT_REFERENCE_LABELS,
  extractChatReferences,
  referenceToken,
  resolveChatReferences,
  searchChatReferences,
} from './chatReferences';

const data = {
  characters: {
    'tom-id': {
      id: '汤姆',
      name: '汤姆',
      aliases: ['大猫'],
      description: 'published',
      skills: [
        {
          id: 'tom-active',
          name: '冲刺',
          aliases: ['加速跑'],
          skillLevels: [{ level: 1, description: '汤姆技能' }],
        },
      ],
    },
    'jerry-id': {
      id: '杰瑞',
      skills: [
        { id: 'jerry-active', name: '冲刺', skillLevels: [{ level: 1, description: '杰瑞技能' }] },
      ],
    },
  },
  cards: { 同名: { id: '同名' } },
  items: { 同名: { name: '同名' } },
  buffs: { 眩晕: { name: '眩晕' } },
  entities: { 夹子: { name: '夹子' } },
  maps: { 经典之家I: { name: '经典之家I' } },
  fixtures: { 管道: { name: '管道' } },
  modes: { 经典奶酪赛: { name: '经典奶酪赛' } },
  traits: { 救援: { description: '救援特性' } },
  specialSkills: { cat: { 同名: { name: '同名' } }, mouse: { 同名: { name: '同名' } } },
  achievements: { cat: { 四抓: { name: '四抓' } }, mouse: { 救援: { name: '救援' } } },
} as unknown as PublishedGameDataByType;

it('indexes canonical IDs, display names, aliases and faction-specific identities', async () => {
  const catalog = buildChatReferenceCatalog(data);
  const result = await searchChatReferences(catalog, '大猫');
  expect(result[0]).toMatchObject({
    id: 'tom-id',
    name: '汤姆',
    label: '角色',
    href: '/characters/tom-id/',
  });
  expect(referenceToken(result[0]!)).toBe('@角色「tom-id」');
  expect(await searchChatReferences(catalog, 'tangmu')).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: 'tom-id' })])
  );
  expect((await searchChatReferences(catalog, '同名', '知识卡')).map((item) => item.label)).toEqual(
    ['知识卡']
  );
  const skills = catalog.filter((item) => item.id === '同名' && item.label.endsWith('特技'));
  expect(skills.map((item) => item.key)).toEqual(['猫特技:同名', '鼠特技:同名']);
  expect(skills.map((item) => item.href)).toEqual([
    '/special-skills/cat/%E5%90%8C%E5%90%8D/',
    '/special-skills/mouse/%E5%90%8C%E5%90%8D/',
  ]);
});

it('offers every supported domain, including character skills with distinct owners and safe links', async () => {
  const catalog = buildChatReferenceCatalog(data, { 组合一: { name: '组合一', group: [] } });
  expect(new Set(catalog.map((reference) => reference.label))).toEqual(
    new Set(CHAT_REFERENCE_LABELS)
  );
  const skills = await searchChatReferences(catalog, '冲刺', '技能');
  expect(skills.map((reference) => referenceToken(reference))).toEqual([
    '@技能「tom-id/冲刺」',
    '@技能「jerry-id/冲刺」',
  ]);
  expect(skills[0]).toMatchObject({
    name: 'tom-id · 冲刺',
    href: '/characters/tom-id/#Skill%3A%E5%86%B2%E5%88%BA',
  });
  expect((await searchChatReferences(catalog, '加速跑', '技能'))[0]?.id).toBe('tom-id/冲刺');
  const token = referenceToken(skills[0]!);
  expect(extractChatReferences(token)[0]?.reference.href).toBe(skills[0]?.href);
  const resolved = resolveChatReferences(
    `${token} @技能「jerry-id/冲刺」 @技能「__proto__/冲刺」 @技能「tom-id/失效」`,
    data,
    {}
  );
  expect(resolved[0]).toEqual({
    label: '技能',
    id: 'tom-id/冲刺',
    type: 'skills',
    data: { ...data.characters['tom-id']!.skills[0], characterId: 'tom-id' },
  });
  expect(resolved[1]?.data).toEqual({
    ...data.characters['jerry-id']!.skills[0],
    characterId: 'jerry-id',
  });
  expect(resolved.slice(2).map((reference) => reference.data)).toEqual([null, null]);
});

it('parses only typed references and safely constructs local URLs', () => {
  const text = '比较 @知识卡「同名」 与 @道具「同名」；普通 @汤姆 或 a@b.com 不算精确引用';
  const matches = extractChatReferences(text);
  expect(matches.map(({ reference }) => reference.label)).toEqual(['知识卡', '道具']);
  expect(text.slice(matches[0]!.start, matches[0]!.end)).toBe('@知识卡「同名」');
  expect(extractChatReferences('@角色「<script>」')[0]?.reference.href).toBe(
    '/characters/%3Cscript%3E/'
  );
});

it('resolves current published entries, deduplicates references, and rejects prototype keys', () => {
  const resolved = resolveChatReferences(
    '@角色「tom-id」 @角色「tom-id」 @猫特技「同名」 @鼠特技「同名」 @知识卡「__proto__」 @道具「失效」',
    data,
    {}
  );
  expect(resolved).toHaveLength(5);
  expect(resolved[0]?.data).toEqual(data.characters['tom-id']);
  expect(resolved[1]?.data).toEqual(data.specialSkills.cat['同名']);
  expect(resolved[2]?.data).toEqual(data.specialSkills.mouse['同名']);
  expect(resolved[3]?.data).toBeNull();
  expect(resolved[4]?.data).toBeNull();
});
