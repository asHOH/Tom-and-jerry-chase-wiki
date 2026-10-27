import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchModes(
  query: SearchQuery,
  modes: PublishedGameDataByType['modes']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, mode] of Object.entries(modes)) {
    const match = await query.matchFields([
      ...commonSearchFields(mode),
      [mode.rules, 'description'],
      [mode.detailedRules, 'detail'],
    ]);
    if (match) {
      results.push({
        type: 'mode',
        href: `/modes/${encodeURIComponent(entityId)}`,
        name: mode.name,
        imageUrl: mode.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
