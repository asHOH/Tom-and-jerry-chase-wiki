import { GameDataManager } from './dataManager';

describe('GameDataManager caching', () => {
  it('returns stable references across calls', () => {
    GameDataManager.invalidate();
    const c1 = GameDataManager.getCharacters();
    const c2 = GameDataManager.getCharacters();
    expect(c1).toBe(c2);

    const f1 = GameDataManager.getFactions();
    const f2 = GameDataManager.getFactions();
    expect(f1).toBe(f2);

    const k1 = GameDataManager.getCards();
    const k2 = GameDataManager.getCards();
    expect(k1).toBe(k2);
  });

  it('produces new references after invalidation', () => {
    GameDataManager.invalidate();
    const beforeChars = GameDataManager.getCharacters();
    const beforeFactions = GameDataManager.getFactions();
    const beforeCards = GameDataManager.getCards();

    GameDataManager.invalidate();

    const afterChars = GameDataManager.getCharacters();
    const afterFactions = GameDataManager.getFactions();
    const afterCards = GameDataManager.getCards();

    expect(afterChars).not.toBe(beforeChars);
    expect(afterFactions).not.toBe(beforeFactions);
    expect(afterCards).not.toBe(beforeCards);
  });

  it('allows selective invalidation', () => {
    GameDataManager.invalidate();
    const c1 = GameDataManager.getCharacters();
    const f1 = GameDataManager.getFactions();
    const k1 = GameDataManager.getCards();

    GameDataManager.invalidate({ characters: true });
    const c2 = GameDataManager.getCharacters();
    const f2 = GameDataManager.getFactions();
    const k2 = GameDataManager.getCards();

    expect(c2).not.toBe(c1);
    // Factions depend on characters so they should also be rebuilt lazily
    expect(f2).not.toBe(f1);
    // Cards unaffected
    expect(k2).toBe(k1);
  });
});
