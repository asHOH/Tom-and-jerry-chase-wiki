import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchFixtures(
  query: SearchQuery,
  fixtures: PublishedGameDataByType['fixtures']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, fixture] of Object.entries(fixtures)) {
    const match = await query.matchFields(commonSearchFields(fixture));
    if (match) {
      results.push({
        type: 'fixture',
        href: `/fixtures/${encodeURIComponent(entityId)}`,
        name: fixture.name,
        imageUrl: fixture.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
