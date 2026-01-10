/**
 * Character-specific edit handlers.
 * Implements domain logic for character edits like ID changes, skill updates, faction management.
 * Can be used in conjunction with generic entity edit utilities.
 */

import { AssetManager } from '@/lib/assetManager';
import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction } from '@/lib/types';
import { characters, FactionId, factions, Skill } from '@/data';

/**
 * Handles character ID changes, including:
 * - Creating a new character entry with the new ID
 * - Regenerating image URLs
 * - Updating faction character lists
 * - Optionally navigating to the new character
 *
 * @param path The full path including old character ID
 * @param newId The new character ID
 * @param factionId The faction this character belongs to
 * @param handleSelectCharacter Callback to navigate to new character
 * @param shouldNavigate Whether to navigate after creating new character
 */
export function handleCharacterIdChange(
  path: string,
  newId: string,
  factionId: FactionId,
  handleSelectCharacter: (id: string) => void,
  shouldNavigate: boolean = false
): void {
  const oldId = path.split('.')[0];
  if (!oldId) {
    console.error('Invalid path for character ID change:', path);
    return;
  }

  const character = characters[oldId];
  if (!character) {
    console.error('Character not found:', oldId);
    return;
  }

  // Don't create duplicate if ID already exists
  if (characters[newId]) {
    if (shouldNavigate) {
      handleSelectCharacter(newId);
    }
    return;
  }

  // Create new character with updated ID and image URL
  const newCharacter = JSON.parse(JSON.stringify(character)) as CharacterWithFaction;
  newCharacter.id = newId;
  newCharacter.imageUrl = AssetManager.getCharacterImageUrl(newId, factionId);

  // Enhance with validation
  const enhancedCharacter = validateAndEnhanceCharacter(newCharacter, newId, factionId);

  characters[newId] = enhancedCharacter;

  // Update faction's character grid list
  const faction = factions[factionId];
  if (faction && !faction.characters.some((c) => c.id === newId)) {
    faction.characters.push({
      id: enhancedCharacter.id,
      name: enhancedCharacter.id,
      imageUrl: enhancedCharacter.imageUrl,
      positioningTags:
        (factionId === 'cat'
          ? enhancedCharacter.catPositioningTags
          : enhancedCharacter.mousePositioningTags) || [],
    });
  }

  if (shouldNavigate) {
    handleSelectCharacter(newId);
  }
}

/**
 * Ensures character object has all required fields with proper structure.
 * Validates faction ID, initializes skill arrays, regenerates URLs.
 *
 * @param character The character object to validate
 * @param characterId The character's ID
 * @param factionId Override faction ID (defaults to character.factionId)
 * @returns The validated and enhanced character
 */
function validateAndEnhanceCharacter(
  character: unknown,
  characterId: string,
  factionId?: FactionId
): CharacterWithFaction {
  if (!character || typeof character !== 'object') {
    throw new Error(`Character ${characterId} is invalid`);
  }

  const charObj = character as Record<string, unknown>;

  // Ensure ID
  if (!charObj.id) {
    charObj.id = characterId;
  }

  // Determine and validate faction ID
  const validFactionId: FactionId =
    (charObj.factionId === 'cat' || charObj.factionId === 'mouse'
      ? (charObj.factionId as FactionId)
      : factionId) || 'mouse';

  charObj.factionId = validFactionId;

  // Ensure faction object
  if (!charObj.faction || typeof charObj.faction !== 'object') {
    charObj.faction = {
      id: validFactionId,
      name: validFactionId === 'cat' ? '猫阵营' : '鼠阵营',
    };
  }

  // Ensure image URL
  if (!charObj.imageUrl) {
    charObj.imageUrl = AssetManager.getCharacterImageUrl(characterId, validFactionId);
  }

  // Ensure skills array
  if (!charObj.skills || !Array.isArray(charObj.skills)) {
    charObj.skills = [];
  }

  // Regenerate skill URLs and IDs
  if (Array.isArray(charObj.skills)) {
    charObj.skills.forEach((skill: Skill) => {
      skill.imageUrl = AssetManager.getSkillImageUrl(characterId, skill, validFactionId);
      skill.id = `${characterId}-${skill.type}`;
    });
  }

  return charObj as CharacterWithFaction;
}

/**
 * Gets the list of original (unmodified) character IDs.
 * Checks GameDataManager for server-side data or returns all current keys.
 *
 * @returns Array of original character IDs
 */
export function getOriginalCharacterIds(): string[] {
  if (typeof window === 'undefined') {
    return Object.keys(characters);
  }
  return Object.keys(GameDataManager.getCharacters());
}

/**
 * Checks if a character ID belongs to the original (static) dataset.
 *
 * @param characterId The character ID to check
 * @returns True if character is original, false if created/modified in edit mode
 */
export function isOriginalCharacter(characterId: string): boolean {
  return getOriginalCharacterIds().includes(characterId);
}
