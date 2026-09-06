'use client';

import { useCallback } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { getNestedProperty, handleCharacterIdChange, setNestedProperty } from '@/lib/editUtils';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import {
  useEditableEntity,
  type EditableEntityRef,
  type EditableUpdate,
} from '@/hooks/useEditableGameData';
import {
  useLocalAchievement,
  useLocalBuff,
  useLocalCard,
  useLocalCharacter,
  useLocalEntity,
  useLocalFixture,
  useLocalItem,
  useLocalMap,
  useLocalMode,
  useLocalSpecialSkill,
} from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import type { FactionId } from '@/data/types';

import type { EditableScope } from './editableTypes';

type EditableRecordScope = Exclude<EditableScope, 'characters' | 'cards'>;

type EditableStoreAdapter = {
  actionPath: string;
  readStoredValue: () => string | number | undefined;
  writeValue: (value: string | number | undefined) => void;
};

type RecordRouteKeys = {
  entityName: string;
  achievementName: string;
  buffName: string;
  itemName: string;
  fixtureName: string;
  mapName: string;
  modeName: string;
  factionId: string;
  skillId: string;
};

type RecordTarget = {
  pathPrefix: string;
  ref: EditableEntityRef<EditableRecordScope>;
};

const emptyObject: DeepReadonly<Record<string, unknown>> = {};

function getRecordTarget(scope: EditableRecordScope, routeKeys: RecordRouteKeys): RecordTarget {
  switch (scope) {
    case 'entities':
      return {
        pathPrefix: routeKeys.entityName,
        ref: { entityType: scope, entityId: routeKeys.entityName },
      };
    case 'achievements':
      return {
        pathPrefix:
          routeKeys.factionId && routeKeys.achievementName
            ? `${routeKeys.factionId}.${routeKeys.achievementName}`
            : '',
        ref: {
          entityType: scope,
          entityId: routeKeys.achievementName,
          factionId: routeKeys.factionId as FactionId,
        },
      };
    case 'buffs':
      return {
        pathPrefix: routeKeys.buffName,
        ref: { entityType: scope, entityId: routeKeys.buffName },
      };
    case 'items':
      return {
        pathPrefix: routeKeys.itemName,
        ref: { entityType: scope, entityId: routeKeys.itemName },
      };
    case 'fixtures':
      return {
        pathPrefix: routeKeys.fixtureName,
        ref: { entityType: scope, entityId: routeKeys.fixtureName },
      };
    case 'maps':
      return {
        pathPrefix: routeKeys.mapName,
        ref: { entityType: scope, entityId: routeKeys.mapName },
      };
    case 'modes':
      return {
        pathPrefix: routeKeys.modeName,
        ref: { entityType: scope, entityId: routeKeys.modeName },
      };
    case 'specialSkills':
      return {
        pathPrefix:
          routeKeys.factionId && routeKeys.skillId
            ? `${routeKeys.factionId}.${routeKeys.skillId}`
            : '',
        ref: {
          entityType: scope,
          entityId: routeKeys.skillId,
          factionId: routeKeys.factionId as FactionId,
        },
      };
  }
}

function useRecord(
  ref: EditableEntityRef<PublishableEntityType>
): readonly [
  DeepReadonly<Record<string, unknown>> | null,
  EditableUpdate<Record<string, unknown>>,
] {
  return useEditableEntity(ref, null) as unknown as readonly [
    DeepReadonly<Record<string, unknown>> | null,
    EditableUpdate<Record<string, unknown>>,
  ];
}

function getActionPath(pathPrefix: string, path: string): string {
  return [pathPrefix, path].filter(Boolean).join('.');
}

export function useEditableCharactersAdapter(
  path: string,
  factionId?: string | undefined
): EditableStoreAdapter {
  const { characterId } = useLocalCharacter();
  const [character, updateCharacter] = useRecord({
    entityType: 'characters',
    entityId: characterId,
  });
  const { handleSelectCharacter } = useAppContext();
  const pathPrefix = typeof character?.id === 'string' ? character.id : characterId;

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(character ?? emptyObject, path),
    [character, path]
  );

  const writeValue = useCallback(
    (value: string | number | undefined) => {
      if (path === 'id') {
        const rawFactionId = character?.factionId;
        const resolvedFactionId =
          factionId === 'cat' || factionId === 'mouse'
            ? factionId
            : rawFactionId === 'cat' || rawFactionId === 'mouse'
              ? rawFactionId
              : undefined;
        if (!resolvedFactionId) {
          throw new Error(`Cannot edit characters.id because "${pathPrefix}" has no faction.`);
        }

        handleCharacterIdChange(
          pathPrefix,
          String(value),
          resolvedFactionId,
          handleSelectCharacter,
          true
        );
        return;
      }

      updateCharacter((record) => setNestedProperty(record, path, value));
    },
    [character?.factionId, factionId, handleSelectCharacter, path, pathPrefix, updateCharacter]
  );

  return { actionPath: getActionPath(pathPrefix, path), readStoredValue, writeValue };
}

export function useEditableCardsAdapter(path: string): EditableStoreAdapter {
  const { cardId } = useLocalCard();
  const [card, updateCard] = useRecord({ entityType: 'cards', entityId: cardId });

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(card ?? emptyObject, path),
    [card, path]
  );

  const writeValue = useCallback(
    (value: string | number | undefined) => {
      if (path === 'id') {
        throw new Error('Editing knowledge card id is not supported in local edit mode.');
      }
      updateCard((record) => setNestedProperty(record, path, value));
    },
    [path, updateCard]
  );

  return { actionPath: getActionPath(cardId, path), readStoredValue, writeValue };
}

export function useEditableRecordAdapter(
  scope: EditableRecordScope,
  path: string
): EditableStoreAdapter {
  const { entityName } = useLocalEntity();
  const { achievementName } = useLocalAchievement();
  const { buffName } = useLocalBuff();
  const { itemName } = useLocalItem();
  const { fixtureName } = useLocalFixture();
  const { mapName } = useLocalMap();
  const { modeName } = useLocalMode();
  const { factionId, skillId } = useLocalSpecialSkill();
  const target = getRecordTarget(scope, {
    entityName,
    achievementName,
    buffName,
    itemName,
    fixtureName,
    mapName,
    modeName,
    factionId,
    skillId,
  });
  const [record, updateRecord] = useRecord(target.ref);

  const readStoredValue = useCallback(
    (): string | number | undefined => getNestedProperty(record ?? emptyObject, path),
    [path, record]
  );

  const writeValue = useCallback(
    (value: string | number | undefined) => {
      if (path === 'name' || path === 'id') {
        throw new Error(`Editing ${path} is not supported for ${scope} in local edit mode.`);
      }
      updateRecord((current) => setNestedProperty(current, path, value));
    },
    [path, scope, updateRecord]
  );

  return {
    actionPath: getActionPath(target.pathPrefix, path),
    readStoredValue,
    writeValue,
  };
}
