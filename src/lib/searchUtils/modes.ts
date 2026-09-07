import { modes } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchModes(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const mode of Object.values(modes)) {
    const match = await query.matchFields([
      ...commonSearchFields(mode),
      [mode.rules, 0.6, 0.55],
      [mode.detailedRules, 0.5, 0.45],
    ]);
    if (match) {
      results.push({
        type: 'mode',
        name: mode.name,
        imageUrl: mode.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
