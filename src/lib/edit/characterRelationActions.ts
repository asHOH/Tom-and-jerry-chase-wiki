import type { TraitRelationKind } from '@/data/types';

import type { Action, ActionHistoryEntry } from './diffUtils';

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
  parseCharacterRelationActionPath(action.path) !== null;

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
