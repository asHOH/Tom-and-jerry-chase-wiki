import { renderHook } from '@testing-library/react';

import { sortCardsByRank } from '@/lib/sortingUtils';
import type { FactionId } from '@/data/types';

import { useSpecifyTypeNavigation, type NavigationEntityType } from './useSpecifyTypeNavigation';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/sortingUtils', () => ({
  sortCardsByRank: jest.fn(jest.requireActual('@/lib/sortingUtils').sortCardsByRank),
}));

jest.mock('@/data', () => ({
  specialSkills: {
    cat: { catFirst: {}, shared: {} },
    mouse: { mouseFirst: {}, shared: {} },
  },
  achievements: {
    cat: { catFirst: {}, shared: {} },
    mouse: { mouseFirst: {}, shared: {} },
  },
  cards: {
    lowerRank: { id: 'lowerRank', rank: 'A', cost: 7 },
    lowerCost: { id: 'lowerCost', rank: 'S', cost: 2 },
    higherCost: { id: 'higherCost', rank: 'S', cost: 7 },
  },
  items: { itemFirst: {}, itemLast: {} },
  entities: { entityFirst: {}, entityLast: {} },
  buffs: { buffFirst: {}, buffLast: {} },
  maps: { mapFirst: {}, mapLast: {} },
  fixtures: { fixtureFirst: {}, fixtureLast: {} },
  modes: { modeFirst: {}, modeLast: {} },
}));

it('switches catalogs synchronously and only sorts when entering the card catalog', () => {
  const { result, rerender } = renderHook(
    ({ id, type }: { id: string; type: NavigationEntityType }) =>
      useSpecifyTypeNavigation(id, type),
    { initialProps: { id: 'itemFirst', type: 'item' } }
  );

  for (const type of ['item', 'entity', 'buff', 'map', 'fixture', 'mode'] as const) {
    rerender({ id: `${type}First`, type });
    expect(result.current.totals).toBe(2);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.nextTarget?.id).toBe(`${type}Last`);
  }
  expect(sortCardsByRank).not.toHaveBeenCalled();

  rerender({ id: 'higherCost', type: 'knowledgeCard' });
  expect(result.current.nextTarget?.id).toBe('lowerCost');
  expect(sortCardsByRank).toHaveBeenCalledTimes(1);
  rerender({ id: 'lowerCost', type: 'knowledgeCard' });
  expect(result.current.nextTarget?.id).toBe('lowerRank');
  expect(sortCardsByRank).toHaveBeenCalledTimes(1);

  rerender({ id: 'itemFirst', type: 'item' });
  expect(result.current.nextTarget?.id).toBe('itemLast');
  expect(sortCardsByRank).toHaveBeenCalledTimes(1);
});

it.each([
  ['specialSkill', 'special-skills'],
  ['achievement', 'achievements'],
] as const)('preserves duplicate-name and faction ordering for %s', (type, path) => {
  const { result, rerender } = renderHook(
    ({ id, factionId }: { id: string; factionId: FactionId }) =>
      useSpecifyTypeNavigation(id, type, factionId),
    { initialProps: { id: 'shared', factionId: 'cat' } }
  );

  expect(result.current.currentIndex).toBe(1);
  result.current.navigateToPrevious();
  expect(mockPush).toHaveBeenLastCalledWith(`/${path}/cat/catFirst`);
  result.current.navigateToNext();
  expect(mockPush).toHaveBeenLastCalledWith(`/${path}/mouse/mouseFirst`);

  rerender({ id: 'mouseFirst', factionId: 'mouse' });
  result.current.navigateToPrevious();
  expect(mockPush).toHaveBeenLastCalledWith(`/${path}/cat/shared`);

  rerender({ id: 'shared', factionId: 'mouse' });
  expect(result.current.currentIndex).toBe(3);
  expect(result.current.nextTarget).toBeNull();
  result.current.navigateToPrevious();
  expect(mockPush).toHaveBeenLastCalledWith(`/${path}/mouse/mouseFirst`);

  rerender({ id: 'shared', factionId: 'cat' });
  expect(result.current.currentIndex).toBe(1);
  expect(result.current.nextTarget?.id).toBe('mouseFirst');
});

it.each(['specialSkill', 'achievement'] as const)(
  'requires an exact faction identity for %s',
  (type) => {
    const { result, rerender } = renderHook(
      ({ id, factionId }: { id: string; factionId: FactionId | undefined }) =>
        useSpecifyTypeNavigation(id, type, factionId),
      { initialProps: { id: 'missing', factionId: 'cat' } }
    );

    for (const [id, factionId] of [
      ['missing', 'cat'],
      ['missing', 'mouse'],
      ['mouseFirst', 'cat'],
      ['catFirst', 'mouse'],
      ['shared', undefined],
    ] as const) {
      rerender({ id, factionId });
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.previousTarget).toBeNull();
      expect(result.current.nextTarget).toBeNull();
      result.current.navigateToPrevious();
      result.current.navigateToNext();
      expect(mockPush).not.toHaveBeenCalled();
    }
  }
);

it('includes all cards in rank/cost order', () => {
  const { result, rerender } = renderHook(
    ({ id }) => useSpecifyTypeNavigation(id, 'knowledgeCard'),
    { initialProps: { id: 'lowerCost' } }
  );

  expect(result.current.totals).toBe(3);
  expect(result.current.currentIndex).toBe(1);
  expect(result.current.previousTarget?.id).toBe('higherCost');
  expect(result.current.nextTarget?.id).toBe('lowerRank');

  rerender({ id: 'higherCost' });
  expect(result.current.previousTarget).toBeNull();
  rerender({ id: 'lowerRank' });
  expect(result.current.nextTarget).toBeNull();
});
