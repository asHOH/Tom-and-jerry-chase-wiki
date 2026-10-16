import type { FactionId, SingleItem } from '@/data/types';

import { getCategorizedKeywords } from './singleItemReverse';
import {
  getSingleItemFactionId,
  getSingleItemHref,
  getSingleItemImageUrl,
} from './singleItemTools';

jest.mock('@/data/autoWrapNames', () => ({ autoWrapNames: [] }));
jest.mock('@/data', () => {
  const skill = (name: string, factionId: string) => ({
    name,
    factionId,
    imageUrl: `/${factionId}/${name}.png`,
    aliases: [`${factionId}-${name}-alias`],
  });
  return {
    specialSkills: {
      cat: { shared: skill('shared', 'cat'), catOnly: skill('catOnly', 'cat') },
      mouse: { shared: skill('shared', 'mouse'), mouseOnly: skill('mouseOnly', 'mouse') },
    },
    characters: {},
    cards: {},
    entities: {},
    buffs: {},
    items: {},
    itemGroups: {},
    maps: {},
    modes: {},
    fixtures: {},
    achievements: { cat: {}, mouse: {} },
  };
});

it.each<[string, FactionId | undefined, FactionId]>([
  ['shared', 'cat', 'cat'],
  ['shared', 'mouse', 'mouse'],
  ['catOnly', undefined, 'cat'],
  ['mouseOnly', undefined, 'mouse'],
])('resolves %s with faction %s consistently', (name, factionId, expectedFaction) => {
  const item: SingleItem = { name, type: 'specialSkill', ...(factionId ? { factionId } : {}) };
  expect(getSingleItemFactionId(item)).toBe(expectedFaction);
  expect(getSingleItemHref(item)).toBe(`/special-skills/${expectedFaction}/${name}`);
  expect(getSingleItemImageUrl(item)).toBe(`/${expectedFaction}/${name}.png`);
  const keywords = getCategorizedKeywords(item);
  expect(keywords.aliasKeywords).toContain(`{${expectedFaction}-${name}-alias}`);
  expect(keywords.originalKeywords).toContain(
    `{${name}(${expectedFaction === 'cat' ? '猫' : '鼠'}特技)}`
  );
  expect(keywords.aliasKeywords.join(' ')).not.toContain(
    `${expectedFaction === 'cat' ? 'mouse' : 'cat'}-${name}-alias`
  );
});

it.each<[string, FactionId | undefined]>([
  ['shared', undefined],
  ['catOnly', 'mouse'],
  ['mouseOnly', 'cat'],
  ['missing', undefined],
  ['missing', 'cat'],
  ['toString', undefined],
  ['constructor', 'mouse'],
])('leaves %s with faction %s unresolved', (name, factionId) => {
  const item: SingleItem = { name, type: 'specialSkill', ...(factionId ? { factionId } : {}) };
  expect(getSingleItemFactionId(item)).toBeUndefined();
  expect(getSingleItemHref(item)).toBe('/error');
  expect(getSingleItemImageUrl(item)).toBe('/images/icons/cat-faction.png');
  expect(getCategorizedKeywords(item).allKeywords).toEqual([]);
});
