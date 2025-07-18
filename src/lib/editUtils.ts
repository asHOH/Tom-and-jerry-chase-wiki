import { characters, FactionId, factions, Skill } from '@/data';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { getSkillImageUrl } from './skillUtils';
import { CharacterWithFaction } from './types';
import json5 from 'json5';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import mouseCharactersStats from '@/data/mouseCharactersStats';
import { GameDataManager } from './dataManager';

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

export function handleCharacterIdChange(
  path: string,
  newId: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void,
  shouldNavigate: boolean = false
) {
  const oldId = path.split('.')[0]!;
  const character = characters[oldId!];
  const factionId = (activeTab || character?.factionId) as FactionId;

  // Create a new character object as a copy.
  const newCharacter = JSON.parse(JSON.stringify(character)) as CharacterWithFaction;
  newCharacter.id = newId;
  newCharacter.imageUrl = (factionId === 'cat' ? getCatImageUrl : getMouseImageUrl)(newId);

  // Enhance the new character with all necessary properties.
  const enhancedCharacter = validateAndEnhanceCharacter(newCharacter, newId);

  if (activeTab == 'mouse') {
    Object.assign(enhancedCharacter, mouseCharactersStats[newId]);
    console.log({ enhancedCharacter, mouseCharactersStats });
  }

  if (characters[newId]) {
    // do not save, and navigate to the existing character
    if (shouldNavigate) {
      handleSelectCharacter(newId);
    }
    return;
  }
  characters[newId] = enhancedCharacter;

  // Add the new character to the correct faction list to make it appear in the grid.
  const faction = factions[factionId];
  if (faction && !faction.characters.some((c) => c.id === newId)) {
    const gridCharacter = {
      id: enhancedCharacter.id,
      name: enhancedCharacter.id, // Or a more appropriate name field
      imageUrl: enhancedCharacter.imageUrl,
      positioningTags:
        (enhancedCharacter.factionId === 'cat'
          ? enhancedCharacter.catPositioningTags
          : enhancedCharacter.mousePositioningTags) || [],
    };
    faction.characters.push(gridCharacter);
  }

  // Update the local state to reflect the new character.
  // Navigate to the new character's page.
  if (shouldNavigate) {
    handleSelectCharacter(newId);
  }
}

export function handleCharacterSkillIdChange(
  path: string,
  newName: string,
  activeTab: string,
  localCharacter: CharacterWithFaction
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
  // Removed setLocalCharacter call due to missing function.
}

// Get the list of original character IDs (before any edits)
export function getOriginalCharacterIds(): string[] {
  if (typeof window === 'undefined') {
    // On server side, return all current character IDs
    return Object.keys(characters);
  }
  return Object.keys(GameDataManager.getCharacters());
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
  }

  // Determine faction if missing
  if (!charObj.factionId) {
    // Try to guess faction from character data or use 'mouse' as default
    charObj.factionId = 'mouse' as FactionId; // Default fallback
  }

  // Ensure faction ID is valid
  const validFactionId =
    charObj.factionId === 'cat' || charObj.factionId === 'mouse'
      ? (charObj.factionId as FactionId)
      : ('mouse' as FactionId);

  if (charObj.factionId !== validFactionId) {
    charObj.factionId = validFactionId;
  }

  // Ensure character has proper imageUrl
  if (!charObj.imageUrl) {
    charObj.imageUrl = (validFactionId === 'cat' ? getCatImageUrl : getMouseImageUrl)(characterId);
  }

  // Ensure character has proper faction structure
  if (!charObj.faction || typeof charObj.faction !== 'object') {
    charObj.faction = {
      id: validFactionId,
      name: validFactionId === 'cat' ? '猫阵营' : '鼠阵营',
    };
  }

  // Ensure skills array exists
  if (!charObj.skills || !Array.isArray(charObj.skills)) {
    charObj.skills = [];
  }

  // Ensure skills have proper imageUrls
  if (Array.isArray(charObj.skills)) {
    charObj.skills.forEach((skill: Skill) => {
      // Always regenerate skill image URLs to ensure they match the current character ID
      skill.imageUrl = getSkillImageUrl(characterId, skill, validFactionId);
      skill.id = `${characterId}-${skill.type}`;
    });
  }

  return charObj as CharacterWithFaction;
}

export function handleChange<T>(
  initialValue: T,
  newContentStr: string,
  path: string,
  activeTab: string | undefined,
  handleSelectCharacter: (id: string) => void
) {
  // If the ID is being changed, handle it as a special case to prevent data corruption.
  if (path && path.split('.')?.[1] === 'id') {
    handleCharacterIdChange(
      path,
      newContentStr,
      activeTab,
      handleSelectCharacter,
      true // ALWAYS navigate when the ID changes now
    );
  } else {
    // For any other field, update the property directly.
    const finalValue = typeof initialValue === 'number' ? parseFloat(newContentStr) : newContentStr;
    // Removed setLocalCharacter call due to missing function.
    setNestedProperty(characters, path, finalValue);
  }
}

export function generateTypescriptCodeFromCharacter(character: DeepReadonly<CharacterWithFaction>) {
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
