import { achievements } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchAchievements(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const achievement of [
    ...Object.values(achievements.cat),
    ...Object.values(achievements.mouse),
  ]) {
    const match = await query.matchFields(commonSearchFields(achievement));
    if (match) {
      results.push({
        type: 'achievement',
        name: achievement.name,
        imageUrl: achievement.imageUrl,
        factionId: achievement.factionId,
        ...match,
      });
    }
  }
  return results;
}
