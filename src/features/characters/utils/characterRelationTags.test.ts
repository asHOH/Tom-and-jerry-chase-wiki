import { splitCharacterRelationTraits } from '@/data/characterRelationData';
import type { TraitRelationKind } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import {
  areCharacterRelationItemsEqual,
  characterRelationTags,
  getAllowedCharacterRelationTags,
  getAllowedInferredCharacterRelationTags,
  getCharacterRelationTagDefinition,
  getCharacterRelationTagLabels,
  normalizeCharacterRelationTags,
} from './characterRelationTags';

it.each(characterRelationTags)(
  'provides the same definition for %s and its inverse label',
  (tag) => {
    const definition = getCharacterRelationTagDefinition(tag);
    expect(definition).toMatch(/[\u4e00-\u9fff]/);
    expect(getCharacterRelationTagDefinition(`怕${tag}`)).toBe(definition);
  }
);

it.each(['旧版说明', '', 'constructor', '__proto__'])(
  'leaves unknown label %s without a definition',
  (tag) => {
    expect(getCharacterRelationTagDefinition(tag)).toBeUndefined();
  }
);

it('compares projected tags across formats while preserving other fields and malformed tags', () => {
  const item = { id: 'A', isMinor: false, tags: ['高伤'] };
  const legacy = { ...item, tags: [{ counters: '高伤', counteredBy: '怕高伤' }] };
  expect(areCharacterRelationItemsEqual(item, legacy)).toBe(true);
  expect(areCharacterRelationItemsEqual([legacy], [item])).toBe(true);
  expect(areCharacterRelationItemsEqual(item, { ...legacy, isMinor: true })).toBe(false);
  expect(
    areCharacterRelationItemsEqual(item, { ...legacy, tags: [{ ...legacy.tags[0], extra: true }] })
  ).toBe(false);
  expect(areCharacterRelationItemsEqual(item, { ...legacy, tags: ['免疫'] })).toBe(false);
  expect(areCharacterRelationItemsEqual(item, { ...legacy, tags: [null] })).toBe(false);
});

it.each([
  ['counters', 'counteredBy'],
  ['countersKnowledgeCards', 'counteredByKnowledgeCards'],
  ['countersSpecialSkills', 'counteredBySpecialSkills'],
] satisfies [TraitRelationKind, TraitRelationKind][])(
  'uses the countering faction for %s and its inverse %s',
  (direct, inverse) => {
    const shared = ['机制', '高伤', '无视', '免疫', '控制', '大视野'];
    const cat = [...shared, '追击'].sort();
    const mouse = [...shared, '拉扯', '自保', '稳救', '破局', '干扰', '速推', '辅助'].sort();
    expect([...getAllowedCharacterRelationTags('cat', direct)].sort()).toEqual(cat);
    expect([...getAllowedCharacterRelationTags('mouse', inverse)].sort()).toEqual(cat);
    expect([...getAllowedCharacterRelationTags('mouse', direct)].sort()).toEqual(mouse);
    expect([...getAllowedCharacterRelationTags('cat', inverse)].sort()).toEqual(mouse);
    expect(getAllowedCharacterRelationTags('mouse', 'collaborators')).toEqual([]);
    expect(getAllowedCharacterRelationTags(undefined, direct)).toEqual([]);
  }
);

it('limits automatic relation traits to the permitted direction', () => {
  expect(getAllowedInferredCharacterRelationTags('cat')).toEqual(['怕拉扯']);
  expect(getAllowedInferredCharacterRelationTags('mouse')).toEqual(['拉扯']);
});

it('reports every baseline tag that violates faction direction', () => {
  const failures = splitCharacterRelationTraits.flatMap(({ relation }) => {
    const allowed = getAllowedCharacterRelationTags(
      characterFactionById[relation.subject.name],
      relation.kind
    );
    return (relation.tags ?? [])
      .filter((tag) => typeof tag !== 'string' || !allowed.includes(tag))
      .map((tag) => ({
        subject: relation.subject,
        target: relation.target,
        kind: relation.kind,
        tag,
      }));
  });
  expect(failures).toEqual([]);
});

it.each([
  ['counters', '高伤'],
  ['counteredBy', '怕高伤'],
  ['countersKnowledgeCards', '高伤'],
  ['counteredByKnowledgeCards', '怕高伤'],
  ['countersSpecialSkills', '高伤'],
  ['counteredBySpecialSkills', '怕高伤'],
] satisfies [TraitRelationKind, string][])('renders both tag formats for %s', (kind, expected) => {
  expect(getCharacterRelationTagLabels(['高伤', ''], kind)).toEqual([expected]);
  expect(
    getCharacterRelationTagLabels([{ counters: '高伤', counteredBy: '怕高伤' }], kind)
  ).toEqual([expected]);
});

it('keeps legacy display labels readable and normalizes editor values without mutating them', () => {
  const tags = [{ counters: ' 高伤 ', counteredBy: '旧版说明' }, '免疫', ''];
  const before = structuredClone(tags);
  expect(getCharacterRelationTagLabels(tags, 'counteredBy')).toEqual(['旧版说明', '怕免疫']);
  expect(normalizeCharacterRelationTags(tags)).toEqual(['高伤', '免疫']);
  expect(tags).toEqual(before);
  expect(getCharacterRelationTagLabels(tags, 'collaborators')).toEqual([]);
  expect(normalizeCharacterRelationTags(undefined)).toEqual([]);
});

it('uses only catalogued single-name tags in the character, card, and skill baseline', () => {
  const tags = splitCharacterRelationTraits.flatMap(({ relation }) => relation.tags ?? []);
  expect(tags.length).toBeGreaterThan(0);
  for (const tag of tags) {
    expect(typeof tag).toBe('string');
    expect(characterRelationTags).toContain(tag);
  }
  expect(new Set(tags)).toEqual(new Set(characterRelationTags));
});
