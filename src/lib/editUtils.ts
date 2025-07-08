import { characters, FactionId, factions, Skill } from '@/data';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { getSkillImageUrl } from './skillUtils';
import { CharacterWithFaction } from './types';
import { Dispatch, SetStateAction } from 'react';
import { produce } from 'immer';
import { setAutoFreeze } from 'immer';
import json5 from 'json5';
import stats from '@/data/mouseCharactersStats'; // Import stats

setAutoFreeze(false);

/**
 * Deeply assigns the values of source object to the target object.
 *
 * @param target The object to which values will be assigned.
 * @param source The object from which values will be assigned.
 * @returns A new object with the merged properties.
 */
export function deepAssign<T extends object, U extends object>(target: T, source: U): T & U {
  const output = { ...target } as T & U;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = (output as Record<string, unknown>)[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        (output as Record<string, unknown>)[key] = deepAssign(targetValue, sourceValue);
      } else {
        (output as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return output;
}

/**
 * Checks if an item is a non-array object.
 *
 * @param item The item to check.
 * @returns True if the item is a non-array object, false otherwise.
 */
function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

export function getNestedProperty<T>(obj: Record<string, unknown>, path: string) {
  if (!path) {
    return obj as unknown as T;
  }
  return path
    .split('.')
    .reduce(
      (acc: unknown, part: string) =>
        acc &&
        typeof acc === 'object' &&
        typeof part === 'string' &&
        part in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    ) as unknown as T;
}

export function setNestedProperty<T>(obj: Record<string, unknown>, path: string, value: T): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current !== 'object' || current === null) {
      return;
    }
    if (typeof part !== 'string') {
      return;
    }
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      if (Number.isNaN(parseInt(part, 10))) current[part] = {};
      else current[part] = [];
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  if (typeof current === 'object' && current !== null && typeof lastPart === 'string') {
    current[lastPart] = value;
  }
}

