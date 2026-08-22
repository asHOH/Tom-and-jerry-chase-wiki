import { readFileSync } from 'fs';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

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
  let runtime: ActiveEditRuntime;

  beforeEach(() => {
    runtime = installTestEditRuntime();
  });

  afterEach(() => {
    clearTestEditRuntime(runtime);
    jest.resetModules();
  });

  it('keeps canonical domains pristine and independent from mutable edit-runtime stores', async () => {
    const staticData = await import('@/data/static');
    const editRuntimeTargets: Record<PublishableEntityType, MutableRecord> = {
      achievements: runtime.stores.achievements,
      characters: runtime.stores.characters,
      cards: runtime.stores.cards,
      entities: runtime.stores.entities,
      buffs: runtime.stores.buffs,
      items: runtime.stores.items,
      fixtures: runtime.stores.fixtures,
      maps: runtime.stores.maps,
      modes: runtime.stores.modes,
      specialSkills: runtime.stores.specialSkills,
      traits: runtime.stores.traits,
    };
    const staticTargets: Record<PublishableEntityType, MutableRecord> = {
      achievements: staticData.achievements,
      characters: staticData.characters,
      cards: staticData.cards,
      entities: staticData.entities,
      buffs: staticData.buffs,
      items: staticData.items,
      fixtures: staticData.fixtures,
      maps: staticData.maps,
      modes: staticData.modes,
      specialSkills: staticData.specialSkills,
      traits: staticData.traits,
    };
    const pristineByType = {} as Record<PublishableEntityType, unknown>;

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      const staticTarget = staticTargets[entityType];
      pristineByType[entityType] = structuredClone(staticTarget);

      const runtimeTarget = editRuntimeTargets[entityType];
      const branch = asMutableRecord(runtimeTarget[firstBranchKey(runtimeTarget)]);
      branch.__edit_runtime_mutation__ = true;
    }

    const { getCanonicalGameData } = await import('./canonicalSources');

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      const canonicalRoot = getCanonicalGameData(entityType) as unknown as MutableRecord;
      const staticTarget = staticTargets[entityType];
      const runtimeTarget = editRuntimeTargets[entityType];

      expect(canonicalRoot).toEqual(pristineByType[entityType]);
      expect(getCanonicalGameData(entityType)).toBe(canonicalRoot);

      for (const target of [staticTarget, runtimeTarget]) {
        const branchKey = firstBranchKey(target);
        expect(canonicalRoot).not.toBe(target);
        expect(canonicalRoot[branchKey]).not.toBe(target[branchKey]);
      }
    }

    const canonicalCharacters = getCanonicalGameData('characters');
    runtime.stores.characters['汤姆']!.description = 'mutable edit-runtime description';
    expect(canonicalCharacters).toEqual(pristineByType.characters);
  });

  it('is server-only and has no mutable-store dependency', () => {
    const source = readFileSync('src/lib/gameData/published/canonicalSources.ts', 'utf8');

    expect(source).toMatch(/^import 'server-only';/);
    expect(source).not.toMatch(/valtio|@\/data\/store|editModeRegistry/);
  });
});
