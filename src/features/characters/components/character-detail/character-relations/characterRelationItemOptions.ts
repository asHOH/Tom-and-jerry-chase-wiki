import type { TraitRelationKind } from '@/data/types';

import type { RelationItemOptions } from './characterRelationViewModel';

type CreateEditableRelationItemOptionsParams = {
  characterId: string;
  relationKind: TraitRelationKind;
  getDescriptionPath: (relationKind: TraitRelationKind, index: number) => string | undefined;
  onToggleMinor: (characterId: string, relationKind: TraitRelationKind, itemId: string) => void;
  onRemove: (characterId: string, relationKind: TraitRelationKind, itemId: string) => void;
  onUpdateDescription: (
    characterId: string,
    relationKind: TraitRelationKind,
    itemId: string,
    description: string
  ) => void;
};

export const createEditableRelationItemOptions = ({
  characterId,
  relationKind,
  getDescriptionPath,
  onToggleMinor,
  onRemove,
  onUpdateDescription,
}: CreateEditableRelationItemOptionsParams): RelationItemOptions => ({
  relationKind,
  isEditable: true,
  getDescriptionPath: (index) => getDescriptionPath(relationKind, index),
  onToggleMinor: (itemId) => onToggleMinor(characterId, relationKind, itemId),
  onRemove: (itemId) => onRemove(characterId, relationKind, itemId),
  onUpdateDescription: (itemId, description) =>
    onUpdateDescription(characterId, relationKind, itemId, description),
});
