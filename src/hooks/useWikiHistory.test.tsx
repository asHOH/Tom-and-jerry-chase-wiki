import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { WikiHistoryProvider } from '@/context/WikiHistoryContext';
import { WikiChangeType } from '@/data/types';

import { useWikiHistory } from './useWikiHistory';

const publicActionRow = (itemName: string): PublicActionRow => ({
  id: `action-${itemName}`,
  entity_type: 'items',
  entry: {
    op: 'set',
    path: `${itemName}.description`,
    oldValue: 'old',
    newValue: 'new',
  },
  created_at: '2026-05-10T00:00:00.000Z',
  status: 'approved',
  message: null,
  reviewed_at: null,
  created_by: null,
});

describe('useWikiHistory', () => {
  it('returns static wiki history data without a provider', () => {
    const { result } = renderHook(() =>
      useWikiHistory([{ name: 'No Matching Static History Item', type: 'item' }])
    );

    expect(result.current).toEqual([]);
  });

  it('includes dynamic history derived from provider public actions', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WikiHistoryProvider publicActions={[publicActionRow('Public Test Item')]}>
        {children}
      </WikiHistoryProvider>
    );

    const { result } = renderHook(
      () => useWikiHistory([{ name: 'Public Test Item', type: 'item' }]),
      { wrapper }
    );

    expect(result.current).toEqual([
      expect.objectContaining({
        year: 2026,
        date: '5.10',
        type: WikiChangeType.UPDATE,
      }),
    ]);
  });

  it('excludes dynamic history for other items', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WikiHistoryProvider publicActions={[publicActionRow('Other Public Test Item')]}>
        {children}
      </WikiHistoryProvider>
    );

    const { result } = renderHook(
      () => useWikiHistory([{ name: 'Public Test Item', type: 'item' }]),
      { wrapper }
    );

    expect(result.current).toEqual([]);
  });
});
