import { characters, cardData, factions } from '../../data';
import { Character, Card, FactionId } from '../../data/types';

describe('Data Validation', () => {
  describe('Characters Data', () => {
    const characterArray = Object.values(characters);

    it('should have at least one character', () => {
      expect(characterArray.length).toBeGreaterThan(0);
    });

    it('should have characters for both factions', () => {
      const catCharacters = characterArray.filter(c => c.faction.id === 'cat');
      const mouseCharacters = characterArray.filter(c => c.faction.id === 'mouse');
      
      expect(catCharacters.length).toBeGreaterThan(0);
      expect(mouseCharacters.length).toBeGreaterThan(0);
    });

    it('should have valid character structure', () => {
      characterArray.forEach((character: Character) => {
        expect(character.id).toBeDefined();
        expect(character.description).toBeDefined();
        expect(character.factionId).toBeDefined();
        expect(character.factionId).toMatch(/^(cat|mouse)$/);
        expect(character.skills).toBeDefined();
        expect(Array.isArray(character.skills)).toBe(true);
      });
    });

    it('should have valid HP values for all characters', () => {
      characterArray.forEach((character: Character) => {
        if (character.maxHp) {
          expect(character.maxHp).toBeGreaterThan(0);
          expect(character.maxHp).toBeLessThan(1000); // Reasonable upper limit
        }
      });
    });

    it('should have valid positioning tags', () => {
      characterArray.forEach((character: Character) => {
        if (character.factionId === 'cat' && character.catPositioningTags) {
          character.catPositioningTags.forEach(tag => {
            expect(tag.tagName).toBeDefined();
            expect(typeof tag.isMinor).toBe('boolean');
            expect(tag.description).toBeDefined();
          });
        }
        
        if (character.factionId === 'mouse' && character.mousePositioningTags) {
          character.mousePositioningTags.forEach(tag => {
            expect(tag.tagName).toBeDefined();
            expect(typeof tag.isMinor).toBe('boolean');
            expect(tag.description).toBeDefined();
          });
        }
      });
    });

    it('should have valid skills for all characters', () => {
      characterArray.forEach((character: Character) => {
        expect(character.skills.length).toBeGreaterThan(0);
        
        character.skills.forEach(skill => {
          expect(skill.id).toBeDefined();
          expect(skill.name).toBeDefined();
          expect(skill.type).toMatch(/^(ACTIVE|WEAPON1|WEAPON2|PASSIVE)$/);
          expect(Array.isArray(skill.skillLevels)).toBe(true);
          expect(skill.skillLevels.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Knowledge Cards Data', () => {
    const cardsArray = Object.values(cardData);

    it('should have at least one card', () => {
      expect(cardsArray.length).toBeGreaterThan(0);
    });

    it('should have valid card structure', () => {
      cardsArray.forEach((card: Card) => {
        expect(card.id).toBeDefined();
        expect(card.rank).toMatch(/^[SABC]$/);
        expect(card.cost).toBeGreaterThan(0);
        expect(card.cost).toBeLessThanOrEqual(10);
        expect(card.description).toBeDefined();
        expect(Array.isArray(card.levels)).toBe(true);
      });
    });

    it('should have valid cost ranges by rank', () => {
      cardsArray.forEach((card: Card) => {
        // S rank cards should generally be more expensive
        if (card.rank === 'S') {
          expect(card.cost).toBeGreaterThanOrEqual(4);
        }
        // C rank cards should generally be cheaper
        if (card.rank === 'C') {
          expect(card.cost).toBeLessThanOrEqual(6);
        }
      });
    });

    it('should have valid levels for all cards', () => {
      cardsArray.forEach((card: Card) => {
        expect(card.levels.length).toBeGreaterThan(0);
        expect(card.levels.length).toBeLessThanOrEqual(3);
        
        card.levels.forEach((level, index) => {
          expect(level.level).toBe(index + 1);
          expect(level.description).toBeDefined();
        });
      });
    });
  });

  describe('Factions Data', () => {
    it('should have both cat and mouse factions', () => {
      expect(factions.cat).toBeDefined();
      expect(factions.mouse).toBeDefined();
    });

    it('should have valid faction structure', () => {
      Object.values(factions).forEach(faction => {
        expect(faction.id).toMatch(/^(cat|mouse)$/);
        expect(faction.name).toBeDefined();
        expect(faction.description).toBeDefined();
        expect(Array.isArray(faction.characters)).toBe(true);
      });
    });

    it('should have characters in each faction', () => {
      expect(factions.cat.characters.length).toBeGreaterThan(0);
      expect(factions.mouse.characters.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent character IDs between characters and factions', () => {
      const characterIds = Object.keys(characters);
      const factionCharacterIds = [
        ...factions.cat.characters.map(c => c.id),
        ...factions.mouse.characters.map(c => c.id)
      ];
      
      expect(characterIds.sort()).toEqual(factionCharacterIds.sort());
    });

    it('should have unique character IDs', () => {
      const characterIds = Object.keys(characters);
      const uniqueIds = [...new Set(characterIds)];
      expect(characterIds.length).toBe(uniqueIds.length);
    });

    it('should have unique card IDs', () => {
      const cardIds = Object.keys(cardData);
      const uniqueIds = [...new Set(cardIds)];
      expect(cardIds.length).toBe(uniqueIds.length);
    });
  });
});
