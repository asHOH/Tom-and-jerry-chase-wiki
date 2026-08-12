import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
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
} from '@/data/static';

import { cloneGameDataValue } from './cloneGameDataValue';

export const ACTION_AUDIT_TARGET_COUNTS = Object.freeze({
  achievements: 2,
  characters: 1,
  cards: 2,
  entities: 1,
  buffs: 2,
  items: 2,
  fixtures: 2,
  maps: 2,
  modes: 2,
  specialSkills: 2,
  traits: 1,
} as const);

export const ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES = Object.freeze([] as const);

export type ActionAuditTargetRegistry = Record<string, Record<string, unknown>[]>;

type BaselineTargetRegistry = Record<PublishableEntityType, readonly Record<string, unknown>[]>;

const baselineTargets: BaselineTargetRegistry = {
  achievements: [
    achievements as unknown as Record<string, unknown>,
    achievements as unknown as Record<string, unknown>,
  ],
  characters: [characters as unknown as Record<string, unknown>],
  cards: [cards as unknown as Record<string, unknown>, cards as unknown as Record<string, unknown>],
  entities: [entities as unknown as Record<string, unknown>],
  buffs: [buffs as unknown as Record<string, unknown>, buffs as unknown as Record<string, unknown>],
  items: [items as unknown as Record<string, unknown>, items as unknown as Record<string, unknown>],
  fixtures: [
    fixtures as unknown as Record<string, unknown>,
    fixtures as unknown as Record<string, unknown>,
  ],
  maps: [maps as unknown as Record<string, unknown>, maps as unknown as Record<string, unknown>],
  modes: [modes as unknown as Record<string, unknown>, modes as unknown as Record<string, unknown>],
  specialSkills: [
    specialSkills as unknown as Record<string, unknown>,
    specialSkills as unknown as Record<string, unknown>,
  ],
  traits: [traits as unknown as Record<string, unknown>],
};

export class ActionAuditTargetCloneError extends Error {
  readonly detail: {
    code: 'clone_failed';
    entityType: string;
    targetIndex: number;
  };

  constructor(entityType: string, targetIndex: number) {
    super(`Failed to clone audit baseline target ${entityType}[${targetIndex}]`);
    this.name = 'ActionAuditTargetCloneError';
    this.detail = Object.freeze({ code: 'clone_failed', entityType, targetIndex });
  }
}

function cloneTarget(
  entityType: string,
  targetIndex: number,
  source: unknown
): Record<string, unknown> {
  const cloned = cloneGameDataValue(source);
  if (
    !cloned.success ||
    cloned.value === null ||
    typeof cloned.value !== 'object' ||
    Array.isArray(cloned.value)
  ) {
    throw new ActionAuditTargetCloneError(entityType, targetIndex);
  }

  return cloned.value as Record<string, unknown>;
}

export function createActionAuditTargetRegistry(): ActionAuditTargetRegistry {
  return Object.fromEntries(
    Object.entries(baselineTargets).map(([entityType, sources]) => [
      entityType,
      sources.map((source, targetIndex) => cloneTarget(entityType, targetIndex, source)),
    ])
  );
}
