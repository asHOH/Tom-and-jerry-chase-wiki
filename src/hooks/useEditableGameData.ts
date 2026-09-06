'use client';

import type { DeepReadonly } from '@/types/deep-readonly';
import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { EditStores } from '@/lib/edit/editStores';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type {
  PublishedGameDataByType,
  PublishedGameDataEntityByType,
} from '@/lib/gameData/published/types';
import type { FactionId } from '@/data/types';

import { useDraftDataRuntime } from './useDraftDataRuntime';

type FactionEntityType = 'achievements' | 'specialSkills';

export type EditableEntityRef<EntityType extends PublishableEntityType> =
  EntityType extends FactionEntityType
    ? { entityType: EntityType; entityId: string; factionId: FactionId }
    : { entityType: EntityType; entityId: string; factionId?: never };

export function useEditableDomain<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType]
): PublishedGameDataByType[EntityType];
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType] extends DeepReadonly<View>
    ? DeepReadonly<View>
    : never
): DeepReadonly<View>;
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: DeepReadonly<View>,
  projectDraft: (draft: PublishedGameDataByType[EntityType]) => DeepReadonly<View>
): DeepReadonly<View>;
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType] | DeepReadonly<View>,
  projectDraft?: (draft: PublishedGameDataByType[EntityType]) => DeepReadonly<View>
): PublishedGameDataByType[EntityType] | DeepReadonly<View> {
  const editRuntime = useDraftDataRuntime();
  const draft = useOptionalEditSnapshot<EditStores[EntityType]>(
    editRuntime?.stores[entityType],
    undefined
  );

  if (!draft) return publishedFallback;
  const publishedDraft = draft as PublishedGameDataByType[EntityType];
  return projectDraft ? projectDraft(publishedDraft) : publishedDraft;
}

export function useEditableEntity<EntityType extends PublishableEntityType>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null
): DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null;
export function useEditableEntity<EntityType extends PublishableEntityType, View>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: PublishedGameDataEntityByType[EntityType] extends DeepReadonly<View>
    ? DeepReadonly<View>
    : never
): DeepReadonly<View>;
export function useEditableEntity<EntityType extends PublishableEntityType>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null
): DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null {
  const editRuntime = useDraftDataRuntime();
  const domain = editRuntime?.stores[ref.entityType];
  const draft = domain
    ? 'factionId' in ref && ref.factionId
      ? (domain as EditStores[FactionEntityType])[ref.factionId][ref.entityId]
      : (domain as Exclude<EditStores[EntityType], EditStores[FactionEntityType]>)[ref.entityId]
    : undefined;

  return useOptionalEditSnapshot(draft, publishedFallback) as DeepReadonly<
    PublishedGameDataEntityByType[EntityType]
  > | null;
}
