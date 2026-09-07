import { getItemGroupImageUrl } from '@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl';
import { itemGroups } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchItemGroups(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const group of Object.values(itemGroups)) {
    const match = await query.matchFields(
      commonSearchFields({
        name: group.name,
        aliases: group.aliases,
        description: group.description,
      })
    );
    if (match) {
      results.push({
        type: 'itemGroup',
        name: group.name,
        imageUrl: getItemGroupImageUrl(group),
        ...match,
      });
    }
  }
  return results;
}
