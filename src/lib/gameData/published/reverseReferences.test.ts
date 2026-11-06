import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import { packReferenceSection, unpackReferenceRow } from '@/lib/referenceProjection';
import { referenceDomains, type ReferenceCatalog } from '@/lib/referenceSources';
import * as bundledCatalog from '@/data/static';

import { createApprovedActionSnapshot } from './approvedActionSnapshot';
import { getCanonicalGameData } from './canonicalSources';
import { selectReferenceSections } from './reverseReferences';
import { selectPublishedGameData } from './selectPublishedDomain';

jest.mock('server-only', () => ({}));
jest.mock('./getApprovedActionSnapshot', () => ({}));
jest.mock('./publishedSnapshot', () => ({}));
jest.mock('@/data/variants', () => ({
  variantEdges: [
    { prototype: { type: 'item', name: '原型' }, variant: { type: 'item', name: '中间' } },
    { prototype: { type: 'item', name: '中间' }, variant: { type: 'item', name: '经验蛋糕' } },
  ],
}));

const target = { name: '经验蛋糕', type: 'item' } as const;
const mention = '新增描述提到{经验蛋糕}。';
const catalog = Object.fromEntries(
  referenceDomains.map((domain) => [domain, getCanonicalGameData(domain)])
) as ReferenceCatalog;

it('looks up aliases by the route key after an item changes its display name', () => {
  const item = { ...catalog.items[target.name]!, name: '新的经验蛋糕', aliases: ['公开别名'] };
  const map = { ...Object.values(catalog.maps)[0]!, description: '{公开别名}' };
  const [section] = selectReferenceSections(
    { ...catalog, items: { [target.name]: item }, maps: { map } },
    [{ type: 'item', name: item.name, sourceId: target.name }]
  );
  expect(section!.groups[0]!.rows).toEqual([
    expect.objectContaining({ href: '/maps/map', description: '{公开别名}' }),
  ]);
});

it('keeps same-named sources and stored group, prototype and owner identities after a rename', () => {
  const item = { ...catalog.items[target.name]!, name: '同名道具', description: '{同名道具}' };
  const entity = { ...Object.values(catalog.entities)[0]!, name: '测试衍生物', owner: target };
  const map = { ...Object.values(catalog.maps)[0]!, description: '{测试衍生物}、{原型}和{鞭炮}' };
  const data = {
    ...catalog,
    items: { other: item, [target.name]: item, 鞭炮束: { ...item, name: '新的鞭炮束' } },
    entities: { child: entity },
    maps: { map },
  };
  const [root, firecracker] = selectReferenceSections(data, [
    { type: 'item', sourceId: target.name, name: item.name },
    { type: 'item', sourceId: '鞭炮束', name: '新的鞭炮束' },
  ]);
  const links = root!.groups[0]!.rows.map((row) => row.href);
  expect(links).toContain('/items/other');
  expect(links).not.toContain('/items/' + encodeURIComponent(target.name));
  expect(root!.groups.map((group) => group.title)).toEqual([item.name, '测试衍生物', '原型']);
  expect(firecracker!.groups[0]!.rows.map((row) => row.href)).toContain('/maps/map');
});

function characterEdit(id: string, description: string) {
  const decoded = decodeStoredActionRow({
    id,
    entry: { op: 'set', path: '汤姆.skills.0.description', newValue: description },
  });
  if (!decoded.success) throw new Error(decoded.error.message);
  return { entityType: 'characters', decodedRow: decoded.value };
}

it('adds and removes the first reference when only the referring character changes', () => {
  const addition = characterEdit('add-reference', mention);
  const removal = characterEdit('remove-reference', '引用已移除');
  for (const [rows, expectedCount] of [
    [[], 0],
    [[addition], 1],
    [[addition, removal], 0],
  ] as const) {
    const snapshot = createApprovedActionSnapshot(rows);
    const characters = selectPublishedGameData('characters', catalog.characters, snapshot);
    const [section] = selectReferenceSections({ ...catalog, characters }, [target]);
    const hits = section!.groups.flatMap((group) => group.rows);
    expect(hits).toHaveLength(expectedCount);
    const transported = packReferenceSection(catalog, section!).groups.flatMap((group) =>
      group.rows.map((row) => unpackReferenceRow(catalog, row, group.keywords, true))
    );
    expect(transported.map((row) => row.description)).toEqual(
      hits.map((row) => row.mobileDescription ?? row.description)
    );
    if (expectedCount)
      expect(hits[0]).toMatchObject({
        name: characters['汤姆']!.skills[0]!.name,
        type: 'skill',
        ownerSuffix: '（猫‐汤姆）',
        href: '/characters/' + encodeURIComponent('汤姆'),
        description: mention,
      });
  }
});

