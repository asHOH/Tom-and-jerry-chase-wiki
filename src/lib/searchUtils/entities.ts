import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { commonSearchFields, type SearchField, type SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchEntities(
  query: SearchQuery,
  entities: PublishedGameDataByType['entities']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, entity] of Object.entries(entities)) {
    const match = await query.matchFields([
      ...commonSearchFields(entity),
      [entity.create, 'description'],
      [entity.detailedCreate, 'detail'],
      ...(entity.skills ?? []).map((skill): SearchField => [skill.name, 'name']),
      ...(entity.skills ?? []).flatMap((skill) =>
        (skill.aliases ?? []).map((alias): SearchField => [
          alias,
          'alias',
          `${skill.name} (${alias})`,
        ])
      ),
      ...(entity.skills ?? []).map((skill): SearchField => [skill.description, 'description']),
      ...(entity.skills ?? []).map((skill): SearchField => [skill.detailedDescription, 'detail']),
    ]);
    if (match) {
      results.push({
        type: 'entity',
        href: `/entities/${encodeURIComponent(entityId)}`,
        name: entity.name,
        imageUrl: entity.imageUrl,
        ...match,
      });
    }
  }
  return results;
}
