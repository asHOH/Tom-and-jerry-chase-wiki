import { GameDataManager } from '@/lib/dataManager';
import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import type { CharacterWithFaction } from '@/lib/types';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import { isOriginalCharacter } from './characterEditHandlers';

describe('characterEditHandlers', () => {
  const draftCharacterId = '__copilot-draft-character__';
  const canonicalTom = structuredClone(
    GameDataManager.getCharacters()['汤姆']!
  ) as CharacterWithFaction;
  let runtime: ActiveEditRuntime;
  let characters: ActiveEditRuntime['stores']['characters'];

  beforeEach(() => {
    runtime = installTestEditRuntime();
    characters = runtime.stores.characters;
  });

  afterEach(() => {
    clearTestEditRuntime(runtime);
  });

  it('does not classify locally created draft characters as canonical characters', () => {
    const draftCharacter = structuredClone(canonicalTom);
    draftCharacter.id = draftCharacterId;

    characters[draftCharacterId] = draftCharacter;

    expect(isOriginalCharacter(draftCharacterId)).toBe(false);
  });

  it('keeps canonical game data separate from local character edits', () => {
    const canonicalDescription = GameDataManager.getCharacters()['汤姆']!.description;

    characters['汤姆']!.description = '本地测试草稿描述';

    expect(GameDataManager.getCharacters()['汤姆']!.description).toBe(canonicalDescription);
  });
});
