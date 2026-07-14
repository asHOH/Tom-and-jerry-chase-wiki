import { actorProfiles } from './data';
import type { ActorProfile } from './schema';

export type ActorProfileLookup = Readonly<Record<string, ActorProfile>>;

export const actorProfileLookup: ActorProfileLookup = Object.fromEntries(
  actorProfiles.map((profile) => [profile.name, profile])
);
