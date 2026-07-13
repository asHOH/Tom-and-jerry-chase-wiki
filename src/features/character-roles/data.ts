import canonicalCharacterRoles from './data/characterRoles.json';
import { parseCharacterRoleCollection, type CharacterRole } from './schema';

export const characterRoles: readonly CharacterRole[] = Object.freeze(
  parseCharacterRoleCollection(canonicalCharacterRoles)
);

export const characterRolesByName: ReadonlyMap<string, CharacterRole> = new Map(
  characterRoles.map((role) => [role.name, role])
);
