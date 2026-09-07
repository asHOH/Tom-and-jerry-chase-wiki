import { entities } from '@/data';

import { commonSearchFields, type SearchField, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchEntities(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const entity of Object.values(entities)) {
    const match = await query.matchFields([
      ...commonSearchFields(entity),
      [entity.create, 0.6, 0.55],
      [entity.detailedCreate, 0.5, 0.45],
      ...(entity.skills ?? []).map((skill): SearchField => [skill.name, 0.4, 0.35]),
      ...(entity.skills ?? []).flatMap((skill) =>
        (skill.aliases ?? []).map((alias): SearchField => [
          alias,
          0.34,
          0.33,
          `${skill.name} (${alias})`,
        ])
      ),
      ...(entity.skills ?? []).map((skill): SearchField => [skill.description, 0.3, 0.25]),
      ...(entity.skills ?? []).map((skill): SearchField => [skill.detailedDescription, 0.2, 0.18]),
    ]);
    if (match) {
      results.push({
        type: 'entity',
        name: entity.name,
        imageUrl: entity.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
