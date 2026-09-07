import { fixtures } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchFixtures(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const fixture of Object.values(fixtures)) {
    const match = await query.matchFields(commonSearchFields(fixture));
    if (match) {
      results.push({
        type: 'fixture',
        name: fixture.name,
        imageUrl: fixture.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
