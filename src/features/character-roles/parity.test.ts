import type { Character } from '@/data/types';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

import { createCharacterRoleParityReport } from './parity';

const characters = [
  ...Object.values(catCharactersWithImages),
  ...Object.values(mouseCharactersWithImages),
] as Character[];

describe('createCharacterRoleParityReport', () => {
  it('has no unexplained directly equivalent field differences', () => {
    const report = createCharacterRoleParityReport(characters);

    expect(report.unexplainedDifferences).toEqual([]);
    expect(report.summary.reviewedCorrectionCount).toBe(41);
    expect(report.summary.playableCharacterCount).toBe(characters.length);
  });

  it('records every old and newly derived integer jump height', () => {
    const report = createCharacterRoleParityReport(characters);

    expect(report.jumpHeights).toHaveLength(characters.length);
    expect(report.jumpHeights.every(({ canonicalValue }) => Number.isInteger(canonicalValue))).toBe(
      true
    );
    expect(report.jumpHeights.find(({ characterId }) => characterId === '汤姆')).toEqual({
      characterId: '汤姆',
      legacyValue: 420,
      canonicalValue: 483,
      changed: true,
    });
  });
});
