import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

const LEGACY_ACTOR_PROFILE_FIELDS = [
  'maxHp',
  'attackBoost',
  'hpRecovery',
  'moveSpeed',
  'jumpHeight',
  'clawKnifeCdHit',
  'clawKnifeCdUnhit',
  'clawKnifeRange',
  'initialItem',
  'storePurchaseTime',
  'cheesePushSpeed',
  'wallCrackDamageBoost',
  'gender',
] as const;

const characters = [
  ...Object.values(catCharactersWithImages),
  ...Object.values(mouseCharactersWithImages),
];

describe('legacy actor profile data removal', () => {
  it('should leave no covered legacy field on a playable character definition', () => {
    for (const character of characters) {
      for (const field of LEGACY_ACTOR_PROFILE_FIELDS) {
        expect(Object.hasOwn(character, field)).toBe(false);
      }
    }

    expect(catCharactersWithImages['苏蕊']).toMatchObject({
      specialClawKnifeCdHit: 8,
      specialClawKnifeCdUnhit: 4,
    });
  });

  it('should retain the reviewed clean parity report', () => {
    const report = JSON.parse(
      readFileSync(resolve(process.cwd(), 'docs/reports/character-role-parity.json'), 'utf8')
    ) as {
      summary: { unexplainedDifferenceCount: number };
      unexplainedDifferences: unknown[];
    };

    expect(report.summary.unexplainedDifferenceCount).toBe(0);
    expect(report.unexplainedDifferences).toEqual([]);
  });

  it('should ignore the raw actor-profile source without tracking it', () => {
    const rawPath = 'src/data/roles.json';
    const ignoredPath = execFileSync('git', ['check-ignore', '--', rawPath], {
      encoding: 'utf8',
    }).trim();
    const trackedPath = execFileSync('git', ['ls-files', '--', rawPath], {
      encoding: 'utf8',
    }).trim();

    expect(ignoredPath).toBe(rawPath);
    expect(trackedPath).toBe('');
  });
});
