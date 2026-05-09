'use client';

import { useCallback } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { getNestedProperty, handleCharacterIdChange, setNestedProperty } from '@/lib/editUtils';
import { useAppContext } from '@/context/AppContext';
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
} from '@/context/EditModeContext';
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

type EditableStoreAdapter = {
  readStoredValue: () => string | number | undefined;
  writeValue: (value: string | number) => void;
};

const emptyObject = proxy({});

function createMissingEditableTargetError(
  scope: EditableScope,
  entityId: string,
  path: string
): Error {
  return new Error(`Cannot edit ${scope}.${path} because "${entityId}" is not loaded.`);
}

export function useEditableCharactersAdapter(
  path: string,
  factionId?: string | undefined
): EditableStoreAdapter {
  const { characterId } = useLocalCharacter();
  const rawLocalCharacter = characters[characterId];
  const localCharacterSnapshot = useSnapshot(rawLocalCharacter ?? emptyObject);
  const { handleSelectCharacter } = useAppContext();

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(localCharacterSnapshot, path),
    [localCharacterSnapshot, path]
  );

  const writeValue = useCallback(
    (value: string | number) => {
      if (!rawLocalCharacter || !characterId) {
        throw createMissingEditableTargetError('characters', characterId || '<unknown>', path);
      }

      if (path === 'id') {
        const resolvedFactionId =
          factionId === 'cat' || factionId === 'mouse'
            ? factionId
            : rawLocalCharacter.factionId === 'cat' || rawLocalCharacter.factionId === 'mouse'
              ? rawLocalCharacter.factionId
              : undefined;
        if (!resolvedFactionId) {
          throw new Error(
            `Cannot edit characters.id because "${rawLocalCharacter.id}" has no faction.`
          );
        }

        handleCharacterIdChange(
          rawLocalCharacter.id,
          String(value),
          resolvedFactionId,
          handleSelectCharacter,
          true
        );
        return;
      }

      setNestedProperty(
        characters as unknown as Record<string, unknown>,
        `${rawLocalCharacter.id}.${path}`,
        value
      );
    },
    [characterId, factionId, handleSelectCharacter, path, rawLocalCharacter]
  );

  return { readStoredValue, writeValue };
}

export function useEditableCardsAdapter(path: string): EditableStoreAdapter {
  const { cardId } = useLocalCard();
  const rawLocalCard = cardsEdit[cardId];
  const localCardSnapshot = useSnapshot(rawLocalCard ?? emptyObject);

  const readStoredValue = useCallback(
    () => getNestedProperty<string | number | undefined>(localCardSnapshot, path),
    [localCardSnapshot, path]
  );

  const writeValue = useCallback(
    (value: string | number) => {
      if (!rawLocalCard || !cardId) {
        throw createMissingEditableTargetError('cards', cardId || '<unknown>', path);
      }

      // Knowledge card `id` is also the record key and route segment; avoid accidental breakage.
      if (path === 'id') {
        throw new Error('Editing knowledge card id is not supported in local edit mode.');
      }

      setNestedProperty(cardsEdit, `${cardId}.${path}`, value);
    },
    [cardId, path, rawLocalCard]
  );

  return { readStoredValue, writeValue };
}

