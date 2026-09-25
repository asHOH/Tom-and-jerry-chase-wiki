import type { Action } from '@/lib/edit/diffUtils';

import { preparePendingActionRecovery } from './pendingActionRecovery';

const original = {
  Tom: {
    skills: [
      { id: 'passive', skillLevels: [{ level: 1, description: 'old' }] },
      { id: 'active', skillLevels: [{ level: 1, description: 'old' }] },
    ],
  },
};
const edit: Action = {
  op: 'set',
  path: 'Tom.skills.0.skillLevels.0.description',
  oldValue: 'old',
  newValue: 'reviewed',
};
const reviewedItems = {
  'Tom.skills.0': { id: 'passive' },
  'Tom.skills.0.skillLevels.0': { level: 1 },
};

it('prepares a whole-list replacement with fresh context without mutating evidence', () => {
  const before = structuredClone(original);
  const result = preparePendingActionRecovery([edit], original, reviewedItems);
  expect(result).toEqual([
    {
      op: 'set',
      path: 'Tom.skills',
      oldValue: before.Tom.skills,
      newValue: [
        { id: 'passive', skillLevels: [{ level: 1, description: 'reviewed' }] },
        before.Tom.skills[1],
      ],
    },
  ]);
  expect(original).toEqual(before);
});

it('refuses unreviewed nested identities, reordered items, stale text and structural edits', () => {
  expect(() => preparePendingActionRecovery([edit], original, {})).toThrow('Review');
  expect(() =>
    preparePendingActionRecovery([edit], original, { 'Tom.skills.0': { id: 'passive' } })
  ).toThrow('Review');
  const reordered = { Tom: { skills: [...original.Tom.skills].reverse() } };
  expect(() => preparePendingActionRecovery([edit], reordered, reviewedItems)).toThrow('Review');
  expect(() =>
    preparePendingActionRecovery([{ ...edit, oldValue: 'outdated' }], original, reviewedItems)
  ).toThrow('newer content');
  expect(() =>
    preparePendingActionRecovery([{ ...edit, op: 'delete' }], original, reviewedItems)
  ).toThrow('existing text fields');
});
