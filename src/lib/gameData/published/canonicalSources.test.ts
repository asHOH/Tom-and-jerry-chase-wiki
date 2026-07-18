import { readFileSync } from 'fs';

import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';

jest.mock('server-only', () => ({}), { virtual: true });

type MutableRecord = Record<string, unknown>;

function asMutableRecord(value: unknown): MutableRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a game-data record');
  }

  return value as MutableRecord;
}

function firstBranchKey(root: MutableRecord): string {
  const key = Object.keys(root)[0];
  if (!key) throw new Error('Expected a non-empty game-data record');
  return key;
}

describe('canonical game-data sources', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('constructs every canonical domain pristinely after legacy targets load and mutate', async () => {
    const legacy = await import('@/data');
    const legacyTargets: Record<PublishableEntityType, readonly MutableRecord[]> = {
      achievements: [legacy.achievements, legacy.achievementsEdit],
      characters: [legacy.characters],
      cards: [legacy.cards, legacy.cardsEdit],
      entities: [legacy.entities],
      buffs: [legacy.buffs, legacy.buffsEdit],
      items: [legacy.items, legacy.itemsEdit],
      fixtures: [legacy.fixtures, legacy.fixturesEdit],
      maps: [legacy.maps, legacy.mapsEdit],
      modes: [legacy.modes, legacy.modesEdit],
      specialSkills: [legacy.specialSkills, legacy.specialSkillsEdit],
    };
    const pristineByType = {} as Record<PublishableEntityType, unknown>;

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      const targets = legacyTargets[entityType];
      const primaryTarget = targets[0];
      if (!primaryTarget) throw new Error(`Missing legacy target for ${entityType}`);

      pristineByType[entityType] = structuredClone(primaryTarget);
      for (const [targetIndex, target] of targets.entries()) {
        const branch = asMutableRecord(target[firstBranchKey(target)]);
        branch[`__legacy_mutation_${targetIndex}__`] = true;
      }
    }

    const { getCanonicalGameData } = await import('./canonicalSources');

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      const canonicalRoot = getCanonicalGameData(entityType) as unknown as MutableRecord;
      const targets = legacyTargets[entityType];

      expect(canonicalRoot).toEqual(pristineByType[entityType]);
      expect(getCanonicalGameData(entityType)).toBe(canonicalRoot);

      for (const target of targets) {
        const branchKey = firstBranchKey(target);
        expect(canonicalRoot).not.toBe(target);
        expect(canonicalRoot[branchKey]).not.toBe(target[branchKey]);
      }
    }
  });

  it('is server-only and has no mutable-store dependency', () => {
    const source = readFileSync('src/lib/gameData/published/canonicalSources.ts', 'utf8');

    expect(source).toMatch(/^import 'server-only';/);
    expect(source).not.toMatch(/valtio|@\/data\/store|editModeRegistry/);
  });
});
