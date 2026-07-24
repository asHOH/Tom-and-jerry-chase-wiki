'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { WikiChangeType } from '@/data/types';

export type PublishedEntityHistoryEntry = Readonly<{
  year: number;
  date: string;
  type: WikiChangeType;
  description: string;
}>;

const PublishedEntityHistoryContext = createContext<readonly PublishedEntityHistoryEntry[] | null>(
  null
);

export function PublishedEntityHistoryProvider({
  children,
  history,
}: {
  children: ReactNode;
  history: readonly PublishedEntityHistoryEntry[];
}) {
  return (
    <PublishedEntityHistoryContext.Provider value={history}>
      {children}
    </PublishedEntityHistoryContext.Provider>
  );
}

export function usePublishedEntityHistory(): readonly PublishedEntityHistoryEntry[] | null {
  return useContext(PublishedEntityHistoryContext);
}
