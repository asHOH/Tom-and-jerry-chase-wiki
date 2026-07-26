import { resolveGameDataAdvancedSubmit } from './submitMode';

const entry = [{ op: 'set', path: 'item.description', newValue: 'new' }] as const;

describe('resolveGameDataAdvancedSubmit', () => {
  it('hides advanced submit when the draft cannot auto publish', () => {
    expect(
      resolveGameDataAdvancedSubmit({
        entityType: 'items',
        entries: entry,
        canAll: () => false,
      })
    ).toEqual({
      available: false,
      defaultOutcome: 'pending',
      modes: ['default'],
    });
  });

  it('offers auto publish and normal submit when the draft cannot self-review', () => {
    expect(
      resolveGameDataAdvancedSubmit({
        entityType: 'items',
        entries: entry,
        canAll: (permission) => permission === 'game_data_action.auto_approve',
      })
    ).toEqual({
      available: true,
      defaultOutcome: 'public_pending',
      modes: ['default', 'force_pending'],
    });
  });

  it('offers full reviewer submit modes when the draft can auto publish and self-review', () => {
    expect(
      resolveGameDataAdvancedSubmit({
        entityType: 'items',
        entries: entry,
        canAll: () => true,
      })
    ).toEqual({
      available: true,
      defaultOutcome: 'approved',
      modes: ['default', 'force_public_pending', 'force_pending'],
    });
  });
});