function handleCharacterIdChange(
  path: string,
  newId: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void,
  _localCharacter: CharacterWithFaction,
  setLocalCharacter: Dispatch<CharacterWithFaction>,
  shouldNavigate: boolean = false
) {
  // FIXME: This code may lead to uncertain damage as other code do not handle the situation where the id changes
  // characters is not managed by react, so we need to trigger the update manually
  // use localCharacter to force update
  const oldId = path.split('.')[0]!;
  const character = characters[oldId!];

  // Derive faction from character data if not provided
  const factionId = activeTab || character?.factionId;

  if (!factionId) {
    console.warn('Could not determine faction for character', oldId);
    return;
  }

  // Check if the new ID already exists - if so, load that character instead
  if (characters[newId] && newId !== oldId) {
    console.log(`Character ${newId} already exists, loading existing data`);
    setLocalCharacter(JSON.parse(JSON.stringify(characters[newId])));
    return;
  }

  // Save mapping from original ID to new ID
  const mapping = JSON.parse(localStorage.getItem('characterIdMapping') ?? '{}');
  // Find the original ID that maps to oldId, or use oldId if it's original
  const originalId = Object.keys(mapping).find((key) => mapping[key] === oldId) ?? oldId;
  mapping[originalId] = newId;
  localStorage.setItem('characterIdMapping', JSON.stringify(mapping));

  characters[newId] = { ...character! };
  characters[newId].id = newId;
  characters[newId].imageUrl = (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(newId);
  delete characters[oldId!];
  // Only navigate if explicitly requested (not during edit mode ID changes)
  if (shouldNavigate) {
    handleSelectCharacter(newId);
  }
  // Note: We don't update URL in edit mode to avoid 404 for non-existing character pages
  const faction = factions[factionId]?.characters.find(({ id }) => id == oldId);
  if (faction) {
    faction.id = faction.name = newId;
    faction.imageUrl = (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(newId);
  }
  for (const i of characters[newId].skills) {
    i.id = `${newId}-${i.id.split('-')[1]}`;
    i.imageUrl = getSkillImageUrl(newId, i, factionId as unknown as FactionId);
  }
  if (factionId === 'mouse' && stats[newId]) {
    Object.assign(characters[newId], stats[newId]);
  }
  setLocalCharacter(JSON.parse(JSON.stringify(characters[newId])));
}

export function handleCharacterSkillIdChange(
  path: string,
  newName: string,
  activeTab: string,
  localCharacter: CharacterWithFaction,
  setLocalCharacter: Dispatch<SetStateAction<CharacterWithFaction>>
) {
  const skill = getNestedProperty(
    characters,
    [...path.split('.').slice(0, 3)].join('.')
  ) as unknown as Skill;

  // Derive faction from character data if not provided
  const factionId = activeTab || localCharacter.factionId;

  if (!factionId) {
    console.warn('Could not determine faction for character', localCharacter.id);
    return;
  }

  skill.name = newName;
  skill.imageUrl = getSkillImageUrl(skill.id.split('-')[0]!, skill, factionId as FactionId);
  setLocalCharacter({
    ...localCharacter,
    skills: localCharacter.skills.map((i: Skill, index) =>
      index.toString() == path.split('.')[2] ? skill : i
    ),
  });
}

export function saveFactionsAndCharacters() {
  localStorage.setItem('factions', JSON.stringify(factions));
  localStorage.setItem('characters', JSON.stringify(characters));
}

// Save mapping of original character IDs to current IDs
export function saveCharacterIdMapping() {
  const mapping: Record<string, string> = {};
  // Create reverse mapping from current characters back to their original IDs
  Object.keys(characters).forEach((currentId) => {
    // For now, we'll use a simple approach - if the character exists in localStorage
    // but not in the original data, we assume it's a renamed character
    mapping[currentId] = currentId; // Default to self-mapping
  });
  localStorage.setItem('characterIdMapping', JSON.stringify(mapping));
}

// Get the current character ID for a given original ID
export function getCurrentCharacterId(originalId: string): string {
  if (typeof window === 'undefined') return originalId;

  const mapping = JSON.parse(localStorage.getItem('characterIdMapping') ?? '{}');
  return mapping[originalId] ?? originalId;
}

// Get character by original ID, resolving to current ID if it was renamed
export function getCharacterByOriginalId(originalId: string): CharacterWithFaction | undefined {
  const currentId = getCurrentCharacterId(originalId);
  return characters[currentId];
}

// Get the list of original character IDs (before any edits)
export function getOriginalCharacterIds(): string[] {
  if (typeof window === 'undefined') {
    // On server side, return all current character IDs
    return Object.keys(characters);
  }

  // Try to get original characters from initial data or fallback to current
  const originalCharactersStr = localStorage.getItem('originalCharacters');
  if (originalCharactersStr) {
    try {
      const originalCharacters = JSON.parse(originalCharactersStr);
      return Object.keys(originalCharacters);
    } catch (e) {
      console.error('Failed to parse original characters', e);
    }
  }

  // Fallback: return current character IDs
  return Object.keys(characters);
}

// Check if a character ID corresponds to an original (static) character
export function isOriginalCharacter(characterId: string): boolean {
  return getOriginalCharacterIds().includes(characterId);
}

export function loadFactionsAndCharacters() {
  // 1. Save original data if not already saved
  if (typeof window !== 'undefined' && !localStorage.getItem('originalCharacters')) {
    localStorage.setItem('originalCharacters', JSON.stringify(characters));
    localStorage.setItem('originalFactions', JSON.stringify(factions));
  }

  // 2. clear original data
  const originalCharacters = JSON.stringify(characters);
  const originalFactions = JSON.stringify(factions);
  for (const prop of Object.getOwnPropertyNames(factions)) {
    delete factions[prop];
  }
  for (const prop of Object.getOwnPropertyNames(characters)) {
    delete characters[prop];
  }
  // 3. load localstorage data
  Object.assign(characters, JSON.parse(localStorage.getItem('characters') ?? originalCharacters));
  Object.assign(factions, JSON.parse(localStorage.getItem('factions') ?? originalFactions));
}

export function handleChange<T>(
  initialValue: T,
  newContentStr: string,
  path: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void,
  localCharacter: CharacterWithFaction,
  setLocalCharacter: Dispatch<SetStateAction<CharacterWithFaction>>
) {
  let finalValue: T;
  if (typeof initialValue === 'number') {
    finalValue = parseFloat(newContentStr) as T;
  } else {
    finalValue = newContentStr as T;
  }
  setLocalCharacter(
    produce(localCharacter, (localCharacter) =>
      setNestedProperty(localCharacter, path.split('.').slice(1).join('.'), finalValue)
    )
  );
  setNestedProperty(characters, path, finalValue);
  if (path && path.split('.')?.[1] == 'id') {
    handleCharacterIdChange(
      path,
      newContentStr,
      activeTab,
      handleSelectCharacter,
      localCharacter,
      setLocalCharacter,
      false // Don't navigate during edit mode ID changes
    );
  }
  if (path && path.split('.')?.[1] == 'skills' && path.split('.')?.[3] == 'name') {
    const factionId = activeTab || localCharacter.factionId;
    if (factionId) {
      handleCharacterSkillIdChange(
        path,
        newContentStr,
        factionId,
        localCharacter,
        setLocalCharacter
      );
    }
  }
  saveFactionsAndCharacters();
}

export function generateTypescriptCodeFromCharacter(character: CharacterWithFaction) {
  return (
    `/* ----------------------------------- ${character.id} ----------------------------------- */\n` +
    character.id +
    ': ' +
    json5.stringify(character, {
      quote: '',
      space: 2,
      replacer(key, value) {
        if (['imageUrl', 'faction', 'factionId', 'id'].includes(key)) return undefined;
        return value;
      },
    })
  );
}
