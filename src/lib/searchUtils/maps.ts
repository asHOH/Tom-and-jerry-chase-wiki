import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchField, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchMaps(
  query: SearchQuery,
  maps: PublishedGameDataByType['maps']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, map] of Object.entries(maps)) {
    const match = await query.matchFields([
      ...commonSearchFields(map),
      ...(map.mapSkin ?? []).map((skin): SearchField => [
        skin.name,
        'name',
        `${map.name} (${skin.name})`,
      ]),
      ...(map.mapSkin ?? []).map((skin): SearchField => [skin.description, 'description']),
    ]);
    if (match) {
      results.push({
        type: 'map',
        href: `/maps/${encodeURIComponent(entityId)}`,
        name: map.name,
        imageUrl: map.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
