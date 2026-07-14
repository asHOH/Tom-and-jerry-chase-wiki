import { actorProfiles } from './data';
import type { ActorProfile } from './schema';

export type SerializedCharacterRoles = Readonly<Record<string, ActorProfile>>;

export const serializedCharacterRoles: SerializedCharacterRoles = Object.fromEntries(
  actorProfiles.map((role) => [role.name, role])
);
