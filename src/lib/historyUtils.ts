import { historyData } from '@/data/history';
import { ChangeType } from '@/data/types';

type HistoryEntry = {
  year: number;
  date: string;
  season: string;
  type: 'new' | ChangeType;
  description?: string;
};

export function getHistory(name: string): HistoryEntry[] {
  const history: HistoryEntry[] = [];
  let season: string = '';

  for (const yearData of historyData) {
    for (const event of yearData.events) {
      if (event.details.milestone?.endsWith('开始')) {
        season = event.details.milestone.slice(0, -2);
      }

      if (event.details.testPhaseInfo?.endsWith('开始')) {
        season = event.details.testPhaseInfo.slice(0, -2);
      }

      if (
        event.details.content?.newCharacters?.includes(name) ||
        event.details.content?.newItems?.includes(name) ||
        event.details.content?.newKnowledgeCards?.includes(name)
      ) {
        history.push({
          year: yearData.year,
          date: event.date,
          season,
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
              season,
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
