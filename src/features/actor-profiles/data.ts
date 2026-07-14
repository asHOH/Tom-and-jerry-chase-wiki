import canonicalCharacterRoles from './data/actorProfiles.json';
import { parseActorProfiles, type ActorProfile } from './schema';

export const actorProfiles: readonly ActorProfile[] = Object.freeze(
  parseActorProfiles(canonicalCharacterRoles)
);

export const actorProfilesByName: ReadonlyMap<string, ActorProfile> = new Map(
  actorProfiles.map((role) => [role.name, role])
);
