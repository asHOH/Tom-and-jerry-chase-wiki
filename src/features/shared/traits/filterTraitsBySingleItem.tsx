import traits from '@/data/traits';
import { SingleItem, Trait } from '@/data/types';

import { checkItemMatchesTrait, searchBuffBySingleItem } from './tools';

// 辅助函数：根据Trait的内容生成唯一标识符，用于去重
const getTraitKey = (trait: Trait): string => {
  // 使用Trait的描述和组内容生成唯一key
  const groupKey = trait.group
    .map((item) => {
      if (Array.isArray(item)) {
        return `[${item.map((i) => `${i.name}:${i.type}`).join(',')}]`;
      } else {
        return `${item.name}:${item.type}`;
      }
    })
    .join('|');

  return `${trait.description}|${groupKey}`;
};

/**
 * 从全部特性中筛选出所有包含所给出singleItem的特性
 *
 * @param singleItem - 要匹配的对象（该函数会自动寻找并匹配factionId）
 * @param checkMode - 筛选模式（default或hard），若选用hard模式，则会改为将所给singleItem的factionId作为excludeFactionId属性的考虑内容
 * @param searchBuff - 决定是否需要拆解并筛选buff的来源
 */
export const filterTraitsBySingleItem = (
  singleItem: SingleItem,
  checkMode: 'default' | 'hard' = 'default',
  searchBuff: boolean = true
): Trait[] => {
  const filteredTraits = Object.values(traits).filter((trait) =>
    checkItemMatchesTrait(trait, singleItem, checkMode)
  );
  if (!searchBuff) return filteredTraits;

  const buffRelatedTraits: Trait[] = [];
  const buffItems: SingleItem[] = [];

  if (searchBuff) {
    searchBuffBySingleItem(singleItem).forEach((buffItem) => {
      // 将buffItem添加到buffItems数组中
      buffItems.push(buffItem);

      // 检索该buff相关的trait
      const buffTraits = filterTraitsBySingleItem(buffItem, 'hard');
      buffRelatedTraits.push(...buffTraits);
    });
  }

  // 分别对原生trait和buff相关trait去重
  const baseTraits: Trait[] = [];
  const baseSeenKeys = new Set<string>();

  filteredTraits.forEach((trait) => {
    const key = getTraitKey(trait);
    if (!baseSeenKeys.has(key)) {
      baseSeenKeys.add(key);
      baseTraits.push(trait);
    }
  });

  const buffTraits: Trait[] = [];
  const buffSeenKeys = new Set<string>();

  buffRelatedTraits.forEach((trait) => {
    const key = getTraitKey(trait);
    // 排除已经在原生trait中出现的trait
    if (!baseSeenKeys.has(key) && !buffSeenKeys.has(key)) {
      buffSeenKeys.add(key);
      buffTraits.push(trait);
    }
  });

  // 合并trait，原生trait在前，buff相关trait在后
  return [...baseTraits, ...buffTraits];
};
