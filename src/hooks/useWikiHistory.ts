'use client';

import { useMemo } from 'react';

import { compareSingleItem } from '@/lib/singleItemTools';
import { mergeWikiHistoryData, publicActionsToWikiHistory } from '@/lib/wikiHistoryFromActions';
import { usePublicActionsContext } from '@/context/PublicActionsContext';
import type { SingleItem, WikiChangeType } from '@/data/types';
import { wikiHistoryData } from '@/data/wikiHistory';

type WikiHistoryEntry = {
  year: number;
  date: string;
  type: WikiChangeType;
  description: string;
};

/**
 * Hook that returns wiki history for items, merging static data with dynamically
 * generated entries from public actions.
 */
export function useWikiHistory(items: SingleItem[]): WikiHistoryEntry[] {
  const { actions } = usePublicActionsContext();

  const actionsHistoryData = useMemo(() => {
    if (!actions.length) return [];
    return publicActionsToWikiHistory(actions);
  }, [actions]);

  const mergedData = useMemo(() => {
    return mergeWikiHistoryData(wikiHistoryData, actionsHistoryData);
  }, [actionsHistoryData]);

  const history = useMemo(() => {
    const result: WikiHistoryEntry[] = [];

    for (const yearData of mergedData) {
      for (const event of yearData.events) {
        // 检查常规变更
        if (event.details.data?.changes) {
          for (const change of event.details.data.changes) {
            if (items.some((item) => compareSingleItem(item, change.item))) {
              result.push({
                year: yearData.year,
                date: event.date,
                type: change.changeType,
                description: change.description || event.description,
              });
            }
          }
        }

        // 检查批量变更
        if (event.details.data?.batchChanges) {
          for (const batch of event.details.data.batchChanges) {
            for (const change of batch.changes) {
              if (items.some((item) => compareSingleItem(item, change.item))) {
                result.push({
                  year: yearData.year,
                  date: event.date,
                  type: change.changeType,
                  description: change.description || batch.description || event.description,
                });
              }
            }
          }
        }
      }
    }

    return result;
  }, [items, mergedData]);

  return history;
}
