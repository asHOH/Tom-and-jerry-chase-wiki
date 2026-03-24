import { getSingleItemFactionId } from '@/lib/singleItemTools';
import { Entity, FactionId, SingleItem } from '@/data/types';
import { entities } from '@/data';

// 全局缓存，避免重复计算，键为实体名称
const factionCache = new Map<string, FactionId | undefined>();

export default function getEntityFactionId(
  entity: Entity,
  _visitedSet?: Set<string>,
  _cache?: Map<string, FactionId | undefined>
): FactionId | undefined {
  const cache = _cache ?? factionCache;
  const visitedSet = _visitedSet ?? new Set<string>();

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
        const subEntity = entities[item.name];
        if (subEntity) {
          // 递归调用，传递相同的缓存和 visitedSet
          return getEntityFactionId(subEntity, visitedSet, cache);
        }
        return undefined;
      } else {
        return getSingleItemFactionId(item, visitedSet, cache);
      }
    };

    if (Array.isArray(entity.owner)) {
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
