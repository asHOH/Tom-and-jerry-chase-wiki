import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { FactionId, SingleItem } from '@/data/types';

export const referenceDomains = [
  'characters',
  'cards',
  'specialSkills',
  'items',
  'entities',
  'buffs',
  'maps',
  'modes',
  'fixtures',
  'achievements',
] as const;
export type ReferenceCatalog = Pick<PublishedGameDataByType, (typeof referenceDomains)[number]>;

type ReferenceSource = {
  item: SingleItem;
  fields: readonly (string | undefined)[];
  rules?: readonly (string | undefined)[];
  href: string;
  imageUrl?: string | undefined;
  entityOwners?: ReferenceCatalog['entities'][string]['owner'];
  skillOwner?: { id: string; factionId: FactionId; index: number };
};

export type ReferenceLocation =
  | readonly ['skill', string, number]
  | readonly ['specialSkill' | 'achievement', string, FactionId]
  | readonly ['knowledgeCard' | 'item' | 'entity' | 'buff' | 'map' | 'mode' | 'fixture', string];

const simpleDomains = {
  knowledgeCard: 'cards',
  item: 'items',
  entity: 'entities',
  buff: 'buffs',
  map: 'maps',
  mode: 'modes',
  fixture: 'fixtures',
} as const;

export function referenceSourceAt(
  data: ReferenceCatalog,
  location: ReferenceLocation
): ReferenceSource | undefined {
  const [type, id] = location;
  if (type === 'skill') {
    const character = data.characters[id];
    const index = location[2];
    const skill = character?.skills[index];
    if (!character || !skill) return;
    return {
      item: { name: skill.name, type },
      href: '/characters/' + encodeURIComponent(id),
      imageUrl: skill.imageUrl,
      skillOwner: { id, factionId: character.factionId, index },
      fields: [
        skill.description,
        skill.detailedDescription,
        ...skill.skillLevels.flatMap((level) => [level.description, level.detailedDescription]),
      ],
    };
  }
  if (type === 'specialSkill' || type === 'achievement') {
    const factionId = location[2];
    const record =
      type === 'specialSkill'
        ? data.specialSkills[factionId][id]
        : data.achievements[factionId][id];
    if (!record) return;
    const path = type === 'specialSkill' ? 'special-skills' : 'achievements';
    return {
      item: { name: record.name, type, factionId },
      href: '/' + path + '/' + factionId + '/' + encodeURIComponent(id),
      imageUrl: record.imageUrl,
      fields: [record.description, record.detailedDescription],
    };
  }
  const domain = simpleDomains[type];
  const record = data[domain][id];
  if (!record) return;
  const name = type === 'knowledgeCard' ? data.cards[id]!.id : 'name' in record ? record.name : id;
  return {
    item: { name, type },
    href: '/' + domain + '/' + encodeURIComponent(id),
    imageUrl: record.imageUrl,
    fields: [record.description, record.detailedDescription],
    ...(type === 'entity' ? { entityOwners: data.entities[id]?.owner } : {}),
    ...(type === 'mode' ? { rules: [data.modes[id]?.rules, data.modes[id]?.detailedRules] } : {}),
  };
}

function* locations(data: ReferenceCatalog): Generator<ReferenceLocation> {
  for (const [id, character] of Object.entries(data.characters)) {
    for (const index of character.skills.keys()) yield ['skill', id, index];
  }
  for (const id of Object.keys(data.cards)) yield ['knowledgeCard', id];
  for (const faction of ['cat', 'mouse'] as const) {
    for (const id of Object.keys(data.specialSkills[faction])) yield ['specialSkill', id, faction];
  }
  for (const type of ['item', 'entity', 'buff', 'map', 'mode', 'fixture'] as const) {
    for (const id of Object.keys(data[simpleDomains[type]])) yield [type, id];
  }
  for (const faction of ['cat', 'mouse'] as const) {
    for (const id of Object.keys(data.achievements[faction])) yield ['achievement', id, faction];
  }
}

export function* referenceSources(
  data: ReferenceCatalog
): Generator<ReferenceSource & { location: ReferenceLocation }> {
  for (const location of locations(data)) {
    const source = referenceSourceAt(data, location);
    if (source) yield { ...source, location };
  }
}
export function matchesReference(source: ReferenceSource, keywords: readonly string[]) {
  const matches = (text: string | undefined) =>
    text != null && keywords.some((keyword) => text.includes(keyword));
  return source.fields.some(matches) || source.rules?.some(matches);
}