export function useEditableRecordAdapter(
  scope: Exclude<EditableScope, 'characters' | 'cards'>,
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

  const rawEntity = entitiesEdit[entityName];
  const rawAchievement = achievementsEdit[achievementName];
  const rawBuff = buffsEdit[buffName];
  const rawItem = itemsEdit[itemName];
  const rawFixture = fixturesEdit[fixtureName];
  const rawMap = mapsEdit[mapName];
  const rawMode = modesEdit[modeName];

  const rawSpecialSkill =
    factionId === 'cat'
      ? specialSkillsEdit.cat[skillId]
      : factionId === 'mouse'
        ? specialSkillsEdit.mouse[skillId]
        : undefined;

  const entitySnapshot = useSnapshot(rawEntity ?? emptyObject);
  const achievementSnapshot = useSnapshot(rawAchievement ?? emptyObject);
  const buffSnapshot = useSnapshot(rawBuff ?? emptyObject);
  const itemSnapshot = useSnapshot(rawItem ?? emptyObject);
  const fixtureSnapshot = useSnapshot(rawFixture ?? emptyObject);
  const mapSnapshot = useSnapshot(rawMap ?? emptyObject);
  const modeSnapshot = useSnapshot(rawMode ?? emptyObject);
  const specialSkillSnapshot = useSnapshot(rawSpecialSkill ?? emptyObject);

  const readStoredValue = useCallback((): string | number | undefined => {
    switch (scope) {
      case 'entities':
        return getNestedProperty(entitySnapshot, path);
      case 'achievements':
        return getNestedProperty(achievementSnapshot, path);
      case 'buffs':
        return getNestedProperty(buffSnapshot, path);
      case 'items':
        return getNestedProperty(itemSnapshot, path);
      case 'fixtures':
        return getNestedProperty(fixtureSnapshot, path);
      case 'maps':
        return getNestedProperty(mapSnapshot, path);
      case 'modes':
        return getNestedProperty(modeSnapshot, path);
      case 'specialSkills':
        return getNestedProperty(specialSkillSnapshot, path);
      default:
        return undefined;
    }
  }, [
    scope,
    path,
    entitySnapshot,
    achievementSnapshot,
    buffSnapshot,
    itemSnapshot,
    fixtureSnapshot,
    mapSnapshot,
    modeSnapshot,
    specialSkillSnapshot,
  ]);

  const writeValue = useCallback(
    (value: string | number) => {
      // Avoid breaking route segment keys (these entities are keyed by name/skillId).
      if (path === 'name' || path === 'id') {
        throw new Error(`Editing ${path} is not supported for ${scope} in local edit mode.`);
      }

      switch (scope) {
        case 'entities': {
          if (!entityName || !rawEntity) {
            throw createMissingEditableTargetError(scope, entityName || '<unknown>', path);
          }
          setNestedProperty(
            entitiesEdit as unknown as Record<string, unknown>,
            `${entityName}.${path}`,
            value
          );
          break;
        }
        case 'achievements': {
          if (!achievementName || !rawAchievement) {
            throw createMissingEditableTargetError(scope, achievementName || '<unknown>', path);
          }
          setNestedProperty(
            achievementsEdit as unknown as Record<string, unknown>,
            `${achievementName}.${path}`,
            value
          );
          break;
        }
        case 'buffs': {
          if (!buffName || !rawBuff) {
            throw createMissingEditableTargetError(scope, buffName || '<unknown>', path);
          }
          setNestedProperty(
            buffsEdit as unknown as Record<string, unknown>,
            `${buffName}.${path}`,
            value
          );
          break;
        }
        case 'items': {
          if (!itemName || !rawItem) {
            throw createMissingEditableTargetError(scope, itemName || '<unknown>', path);
          }
          setNestedProperty(
            itemsEdit as unknown as Record<string, unknown>,
            `${itemName}.${path}`,
            value
          );
          break;
        }
        case 'fixtures': {
          if (!fixtureName || !rawFixture) {
            throw createMissingEditableTargetError(scope, fixtureName || '<unknown>', path);
          }
          setNestedProperty(
            fixturesEdit as unknown as Record<string, unknown>,
            `${fixtureName}.${path}`,
            value
          );
          break;
        }
        case 'maps': {
          if (!mapName || !rawMap) {
            throw createMissingEditableTargetError(scope, mapName || '<unknown>', path);
          }
          setNestedProperty(
            mapsEdit as unknown as Record<string, unknown>,
            `${mapName}.${path}`,
            value
          );
          break;
        }
        case 'modes': {
          if (!modeName || !rawMode) {
            throw createMissingEditableTargetError(scope, modeName || '<unknown>', path);
          }
          setNestedProperty(
            modesEdit as unknown as Record<string, unknown>,
            `${modeName}.${path}`,
            value
          );
          break;
        }
        case 'specialSkills': {
          if (!factionId || !skillId || !rawSpecialSkill) {
            throw createMissingEditableTargetError(
              scope,
              `${factionId || '<unknown>'}.${skillId || '<unknown>'}`,
              path
            );
          }
          setNestedProperty(
            specialSkillsEdit as unknown as Record<string, unknown>,
            `${factionId}.${skillId}.${path}`,
            value
          );
          break;
        }
        default:
          break;
      }
    },
    [
      scope,
      path,
      entityName,
      rawEntity,
      achievementName,
      rawAchievement,
      buffName,
      rawBuff,
      itemName,
      rawItem,
      fixtureName,
      rawFixture,
      mapName,
      rawMap,
      modeName,
      rawMode,
      factionId,
      skillId,
      rawSpecialSkill,
    ]
  );

  return { readStoredValue, writeValue };
}
