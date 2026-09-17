import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchItems(
  query: SearchQuery,
  items: PublishedGameDataByType['items']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, item] of Object.entries(items)) {
    const match = await query.matchFields(commonSearchFields(item));
    if (match) {
      results.push({
        type: 'item',
        href: `/items/${encodeURIComponent(entityId)}`,
        name: item.name,
        imageUrl: item.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
