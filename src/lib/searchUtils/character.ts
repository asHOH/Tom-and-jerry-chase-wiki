import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import {
  getPositioningTagLevel,
  isPositioningTagVisible,
} from '@/constants/positioningTagSequences';

import type { SearchField, SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchCharacters(
  query: SearchQuery,
  characters: PublishedGameDataByType['characters']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, character] of Object.entries(characters)) {
    let matchedSkillName: string | undefined;
    const tags = [
      ...(character.catPositioningTags ?? []),
      ...(character.mousePositioningTags ?? []),
    ].filter((tag) => isPositioningTagVisible(getPositioningTagLevel(tag)));
    let match = await query.matchFields([
      [character.id, 'name', character.id],
      ...(character.aliases ?? []).map((alias): SearchField => [
        alias,
        'alias',
        `${character.id} (${alias})`,
      ]),
      [character.description, 'description', character.description],
      ...tags.map((tag): SearchField => [tag.tagName, 'description']),
      ...tags.map((tag): SearchField => [tag.description, 'description']),
      ...tags.map((tag): SearchField => [tag.additionalDescription, 'detail']),
    ]);

    for (const skill of character.skills) {
      const skillMatch = await query.matchFields([
        [skill.name, 'name'],
        ...(skill.aliases ?? []).map((alias): SearchField => [
          alias,
          'alias',
          `${skill.name} (${alias})`,
        ]),
        [skill.description, 'description'],
        [skill.detailedDescription, 'detail'],
        ...skill.skillLevels.flatMap((level): SearchField[] => [
          [level.description, 'detail'],
          [level.detailedDescription, 'detail'],
        ]),
      ]);
      if (skillMatch && (!match || skillMatch.priority > match.priority)) {
        match = skillMatch;
        matchedSkillName = skill.name;
      }
    }

    if (match) {
      results.push({
        type: 'character',
        href: `/characters/${encodeURIComponent(entityId)}${matchedSkillName ? `#Skill:${encodeURIComponent(matchedSkillName)}` : ''}`,
        id: character.id,
        imageUrl: character.imageUrl!,
        ...match,
        ...(matchedSkillName ? { matchedSkillName } : {}),
      });
    }
  }
  return results;
}
