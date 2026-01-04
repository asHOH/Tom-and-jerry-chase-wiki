import { SingleItem, WikiChangeType } from '@/data/types';
import { wikiHistoryData } from '@/data/wikiHistory';

import { compareSingleItem } from './singleItemTools';

type WikiHistoryEntry = {
  year: number;
  date: string;
  type: WikiChangeType;
  description: string;
};

export function getWikiHistory(items: SingleItem[]): WikiHistoryEntry[] {
  const history: WikiHistoryEntry[] = [];

  for (const yearData of wikiHistoryData) {
    for (const event of yearData.events) {
      // 检查常规变更
      if (event.details.data?.changes) {
        for (const change of event.details.data.changes) {
          if (items.some((item) => compareSingleItem(item, change.item))) {
            history.push({
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
              history.push({
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

  return history;
}
