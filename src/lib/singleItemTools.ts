import type { FactionId, SingleItem } from '@/data/types';
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

import { variantEdges } from '../data/variants';

export const getSingleItemHref = (singleItem: SingleItem): string => {
  let result: string | undefined;

  if (singleItem.type === 'character') {
    result = `/characters/${singleItem.name}`;
  } else if (singleItem.type === 'knowledgeCard') {
    result = `/cards/${singleItem.name}`;
  } else if (singleItem.type === 'specialSkill') {
    const allSpecialSkills = { ...specialSkills.cat, ...specialSkills.mouse };
    const factionId =
      singleItem.factionId ??
      Object.values(allSpecialSkills).find((skill) => skill.name === singleItem.name)?.factionId;
    result = `/special-skills/${factionId}/${singleItem.name}`;
  } else if (singleItem.type === 'item') {
    result = `/items/${singleItem.name}`;
  } else if (singleItem.type === 'entity') {
    result = `/entities/${singleItem.name}`;
  } else if (singleItem.type === 'buff') {
    result = `/buffs/${singleItem.name}`;
  } else if (singleItem.type === 'map') {
    result = `/maps/${singleItem.name}`;
  } else if (singleItem.type === 'fixture') {
    result = `/fixtures/${singleItem.name}`;
  } else if (singleItem.type === 'mode') {
    result = `/modes/${singleItem.name}`;
  } else if (singleItem.type === 'achievement') {
    result = `/achievements/${singleItem.name}`;
  } else if (singleItem.type === 'skill') {
    const skill = Object.values(characters)
      .flatMap((character) => character.skills)
      .find(
        (characterSkill) =>
          characterSkill.name === singleItem.name ||
          characterSkill.aliases?.includes(singleItem.name)
      );

    if (skill) {
      const id = (skill as { id?: string }).id;
      const ownerId = id ? id.split('-')[0] : undefined;
      result = `/characters/${ownerId}`;
    }
  }

  return result || '/error';
};

