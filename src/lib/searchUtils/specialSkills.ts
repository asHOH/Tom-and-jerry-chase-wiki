import { specialSkills } from '@/data';

import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchSpecialSkills(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const skill of [
    ...Object.values(specialSkills.cat),
    ...Object.values(specialSkills.mouse),
  ]) {
    const match = await query.matchFields(commonSearchFields(skill));
    if (match) {
      results.push({
        type: 'specialSkill',
        name: skill.name,
        imageUrl: skill.imageUrl,
        factionId: skill.factionId,
        ...match,
      });
    }
  }
  return results;
}
