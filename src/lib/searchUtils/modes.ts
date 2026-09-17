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
      [mode.rules, 0.6, 0.55],
      [mode.detailedRules, 0.5, 0.45],
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
