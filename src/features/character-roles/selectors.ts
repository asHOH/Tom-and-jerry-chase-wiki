import type { FactionId } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import { actorProfilesByName } from './data';
import type { ActorProfile } from './schema';

export const getCharacterRole = (name: string): ActorProfile => {
  const role = actorProfilesByName.get(name);
  if (!role) throw new Error(`Missing canonical character role: ${name}`);
  return role;
};

export const getCharacterRoleForCharacter = (character: {
  id: string;
  factionId: FactionId;
}): ActorProfile => getCharacterRole(character.id);

export const getCharacterRoleJumpHeight = (role: ActorProfile): number =>
  Math.round(role.jumpSpeed ** 2 / (2 * Math.abs(role.gravity)));

export const getDisplayedCharacterRoleGravity = (role: ActorProfile): number =>
  Math.round(role.gravity);

export const haveUniformDisplayedGravity = (roles: readonly ActorProfile[]): boolean =>
  new Set(roles.map(getDisplayedCharacterRoleGravity)).size <= 1;

export const isFactionDisplayedGravityUniform = (factionId: FactionId): boolean => {
  const roles = Object.entries(characterFactionById)
    .filter(([, characterFactionId]) => characterFactionId === factionId)
    .map(([characterId]) => getCharacterRole(characterId));

  return haveUniformDisplayedGravity(roles);
};
