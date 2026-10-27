import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import type { SearchField, SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchCards(
  query: SearchQuery,
  cards: PublishedGameDataByType['cards']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, card] of Object.entries(cards)) {
    const match = await query.matchFields([
      [card.id, 'name', card.id],
      [card.description, 'description', card.description],
      [card.detailedDescription, 'detail', card.detailedDescription],
      ...(card.levels ?? []).map((level): SearchField => [level.description, 'detail']),
      ...(card.levels ?? []).map((level): SearchField => [level.detailedDescription, 'detail']),
    ]);
    if (match)
      results.push({
        type: 'card',
        href: `/cards/${encodeURIComponent(entityId)}`,
        id: card.id,
        imageUrl: card.imageUrl!,
        ...match,
      });
  }
  return results;
}
