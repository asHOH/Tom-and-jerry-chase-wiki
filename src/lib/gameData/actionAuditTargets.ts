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

export const ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES = Object.freeze([] as const);

export type ActionAuditTargetRegistry = Record<string, Record<string, unknown>[]>;

const baselineTargets = {
  achievements,
  characters,
  cards,
  entities,
  buffs,
  items,
  fixtures,
  maps,
  modes,
  specialSkills,
  traits,
} satisfies Record<PublishableEntityType, object>;

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
    Object.entries(baselineTargets).map(([entityType, source]) => [
      entityType,
      [cloneTarget(entityType, 0, source)],
    ])
  );
}
