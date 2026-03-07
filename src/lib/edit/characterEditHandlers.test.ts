import { proxy } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import type { CharacterWithFaction } from '@/lib/types';
import { characters } from '@/data';

import { isOriginalCharacter } from './characterEditHandlers';

describe('characterEditHandlers', () => {
  const draftCharacterId = '__copilot-draft-character__';
  const canonicalTom = structuredClone(
    GameDataManager.getCharacters()['汤姆']!
  ) as CharacterWithFaction;

  afterEach(() => {
    delete characters[draftCharacterId];

    const tom = characters['汤姆'] as unknown as Record<string, unknown>;
    Object.keys(tom).forEach((key) => {
      if (!(key in canonicalTom)) {
        delete tom[key];
      }
    });
    Object.assign(tom, structuredClone(canonicalTom));

    GameDataManager.invalidate({ characters: true });
  });

  it('does not classify locally created draft characters as canonical characters', () => {
    const draftCharacter = structuredClone(canonicalTom);
    draftCharacter.id = draftCharacterId;

    characters[draftCharacterId] = proxy(draftCharacter);

    expect(isOriginalCharacter(draftCharacterId)).toBe(false);
  });

  it('keeps canonical game data separate from local character edits', () => {
    const canonicalDescription = GameDataManager.getCharacters()['汤姆']!.description;

    characters['汤姆']!.description = '本地测试草稿描述';

    expect(GameDataManager.getCharacters()['汤姆']!.description).toBe(canonicalDescription);
  });
});
