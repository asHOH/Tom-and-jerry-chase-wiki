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
  // BUT: allow user-created characters to be renamed even if target ID exists
  if (characters[newId] && newId !== oldId) {
    const isOriginalOldCharacter = isOriginalCharacter(oldId);
    const isOriginalNewCharacter = isOriginalCharacter(newId);

    // If trying to rename TO an original character, prevent it to avoid data loss
    if (isOriginalNewCharacter) {
      console.warn(`Cannot rename to original character ${newId}, loading existing data instead`);
      try {
        const existingCharacter = validateAndEnhanceCharacter(characters[newId], newId);
        setLocalCharacter(JSON.parse(JSON.stringify(existingCharacter)));
      } catch (error) {
        console.error(`Failed to load existing character ${newId}:`, error);
        setLocalCharacter(JSON.parse(JSON.stringify(characters[newId])));
      }
      return;
    }

    // If both are user-created characters, allow overwriting with warning
    if (!isOriginalOldCharacter) {
      console.warn(`Overwriting existing user-created character ${newId} with ${oldId}`);
      // Continue with the rename process - this will overwrite the existing character
    } else {
      // Original character trying to overwrite user-created character - load existing instead
      console.log(`Character ${newId} already exists, loading existing data`);
      try {
        const existingCharacter = validateAndEnhanceCharacter(characters[newId], newId);
        setLocalCharacter(JSON.parse(JSON.stringify(existingCharacter)));
      } catch (error) {
        console.error(`Failed to load existing character ${newId}:`, error);
        setLocalCharacter(JSON.parse(JSON.stringify(characters[newId])));
      }
      return;
    }
  }

  // Create new character with enhanced data structure
  const newCharacter = { ...character! };
  newCharacter.id = newId;
  newCharacter.imageUrl = (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(newId);
  setLocalCharacter(JSON.parse(JSON.stringify(newCharacter)));

  // Clear video URLs when creating user-created character from existing one
  if (!isOriginalCharacter(newId) && newCharacter.skills && Array.isArray(newCharacter.skills)) {
    newCharacter.skills.forEach((skill: Skill) => {
      if (skill.videoUrl) {
        delete skill.videoUrl;
      }
    });
    console.log(`Cleared video URLs for user-created character ${newId}`);
  }

  // Ensure all required fields are present
  try {
    const enhanced = validateAndEnhanceCharacter(newCharacter, newId);
    Object.assign(characters, { [newId]: enhanced });
  } catch (error) {
    console.error(`Failed to enhance new character ${newId}:`, error);
    Object.assign(characters, { [newId]: newCharacter });
  }

  delete characters[oldId!];

  // Only navigate if explicitly requested
  if (shouldNavigate) {
    handleSelectCharacter(newId);
  }
  // Note: We don't update URL in edit mode to avoid 404 for non-existing character pages
  const faction = factions[factionId]?.characters.find(({ id }) => id == oldId);
  if (faction) {
    faction.id = faction.name = newId;
    faction.imageUrl = (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(newId);
  }

  const updatedCharacter = characters[newId];
  if (updatedCharacter?.skills) {
    for (const i of updatedCharacter.skills) {
      i.id = `${newId}-${i.id.split('-')[1]}`;
      i.imageUrl = getSkillImageUrl(newId, i, factionId as unknown as FactionId);
    }
  }

  if (factionId === 'mouse' && stats[newId] && updatedCharacter) {
    Object.assign(updatedCharacter, stats[newId]);
  }

  if (updatedCharacter) {
    setLocalCharacter(JSON.parse(JSON.stringify(updatedCharacter)));
  }
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
  // Ensure all characters have complete data structure before saving
  Object.keys(characters).forEach((characterId) => {
    const character = characters[characterId];
    if (character) {
      try {
        // Validate and enhance character before saving
        const enhanced = validateAndEnhanceCharacter(character, characterId);
        // Use Object.assign to preserve the original object reference
        Object.assign(character, enhanced);
      } catch (error) {
        console.error(`Failed to validate character ${characterId} before saving:`, error);
        // Ensure at least basic id field exists
        if (!character.id) {
          character.id = characterId;
        }
      }
    }
  });

  localStorage.setItem('factions', JSON.stringify(factions));
  localStorage.setItem('characters', JSON.stringify(characters));
  console.log(
    `Saved ${Object.keys(characters).length} characters and ${Object.keys(factions).length} factions to localStorage`
  );
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

// Ensure character object has proper structure with all required fields
export function validateCharacterStructure(
  character: unknown,
  characterId: string
): CharacterWithFaction {
  if (!character || typeof character !== 'object') {
    throw new Error(`Character ${characterId} not found or invalid`);
  }

  const charObj = character as Record<string, unknown>;

  // Ensure id field exists
  if (!charObj.id) {
    charObj.id = characterId;
  }

  // Ensure other required fields exist
  if (!charObj.faction) {
    charObj.faction = charObj.factionId ? { id: charObj.factionId } : { id: 'unknown' };
  }

  if (!charObj.skills) {
    charObj.skills = [];
  }

  return charObj as CharacterWithFaction;
}

export function loadFactionsAndCharacters() {
  // 1. Save original data if not already saved
  if (typeof window !== 'undefined' && !localStorage.getItem('originalCharacters')) {
    localStorage.setItem('originalCharacters', JSON.stringify(characters));
    localStorage.setItem('originalFactions', JSON.stringify(factions));
    console.log('Saved original character and faction data to localStorage');
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
  const loadedCharacters = JSON.parse(localStorage.getItem('characters') ?? originalCharacters);
  const loadedFactions = JSON.parse(localStorage.getItem('factions') ?? originalFactions);

  // 4. Ensure all characters have complete data structure
  const enhancedCharacters: Record<string, CharacterWithFaction> = {};

  Object.keys(loadedCharacters).forEach((characterId) => {
    const character = loadedCharacters[characterId];

    try {
      // Validate and enhance character structure
      const enhancedCharacter = validateAndEnhanceCharacter(character, characterId);
      enhancedCharacters[characterId] = enhancedCharacter;
      console.log(`Successfully enhanced character ${characterId}`);
    } catch (error) {
      console.error(`Failed to enhance character ${characterId}:`, error);
      // Try to salvage what we can
      if (character && typeof character === 'object') {
        character.id = character.id || characterId;
        enhancedCharacters[characterId] = character as CharacterWithFaction;
      }
    }
  });

  Object.assign(characters, enhancedCharacters);
  Object.assign(factions, loadedFactions);

  console.log(`Loaded ${Object.keys(enhancedCharacters).length} characters from localStorage`);
}

// Helper function to validate and enhance character structure
function validateAndEnhanceCharacter(
  character: unknown,
  characterId: string
): CharacterWithFaction {
  if (!character || typeof character !== 'object') {
    throw new Error(`Character ${characterId} not found or invalid`);
  }

  const charObj = character as Record<string, unknown>;

  // Ensure id field exists
  if (!charObj.id) {
    charObj.id = characterId;
    console.log(`Added missing id field to character ${characterId}`);
  }

  // Determine faction if missing
  if (!charObj.factionId) {
    // Try to guess faction from character data or use 'mouse' as default
    charObj.factionId = 'mouse' as FactionId; // Default fallback
    console.log(`Added missing factionId to character ${characterId}, defaulted to mouse`);
  }

  // Ensure faction ID is valid
  const validFactionId =
    charObj.factionId === 'cat' || charObj.factionId === 'mouse'
      ? (charObj.factionId as FactionId)
      : ('mouse' as FactionId);

  if (charObj.factionId !== validFactionId) {
    charObj.factionId = validFactionId;
    console.log(`Corrected invalid factionId for character ${characterId} to ${validFactionId}`);
  }

  // Ensure character has proper imageUrl
  if (!charObj.imageUrl) {
    charObj.imageUrl = (validFactionId === 'cat' ? getCatImageUrl : getMouseImageUrl)(characterId);
    console.log(`Enhanced character ${characterId} with imageUrl: ${charObj.imageUrl}`);
  }

  // Ensure character has proper faction structure
  if (!charObj.faction || typeof charObj.faction !== 'object') {
    charObj.faction = {
      id: validFactionId,
      name: validFactionId === 'cat' ? '猫阵营' : '鼠阵营',
    };
    console.log(`Enhanced character ${characterId} with faction structure`);
  }

  // Ensure skills array exists
  if (!charObj.skills || !Array.isArray(charObj.skills)) {
    charObj.skills = [];
    console.log(`Added missing skills array to character ${characterId}`);
  }

  // Ensure skills have proper imageUrls
  if (Array.isArray(charObj.skills)) {
    charObj.skills.forEach((skill: Skill) => {
      if (!skill.imageUrl) {
        skill.imageUrl = getSkillImageUrl(characterId, skill, validFactionId);
      }
    });
    console.log(`Enhanced character ${characterId} skills with imageUrls`);
  }

  return charObj as CharacterWithFaction;
}

export function handleChange<T>(
  initialValue: T,
  newContentStr: string,
  path: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void, // Use the consolidated navigation function
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
      handleSelectCharacter, // Pass the consolidated navigation handler
      localCharacter,
      setLocalCharacter,
      true // ALWAYS navigate when the ID changes now
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
        // Always remove these character-level properties
        if (key === 'imageUrl' || key === 'faction' || key === 'factionId') return undefined;

        // Remove id from character level and skills, but keep it in skillAllocations
        if (key === 'id') {
          if (this === character) return undefined; // Remove character-level id
          if (this.name && this.type) return undefined; // Remove id from skills (they have name and type)
          // Keep id in skillAllocations (they have pattern and weaponType)
        }

        return value;
      },
    })
  );
}
