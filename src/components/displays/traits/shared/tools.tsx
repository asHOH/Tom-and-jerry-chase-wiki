import { itemGroups } from '@/data';
import { SingleItem, SingleItemOrGroup, FactionId, Trait } from '@/data/types';
import { getSingleItemFactionId } from '@/lib/singleItemTools';

// 导出-辅助函数：判断两个factionId是否相同，默认会将undefined视作任意一种factionId，若采用严格模式则双方必须均不为undefined
export const compareFactionId = (
  factionId1: FactionId | undefined,
  factionId2: FactionId | undefined,
  checkMode: 'default' | 'hard' = 'default'
): boolean => {
  // 如果任一factionId为undefined，根据模式返回内容
  if (factionId1 === undefined || factionId2 === undefined) {
    return checkMode === 'default' ? true : false;
  }
  // 如果都有实际值，则比较是否相等
  return factionId1 === factionId2;
};

// 导出-辅助函数：检查某个SingleItem的factionId是否在需要排除的范围内
export const shouldExcludeItemGroupItem = (
  item: SingleItem,
  excludeFactionId?: FactionId | undefined
): boolean => {
  if (!excludeFactionId) return false;
  const itemFactionId = getSingleItemFactionId(item);
  return compareFactionId(itemFactionId, excludeFactionId, 'hard');
};

// 辅助函数 - 检查单个singleItemOrGroup是否包含了singleItem
const checkOneItem = (
  groupItem: SingleItemOrGroup,
  singleItem: SingleItem,
  singleItemFactionId?: FactionId,
  excludeFactionId: FactionId | undefined = undefined
): boolean => {
  if (groupItem.type === 'itemGroup') {
    return (
      itemGroups[groupItem.name]?.group.some(
        (item) =>
          singleItem.name === item.name &&
          singleItem.type === item.type &&
          compareFactionId(singleItemFactionId, getSingleItemFactionId(item)) &&
          !shouldExcludeItemGroupItem(item, excludeFactionId)
      ) || false
    );
  } else {
    return (
      groupItem.name === singleItem.name &&
      groupItem.type === singleItem.type &&
      compareFactionId(singleItemFactionId, getSingleItemFactionId(groupItem))
    );
  }
};

// 导出-辅助函数 - 检查groupItem中是否包含了singleItem
/**
 * 检查singleItem是否在指定的groupItem中
 * @param groupItem - 要检查的范围（该函数会自动寻找并匹配factionId）
 * @param singleItem - 要匹配的对象（会自动寻找并补全它的factionId）
 * @param excludeFactionId - （可选）要从groupItem中筛去的阵营，默认会筛去itemGroup或buff的拆解结果中的对应部分
 * @param checkMode - 筛选模式（default或hard），若选用hard模式，则会改为将所给singleItem的factionId作为excludeFactionId属性的考虑内容
 */
export const checkItemMatchesGroup = (
  groupItem: SingleItemOrGroup | SingleItemOrGroup[],
  singleItem: SingleItem,
  excludeFactionId: FactionId | undefined = undefined,
  checkMode: 'default' | 'hard' = 'default'
): boolean => {
  const singleItemFactionId = getSingleItemFactionId(singleItem);

  //Hard模式：直接检查singleItem的FactionId与excludeFactionId是否一致，若一致则跳过后续内容
  if (checkMode === 'hard' && compareFactionId(singleItemFactionId, excludeFactionId, 'hard')) {
    return false;
  }

  //常规索引
  const matchItem = Array.isArray(groupItem)
    ? groupItem.find((item) =>
        checkOneItem(item, singleItem, singleItemFactionId, excludeFactionId)
      )
    : checkOneItem(groupItem, singleItem, singleItemFactionId, excludeFactionId);
  if (matchItem !== undefined) {
    return !!matchItem;
  }

  return false;
};

// 导出-辅助函数 - 检查整个Trait中是否包含了singleItem
/**
 * 检查整个Trait中是否包含了singleItem
 *
 * @param trait - 要检查的Trait
 * @param singleItem - 要匹配的对象（该函数会自动寻找并匹配factionId）
 * @param checkMode - 筛选模式（default或hard），若选用hard模式，则会改为将所给singleItem的factionId作为excludeFactionId属性的考虑内容
 */
export const checkItemMatchesTrait = (
  trait: Trait,
  singleItem: SingleItem,
  checkMode: 'default' | 'hard' = 'default'
): boolean => {
  const singleItemFactionId = getSingleItemFactionId(singleItem);
  // hard模式：直接检查singleItem的FactionId与excludeFactionId是否一致，若一致则跳过后续内容
  if (
    checkMode === 'hard' &&
    compareFactionId(singleItemFactionId, trait.excludeFactionId, 'hard')
  ) {
    return false;
  }

  // 优先检查spacialCase
  if (trait.spacialCase && trait.spacialCase.length > 0) {
    for (const sc of trait.spacialCase) {
      if (
        sc.group.some((groupItem) =>
          checkItemMatchesGroup(groupItem, singleItem, trait.excludeFactionId)
        )
      ) {
        return true;
      }
    }
  }

  // 如果没有在spacialCase中找到，检查原始group
  return trait.group.some((groupItem) =>
    checkItemMatchesGroup(groupItem, singleItem, trait.excludeFactionId)
  );
};
