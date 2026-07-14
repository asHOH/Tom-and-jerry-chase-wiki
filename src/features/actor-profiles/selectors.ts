import type { FactionId } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import { actorProfilesByName } from './data';
import type { ActorProfile } from './schema';

export const getActorProfile = (name: string): ActorProfile => {
  const profile = actorProfilesByName.get(name);
  if (!profile) throw new Error(`Missing canonical actor profile: ${name}`);
  return profile;
};

export const getActorProfileForCharacter = (character: {
  id: string;
  factionId: FactionId;
}): ActorProfile => getActorProfile(character.id);

export const getActorJumpHeight = (profile: ActorProfile): number =>
  Math.round(profile.jumpSpeed ** 2 / (2 * Math.abs(profile.gravity)));

export const getDisplayedActorGravity = (profile: ActorProfile): number =>
  Math.round(profile.gravity);

export const haveUniformDisplayedGravity = (profiles: readonly ActorProfile[]): boolean =>
  new Set(profiles.map(getDisplayedActorGravity)).size <= 1;

export const isFactionDisplayedGravityUniform = (factionId: FactionId): boolean => {
  const profiles = Object.entries(characterFactionById)
    .filter(([, characterFactionId]) => characterFactionId === factionId)
    .map(([characterId]) => getActorProfile(characterId));

  return haveUniformDisplayedGravity(profiles);
};
