import { historyData } from '@/data/history';
import { ChangeType } from '@/data/types';

type HistoryEntry = {
  year: number;
  date: string;
  type: 'new' | ChangeType;
  description?: string;
};

export function getHistory(name: string): HistoryEntry[] {
  const history: HistoryEntry[] = [];

  for (const yearData of historyData) {
    for (const event of yearData.events) {
      if (
        event.details.content?.newCharacters?.includes(name) ||
        event.details.content?.newItems?.includes(name) ||
        event.details.content?.newKnowledgeCards?.includes(name)
      ) {
        history.push({
          year: yearData.year,
          date: event.date,
          type: 'new',
          description: event.description,
        });
      }

      if (event.details.balance?.characterChanges) {
        for (const change of event.details.balance.characterChanges) {
          if (change.name === name) {
            history.push({
              year: yearData.year,
              date: event.date,
              type: change.changeType,
              description: event.description,
            });
          }
        }
      }
    }
  }

  return history;
}
