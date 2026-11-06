import type { DeepReadonly } from '@/types/deep-readonly';
import { resolveEntityFaction } from '@/lib/itemFaction';
import type { Entity, FactionId } from '@/data/types';
import { achievements, cards, characters, entities, items, specialSkills } from '@/data';

const factionCache = new Map<string, FactionId | undefined>();

export default function getEntityFactionId(
  entity: DeepReadonly<Entity>,
  visitedSet = new Set<string>(),
  cache = factionCache
): FactionId | undefined {
  return resolveEntityFaction(
    entity,
    { characters, cards, entities, achievements, items, specialSkills },
    visitedSet,
    cache
  );
}
