import { FactionId, SingleItem } from '@/data/types';
import getEntityFactionId from '@/features/entities/lib/getEntityFactionId';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

export const getSingleItemHref = (singleItem: SingleItem): string => {
  let R: string | undefined;
  if (singleItem.type == 'character') {
    R = `/characters/${singleItem.name}`;
  } else if (singleItem.type == 'knowledgeCard') {
    R = `/cards/${singleItem.name}`;
  } else if (singleItem.type == 'specialSkill') {
    const allSpecialSkills = { ...specialSkills.cat, ...specialSkills.mouse };
    const factionId = singleItem.factionId
      ? singleItem.factionId
      : Object.values(allSpecialSkills).find((skill) => skill.name == singleItem.name)?.factionId;
    R = `/special-skills/${factionId}/${singleItem.name}`;
  } else if (singleItem.type == 'item') {
    R = `/items/${singleItem.name}`;
  } else if (singleItem.type == 'entity') {
    R = `/entities/${singleItem.name}`;
  } else if (singleItem.type == 'buff') {
    R = `/buffs/${singleItem.name}`;
  } else if (singleItem.type == 'map') {
    R = `/maps/${singleItem.name}`;
  } else if (singleItem.type == 'fixture') {
    R = `/fixtures/${singleItem.name}`;
  } else if (singleItem.type == 'mode') {
    R = `/modes/${singleItem.name}`;
  } else if (singleItem.type == 'achievement') {
    R = `/achievements/${singleItem.name}`;
  } else if (singleItem.type == 'skill') {
    const skill = Object.values(characters)
      .flatMap((c) => c.skills)
      .find((skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name));
    if (skill) {
      // Skill in processed characters should have id like `${ownerId}-...`
      const id = (skill as { id?: string }).id;
      const ownerId = id ? id.split('-')[0] : undefined;

      R = `/characters/${ownerId}`;
    }
  }

  return R || '/error';
};

export const getSingleItemImageUrl = (singleItem: SingleItem): string => {
  let R: string | undefined;
  if (singleItem.type == 'character') {
    R = characters[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'knowledgeCard') {
    R = cards[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'specialSkill') {
    if (['应急治疗', '急速翻滚'].includes(singleItem.name)) {
      const factionId: FactionId = singleItem.factionId || 'mouse';
      R = `/images/${factionId}SpecialSkills/${singleItem.name}.png`;
    } else {
      const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
      R = allSpecialSkills.find((specialSkill) => specialSkill.name === singleItem.name)?.imageUrl;
    }
  } else if (singleItem.type == 'item') {
    R = items[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'entity') {
    R = entities[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'buff') {
    R = buffs[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'map') {
    R = maps[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'fixture') {
    R = fixtures[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'mode') {
    R = modes[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'achievement') {
    R = achievements[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'skill') {
    const skill = Object.values(characters)
      .flatMap((c) => c.skills)
      .find((skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name));
    R = skill?.imageUrl;
  }

  return R || '/images/icons/cat-faction.png';
};

export const getSingleItemFactionId = (
  singleItem: SingleItem,
  _visitedSet?: Set<string>,
  _cache?: Map<string, FactionId | undefined>
): FactionId | undefined => {
  // 优先使用直接指定的 factionId
  if (singleItem.factionId !== undefined) {
    return singleItem.factionId;
  }

  // 根据类型从数据源中获取 factionId
  const findFactionId = (): FactionId | undefined => {
    if (singleItem.type === 'character') {
      return characters[singleItem.name]?.factionId;
    } else if (singleItem.type === 'knowledgeCard') {
      return cards[singleItem.name]?.factionId;
    } else if (singleItem.type === 'specialSkill') {
      const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
      return allSpecialSkills.find((skill) => skill.name === singleItem.name)?.factionId;
    } else if (singleItem.type === 'item') {
      return items[singleItem.name]?.factionId;
    } else if (singleItem.type === 'skill') {
      const owner = Object.values(characters).find((c) =>
        c.skills.some((skill) => skill.name === singleItem.name)
      );
      return owner?.factionId;
    } else if (singleItem.type === 'achievement') {
      return achievements[singleItem.name]?.factionId;
    }
    return undefined;
  };

  // 处理实体类型：委托给 getEntityFactionId
  if (singleItem.type === 'entity') {
    const entity = entities[singleItem.name];
    if (!entity) return undefined;
    // 传递 visitedSet 和 cache
    return getEntityFactionId(entity, _visitedSet, _cache);
  }

  // 其他类型直接查找
  return findFactionId();
};

export const compareSingleItem = (
  singleItem1: SingleItem,
  singleItem2: SingleItem,
  checkMode: 'default' | 'hard' = 'default'
): boolean => {
  const compareFactionId = (
    factionId1: FactionId | undefined,
    factionId2: FactionId | undefined,
    checkMode: 'default' | 'hard'
  ): boolean => {
    if (factionId1 === undefined || factionId2 === undefined) {
      return checkMode === 'default' ? true : false;
    }
    return factionId1 === factionId2;
  };
  if (
    singleItem1.type === singleItem2.type &&
    singleItem1.name === singleItem2.name &&
    compareFactionId(singleItem1.factionId, singleItem2.factionId, checkMode)
  ) {
    return true;
  }
  return false;
};
