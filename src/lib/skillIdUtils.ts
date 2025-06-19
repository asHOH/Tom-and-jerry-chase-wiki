/**
 * Utility to process character data and assign IDs
 */

import type { SkillDefinition, Skill, CharacterDefinition, Character } from '../data/types';

/**
 * Process skills array to automatically assign IDs based on character name
 * @param characterName - The character's name
 * @param skills - Array of skill definitions
 * @returns Skills array with IDs automatically assigned
 */
export function processSkillsWithIds(characterName: string, skills: SkillDefinition[]): Skill[] {
  return skills.map((skill) => ({
    ...skill,
    id: `${characterName}-${skill.type}`,
  }));
}

/**
 * Process character definitions to assign IDs and process skills
 * @param characterDefinitions - Record of character definitions keyed by name
 * @returns Record of processed characters with IDs and processed skills
 */
export function processCharacters<T extends Record<string, CharacterDefinition>>(
  characterDefinitions: T
): { [K in keyof T]: Character & { id: K } } {
  return Object.fromEntries(
    Object.entries(characterDefinitions).map(([characterName, character]) => [
      characterName,
      {
        ...character,
        id: characterName,
        skills: processSkillsWithIds(characterName, character.skills),
      },
    ])
  ) as { [K in keyof T]: Character & { id: K } };
}
