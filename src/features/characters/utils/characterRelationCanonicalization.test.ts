import { characterDisplayOrder } from '../data/characterMetadata';
import {
  getCanonicalCharacterRelationStorageLocation,
  getCanonicalCounterEachOtherOwner,
  getCharacterFaction,
  mergeCanonicalRelationEntries,
} from './characterRelationCanonicalization';

describe('characterRelationCanonicalization', () => {
  it('should rank mice before cats using character grid order', () => {
    const firstMouseId = characterDisplayOrder.find(
      (id: string) => getCharacterFaction(id) === 'mouse'
    );
    const firstCatId = characterDisplayOrder.find(
      (id: string) => getCharacterFaction(id) === 'cat'
    );

    expect(firstMouseId).toBeDefined();
    expect(firstCatId).toBeDefined();
    expect(characterDisplayOrder.indexOf(firstMouseId!)).toBeLessThan(
      characterDisplayOrder.indexOf(firstCatId!)
    );
  });

  it('should store collaborators on the lower-ranked owner', () => {
    const mouseIds = characterDisplayOrder.filter(
      (id: string) => getCharacterFaction(id) === 'mouse'
    );
    const [firstMouseId, secondMouseId] = mouseIds;

    expect(firstMouseId).toBeDefined();
    expect(secondMouseId).toBeDefined();

    const location = getCanonicalCharacterRelationStorageLocation(
      secondMouseId!,
      'collaborators',
      firstMouseId!
    );

    expect(location).toEqual({
      ownerId: firstMouseId,
      kind: 'collaborators',
      targetId: secondMouseId,
    });
  });

  it('should store counterEachOther on the mouse side only', () => {
    const mouseId = characterDisplayOrder.find((id: string) => getCharacterFaction(id) === 'mouse');
    const catId = characterDisplayOrder.find((id: string) => getCharacterFaction(id) === 'cat');

    expect(mouseId).toBeDefined();
    expect(catId).toBeDefined();

    expect(getCanonicalCounterEachOtherOwner(mouseId!, catId!)).toBe(mouseId);
    expect(getCanonicalCounterEachOtherOwner(catId!, mouseId!)).toBe(mouseId);
  });

  it('should reject same-faction counterEachOther pairs', () => {
    const mouseIds = characterDisplayOrder.filter(
      (id: string) => getCharacterFaction(id) === 'mouse'
    );
    const [firstMouseId, secondMouseId] = mouseIds;

    expect(firstMouseId).toBeDefined();
    expect(secondMouseId).toBeDefined();
    expect(getCanonicalCounterEachOtherOwner(firstMouseId!, secondMouseId!)).toBeNull();
  });

  it('should report conflicting duplicate descriptions instead of silently merging', () => {
    const result = mergeCanonicalRelationEntries(
      {
        description: 'A description',
        isMinor: true,
      },
      {
        description: 'A different description',
        isMinor: false,
      }
    );

    expect(result.conflict).toEqual({
      currentDescription: 'A description',
      incomingDescription: 'A different description',
    });
    expect(result.merged).toBeNull();
  });

  it('should merge compatible duplicates conservatively', () => {
    const result = mergeCanonicalRelationEntries(
      {
        description: '',
        isMinor: true,
      },
      {
        description: 'Merged description',
        isMinor: false,
      }
    );

    expect(result.conflict).toBeNull();
    expect(result.merged).toMatchObject({
      description: 'Merged description',
      isMinor: false,
    });
  });
});
