import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import { applyCheckedActionRow } from '@/lib/gameData/checkedActionReplay';
import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';

import {
  createApprovedActionSnapshot,
  type ApprovedActionSnapshotRowInput,
} from './approvedActionSnapshot';
import { getCanonicalGameData } from './canonicalSources';
import { PublishedGameDataReplayError, selectPublishedGameData } from './selectPublishedDomain';
import type { PublishedGameDataByType } from './types';

jest.mock('server-only', () => ({}), { virtual: true });

type MutableRecord = Record<string, unknown>;

function decodedRow(
  entityType: string,
  rowId: string,
  entry: unknown
): ApprovedActionSnapshotRowInput {
  const decoded = decodeStoredActionRow({ id: rowId, entry });
  if (!decoded.success) throw new Error(decoded.error.message);
  return { entityType, decodedRow: decoded.value };
}

function asMutableRecord(value: unknown): MutableRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a game-data record');
  }
  return value as MutableRecord;
}

describe('selectPublishedGameData', () => {
  it.each(PUBLISHABLE_ENTITY_TYPES)(
    'matches checked replay and isolates touched branches for %s',
    (entityType) => {
      const canonical = getCanonicalGameData(entityType);
      const canonicalRoot = canonical as unknown as MutableRecord;
      const canonicalBefore = structuredClone(canonicalRoot);
      const touchedKey = Object.keys(canonicalRoot)[0]!;
      const untouchedKey = Object.keys(canonicalRoot)[1]!;
      const input = decodedRow(entityType, `row-${entityType}`, {
        op: 'set',
        path: `${touchedKey}.__published_test_marker__`,
        newValue: entityType,
      });
      const snapshot = createApprovedActionSnapshot([input]);
      const snapshotBefore = structuredClone(snapshot);

      const result = selectPublishedGameData(entityType, canonical, snapshot);
      const expected = structuredClone(canonicalRoot);
      const replayed = applyCheckedActionRow({
        rowId: input.decodedRow.rowId,
        actions: input.decodedRow.actions,
        targets: [expected],
      });

      expect(replayed.success).toBe(true);
      expect(result).toEqual(expected);
      expect(canonical).toEqual(canonicalBefore);
      expect(snapshot).toEqual(snapshotBefore);
      expect(result).not.toBe(canonical);
      expect((result as unknown as MutableRecord)[touchedKey]).not.toBe(canonicalRoot[touchedKey]);
      expect((result as unknown as MutableRecord)[untouchedKey]).toBe(canonicalRoot[untouchedKey]);
    }
  );

  it('supports replacement, nested array edits, deletion, creation, and multi-entry rows', () => {
    const canonical = getCanonicalGameData('characters');
    const replacement = { name: 'replacement' };
    const snapshot = createApprovedActionSnapshot([
      decodedRow('characters', 'row-fixtures', [
        { op: 'set', path: '汤姆.skills.0.description', newValue: 'array edit' },
        { op: 'delete', path: '汤姆.description' },
        { op: 'set', path: '__new_character__.description', newValue: 'created' },
        { op: 'set', path: '图多盖洛', newValue: replacement },
      ]),
    ]);

    const result = selectPublishedGameData('characters', canonical, snapshot);
    const mutableResult = result as unknown as MutableRecord;
    const tom = asMutableRecord(mutableResult['汤姆']);
    const firstSkill = asMutableRecord((tom.skills as unknown[])[0]);

    expect(firstSkill.description).toBe('array edit');
    expect(tom).not.toHaveProperty('description');
    expect(mutableResult['__new_character__']).toEqual({ description: 'created' });
    expect(mutableResult['图多盖洛']).toEqual(replacement);
  });

  it('uses faction roots and ignores rows for unknown or other domains', () => {
    const canonical = getCanonicalGameData('specialSkills');
    const catSkillId = Object.keys(canonical.cat)[0]!;
    const snapshot = createApprovedActionSnapshot([
      decodedRow('unknown-domain', 'row-unknown', {
        op: 'set',
        path: 'cat.__unknown__',
        newValue: true,
      }),
      decodedRow('items', 'row-items', {
        op: 'set',
        path: '__other_domain__',
        newValue: true,
      }),
      decodedRow('specialSkills', 'row-skills', {
        op: 'set',
        path: `cat.${catSkillId}.description`,
        newValue: 'faction edit',
      }),
    ]);

    const result = selectPublishedGameData('specialSkills', canonical, snapshot);

    expect(result.cat[catSkillId]?.description).toBe('faction edit');
    expect(result.cat).not.toBe(canonical.cat);
    expect(result.mouse).toBe(canonical.mouse);
    expect(result).not.toHaveProperty('__other_domain__');
  });

  it('uses call-local handled IDs and produces independent repeated results', () => {
    const canonical = getCanonicalGameData('items');
    const itemId = Object.keys(canonical)[0]!;
    const snapshot = createApprovedActionSnapshot([
      decodedRow('items', 'duplicate-row', {
        op: 'set',
        path: `${itemId}.description`,
        newValue: 'first',
      }),
      decodedRow('items', 'duplicate-row', {
        op: 'set',
        path: `${itemId}.description`,
        newValue: 'second',
      }),
    ]);

    const first = selectPublishedGameData('items', canonical, snapshot);
    const second = selectPublishedGameData('items', canonical, snapshot);

    expect(first).toEqual(second);
    expect(first[itemId]?.description).toBe('first');
    expect(first[itemId]).not.toBe(second[itemId]);
  });

  it('throws without mutating canonical data when a later row fails atomically', () => {
    const canonical = getCanonicalGameData('items');
    const canonicalBefore = structuredClone(canonical);
    const itemId = Object.keys(canonical)[0]!;
    const snapshot = createApprovedActionSnapshot([
      decodedRow('items', 'row-success', {
        op: 'set',
        path: `${itemId}.description`,
        newValue: 'earlier success',
      }),
      decodedRow('items', 'row-failure', [
        {
          op: 'set',
          path: `${itemId}.description`,
          newValue: 'must roll back',
        },
        { op: 'delete', path: `${itemId}.__missing__` },
      ]),
    ]);

    expect(() => selectPublishedGameData('items', canonical, snapshot)).toThrow(
      PublishedGameDataReplayError
    );
    try {
      selectPublishedGameData('items', canonical, snapshot);
    } catch (error) {
      expect((error as PublishedGameDataReplayError).detail).toMatchObject({
        rowId: 'row-failure',
        stage: 'apply',
        actionIndex: 1,
      });
    }
    expect(canonical).toEqual(canonicalBefore);
  });

  it('keeps malformed stored input outside the snapshot boundary', () => {
    const decoded = decodeStoredActionRow({
      id: 'malformed',
      entry: { op: 'set', path: '__proto__.polluted', newValue: true },
    });

    expect(decoded).toMatchObject({ success: false, error: { code: 'invalid_path' } });
  });
});

function assertDeepReadonlyContract(data: PublishedGameDataByType): void {
  if (false) {
    // @ts-expect-error Published roots are readonly.
    data.items.newItem = {};
    // @ts-expect-error Published nested values are deeply readonly.
    data.characters['汤姆']!.skills[0]!.description = 'mutation';
  }
}

assertDeepReadonlyContract({} as PublishedGameDataByType);
