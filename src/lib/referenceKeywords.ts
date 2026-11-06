import type { ItemGroup, SingleItem } from '@/data/types';
import { resolveSpecialSkill } from '@/features/special-skills/resolveSpecialSkill';

import type { ReferenceCatalog } from './referenceSources';
import { buildReferenceKeywords, type CategorizedKeywords } from './referenceText';
import { compareSingleItem } from './singleItemIdentity';

export function getReferenceKeywords(
  data: ReferenceCatalog,
  itemGroups: Readonly<Record<string, ItemGroup>>,
  autoWrapNames: readonly string[],
  singleItem: SingleItem,
  skillLocation?: { characterId: string; index: number },
  sourceId = singleItem.name
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
      ? resolveSpecialSkill(specialSkills, sourceId, singleItem.factionId)
      : undefined;
  if (singleItem.type === 'specialSkill' && !specialSkill) {
    return { originalKeywords: [], aliasKeywords: [], groupKeywords: [], allKeywords: [] };
  }
  if (specialSkill) singleItem = { ...singleItem, factionId: specialSkill.factionId };

  const getSingleItemAliases = (singleItem: SingleItem): readonly string[] => {
    let R: readonly string[] | undefined;
    if (singleItem.type == 'character') {
      R = characters[sourceId]?.aliases;
    } else if (singleItem.type == 'knowledgeCard') {
      R = cards[sourceId]?.aliases;
    } else if (singleItem.type == 'specialSkill') {
      R = specialSkill?.aliases;
    } else if (singleItem.type == 'item') {
      R = items[sourceId]?.aliases;
    } else if (singleItem.type == 'entity') {
      R = entities[sourceId]?.aliases;
    } else if (singleItem.type == 'buff') {
      R = buffs[sourceId]?.aliases;
    } else if (singleItem.type == 'map') {
      R = maps[sourceId]?.aliases;
    } else if (singleItem.type == 'fixture') {
      R = fixtures[sourceId]?.aliases;
    } else if (singleItem.type == 'mode') {
      R = modes[sourceId]?.aliases;
    } else if (singleItem.type == 'achievement') {
      const factionId = singleItem.factionId;
      R = factionId
        ? achievements[factionId][sourceId]?.aliases
        : (achievements.cat[sourceId] ?? achievements.mouse[sourceId])?.aliases;
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
  const identity = { ...singleItem, name: sourceId };
  const groupNames = Object.values(itemGroups)
    .filter((itemGroup) => itemGroup.group.some((item) => compareSingleItem(item, identity)))
    .flatMap((itemGroup) => [itemGroup.name, ...(itemGroup.aliases || [])]);

  return buildReferenceKeywords(
    singleItem,
    getSingleItemAliases(singleItem),
    groupNames,
    autoWrapNames
  );
}