export const getSingleItemImageUrl = (singleItem: SingleItem): string => {
  let result: string | undefined;

  if (singleItem.type === 'character') {
    result = characters[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'knowledgeCard') {
    result = cards[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'specialSkill') {
    if (['应急治疗', '急速翻滚'].includes(singleItem.name)) {
      const factionId: FactionId = singleItem.factionId || 'mouse';
      result = `/images/${factionId}SpecialSkills/${singleItem.name}.png`;
    } else {
      const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
      result = allSpecialSkills.find((skill) => skill.name === singleItem.name)?.imageUrl;
    }
  } else if (singleItem.type === 'item') {
    result = items[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'entity') {
    result = entities[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'buff') {
    result = buffs[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'map') {
    result = maps[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'fixture') {
    result = fixtures[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'mode') {
    result = modes[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'achievement') {
    result = achievements[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'skill') {
    const skill = Object.values(characters)
      .flatMap((character) => character.skills)
      .find(
        (characterSkill) =>
          characterSkill.name === singleItem.name ||
          characterSkill.aliases?.includes(singleItem.name)
      );
    result = skill?.imageUrl;
  }

  return result || '/images/icons/cat-faction.png';
};

export const getSingleItemFactionId = (
  singleItem: SingleItem,
  _visitedSet?: Set<string>,
  _cache?: Map<string, FactionId | undefined>
): FactionId | undefined => {
  if (singleItem.factionId !== undefined) {
    return singleItem.factionId;
  }

  const findFactionId = (): FactionId | undefined => {
    if (singleItem.type === 'character') {
      return characters[singleItem.name]?.factionId;
    }

    if (singleItem.type === 'knowledgeCard') {
      return cards[singleItem.name]?.factionId;
    }

    if (singleItem.type === 'specialSkill') {
      const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
      return allSpecialSkills.find((skill) => skill.name === singleItem.name)?.factionId;
    }

    if (singleItem.type === 'item') {
      return items[singleItem.name]?.factionId;
    }

    if (singleItem.type === 'skill') {
      const owner = Object.values(characters).find((character) =>
        character.skills.some((skill) => skill.name === singleItem.name)
      );
      return owner?.factionId;
    }

    if (singleItem.type === 'achievement') {
      return achievements[singleItem.name]?.factionId;
    }

    return undefined;
  };

  if (singleItem.type === 'entity') {
    const entity = entities[singleItem.name];
    if (!entity) return undefined;
    return getEntityFactionId(entity, _visitedSet, _cache);
  }

  return findFactionId();
};

export const getFactionLabel = (factionId: FactionId | undefined): '猫' | '鼠' | undefined => {
  if (factionId === 'cat') return '猫';
  if (factionId === 'mouse') return '鼠';
  return undefined;
};

export const formatOwnerName = (ownerName: string, ownerFactionId?: FactionId): string => {
  const ownerFactionLabel = getFactionLabel(ownerFactionId);
  return ownerFactionLabel ? `${ownerFactionLabel}‐${ownerName}` : ownerName;
};

export const getOwnerSuffix = (
  ownerName: string | undefined,
  ownerFactionId?: FactionId
): string | undefined => {
  if (!ownerName) return undefined;
  return `（${formatOwnerName(ownerName, ownerFactionId)}）`;
};

export const getSingleItemOwnerSuffix = (singleItem: SingleItem): string | undefined => {
  const formatOwner = (owner: SingleItem): string => {
    return formatOwnerName(owner.name, getSingleItemFactionId(owner));
  };

  if (singleItem.type === 'skill') {
    const owner = Object.values(characters).find((character) =>
      character.skills.some(
        (skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name)
      )
    );

    if (!owner) return undefined;

    return getOwnerSuffix(owner.id, owner.factionId);
  }

  if (singleItem.type === 'entity') {
    const owner = entities[singleItem.name]?.owner;

    if (!owner) return undefined;

    const owners = Array.isArray(owner) ? owner : [owner];
    const formattedOwners = owners.map(formatOwner);

    if (formattedOwners.length === 0) return undefined;

    return `（${formattedOwners.join(' / ')}）`;
  }

  return undefined;
};

export const compareSingleItem = (
  singleItem1: SingleItem,
  singleItem2: SingleItem,
  checkMode: 'default' | 'hard' = 'default'
): boolean => {
  const compareFactionId = (
    factionId1: FactionId | undefined,
    factionId2: FactionId | undefined,
    currentCheckMode: 'default' | 'hard'
  ): boolean => {
    if (factionId1 === undefined || factionId2 === undefined) {
      return currentCheckMode === 'default';
    }
    return factionId1 === factionId2;
  };

  return (
    singleItem1.type === singleItem2.type &&
    singleItem1.name === singleItem2.name &&
    compareFactionId(singleItem1.factionId, singleItem2.factionId, checkMode)
  );
};

/*getSingleItemVariant相关构建内容*/

function normalizeSingleItem(item: SingleItem): string {
  const base = `${item.type}:${item.name}`;
  // 只对特技进行阵营检测
  if (item.type === 'specialSkill' && item.factionId) {
    return `${base}:${item.factionId}`;
  }
  return base;
}

// 正向索引：原型规范键 → 所有变种规范键集合
const prototypeToVariants = new Map<string, Set<string>>();

// 反向索引：变种规范键 → 所有原型规范键集合
const variantToPrototypes = new Map<string, Set<string>>();

// 缓存规范键对应的 SingleItem 对象（只保留第一个遇到的）
const itemCache = new Map<string, SingleItem>();

/**
 * 构建传递闭包（使用规范化键作为节点标识）
 */
function buildTransitiveClosure() {
  // 1. 存储直接关系
  const directProtoToVars = new Map<string, Set<string>>();
  const directVarToProtos = new Map<string, Set<string>>();

  for (const edge of variantEdges) {
    const protoKey = normalizeSingleItem(edge.prototype);
    const varKey = normalizeSingleItem(edge.variant);

    // 缓存对象（第一次遇到时保存）
    if (!itemCache.has(protoKey)) itemCache.set(protoKey, edge.prototype);
    if (!itemCache.has(varKey)) itemCache.set(varKey, edge.variant);

    // 正向
    if (!directProtoToVars.has(protoKey)) {
      directProtoToVars.set(protoKey, new Set());
    }
    directProtoToVars.get(protoKey)!.add(varKey);

    // 反向
    if (!directVarToProtos.has(varKey)) {
      directVarToProtos.set(varKey, new Set());
    }
    directVarToProtos.get(varKey)!.add(protoKey);
  }

  // 2. 计算正向传递闭包（原型 → 所有变种，排除自身）
  for (const [proto, directVars] of directProtoToVars) {
    const allVariants = new Set<string>();
    const queue = [...directVars];
    const visited = new Set<string>(queue);

    while (queue.length) {
      const current = queue.shift()!;
      if (current === proto) continue; // 避免闭环包含自身
      allVariants.add(current);
      if (directProtoToVars.has(current)) {
        for (const next of directProtoToVars.get(current)!) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
    }
    prototypeToVariants.set(proto, allVariants);
  }

  // 3. 计算反向传递闭包（变种 → 所有原型，排除自身）
  for (const [variant, directProtos] of directVarToProtos) {
    const allPrototypes = new Set<string>();
    const queue = [...directProtos];
    const visited = new Set<string>(queue);

    while (queue.length) {
      const current = queue.shift()!;
      if (current === variant) continue;
      allPrototypes.add(current);
      if (directVarToProtos.has(current)) {
        for (const next of directVarToProtos.get(current)!) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
    }
    variantToPrototypes.set(variant, allPrototypes);
  }
}

// 模块加载时构建索引
buildTransitiveClosure();

/**
 * 获取某个 SingleItem 的所有原型（直接或间接）
 * @param item - 要查询的 SingleItem
 * @returns SingleItem 数组，包含所有原型（可能为空）
 */
export function getSingleItemPrototype(item: SingleItem): SingleItem[] {
  const key = normalizeSingleItem(item);
  const protoKeys = variantToPrototypes.get(key);
  if (!protoKeys) return [];

  const result: SingleItem[] = [];
  for (const k of protoKeys) {
    const cached = itemCache.get(k);
    if (cached) result.push(cached);
  }
  return result;
}

/**
 * 获取某个 SingleItem 的所有变种（直接或间接）
 * @param item - 要查询的 SingleItem
 * @returns SingleItem 数组，包含所有变种（可能为空）
 */
export function getSingleItemVariant(item: SingleItem): SingleItem[] {
  const key = normalizeSingleItem(item);
  const varKeys = prototypeToVariants.get(key);
  if (!varKeys) return [];

  const result: SingleItem[] = [];
  for (const k of varKeys) {
    const cached = itemCache.get(k);
    if (cached) result.push(cached);
  }
  return result;
}
