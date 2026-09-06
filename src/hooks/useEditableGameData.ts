'use client';

import { useCallback } from 'react';

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

export type EditableUpdate<Value extends object> = (mutate: (value: Value) => void) => void;

type EditableResult<Value, MutableValue extends object> = readonly [
  Value,
  EditableUpdate<MutableValue>,
];

export type EditableEntityRef<EntityType extends PublishableEntityType> =
  EntityType extends FactionEntityType
    ? { entityType: EntityType; entityId: string; factionId: FactionId }
    : { entityType: EntityType; entityId: string; factionId?: never };

export function useEditableDomain<EntityType extends PublishableEntityType>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType]
): EditableResult<PublishedGameDataByType[EntityType], EditStores[EntityType]>;
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType] extends DeepReadonly<View>
    ? DeepReadonly<View>
    : never
): EditableResult<DeepReadonly<View>, EditStores[EntityType]>;
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: DeepReadonly<View>,
  projectDraft: (draft: PublishedGameDataByType[EntityType]) => DeepReadonly<View>
): EditableResult<DeepReadonly<View>, EditStores[EntityType]>;
export function useEditableDomain<EntityType extends PublishableEntityType, View>(
  entityType: EntityType,
  publishedFallback: PublishedGameDataByType[EntityType] | DeepReadonly<View>,
  projectDraft?: (draft: PublishedGameDataByType[EntityType]) => DeepReadonly<View>
): EditableResult<
  PublishedGameDataByType[EntityType] | DeepReadonly<View>,
  EditStores[EntityType]
> {
  const editRuntime = useDraftDataRuntime();
  const draft = useOptionalEditSnapshot<EditStores[EntityType]>(
    editRuntime?.stores[entityType],
    undefined
  );

  const update = useCallback<EditableUpdate<EditStores[EntityType]>>(
    (mutate) => {
      const domain = editRuntime?.stores[entityType];
      if (!domain) throw new Error(`Cannot edit ${entityType} because it is not loaded.`);
      mutate(domain);
    },
    [editRuntime, entityType]
  );

  if (!draft) return [publishedFallback, update];
  const publishedDraft = draft as PublishedGameDataByType[EntityType];
  return [projectDraft ? projectDraft(publishedDraft) : publishedDraft, update];
}

export function useEditableEntity<EntityType extends PublishableEntityType>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null
): EditableResult<
  DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null,
  PublishedGameDataEntityByType[EntityType]
>;
export function useEditableEntity<EntityType extends PublishableEntityType, View>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: PublishedGameDataEntityByType[EntityType] extends DeepReadonly<View>
    ? DeepReadonly<View>
    : never
): EditableResult<DeepReadonly<View>, PublishedGameDataEntityByType[EntityType]>;
export function useEditableEntity<EntityType extends PublishableEntityType>(
  ref: EditableEntityRef<EntityType>,
  publishedFallback: DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null
): EditableResult<
  DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null,
  PublishedGameDataEntityByType[EntityType]
> {
  const editRuntime = useDraftDataRuntime();
  const { entityType, entityId } = ref;
  const factionId = 'factionId' in ref ? ref.factionId : undefined;
  const domain = editRuntime?.stores[entityType];
  const draft = domain
    ? factionId
      ? (domain as EditStores[FactionEntityType])[factionId]?.[entityId]
      : (domain as Exclude<EditStores[EntityType], EditStores[FactionEntityType]>)[entityId]
    : undefined;

  const value = useOptionalEditSnapshot(draft, publishedFallback) as DeepReadonly<
    PublishedGameDataEntityByType[EntityType]
  > | null;
  const update = useCallback<EditableUpdate<PublishedGameDataEntityByType[EntityType]>>(
    (mutate) => {
      const currentDomain = editRuntime?.stores[entityType];
      const current = currentDomain
        ? factionId
          ? (currentDomain as EditStores[FactionEntityType])[factionId]?.[entityId]
          : (currentDomain as Exclude<EditStores[EntityType], EditStores[FactionEntityType]>)[
              entityId
            ]
        : undefined;
      if (!current) {
        throw new Error(`Cannot edit ${entityType}.${entityId} because it is not loaded.`);
      }
      mutate(current as PublishedGameDataEntityByType[EntityType]);
    },
    [editRuntime, entityId, entityType, factionId]
  );

  return [value, update];
}
