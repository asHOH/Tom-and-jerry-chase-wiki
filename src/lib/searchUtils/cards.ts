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
      [card.id, 0.2, 0.19, card.id],
      [card.description, 0.18, 0.17, card.description],
      [card.detailedDescription, 0.16, 0.15, card.detailedDescription],
      ...(card.levels ?? []).map((level): SearchField => [level.description, 0.14, 0.13]),
      ...(card.levels ?? []).map((level): SearchField => [level.detailedDescription, 0.12, 0.11]),
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
