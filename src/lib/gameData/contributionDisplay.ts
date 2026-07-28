import type { Route } from 'next';

import type { FactionId } from '@/data/types';

import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';
import { getGameDataActionTarget } from './scopedEntityPaths';

export type AffectedGameDataName = {
  name: string;
  factionId?: FactionId;
};

const GAME_DATA_ROUTES: Record<string, string> = {
  achievements: '/achievements',
  buffs: '/buffs',
  cards: '/cards',
  characters: '/characters',
  entities: '/entities',
  fixtures: '/fixtures',
  items: '/items',
  maps: '/maps',
  modes: '/modes',
  specialSkills: '/special-skills',
};

export function getAffectedGameDataNames(
  entityType: string,
  rawEntry: unknown
): AffectedGameDataName[] {
  const entries = normalizePublicActionEntries(rawEntry);
  const names = new Map<string, AffectedGameDataName>();

  for (const action of flattenActionEntries(entries)) {
    const target = getGameDataActionTarget(entityType, action.path);
    if (!target) continue;

    const key = target.factionId ? `${target.factionId}:${target.entityId}` : target.entityId;
    if (!names.has(key)) {
      names.set(key, {
        name: target.entityId,
        ...(target.factionId && { factionId: target.factionId }),
      });
    }
  }

  return [...names.values()];
}

export function getGameDataDetailHref(
  entityType: string,
  target: AffectedGameDataName | undefined
): Route | null {
  const route = GAME_DATA_ROUTES[entityType];
  if (!route || !target) return null;

  if (target.factionId) {
    return `${route}/${encodeURIComponent(target.factionId)}/${encodeURIComponent(target.name)}` as Route;
  }

  return `${route}/${encodeURIComponent(target.name)}` as Route;
}
