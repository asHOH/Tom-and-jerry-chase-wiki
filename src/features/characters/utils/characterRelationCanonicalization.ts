import type { CharacterRelationItem, FactionId, TraitRelationKind } from '../../../data/types';
import { getCharacterDisplayRankById, getCharacterFactionById } from '../data/characterMetadata';

export type CanonicalStoredCharacterRelationKind = Exclude<TraitRelationKind, 'counteredBy'>;

export type CanonicalRelationStorageLocation = {
  ownerId: string;
  kind: CanonicalStoredCharacterRelationKind;
  targetId: string;
};

export type CanonicalRelationMergeInput = Pick<CharacterRelationItem, 'description' | 'isMinor'>;

export const getCharacterFaction = (characterId: string): FactionId | undefined => {
  return getCharacterFactionById(characterId);
};

export const getCharacterDisplayRank = (characterId: string): number =>
  getCharacterDisplayRankById(characterId);

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
