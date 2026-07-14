import { actorProfiles } from './data';
import { actorProfileLookup } from './serialization';

describe('actorProfileLookup', () => {
  it('provides every canonical role keyed by its normalized site identifier', () => {
    expect(Object.keys(actorProfileLookup)).toHaveLength(actorProfiles.length);
    expect(actorProfileLookup['汤姆']).toMatchObject({ name: '汤姆', maxHp: 255 });
    expect(actorProfileLookup['表演者•杰瑞']?.name).toBe('表演者•杰瑞');
  });
});
