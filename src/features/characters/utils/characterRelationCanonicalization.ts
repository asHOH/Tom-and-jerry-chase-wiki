import type { CharacterRelationItem, FactionId, TraitRelationKind } from '../../../data/types';
import { catCharacterDefinitions } from '../data/catCharacters';
import { mouseCharacterDefinitions } from '../data/mouseCharacters';

export type CanonicalStoredCharacterRelationKind = Exclude<TraitRelationKind, 'counteredBy'>;

export type CanonicalRelationStorageLocation = {
  ownerId: string;
  kind: CanonicalStoredCharacterRelationKind;
  targetId: string;
};

export type CanonicalRelationMergeInput = Pick<CharacterRelationItem, 'description' | 'isMinor'>;

const mouseCharacterIds = Object.keys(mouseCharacterDefinitions);
const catCharacterIds = Object.keys(catCharacterDefinitions);

export const characterDisplayOrder = [...mouseCharacterIds, ...catCharacterIds];

const mouseCharacterIdSet = new Set(mouseCharacterIds);
const catCharacterIdSet = new Set(catCharacterIds);

const characterDisplayRankMap = new Map(
  characterDisplayOrder.map((characterId, index) => [characterId, index] as const)
);

export const getCharacterFaction = (characterId: string): FactionId | undefined => {
  if (mouseCharacterIdSet.has(characterId)) return 'mouse';
  if (catCharacterIdSet.has(characterId)) return 'cat';
  return undefined;
};

export const getCharacterDisplayRank = (characterId: string): number =>
  characterDisplayRankMap.get(characterId) ?? Number.MAX_SAFE_INTEGER;

export const getCanonicalCollaboratorOwner = (leftId: string, rightId: string): string =>
  getCharacterDisplayRank(leftId) <= getCharacterDisplayRank(rightId) ? leftId : rightId;

export const getCanonicalCounterEachOtherOwner = (
  leftId: string,
  rightId: string
): string | null => {
  const leftFaction = getCharacterFaction(leftId);
  const rightFaction = getCharacterFaction(rightId);

  if (!leftFaction || !rightFaction || leftFaction === rightFaction) {
    return null;
  }

  return leftFaction === 'mouse' ? leftId : rightId;
};

export const getCanonicalCharacterRelationStorageLocation = (
  subjectId: string,
  kind: TraitRelationKind,
  targetId: string
): CanonicalRelationStorageLocation | null => {
  switch (kind) {
    case 'counteredBy':
      return {
        ownerId: targetId,
        kind: 'counters',
        targetId: subjectId,
      };
    case 'collaborators':
      return {
        ownerId: getCanonicalCollaboratorOwner(subjectId, targetId),
        kind,
        targetId:
          getCanonicalCollaboratorOwner(subjectId, targetId) === subjectId ? targetId : subjectId,
      };
    case 'counterEachOther': {
      const ownerId = getCanonicalCounterEachOtherOwner(subjectId, targetId);
      if (!ownerId) return null;
      return {
        ownerId,
        kind,
        targetId: ownerId === subjectId ? targetId : subjectId,
      };
    }
    default:
      return {
        ownerId: subjectId,
        kind: kind as CanonicalStoredCharacterRelationKind,
        targetId,
      };
  }
};

export const mergeCanonicalRelationEntries = (
  current: CanonicalRelationMergeInput,
  incoming: CanonicalRelationMergeInput
):
  | {
      merged: CharacterRelationItem;
      conflict: null;
    }
  | {
      merged: null;
      conflict: {
        currentDescription: string;
        incomingDescription: string;
      };
    } => {
  const currentDescription = current.description?.trim() ?? '';
  const incomingDescription = incoming.description?.trim() ?? '';

  if (currentDescription && incomingDescription && currentDescription !== incomingDescription) {
    return {
      merged: null,
      conflict: {
        currentDescription,
        incomingDescription,
      },
    };
  }

  return {
    merged: {
      id: '',
      description: currentDescription || incomingDescription,
      isMinor: !!current.isMinor && !!incoming.isMinor,
    },
    conflict: null,
  };
};
