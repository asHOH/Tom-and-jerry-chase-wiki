'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { mergeWikiHistoryData, publicActionsToWikiHistory } from '@/lib/wikiHistoryFromActions';
import type { WikiYearData } from '@/data/types';
import { wikiHistoryData } from '@/data/wikiHistory';

const WikiHistoryContext = createContext<WikiYearData[] | null>(null);

export function WikiHistoryProvider({
  children,
  publicActions,
}: {
  children: ReactNode;
  publicActions?: PublicActionRow[] | undefined;
}) {
  const mergedHistory = useMemo(() => {
    const actionHistory = publicActionsToWikiHistory(publicActions ?? []);
    return mergeWikiHistoryData(wikiHistoryData, actionHistory);
  }, [publicActions]);

  return (
    <WikiHistoryContext.Provider value={mergedHistory}>{children}</WikiHistoryContext.Provider>
  );
}

export function useWikiHistoryData(): WikiYearData[] {
  return useContext(WikiHistoryContext) ?? wikiHistoryData;
}
