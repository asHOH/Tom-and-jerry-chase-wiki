import { characterRoles } from './data';
import type { CharacterRole } from './schema';

export type SerializedCharacterRoles = Readonly<Record<string, CharacterRole>>;

export const serializedCharacterRoles: SerializedCharacterRoles = Object.fromEntries(
  characterRoles.map((role) => [role.name, role])
);
