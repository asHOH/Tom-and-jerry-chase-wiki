import { characterRoles } from './data';
import { serializedCharacterRoles } from './serialization';

describe('serializedCharacterRoles', () => {
  it('provides every canonical role keyed by its normalized site identifier', () => {
    expect(Object.keys(serializedCharacterRoles)).toHaveLength(characterRoles.length);
    expect(serializedCharacterRoles['汤姆']).toMatchObject({ name: '汤姆', maxHp: 255 });
    expect(serializedCharacterRoles['表演者•杰瑞']?.name).toBe('表演者•杰瑞');
  });
});
