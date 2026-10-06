'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { SingleItem, WikiChangeType } from '@/data/types';

type PublishedEntityHistoryEntry = Readonly<{
  year: number;
  date: string;
  type: WikiChangeType;
  description: string;
}>;

export type PublishedEntityHistory = Readonly<{
  entries: readonly PublishedEntityHistoryEntry[];
  unavailable: boolean;
}>;

export type PublishedRelatedEntityHistory = Readonly<{
  item: SingleItem;
  history: readonly PublishedEntityHistoryEntry[];
}>;

type PublishedEntityHistoryContextValue = Readonly<{
  item: SingleItem;
  history: PublishedEntityHistory;
  relatedHistory: readonly PublishedRelatedEntityHistory[];
}>;

const PublishedEntityHistoryContext = createContext<PublishedEntityHistoryContextValue | null>(
  null
);

function matchesItem(left: SingleItem, right: SingleItem): boolean {
  return (
    left.type === right.type &&
    left.name === right.name &&
    (left.factionId === undefined ||
      right.factionId === undefined ||
      left.factionId === right.factionId)
  );
}

export function PublishedEntityHistoryProvider({
  children,
  history,
  item,
  relatedHistory = [],
}: {
  children: ReactNode;
  history: PublishedEntityHistory;
  item: SingleItem;
  relatedHistory?: readonly PublishedRelatedEntityHistory[];
}) {
  return (
    <PublishedEntityHistoryContext.Provider value={{ item, history, relatedHistory }}>
      {children}
    </PublishedEntityHistoryContext.Provider>
  );
}

export function usePublishedEntityHistory(item: SingleItem): PublishedEntityHistory | null {
  const publishedHistory = useContext(PublishedEntityHistoryContext);
  if (!publishedHistory) return null;

  if (matchesItem(publishedHistory.item, item)) return publishedHistory.history;

  const related = publishedHistory.relatedHistory.find((entry) => matchesItem(entry.item, item));
  return related
    ? { entries: related.history, unavailable: publishedHistory.history.unavailable }
    : null;
}
