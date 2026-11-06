import type { DeepReadonly } from '@/types/deep-readonly';
import type { Entity, FactionId, SingleItem } from '@/data/types';
import { resolveSpecialSkill } from '@/features/special-skills/resolveSpecialSkill';

import { isReadonlyArray } from './isReadonlyArray';
import type { ReferenceCatalog } from './referenceSources';

type FactionSources = Pick<
  ReferenceCatalog,
  'characters' | 'specialSkills' | 'items' | 'cards' | 'entities' | 'achievements'
>;

export const resolveItemFaction = (
  singleItem: SingleItem,
  data: FactionSources,
  visitedSet: Set<string>,
  cache: Map<string, FactionId | undefined>
): FactionId | undefined => {
  const { specialSkills, characters, cards, items, entities, achievements } = data;
  if (singleItem.type === 'specialSkill') {
    return resolveSpecialSkill(specialSkills, singleItem.name, singleItem.factionId)?.factionId;
  }

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
      return (
        singleItem.factionId
          ? achievements[singleItem.factionId][singleItem.name]
          : (achievements.cat[singleItem.name] ?? achievements.mouse[singleItem.name])
      )?.factionId;
    }

    return undefined;
  };

  if (singleItem.type === 'entity') {
    const entity = entities[singleItem.name];
    if (!entity) return undefined;
    return resolveEntityFaction(entity, data, visitedSet, cache);
  }

  return findFactionId();
};

export function resolveEntityFaction(
  entity: DeepReadonly<Entity>,
  data: FactionSources,
  visitedSet: Set<string>,
  cache: Map<string, FactionId | undefined>
): FactionId | undefined {
  // 优先使用直接定义的 factionId
  if (entity.factionId) return entity.factionId;

  // 检查缓存
  if (cache.has(entity.name)) {
    return cache.get(entity.name);
  }

  // 循环检测：若当前实体已在调用链中，返回 undefined
  if (visitedSet.has(entity.name)) {
    return undefined;
  }

  visitedSet.add(entity.name);

  let result: FactionId | undefined = undefined;

  // 如果没有 owner，则无法确定阵营
  if (entity.owner === undefined) {
    result = undefined;
  } else {
    // 处理单个 owner 或 owner 数组
    const handleOwnerItem = (item: SingleItem): FactionId | undefined => {
      if (item.type === 'entity') {
        const subEntity = data.entities[item.name];
        if (subEntity) {
          // 递归调用，传递相同的缓存和 visitedSet
          return resolveEntityFaction(subEntity, data, visitedSet, cache);
        }
        return undefined;
      } else {
        return resolveItemFaction(item, data, visitedSet, cache);
      }
    };

    if (isReadonlyArray(entity.owner)) {
      if (entity.owner.length === 0) {
        result = undefined;
      } else {
        let found: FactionId | undefined = undefined;
        for (const item of entity.owner) {
          const current = handleOwnerItem(item);
          if (current !== undefined) {
            if (found === undefined) {
              found = current;
            } else if (current !== found) {
              // 出现不一致，整个实体无法确定阵营
              found = undefined;
              break;
            }
          }
        }
        result = found;
      }
    } else {
      result = handleOwnerItem(entity.owner);
    }
  }

  // 缓存结果
  cache.set(entity.name, result);
  return result;
}
