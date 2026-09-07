import { items } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchItems(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const item of Object.values(items)) {
    const match = await query.matchFields(commonSearchFields(item));
    if (match) {
      results.push({
        type: 'item',
        name: item.name,
        imageUrl: item.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
