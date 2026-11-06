import type { ItemGroup, SingleItem } from '@/data/types';
import { resolveSpecialSkill } from '@/features/special-skills/resolveSpecialSkill';

import type { ReferenceCatalog } from './referenceSources';
import { buildReferenceKeywords, type CategorizedKeywords } from './referenceText';
import { compareSingleItem } from './singleItemTools';

export function getReferenceKeywords(
  data: ReferenceCatalog,
  itemGroups: Readonly<Record<string, ItemGroup>>,
  autoWrapNames: readonly string[],
  singleItem: SingleItem,
  skillLocation?: { characterId: string; index: number }
): CategorizedKeywords {
  const {
    characters,
    cards,
    specialSkills,
    items,
    entities,
    buffs,
    maps,
    modes,
    fixtures,
    achievements,
  } = data;
  const specialSkill =
    singleItem.type === 'specialSkill'
      ? resolveSpecialSkill(specialSkills, singleItem.name, singleItem.factionId)
      : undefined;
  if (singleItem.type === 'specialSkill' && !specialSkill) {
    return { originalKeywords: [], aliasKeywords: [], groupKeywords: [], allKeywords: [] };
  }
  if (specialSkill) singleItem = { ...singleItem, factionId: specialSkill.factionId };

  const getSingleItemAliases = (singleItem: SingleItem): readonly string[] => {
    let R: readonly string[] | undefined;
    if (singleItem.type == 'character') {
      R = characters[singleItem.name]?.aliases;
    } else if (singleItem.type == 'knowledgeCard') {
      R = cards[singleItem.name]?.aliases;
    } else if (singleItem.type == 'specialSkill') {
      R = specialSkill?.aliases;
    } else if (singleItem.type == 'item') {
      R = items[singleItem.name]?.aliases;
    } else if (singleItem.type == 'entity') {
      R = entities[singleItem.name]?.aliases;
    } else if (singleItem.type == 'buff') {
      R = buffs[singleItem.name]?.aliases;
    } else if (singleItem.type == 'map') {
      R = maps[singleItem.name]?.aliases;
    } else if (singleItem.type == 'fixture') {
      R = fixtures[singleItem.name]?.aliases;
    } else if (singleItem.type == 'mode') {
      R = modes[singleItem.name]?.aliases;
    } else if (singleItem.type == 'achievement') {
      const factionId = singleItem.factionId;
      R = factionId
        ? achievements[factionId][singleItem.name]?.aliases
        : (achievements.cat[singleItem.name] ?? achievements.mouse[singleItem.name])?.aliases;
    } else if (singleItem.type == 'skill') {
      if (skillLocation)
        return characters[skillLocation.characterId]?.skills[skillLocation.index]?.aliases ?? [];
      const skill = Object.values(characters)
        .flatMap((c) => c.skills)
        .find((skill) => skill.name === singleItem.name);
      R = skill?.aliases;
    }

    return R || [];
  };

  // 【修复关键】正确获取组合名：仅从itemGroups数据源获取
  const groupNames = Object.values(itemGroups)
    .filter((itemGroup) => itemGroup.group.some((item) => compareSingleItem(item, singleItem)))
    .flatMap((itemGroup) => [itemGroup.name, ...(itemGroup.aliases || [])]);

  return buildReferenceKeywords(
    singleItem,
    getSingleItemAliases(singleItem),
    groupNames,
    autoWrapNames
  );
}
