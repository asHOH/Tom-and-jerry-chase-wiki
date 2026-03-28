import { catCharactersWithImages } from './catCharacters';
import {
  catCharacterIds,
  characterDisplayOrder,
  characterFactionById,
  getCharacterNavigationInfo,
  mouseCharacterIds,
} from './characterMetadata';
import { mouseCharactersWithImages } from './mouseCharacters';

describe('characterMetadata', () => {
  it('should stay in sync with mouse and cat character data', () => {
    const mouseIdsFromData = Object.keys(mouseCharactersWithImages);
    const catIdsFromData = Object.keys(catCharactersWithImages);

    expect(mouseCharacterIds).toEqual(mouseIdsFromData);
    expect(catCharacterIds).toEqual(catIdsFromData);
    expect(characterDisplayOrder).toEqual([...mouseIdsFromData, ...catIdsFromData]);
  });

  it('should not contain duplicate ids and should keep faction buckets correct', () => {
    expect(new Set(characterDisplayOrder).size).toBe(characterDisplayOrder.length);
    expect(Object.keys(characterFactionById).sort()).toEqual([...characterDisplayOrder].sort());

    mouseCharacterIds.forEach((characterId) => {
      expect(characterFactionById[characterId]).toBe('mouse');
    });

    catCharacterIds.forEach((characterId) => {
      expect(characterFactionById[characterId]).toBe('cat');
    });
  });

  it('should provide stable adjacent navigation ids in display order', () => {
    const first = getCharacterNavigationInfo(mouseCharacterIds[0]);
    const middle = getCharacterNavigationInfo(mouseCharacterIds[1]);
    const lastCharacterId = catCharacterIds[catCharacterIds.length - 1];

    expect(lastCharacterId).toBeDefined();

    const last = getCharacterNavigationInfo(lastCharacterId!);

    expect(first.previousId).toBeNull();
    expect(first.nextId).toBe(mouseCharacterIds[1]);
    expect(first.currentIndex).toBe(0);

    expect(middle.previousId).toBe(mouseCharacterIds[0]);
    expect(middle.nextId).toBe(mouseCharacterIds[2]);

    expect(last.nextId).toBeNull();
    expect(last.previousId).toBe(catCharacterIds[catCharacterIds.length - 2]);
    expect(last.currentIndex).toBe(characterDisplayOrder.length - 1);
    expect(last.totalCharacters).toBe(characterDisplayOrder.length);
  });
});
