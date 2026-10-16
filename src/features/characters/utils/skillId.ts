/**
 * Utility to process character data and assign IDs
 */

import type {
  Character,
  CharacterDefinition,
  FactionId,
  PartialCharacterDefinition,
  Skill,
  SkillDefinition,
} from '@/data/types';

/**
 * Process skills array to automatically assign IDs based on character name
 * @param characterName - The character's name
 * @param skills - Array of skill definitions
 * @returns Skills array with IDs automatically assigned
 */
function processSkillsWithIds(
  characterName: string,
  skills: ReadonlyArray<SkillDefinition>
): Skill[] {
  return skills.map((skill) => ({
    ...skill,
    id: `${characterName}-${skill.type}`,
  }));
}

/**
 * Process character definitions to assign IDs, faction and processed skills
 * @param characterDefinitions - Record of character definitions keyed by name
 * @param factionId - Faction shared by this collection
 * @returns Record of processed characters with IDs and processed skills
 */
export function processCharacters<
  T extends Readonly<Record<string, CharacterDefinition | PartialCharacterDefinition>>,
>(characterDefinitions: T, factionId: FactionId): { [K in keyof T]: Character & { id: K } } {
  if (factionId !== 'cat' && factionId !== 'mouse') {
    throw new Error('Character faction must be cat or mouse');
  }

  return Object.fromEntries(
    Object.entries(characterDefinitions)
      .filter(([, character]) => !('hidden' in character && character.hidden === true))
      .map(([characterName, character]) => [
        characterName,
        {
          ...character,
          id: characterName,
          factionId,
          skills: processSkillsWithIds(characterName, character.skills ?? []),
        },
      ])
  ) as { [K in keyof T]: Character & { id: K } };
}
