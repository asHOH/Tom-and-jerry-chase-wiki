import {
  getPositioningTagLevel,
  isPositioningTagVisible,
} from '@/constants/positioningTagSequences';
import { characters } from '@/data/static';

import type { SearchField, SearchQuery } from './matching';
import type { SearchResult } from './types';

export async function searchCharacters(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const character of Object.values(characters)) {
    let matchedSkillName: string | undefined;
    let match = await query.matchFields([
      [character.id, 1, 0.95, character.id],
      ...(character.aliases ?? []).map((alias): SearchField => [
        alias,
        0.98,
        0.97,
        `${character.id} (${alias})`,
      ]),
    ]);

    if (!match) {
      for (const skill of character.skills) {
        match = await query.matchFields([[skill.name, 0.9, 0.85]]);
        if (match) {
          matchedSkillName = skill.name;
          break;
        }
      }
    }
    if (!match) {
      // Preserve the existing last-matching-skill precedence for aliases.
      for (const skill of character.skills) {
        const aliasMatch = await query.matchFields(
          (skill.aliases ?? []).map((alias): SearchField => [
            alias,
            0.84,
            0.83,
            `${skill.name} (${alias})`,
          ])
        );
        if (aliasMatch) {
          match = aliasMatch;
          matchedSkillName = skill.name;
        }
      }
    }
    if (!match) {
      const tags = [
        ...(character.catPositioningTags ?? []),
        ...(character.mousePositioningTags ?? []),
      ].filter((tag) => isPositioningTagVisible(getPositioningTagLevel(tag)));
      match = await query.matchFields([
        [character.description, 0.8, 0.75, character.description],
        ...tags.map((tag): SearchField => [tag.tagName, 0.7, 0.65]),
        ...tags.map((tag): SearchField => [tag.description, 0.6, 0.55]),
        ...tags.map((tag): SearchField => [tag.additionalDescription, 0.5, 0.45]),
      ]);
    }
    if (!match) {
      for (const skill of character.skills) {
        match = await query.matchFields([[skill.description, 0.4, 0.35]]);
        if (match) {
          matchedSkillName = skill.name;
          break;
        }
      }
    }
    if (!match) {
      for (const skill of character.skills) {
        const detailMatch = await query.matchFields([[skill.detailedDescription, 0.3, 0.25]]);
        if (detailMatch) {
          match = detailMatch;
          matchedSkillName = skill.name;
          break;
        }
        const levelMatch = await query.matchFields(
          skill.skillLevels.flatMap((level): SearchField[] => [
            [level.description, 0.2, 0.19],
            [level.detailedDescription, 0.18, 0.17],
          ])
        );
        // Later skills can supersede a level match, as in the original search.
        if (levelMatch) {
          match = levelMatch;
          matchedSkillName = skill.name;
        }
      }
    }

    if (match) {
      results.push({
        type: 'character',
        id: character.id,
        imageUrl: character.imageUrl!,
        ...match,
        ...(matchedSkillName ? { matchedSkillName } : {}),
      });
    }
  }
  return results;
}
