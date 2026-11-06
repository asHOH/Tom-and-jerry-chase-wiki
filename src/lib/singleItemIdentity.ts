import type { FactionId, SingleItem } from '@/data/types';
import { variantEdges } from '@/data/variants';

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
