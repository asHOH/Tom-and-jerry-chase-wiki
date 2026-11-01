import { actorProfiles } from './data';
import { actorProfileLookup } from './serialization';

describe('actorProfileLookup', () => {
  it('provides every canonical profile keyed by its normalized site identifier', () => {
    expect(Object.keys(actorProfileLookup)).toHaveLength(actorProfiles.length);
    for (const profile of actorProfiles) {
      expect(actorProfileLookup[profile.name]).toEqual(profile);
    }
  });
});
