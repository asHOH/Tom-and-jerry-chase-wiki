export const PUBLISHABLE_ENTITY_TYPES = Object.freeze([
  'characters',
  'cards',
  'entities',
  'buffs',
  'items',
  'fixtures',
  'maps',
  'modes',
  'specialSkills',
  'achievements',
] as const);

export type PublishableEntityType = (typeof PUBLISHABLE_ENTITY_TYPES)[number];

const publishableEntityTypeSet: ReadonlySet<string> = new Set(PUBLISHABLE_ENTITY_TYPES);

export function isPublishableEntityType(value: string): value is PublishableEntityType {
  return publishableEntityTypeSet.has(value);
}
