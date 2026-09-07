import { maps } from '@/data';

import { commonSearchFields, type SearchField, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchMaps(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const map of Object.values(maps)) {
    const match = await query.matchFields([
      ...commonSearchFields(map),
      ...(map.mapSkin ?? []).map((skin): SearchField => [
        skin.name,
        0.6,
        0.55,
        `${map.name} (${skin.name})`,
      ]),
      ...(map.mapSkin ?? []).map((skin): SearchField => [skin.description, 0.5, 0.45]),
    ]);
    if (match) {
      results.push({
        type: 'map',
        name: map.name,
        imageUrl: map.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
