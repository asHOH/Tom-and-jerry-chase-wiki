import { GameDataManager } from './dataManager';

describe('GameDataManager', () => {
  describe('getFactions', () => {
    it('should return factions with characters', () => {
      const factions = GameDataManager.getFactions();

      expect(factions).toBeDefined();
      expect(Object.keys(factions)).toContain('cat');
      expect(Object.keys(factions)).toContain('mouse');

      // Check that factions have characters
      const catFaction = factions['cat'];
      expect(catFaction).toBeDefined();
      expect(catFaction?.characters).toBeDefined();
      expect(Array.isArray(catFaction?.characters)).toBe(true);

      // Check character structure
      if (catFaction?.characters && catFaction.characters.length > 0) {
        const firstCharacter = catFaction.characters[0];
        expect(firstCharacter).toHaveProperty('id');
        expect(firstCharacter).toHaveProperty('name');
        expect(firstCharacter).toHaveProperty('imageUrl');
        expect(firstCharacter).toHaveProperty('positioningTags');
      }
    });
  });

  describe('getCharacters', () => {
    it('should return characters with faction references', () => {
      const characters = GameDataManager.getCharacters();

      expect(characters).toBeDefined();
      expect(typeof characters).toBe('object');

      // Check character structure
      const characterIds = Object.keys(characters);
      if (characterIds.length > 0) {
        const firstCharacterId = characterIds[0];
        if (firstCharacterId) {
          const firstCharacter = characters[firstCharacterId];
          if (firstCharacter) {
            expect(firstCharacter).toHaveProperty('id');
            expect(firstCharacter).toHaveProperty('faction');
            expect(firstCharacter.faction).toHaveProperty('id');
            expect(firstCharacter.faction).toHaveProperty('name');
            expect(firstCharacter).toHaveProperty('imageUrl');
          }
        }
      }
    });
  });

  describe('getCards', () => {
    it('should return cards with faction references', () => {
      const cards = GameDataManager.getCards();

      expect(cards).toBeDefined();
      expect(typeof cards).toBe('object');

      // Check card structure
      const cardIds = Object.keys(cards);
      if (cardIds.length > 0) {
        const firstCardId = cardIds[0];
        if (firstCardId) {
          const firstCard = cards[firstCardId];
          if (firstCard) {
            expect(firstCard).toHaveProperty('id');
            expect(firstCard).toHaveProperty('faction');
            expect(firstCard.faction).toHaveProperty('id');
            expect(firstCard.faction).toHaveProperty('name');
            expect(firstCard).toHaveProperty('imageUrl');
          }
        }
      }
    });
  });

  describe('getRawData', () => {
    it('should return raw data objects', () => {
      const rawData = GameDataManager.getRawData();

      expect(rawData).toBeDefined();
      expect(rawData).toHaveProperty('factionData');
      expect(rawData).toHaveProperty('characterData');
      expect(rawData).toHaveProperty('cardData');

      // Check raw faction data
      expect(rawData.factionData).toHaveProperty('cat');
      expect(rawData.factionData).toHaveProperty('mouse');

      // Check that raw data doesn't have derived properties
      expect(rawData.factionData.cat).not.toHaveProperty('characters');
      expect(rawData.factionData.mouse).not.toHaveProperty('characters');
    });
  });

  describe('data consistency', () => {
    it('should maintain data consistency between different methods', () => {
      const factions = GameDataManager.getFactions();
      const characters = GameDataManager.getCharacters();

      // Count characters in factions
      const catCharactersInFaction = factions['cat']?.characters?.length || 0;
      const mouseCharactersInFaction = factions['mouse']?.characters?.length || 0;

      // Count characters by faction in characters object
      const allCharacters = Object.values(characters);
      const catCharactersInCharacters = allCharacters.filter((c) => c.faction.id === 'cat').length;
      const mouseCharactersInCharacters = allCharacters.filter(
        (c) => c.faction.id === 'mouse'
      ).length;

      expect(catCharactersInFaction).toBe(catCharactersInCharacters);
      expect(mouseCharactersInFaction).toBe(mouseCharactersInCharacters);
    });
  });
});
