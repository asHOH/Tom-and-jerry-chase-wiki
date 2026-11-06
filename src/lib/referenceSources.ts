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

export function* referenceSources(data: ReferenceCatalog): Generator<ReferenceSource> {
  for (const [id, character] of Object.entries(data.characters)) {
    for (const [index, skill] of character.skills.entries()) {
      yield {
        item: { name: skill.name, type: 'skill' },
        href: '/characters/' + encodeURIComponent(id),
        skillOwner: { id, factionId: character.factionId, index },
        imageUrl: skill.imageUrl,
        fields: [
          skill.description,
          skill.detailedDescription,
          ...skill.skillLevels.flatMap((level) => [level.description, level.detailedDescription]),
        ],
      };
    }
  }
  for (const [id, card] of Object.entries(data.cards)) {
    yield {
      item: { name: card.id, type: 'knowledgeCard' },
      href: '/cards/' + encodeURIComponent(id),
      imageUrl: card.imageUrl,
      fields: [card.description, card.detailedDescription],
    };
  }
  for (const factionId of ['cat', 'mouse'] as const) {
    for (const [id, skill] of Object.entries(data.specialSkills[factionId])) {
      yield {
        item: { name: skill.name, type: 'specialSkill', factionId },
        href: '/special-skills/' + factionId + '/' + encodeURIComponent(id),
        imageUrl: skill.imageUrl,
        fields: [skill.description, skill.detailedDescription],
      };
    }
  }
  for (const [domain, type] of [
    ['items', 'item'],
    ['entities', 'entity'],
    ['buffs', 'buff'],
    ['maps', 'map'],
    ['modes', 'mode'],
    ['fixtures', 'fixture'],
  ] as const) {
    for (const [id, entity] of Object.entries(data[domain])) {
      yield {
        item: { name: entity.name, type },
        href: '/' + domain + '/' + encodeURIComponent(id),
        imageUrl: entity.imageUrl,
        fields: [entity.description, entity.detailedDescription],
        ...(domain === 'entities' ? { entityOwners: data.entities[id]?.owner } : {}),
        ...(domain === 'modes'
          ? { rules: [data.modes[id]?.rules, data.modes[id]?.detailedRules] }
          : {}),
      };
    }
  }
  for (const factionId of ['cat', 'mouse'] as const) {
    for (const [id, achievement] of Object.entries(data.achievements[factionId])) {
      yield {
        item: {
          name: achievement.name,
          type: 'achievement',
          factionId: achievement.factionId ?? factionId,
        },
        href: '/achievements/' + factionId + '/' + encodeURIComponent(id),
        imageUrl: achievement.imageUrl,
        fields: [achievement.description, achievement.detailedDescription],
      };
    }
  }
}

export function matchesReference(source: ReferenceSource, keywords: readonly string[]) {
  const matches = (text: string | undefined) =>
    text != null && keywords.some((keyword) => text.includes(keyword));
  return source.fields.some(matches) || source.rules?.some(matches);
}
