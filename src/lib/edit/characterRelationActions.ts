import { getCharacterRelationKey } from '@/data/characterRelations';
import type {
  CharacterRelationTrait,
  SingleItem,
  SingleItemTypeName,
  TraitRelationKind,
} from '@/data/types';

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
const SINGLE_ITEM_TYPE_SET = new Set<SingleItemTypeName>([
  'character',
  'skill',
  'knowledgeCard',
  'specialSkill',
  'item',
  'entity',
  'buff',
  'map',
  'fixture',
  'mode',
  'achievement',
]);

const getExpectedTargetType = (kind: TraitRelationKind): SingleItemTypeName => {
  switch (kind) {
    case 'counters':
    case 'counteredBy':
    case 'counterEachOther':
    case 'collaborators':
      return 'character';
    case 'countersKnowledgeCards':
    case 'counteredByKnowledgeCards':
      return 'knowledgeCard';
    case 'countersSpecialSkills':
    case 'counteredBySpecialSkills':
      return 'specialSkill';
    case 'advantageMaps':
    case 'disadvantageMaps':
      return 'map';
    case 'advantageModes':
    case 'disadvantageModes':
      return 'mode';
  }
};

export const isCharacterRelationKind = (value: string): value is TraitRelationKind =>
  CHARACTER_RELATION_KIND_SET.has(value as TraitRelationKind);

const isSingleItem = (value: unknown): value is SingleItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SingleItem>;
  return (
    typeof item.name === 'string' &&
    typeof item.type === 'string' &&
    SINGLE_ITEM_TYPE_SET.has(item.type as SingleItemTypeName) &&
    (item.factionId === undefined || item.factionId === 'cat' || item.factionId === 'mouse')
  );
};

export const isCharacterRelationTrait = (value: unknown): value is CharacterRelationTrait => {
  if (!value || typeof value !== 'object') return false;
  const trait = value as Partial<CharacterRelationTrait>;
  if (typeof trait.description !== 'string' || !trait.relation) return false;

  const relation = trait.relation;
  return (
    typeof relation.kind === 'string' &&
    isCharacterRelationKind(relation.kind) &&
    isSingleItem(relation.subject) &&
    relation.subject.type === 'character' &&
    isSingleItem(relation.target) &&
    relation.target.type === getExpectedTargetType(relation.kind) &&
    (relation.description === undefined || typeof relation.description === 'string') &&
    (relation.isMinor === undefined || typeof relation.isMinor === 'boolean')
  );
};

const getActionTrait = (action: Action): CharacterRelationTrait | null => {
  if (isCharacterRelationTrait(action.newValue)) return action.newValue;
  if (isCharacterRelationTrait(action.oldValue)) return action.oldValue;
  return null;
};

export const isCharacterRelationAction = (action: Action): boolean => {
  const trait = getActionTrait(action);
  return !!trait && action.path === getCharacterRelationKey(trait);
};

export const getCharacterRelationActionCharacterIds = (action: Action): string[] => {
  const ids = new Set<string>();
  [action.oldValue, action.newValue].forEach((value) => {
    if (!isCharacterRelationTrait(value)) return;
    if (value.relation.subject.type === 'character') ids.add(value.relation.subject.name);
    if (value.relation.target.type === 'character') ids.add(value.relation.target.name);
  });
  return [...ids];
};

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
