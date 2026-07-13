import type { FactionId } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import { characterRolesByName } from './data';
import type { CharacterRole } from './schema';

export const getCharacterRole = (name: string): CharacterRole => {
  const role = characterRolesByName.get(name);
  if (!role) throw new Error(`Missing canonical character role: ${name}`);
  return role;
};

export const getCharacterRoleForCharacter = (character: {
  id: string;
  factionId: FactionId;
}): CharacterRole => getCharacterRole(character.id);

export const getCharacterRoleJumpHeight = (role: CharacterRole): number =>
  Math.round(role.jumpSpeed ** 2 / (2 * Math.abs(role.gravity)));

export const getDisplayedCharacterRoleGravity = (role: CharacterRole): number =>
  Math.round(role.gravity);

export const haveUniformDisplayedGravity = (roles: readonly CharacterRole[]): boolean =>
  new Set(roles.map(getDisplayedCharacterRoleGravity)).size <= 1;

export const isFactionDisplayedGravityUniform = (factionId: FactionId): boolean => {
  const roles = Object.entries(characterFactionById)
    .filter(([, characterFactionId]) => characterFactionId === factionId)
    .map(([characterId]) => getCharacterRole(characterId));

  return haveUniformDisplayedGravity(roles);
};
