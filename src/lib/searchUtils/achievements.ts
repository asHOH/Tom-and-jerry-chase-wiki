import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchAchievements(
  query: SearchQuery,
  achievements: PublishedGameDataByType['achievements']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const factionId of ['cat', 'mouse'] as const) {
    for (const [entityId, achievement] of Object.entries(achievements[factionId])) {
      const match = await query.matchFields(commonSearchFields(achievement));
      if (match) {
        results.push({
          type: 'achievement',
          key: `achievement:${factionId}:${entityId}`,
          href: `/achievements/${factionId}/${encodeURIComponent(entityId)}`,
          title: achievement.name,
          imageUrl: achievement.imageUrl,
          factionId,
          ...match,
        });
      }
    }
  }
  return results;
}
