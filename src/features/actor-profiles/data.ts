import canonicalActorProfiles from './data/actorProfiles.json';
import { parseActorProfiles, type ActorProfile } from './schema';

export const actorProfiles: readonly ActorProfile[] = Object.freeze(
  parseActorProfiles(canonicalActorProfiles)
);

export const actorProfilesByName: ReadonlyMap<string, ActorProfile> = new Map(
  actorProfiles.map((role) => [role.name, role])
);