it('transports canonical matches by location and reconstructs both published excerpts', () => {
  const [section] = selectReferenceSections(catalog, [{ type: 'item', name: '鞭炮束' }]);
  const packed = packReferenceSection(catalog, section!);
  expect(packed.groups[0]!.rows.every((row) => 'at' in row)).toBe(true);
  for (const [groupIndex, group] of packed.groups.entries()) {
    for (const [index, row] of group.rows.entries()) {
      const {
        location: _location,
        mobileDescription,
        ...desktop
      } = section!.groups[groupIndex]!.rows[index]!;
      expect(unpackReferenceRow(bundledCatalog, row, group.keywords, false)).toEqual(desktop);
      expect(unpackReferenceRow(bundledCatalog, row, group.keywords, true)).toEqual({
        ...desktop,
        description: mobileDescription ?? desktop.description,
      });
    }
  }
});

it('keeps child-only hits for joint owners and indirect prototypes, including map mentions', () => {
  const child = {
    ...Object.values(catalog.entities)[0]!,
    name: '测试衍生物',
    owner: [{ name: '另一道具', type: 'item' as const }, target],
  };
  const map = {
    ...Object.values(catalog.maps)[0]!,
    name: '地图引用',
    description: '{测试衍生物}及{原型}',
    detailedDescription: '',
  };
  const [section] = selectReferenceSections(
    {
      ...catalog,
      entities: { child },
      maps: { fixture: map },
      characters: {},
      cards: {},
      specialSkills: { cat: {}, mouse: {} },
      items: {},
      buffs: {},
      fixtures: {},
      modes: {},
      achievements: { cat: {}, mouse: {} },
    },
    [target]
  );
  expect(section!.groups.map((group) => group.title)).toEqual(['测试衍生物', '原型']);
  for (const group of section!.groups) {
    expect(group.rows).toHaveLength(1);
    expect(group.rows[0]).toMatchObject({
      type: 'map',
      href: '/maps/fixture',
      description: map.description,
    });
  }
});

it('uses the target skill owner for aliases and returns the other same-named skill', () => {
  const character = catalog.characters['汤姆']!;
  const base = character.skills[0]!;
  const same = { ...base, name: '同名技能', detailedDescription: '', skillLevels: [] };
  const data = {
    ...catalog,
    characters: {
      first: { ...character, skills: [{ ...same, aliases: ['甲别名'], description: '{乙别名}' }] },
      second: {
        ...character,
        skills: [{ ...same, aliases: ['乙别名'], description: '{同名技能}' }],
      },
    },
  };
  const [section] = selectReferenceSections(data, [
    { name: '同名技能', type: 'skill', skillLocation: { characterId: 'second', index: 0 } },
  ]);
  expect(section!.groups[0]!.keywords.aliasKeywords).toContain('{乙别名}');
  expect(section!.groups[0]!.rows).toEqual([
    expect.objectContaining({
      name: '同名技能',
      href: '/characters/first',
      description: '{乙别名}',
    }),
  ]);
});

it('limits faction-specific owned entities to the matching special skill', () => {
  const skill = { name: '应急治疗', type: 'specialSkill' as const };
  const child = {
    ...Object.values(catalog.entities)[0]!,
    name: '测试衍生物',
    owner: { ...skill, factionId: 'cat' as const },
  };
  const map = { ...Object.values(catalog.maps)[0]!, description: '{测试衍生物}' };
  const [cat, mouse] = selectReferenceSections({ ...catalog, entities: { child }, maps: { map } }, [
    { ...skill, factionId: 'cat' },
    { ...skill, factionId: 'mouse' },
  ]);
  expect(cat!.groups.find((group) => group.title === child.name)?.rows).toHaveLength(1);
  expect(mouse!.groups.map((group) => group.title)).not.toContain(child.name);
});
