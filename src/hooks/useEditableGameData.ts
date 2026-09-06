'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { EditEntityRef } from '@/lib/edit/editSession';
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
  const subscribe = useCallback(
    (listener: () => void) =>
      editRuntime?.subscribe({ kind: 'domain', entityType }, listener) ?? (() => undefined),
    [editRuntime, entityType]
  );
  const getSnapshot = useCallback(
    () => editRuntime?.readDomain(entityType) ?? publishedFallback,
    [editRuntime, entityType, publishedFallback]
  );
  const draft = useSyncExternalStore(subscribe, getSnapshot, () => publishedFallback);

  const update = useCallback<EditableUpdate<EditStores[EntityType]>>(
    (mutate) => {
      if (!editRuntime) throw new Error(`Cannot edit ${entityType} because it is not loaded.`);
      editRuntime.updateDomain(entityType, mutate);
    },
    [editRuntime, entityType]
  );

  if (!editRuntime) return [publishedFallback, update];
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
  const sessionRef = useMemo(
    () =>
      ({
        entityType,
        entityId,
        ...(factionId ? { factionId } : {}),
      }) as EditEntityRef<EntityType>,
    [entityId, entityType, factionId]
  );
  const subscribe = useCallback(
    (listener: () => void) =>
      editRuntime?.subscribe({ kind: 'entity', entity: sessionRef }, listener) ?? (() => undefined),
    [editRuntime, sessionRef]
  );
  const getSnapshot = useCallback(
    () => editRuntime?.readEntity(sessionRef) ?? publishedFallback,
    [editRuntime, publishedFallback, sessionRef]
  );
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => publishedFallback
  ) as DeepReadonly<PublishedGameDataEntityByType[EntityType]> | null;
  const update = useCallback<EditableUpdate<PublishedGameDataEntityByType[EntityType]>>(
    (mutate) => {
      if (!editRuntime) {
        throw new Error(`Cannot edit ${entityType}.${entityId} because it is not loaded.`);
      }
      editRuntime.updateEntity(sessionRef, mutate);
    },
    [editRuntime, entityId, entityType, sessionRef]
  );

  return [value, update];
}
