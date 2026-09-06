import { readFileSync } from 'fs';

import type { EditSession } from '@/lib/edit/editSession';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

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
  let session: EditSession;

  beforeEach(() => {
    session = installTestEditSession();
  });

  afterEach(() => {
    clearTestEditSession(session);
    jest.resetModules();
  });

  it('keeps canonical domains pristine and independent from mutable edit-runtime stores', async () => {
    const staticData = await import('@/data/static');
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

      session.updateDomain(entityType, (runtimeTarget) => {
        const root = runtimeTarget as unknown as MutableRecord;
        const branch = asMutableRecord(root[firstBranchKey(root)]);
        branch.__edit_runtime_mutation__ = true;
      });
    }

    const { getCanonicalGameData } = await import('./canonicalSources');

    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      const canonicalRoot = getCanonicalGameData(entityType) as unknown as MutableRecord;
      const staticTarget = staticTargets[entityType];
      const runtimeTarget = session.readDomain(entityType) as unknown as MutableRecord;

      expect(canonicalRoot).toEqual(pristineByType[entityType]);
      expect(getCanonicalGameData(entityType)).toBe(canonicalRoot);

      for (const target of [staticTarget, runtimeTarget]) {
        const branchKey = firstBranchKey(target);
        expect(canonicalRoot).not.toBe(target);
        expect(canonicalRoot[branchKey]).not.toBe(target[branchKey]);
      }
    }

    const canonicalCharacters = getCanonicalGameData('characters');
    session.updateEntity({ entityType: 'characters', entityId: '汤姆' }, (character) => {
      character.description = 'mutable edit-runtime description';
    });
    expect(canonicalCharacters).toEqual(pristineByType.characters);
  });

  it('is server-only and has no mutable-store dependency', () => {
    const source = readFileSync('src/lib/gameData/published/canonicalSources.ts', 'utf8');

    expect(source).toMatch(/^import 'server-only';/);
    expect(source).not.toMatch(/valtio|@\/data\/store|editModeRegistry/);
  });
});
