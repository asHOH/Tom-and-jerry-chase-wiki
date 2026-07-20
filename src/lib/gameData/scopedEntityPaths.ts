import type { FactionId } from '@/data/types';

export type FactionScopedGameDataEntityType = 'specialSkills' | 'achievements';

export type GameDataActionTarget = {
  entityId: string;
  factionId?: FactionId;
  pathParts: string[];
};

export function isFactionScopedGameDataEntityType(
  entityType: string
): entityType is FactionScopedGameDataEntityType {
  return entityType === 'specialSkills' || entityType === 'achievements';
}

/**
 * Resolves the record addressed by an action path.
 * Faction-scoped domains use `factionId.entityId.field`, while other domains
 * use `entityId.field`.
 */
export function getGameDataActionTarget(
  entityType: string,
  path: string
): GameDataActionTarget | undefined {
  const pathParts = path.split('.').filter(Boolean);
  if (pathParts.length === 0) return undefined;

  if (isFactionScopedGameDataEntityType(entityType)) {
    const factionId = pathParts[0];
    const entityId = pathParts[1];
    if ((factionId !== 'cat' && factionId !== 'mouse') || !entityId) return undefined;

    return { entityId, factionId, pathParts };
  }

  const entityId = pathParts[0];
  return entityId ? { entityId, pathParts } : undefined;
}

export function getGameDataActionEntityKey(entityType: string, path: string): string | undefined {
  const target = getGameDataActionTarget(entityType, path);
  if (!target) return undefined;
  return target.factionId ? `${target.factionId}.${target.entityId}` : target.entityId;
}
