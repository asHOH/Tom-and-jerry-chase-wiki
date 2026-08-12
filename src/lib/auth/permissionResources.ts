import 'server-only';

import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
  traits,
} from '@/data';

export type PermissionResourceOption = { id: string; label: string };

const LIST_PAGE_IDS = [
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'cards',
  'special-skills',
  'characters',
];

const toOptions = (record: Record<string, unknown>): PermissionResourceOption[] =>
  Object.entries(record).map(([id, value]) => {
    const item = value as { id?: string; name?: string };
    return { id, label: item.name ?? item.id ?? id };
  });

const specialSkillOptions = Object.entries(specialSkills).flatMap(([faction, skills]) =>
  toOptions(skills as Record<string, unknown>).map((option) => ({
    id: `${faction}.${option.id}`,
    label: option.label,
  }))
);

const achievementOptions = Object.entries(achievements).flatMap(([faction, entries]) =>
  toOptions(entries as Record<string, unknown>).map((option) => ({
    id: `${faction}.${option.id}`,
    label: option.label,
  }))
);

const staticOptions: Record<string, PermissionResourceOption[]> = {
  characters: toOptions(characters),
  cards: toOptions(cards),
  knowledge_cards: toOptions(cards),
  entities: toOptions(entities),
  items: toOptions(items),
  buffs: toOptions(buffs),
  maps: toOptions(maps),
  fixtures: toOptions(fixtures),
  modes: toOptions(modes),
  achievements: achievementOptions,
  specialSkills: specialSkillOptions.map((option) => ({
    id: option.id.slice(option.id.indexOf('.') + 1),
    label: option.label,
  })),
  traits: toOptions(traits),
  special_skills: specialSkillOptions,
  list_pages: LIST_PAGE_IDS.map((id) => ({ id, label: id })),
};

export const getStaticPermissionResourceOptions = (
  resourceType: string
): PermissionResourceOption[] | null => {
  const normalizedType = resourceType.startsWith('comments/')
    ? resourceType.slice('comments/'.length)
    : resourceType;
  return staticOptions[normalizedType] ?? null;
};

export const isKnownStaticPermissionResource = (
  resourceType: string,
  resourceId: string
): boolean | null => {
  const options = getStaticPermissionResourceOptions(resourceType);
  if (!options) return null;
  return options.some((option) => option.id === resourceId);
};

export const getAllStaticPermissionResourceOptions = () =>
  Object.fromEntries(
    Object.entries(staticOptions).flatMap(([resourceType, options]) => [
      [resourceType, options],
      [`comments/${resourceType}`, options],
    ])
  );
