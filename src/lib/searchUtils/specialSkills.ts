import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchSpecialSkills(
  query: SearchQuery,
  specialSkills: PublishedGameDataByType['specialSkills']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const factionId of ['cat', 'mouse'] as const) {
    for (const [entityId, skill] of Object.entries(specialSkills[factionId])) {
      const match = await query.matchFields(commonSearchFields(skill));
      if (match) {
        results.push({
          type: 'specialSkill',
          href: `/special-skills/${factionId}/${encodeURIComponent(entityId)}`,
          name: skill.name,
          imageUrl: skill.imageUrl,
          factionId,
          ...match,
        });
      }
    }
  }
  return results;
}
