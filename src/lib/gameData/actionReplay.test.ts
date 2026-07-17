import {
  applyPublicActionRows,
  PublicActionReplayInvariantError,
  resolvePublicActionTargets,
  type PublicActionTargetRegistry,
} from './actionReplay';
import type { PublicActionRow } from './publicActionsTypes';

const row = (id: string, entry: unknown, entityType = 'characters'): PublicActionRow => ({
  id,
  entity_type: entityType,
  entry,
  created_at: '2026-05-09T00:00:00.000Z',
  status: 'approved',
  message: null,
  reviewed_at: null,
  created_by: null,
});

describe('applyPublicActionRows', () => {
  it('should skip already handled rows', () => {
    const target: Record<string, unknown> = {};
    const handledIds = new Set(['already-applied']);

    const result = applyPublicActionRows({
      rows: [
        row('already-applied', {
          op: 'set',
          path: 'Tom.description',
          oldValue: undefined,
          newValue: 'new',
        }),
      ],
      handledIds,
      resolveTargets: () => [target],
    });

    expect(target).toEqual({});
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should skip invalid entries without marking them handled', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [row('invalid-entry', { op: 'replace', path: 'Tom.description' })],
      handledIds,
      resolveTargets: () => [{ Tom: {} }],
    });

    expect(handledIds.has('invalid-entry')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should apply one row to multiple targets', () => {
    const staticTarget: Record<string, unknown> = { Tom: { description: 'old' } };
    const editTarget: Record<string, unknown> = { Tom: { description: 'old' } };
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row('multi-target', {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        }),
      ],
      handledIds,
      resolveTargets: () => [staticTarget, editTarget],
    });

    expect(staticTarget).toEqual({ Tom: { description: 'new' } });
    expect(editTarget).toEqual({ Tom: { description: 'new' } });
    expect(result).toEqual({ handledCount: 1, mutatedCount: 1, handledIds: ['multi-target'] });
  });

  it('should roll back earlier entries when a later entry fails', () => {
    const target: Record<string, unknown> = {
      Locked: Object.freeze({ description: 'locked' }),
      Tom: { description: 'old' },
    };
    const handledIds = new Set<string>();
    const onError = jest.fn();

    const result = applyPublicActionRows({
      rows: [
        row('partially-failing-row', [
          {
            op: 'set',
            path: 'Tom.description',
            oldValue: 'old',
            newValue: 'new',
          },
          {
            op: 'set',
            path: 'Locked.description',
            oldValue: 'locked',
            newValue: 'unlocked',
          },
        ]),
      ],
      handledIds,
      resolveTargets: () => [target],
      onError,
    });

    expect(target).toEqual({
      Locked: { description: 'locked' },
      Tom: { description: 'old' },
    });
    expect(handledIds.has('partially-failing-row')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'partially-failing-row' }),
      expect.any(TypeError)
    );
  });

  it('should roll back earlier targets when a later target fails', () => {
    const firstTarget: Record<string, unknown> = { Tom: { description: 'old' } };
    const failingTarget: Record<string, unknown> = {
      Tom: Object.freeze({ description: 'old' }),
    };
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row('multi-target-failure', {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        }),
      ],
      handledIds,
      resolveTargets: () => [firstTarget, failingTarget],
    });

    expect(firstTarget).toEqual({ Tom: { description: 'old' } });
    expect(failingTarget).toEqual({ Tom: { description: 'old' } });
    expect(handledIds.has('multi-target-failure')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should abort replay when rollback cannot restore the target', () => {
    const baseTarget: Record<string, unknown> = {
      Locked: Object.freeze({ description: 'locked' }),
      Tom: { description: 'old' },
    };
    const target = new Proxy(baseTarget, {
      set() {
        throw new Error('rollback assignment failed');
      },
    });
    const handledIds = new Set<string>();
    const onError = jest.fn();
    const laterTarget: Record<string, unknown> = { Jerry: { description: 'old' } };

    expect(() =>
      applyPublicActionRows({
        rows: [
          row('rollback-failure', [
            {
              op: 'set',
              path: 'Tom.description',
              oldValue: 'old',
              newValue: 'new',
            },
            {
              op: 'set',
              path: 'Locked.description',
              oldValue: 'locked',
              newValue: 'unlocked',
            },
          ]),
          row(
            'later-row',
            {
              op: 'set',
              path: 'Jerry.description',
              oldValue: 'old',
              newValue: 'new',
            },
            'items'
          ),
        ],
        handledIds,
        resolveTargets: (entityType) => (entityType === 'characters' ? [target] : [laterTarget]),
        onError,
      })
    ).toThrow(PublicActionReplayInvariantError);

    expect(onError).not.toHaveBeenCalled();
    expect(handledIds.has('rollback-failure')).toBe(false);
    expect(laterTarget).toEqual({ Jerry: { description: 'old' } });
  });

  it('should preserve known no-op rows as handled without counting mutations', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row(
          'known-no-op',
          {
            op: 'set',
            path: 'cat.description',
            oldValue: 'old',
            newValue: 'new',
          },
          'factions'
        ),
      ],
      handledIds,
      resolveTargets: () => [],
    });

    expect(handledIds.has('known-no-op')).toBe(true);
    expect(result).toEqual({ handledCount: 1, mutatedCount: 0, handledIds: ['known-no-op'] });
  });

  it('should leave unknown target rows unhandled', () => {
    const handledIds = new Set<string>();

    const result = applyPublicActionRows({
      rows: [
        row(
          'unknown-target',
          {
            op: 'set',
            path: 'Tom.description',
            oldValue: 'old',
            newValue: 'new',
          },
          'unknown'
        ),
      ],
      handledIds,
      resolveTargets: () => null,
    });

    expect(handledIds.has('unknown-target')).toBe(false);
    expect(result).toEqual({ handledCount: 0, mutatedCount: 0, handledIds: [] });
  });

  it('should run default application inside applyWithin when provided', () => {
    const target: Record<string, unknown> = { Tom: { description: 'old' } };
    const calls: string[] = [];

    applyPublicActionRows({
      rows: [
        row('within', {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        }),
      ],
      handledIds: new Set<string>(),
      resolveTargets: () => [target],
      applyWithin: (actionRow, fn) => {
        calls.push(`before:${actionRow.id}`);
        fn();
        calls.push(`after:${actionRow.id}`);
      },
    });

    expect(calls).toEqual(['before:within', 'after:within']);
    expect(target).toEqual({ Tom: { description: 'new' } });
  });
});

