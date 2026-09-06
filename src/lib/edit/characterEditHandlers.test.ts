import { proxy } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import type { CharacterWithFaction } from '@/lib/types';

import { handleCharacterIdChange, isOriginalCharacter } from './characterEditHandlers';

describe('characterEditHandlers', () => {
  const draftCharacterId = '__copilot-draft-character__';
  const canonicalTom = structuredClone(
    GameDataManager.getCharacters()['汤姆']!
  ) as CharacterWithFaction;
  let characters: Record<string, CharacterWithFaction>;

  beforeEach(() => {
    characters = proxy(structuredClone(GameDataManager.getCharacters())) as Record<
      string,
      CharacterWithFaction
    >;
  });

  it('does not classify locally created draft characters as canonical characters', () => {
    const draftCharacter = structuredClone(canonicalTom);
    draftCharacter.id = draftCharacterId;

    characters[draftCharacterId] = draftCharacter;

    expect(isOriginalCharacter(draftCharacterId)).toBe(false);
  });

  it('creates and navigates to a draft character through the supplied store capability', () => {
    const handleSelectCharacter = jest.fn();

    handleCharacterIdChange(
      characters,
      '汤姆',
      draftCharacterId,
      'cat',
      handleSelectCharacter,
      true
    );

    expect(characters[draftCharacterId]).toMatchObject({
      id: draftCharacterId,
      factionId: 'cat',
    });
    expect(isOriginalCharacter(draftCharacterId)).toBe(false);
    expect(handleSelectCharacter).toHaveBeenCalledWith(draftCharacterId);
  });

  it('keeps canonical game data separate from local character edits', () => {
    const canonicalDescription = GameDataManager.getCharacters()['汤姆']!.description;

    characters['汤姆']!.description = '本地测试草稿描述';

    expect(GameDataManager.getCharacters()['汤姆']!.description).toBe(canonicalDescription);
  });
});
