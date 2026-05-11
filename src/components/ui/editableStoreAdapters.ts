'use client';

import { useCallback, useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { getNestedProperty, handleCharacterIdChange, setNestedProperty } from '@/lib/editUtils';
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
import {
  achievementsEdit,
  buffsEdit,
  cardsEdit,
  characters,
  entitiesEdit,
  fixturesEdit,
  itemsEdit,
  mapsEdit,
  modesEdit,
  specialSkillsEdit,
} from '@/data/store';

import type { EditableScope } from './editableTypes';

type EditableRecordScope = Exclude<EditableScope, 'characters' | 'cards'>;

type EditableStoreAdapter = {
  readStoredValue: () => string | number | undefined;
  writeValue: (value: string | number) => void;
};

type EditableWriteTarget = {
  entityId: string;
  root: Record<string, unknown>;
  pathPrefix: string;
  record: Record<string, unknown> | undefined;
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

const emptyObject = proxy({});

function createMissingEditableTargetError(
  scope: EditableScope,
  entityId: string,
  path: string
): Error {
  return new Error(`Cannot edit ${scope}.${path} because "${entityId}" is not loaded.`);
}

function assertEditableTargetLoaded(
  scope: EditableScope,
  target: EditableWriteTarget,
  path: string
): asserts target is EditableWriteTarget & { record: Record<string, unknown> } {
  if (!target.entityId || !target.record) {
    throw createMissingEditableTargetError(scope, target.entityId || '<unknown>', path);
  }
}

function getCharacterWriteTarget(characterId: string): EditableWriteTarget {
  const record = characters[characterId] as unknown as Record<string, unknown> | undefined;
  return {
    entityId: characterId,
    root: characters as unknown as Record<string, unknown>,
    pathPrefix: record?.id ? String(record.id) : characterId,
    record,
  };
}

function getCardsWriteTarget(cardId: string): EditableWriteTarget {
  return {
    entityId: cardId,
    root: cardsEdit as unknown as Record<string, unknown>,
    pathPrefix: cardId,
    record: cardsEdit[cardId] as unknown as Record<string, unknown> | undefined,
  };
}

function getRecordWriteTarget(
  scope: EditableRecordScope,
  routeKeys: RecordRouteKeys
): EditableWriteTarget {
  switch (scope) {
    case 'entities':
      return {
        entityId: routeKeys.entityName,
        root: entitiesEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.entityName,
        record: entitiesEdit[routeKeys.entityName] as Record<string, unknown> | undefined,
      };
    case 'achievements':
      return {
        entityId: routeKeys.achievementName,
        root: achievementsEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.achievementName,
        record: achievementsEdit[routeKeys.achievementName] as Record<string, unknown> | undefined,
      };
    case 'buffs':
      return {
        entityId: routeKeys.buffName,
        root: buffsEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.buffName,
        record: buffsEdit[routeKeys.buffName] as unknown as Record<string, unknown> | undefined,
      };
    case 'items':
      return {
        entityId: routeKeys.itemName,
        root: itemsEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.itemName,
        record: itemsEdit[routeKeys.itemName] as unknown as Record<string, unknown> | undefined,
      };
    case 'fixtures':
      return {
        entityId: routeKeys.fixtureName,
        root: fixturesEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.fixtureName,
        record: fixturesEdit[routeKeys.fixtureName] as Record<string, unknown> | undefined,
      };
    case 'maps':
      return {
        entityId: routeKeys.mapName,
        root: mapsEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.mapName,
        record: mapsEdit[routeKeys.mapName] as unknown as Record<string, unknown> | undefined,
      };
    case 'modes':
      return {
        entityId: routeKeys.modeName,
        root: modesEdit as unknown as Record<string, unknown>,
        pathPrefix: routeKeys.modeName,
        record: modesEdit[routeKeys.modeName] as unknown as Record<string, unknown> | undefined,
      };
    case 'specialSkills': {
      const factionRoot =
        routeKeys.factionId === 'cat'
          ? specialSkillsEdit.cat
          : routeKeys.factionId === 'mouse'
            ? specialSkillsEdit.mouse
            : undefined;
      const pathPrefix =
        routeKeys.factionId && routeKeys.skillId
          ? `${routeKeys.factionId}.${routeKeys.skillId}`
          : '';

      return {
        entityId:
          pathPrefix || `${routeKeys.factionId || '<unknown>'}.${routeKeys.skillId || '<unknown>'}`,
        root: specialSkillsEdit as unknown as Record<string, unknown>,
        pathPrefix,
        record: factionRoot?.[routeKeys.skillId] as Record<string, unknown> | undefined,
      };
    }
  }
}

function writeNestedTargetValue(
  scope: EditableScope,
  target: EditableWriteTarget,
  path: string,
  value: string | number
) {
  assertEditableTargetLoaded(scope, target, path);
  setNestedProperty(target.root, `${target.pathPrefix}.${path}`, value);
}

export function useEditableCharactersAdapter(
  path: string,
  factionId?: string | undefined
): EditableStoreAdapter {
  const { characterId } = useLocalCharacter();
  const target = useMemo(() => getCharacterWriteTarget(characterId), [characterId]);
  const localCharacterSnapshot = useSnapshot(target.record ?? emptyObject);
  const { handleSelectCharacter } = useAppContext();

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(localCharacterSnapshot, path),
    [localCharacterSnapshot, path]
  );

  const writeValue = useCallback(
    (value: string | number) => {
      assertEditableTargetLoaded('characters', target, path);

      if (path === 'id') {
        const currentCharacterId =
          typeof target.record.id === 'string' ? target.record.id : target.entityId;
        const rawFactionId = target.record.factionId;
        const resolvedFactionId =
          factionId === 'cat' || factionId === 'mouse'
            ? factionId
            : rawFactionId === 'cat' || rawFactionId === 'mouse'
              ? rawFactionId
              : undefined;
        if (!resolvedFactionId) {
          throw new Error(
            `Cannot edit characters.id because "${currentCharacterId}" has no faction.`
          );
        }

        handleCharacterIdChange(
          currentCharacterId,
          String(value),
          resolvedFactionId,
          handleSelectCharacter,
          true
        );
        return;
      }

      writeNestedTargetValue('characters', target, path, value);
    },
    [factionId, handleSelectCharacter, path, target]
  );

  return { readStoredValue, writeValue };
}

export function useEditableCardsAdapter(path: string): EditableStoreAdapter {
  const { cardId } = useLocalCard();
  const target = useMemo(() => getCardsWriteTarget(cardId), [cardId]);
  const localCardSnapshot = useSnapshot(target.record ?? emptyObject);

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(localCardSnapshot, path),
    [localCardSnapshot, path]
  );

  const writeValue = useCallback(
    (value: string | number) => {
      assertEditableTargetLoaded('cards', target, path);

      // Knowledge card `id` is also the record key and route segment; avoid accidental breakage.
      if (path === 'id') {
        throw new Error('Editing knowledge card id is not supported in local edit mode.');
      }

      writeNestedTargetValue('cards', target, path, value);
    },
    [path, target]
  );

  return { readStoredValue, writeValue };
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

  const target = useMemo(
    () =>
      getRecordWriteTarget(scope, {
        entityName,
        achievementName,
        buffName,
        itemName,
        fixtureName,
        mapName,
        modeName,
        factionId,
        skillId,
      }),
    [
      scope,
      entityName,
      achievementName,
      buffName,
      itemName,
      fixtureName,
      mapName,
      modeName,
      factionId,
      skillId,
    ]
  );
  const recordSnapshot = useSnapshot(target.record ?? emptyObject);

  const readStoredValue = useCallback(
    (): string | number | undefined => getNestedProperty(recordSnapshot, path),
    [path, recordSnapshot]
  );

  const writeValue = useCallback(
    (value: string | number) => {
      // Avoid breaking route segment keys (these entities are keyed by name/skillId).
      if (path === 'name' || path === 'id') {
        throw new Error(`Editing ${path} is not supported for ${scope} in local edit mode.`);
      }

      writeNestedTargetValue(scope, target, path, value);
    },
    [scope, path, target]
  );

  return { readStoredValue, writeValue };
}
