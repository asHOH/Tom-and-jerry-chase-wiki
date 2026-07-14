import canonicalCharacterRoles from './data/characterRoles.json';
import { parseCharacterRoleCollection, type ActorProfile } from './schema';

export const actorProfiles: readonly ActorProfile[] = Object.freeze(
  parseCharacterRoleCollection(canonicalCharacterRoles)
);

export const actorProfilesByName: ReadonlyMap<string, ActorProfile> = new Map(
  actorProfiles.map((role) => [role.name, role])
);
