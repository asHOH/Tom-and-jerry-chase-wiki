import isEqual from 'lodash-es/isEqual';

import { parseActionPath } from '@/lib/gameData/actionPath';
import { cloneGameDataValue } from '@/lib/gameData/cloneGameDataValue';
import type { TraitRelationKind } from '@/data/types';
import {
  CHARACTER_RELATION_PAIR_FIELD,
  parseCharacterRelationPairPath,
} from '@/features/characters/utils/characterRelationPairs';

import { normalizeActionHistory, type Action, type ActionHistoryEntry } from './diffUtils';

export const CHARACTER_RELATION_KINDS = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
] as const satisfies readonly TraitRelationKind[];

const CHARACTER_RELATION_KIND_SET = new Set<TraitRelationKind>(CHARACTER_RELATION_KINDS);

export type CharacterRelationActionPath = {
  characterId: string;
  relationKind: TraitRelationKind;
  rest: string[];
};

export const isCharacterRelationKind = (value: string): value is TraitRelationKind =>
  CHARACTER_RELATION_KIND_SET.has(value as TraitRelationKind);

export const parseCharacterRelationActionPath = (
  path: string
): CharacterRelationActionPath | null => {
  const segments = path.split('.').filter(Boolean);
  const characterId = segments[0];
  const relationKind = segments[1];

  if (!characterId || !relationKind || !isCharacterRelationKind(relationKind)) {
    return null;
  }

  return {
    characterId,
    relationKind,
    rest: segments.slice(2),
  };
};

export const isCharacterRelationAction = (action: Action): boolean =>
  parseCharacterRelationActionPath(action.path) !== null ||
  action.path.split('.')[1] === CHARACTER_RELATION_PAIR_FIELD;

const isRelationMap = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function clonePairAction(action: Action): Action {
  const oldValue = cloneGameDataValue(action.oldValue);
  const newValue = cloneGameDataValue(action.newValue);
  if (!oldValue.success || !newValue.success) {
    throw new TypeError('Cannot record character relation values.');
  }
  return {
    ...action,
    ...(action.oldValue === undefined ? {} : { oldValue: oldValue.value }),
    ...(action.newValue === undefined ? {} : { newValue: newValue.value }),
  };
}

/** Keep shared pairs independent when an editor initializes or replaces their containing map. */
export function normalizeCharacterRelationPairHistory(
  history: readonly ActionHistoryEntry[]
): ActionHistoryEntry[] {
  return normalizeActionHistory(
    history.map((entry) => {
      const actions = Array.isArray(entry) ? entry : [entry];
      if (!actions.some((action) => action.path.split('.')[1] === CHARACTER_RELATION_PAIR_FIELD)) {
        return entry;
      }
      const normalized = actions.flatMap((action): Action[] => {
        const [ownerId, field, ...rest] = action.path.split('.');
        if (!ownerId || field !== CHARACTER_RELATION_PAIR_FIELD) return [action];
        if (parseCharacterRelationPairPath(action.path)) return [clonePairAction(action)];
        if (
          rest.length > 0 ||
          (action.oldValue !== undefined && !isRelationMap(action.oldValue)) ||
          (action.newValue !== undefined && !isRelationMap(action.newValue))
        ) {
          return [action];
        }

        const oldMap = (action.oldValue ?? {}) as Record<string, unknown>;
        const newMap = (action.newValue ?? {}) as Record<string, unknown>;
        const targets = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
        // Preserve malformed drafts for validation instead of interpreting IDs as paths.
        if (
          [...targets].some(
            (id) => !id || id.includes('.') || !parseActionPath(`${ownerId}.${field}.${id}`).success
          )
        )
          return [action];

        return [...targets].flatMap((otherId) => {
          const oldValue = Object.hasOwn(oldMap, otherId) ? oldMap[otherId] : undefined;
          const newValue = Object.hasOwn(newMap, otherId) ? newMap[otherId] : undefined;
          if (isEqual(oldValue, newValue)) return [];
          return [
            clonePairAction({
              op: newValue === undefined ? 'delete' : 'set',
              path: `${ownerId}.${field}.${otherId}`,
              oldValue,
              newValue,
            }),
          ];
        });
      });
      return normalized.length === 1 ? normalized[0]! : normalized;
    })
  );
}

export const splitCharacterRelationActionHistory = (
  history: readonly ActionHistoryEntry[]
): {
  matching: Action[];
  remaining: Action[];
} => {
  const matching: Action[] = [];
  const remaining: Action[] = [];

  for (const entry of history) {
    const actions = Array.isArray(entry) ? entry : [entry];
    for (const action of actions) {
      if (isCharacterRelationAction(action)) {
        matching.push(action);
      } else {
        remaining.push(action);
      }
    }
  }

  return { matching, remaining };
};
