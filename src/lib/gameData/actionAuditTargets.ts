import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import {
  achievements,
  buffs,
  cards,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data/static';
import {
  achievementsEdit,
  buffsEdit,
  cardsEdit,
  characters,
  fixturesEdit,
  itemsEdit,
  mapsEdit,
  modesEdit,
  specialSkillsEdit,
} from '@/data/store';

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
} as const);

export const ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES = Object.freeze([] as const);

export type ActionAuditTargetRegistry = Record<string, Record<string, unknown>[]>;

type BaselineTargetRegistry = Record<PublishableEntityType, readonly Record<string, unknown>[]>;

const baselineTargets: BaselineTargetRegistry = {
  achievements: [
    achievements as unknown as Record<string, unknown>,
    achievementsEdit as unknown as Record<string, unknown>,
  ],
  characters: [characters as unknown as Record<string, unknown>],
  cards: [
    cards as unknown as Record<string, unknown>,
    cardsEdit as unknown as Record<string, unknown>,
  ],
  entities: [entities as unknown as Record<string, unknown>],
  buffs: [
    buffs as unknown as Record<string, unknown>,
    buffsEdit as unknown as Record<string, unknown>,
  ],
  items: [
    items as unknown as Record<string, unknown>,
    itemsEdit as unknown as Record<string, unknown>,
  ],
  fixtures: [
    fixtures as unknown as Record<string, unknown>,
    fixturesEdit as unknown as Record<string, unknown>,
  ],
  maps: [
    maps as unknown as Record<string, unknown>,
    mapsEdit as unknown as Record<string, unknown>,
  ],
  modes: [
    modes as unknown as Record<string, unknown>,
    modesEdit as unknown as Record<string, unknown>,
  ],
  specialSkills: [
    specialSkills as unknown as Record<string, unknown>,
    specialSkillsEdit as unknown as Record<string, unknown>,
  ],
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