describe('resolvePublicActionTargets', () => {
  it('should resolve client entities to the editable entity target', () => {
    const entitiesEdit: Record<string, unknown> = {};
    const registry: PublicActionTargetRegistry = {
      entities: [entitiesEdit],
    };

    expect(resolvePublicActionTargets(registry, 'entities')).toEqual([entitiesEdit]);
  });

  it('should resolve server entity types to static and editable targets', () => {
    const cards: Record<string, unknown> = {};
    const cardsEdit: Record<string, unknown> = {};
    const buffs: Record<string, unknown> = {};
    const buffsEdit: Record<string, unknown> = {};
    const items: Record<string, unknown> = {};
    const itemsEdit: Record<string, unknown> = {};
    const registry: PublicActionTargetRegistry = {
      cards: [cards, cardsEdit],
      buffs: [buffs, buffsEdit],
      items: [items, itemsEdit],
    };

    expect(resolvePublicActionTargets(registry, 'cards')).toEqual([cards, cardsEdit]);
    expect(resolvePublicActionTargets(registry, 'buffs')).toEqual([buffs, buffsEdit]);
    expect(resolvePublicActionTargets(registry, 'items')).toEqual([items, itemsEdit]);
  });

  it('should resolve factions to a known no-op target list', () => {
    const registry: PublicActionTargetRegistry = {
      factions: [],
    };

    expect(resolvePublicActionTargets(registry, 'factions')).toEqual([]);
  });

  it('should apply entity rows through registry targets with current root-shaped paths', () => {
    const entities: Record<string, unknown> = {
      cat: {
        Rocket: {
          description: 'old',
        },
      },
    };
    const registry: PublicActionTargetRegistry = {
      entities: [entities],
    };

    const result = applyPublicActionRows({
      rows: [
        row(
          'entity-row',
          {
            op: 'set',
            path: 'cat.Rocket.description',
            oldValue: 'old',
            newValue: 'new',
          },
          'entities'
        ),
      ],
      handledIds: new Set<string>(),
      resolveTargets: (entityType) => resolvePublicActionTargets(registry, entityType),
    });

    expect(entities).toEqual({
      cat: {
        Rocket: {
          description: 'new',
        },
      },
    });
    expect(result).toEqual({ handledCount: 1, mutatedCount: 1, handledIds: ['entity-row'] });
  });
});
