import {
  FactionId,
  SingleItem,
  SingleItemOrGroup,
  SingleItemTypeChineseNameList,
  Trait,
  TraitGroup,
} from '@/data/types';
import { itemGroups } from '@/data';

import { checkItemMatchesGroup, checkItemMatchesTrait, searchBuffBySingleItem } from './tools';

// 辅助函数：为singleItemOrGroup生成符合要求的链接文本，包括颜色信息
const getSingleItemNameWithColorText = (singleItemOrGroup: SingleItemOrGroup): string => {
  const SingleItemTypeChineseName =
    singleItemOrGroup.type === 'itemGroup'
      ? '组合'
      : SingleItemTypeChineseNameList[singleItemOrGroup.type];
  const textColor =
    singleItemOrGroup.type === 'itemGroup' || singleItemOrGroup.type === 'buff'
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-blue-700 dark:text-blue-400';
  return `{$${singleItemOrGroup.name}$${textColor}#(${SingleItemTypeChineseName})}`;
};

// 辅助函数：生成Trait的完整group的显示文本。isMinor属性决定最终文本的前缀类型
const formatWholeGroup = (
  group: TraitGroup,
  description: string,
  isMinor: boolean = false
): string => {
  const itemNames: string[] = [];

  group.forEach((groupItem) => {
    if (Array.isArray(groupItem)) {
      // 对于数组类型，显示所有元素
      const arrayItemNames = groupItem
        .map((item) => getSingleItemNameWithColorText(item))
        .join('/');
      itemNames.push(arrayItemNames);
    } else {
      // 对于单个SingleItem，显示其名称和类型
      itemNames.push(getSingleItemNameWithColorText(groupItem));
    }
  });

  // 生成整个group的字符串
  const namesString = itemNames.join('、');
  return `${isMinor ? ' └─' : ' • '}${namesString}：${description}`;
};

// 辅助函数：生成Trait的基于singleItem为主内容的group的显示文本。isMinor属性决定最终文本的前缀类型
const formatWithExclusion = (
  group: TraitGroup,
  description: string,
  singleItem: SingleItem,
  excludeFactionId?: FactionId | undefined,
  isMinor: boolean = false
): string => {
  const itemNames: string[] = [];
  const printItem: SingleItemOrGroup[] = [singleItem]; // 最终显示时只会显示最后一个名称

  group.forEach((groupItem) => {
    if (Array.isArray(groupItem)) {
      // 对于数组类型，检查是否包含目标singleItem。对itemGroup需进行拆解，且若查找到目标则更改printItem
      const containsTarget = checkItemMatchesGroup(groupItem, singleItem, excludeFactionId);

      if (!containsTarget) {
        // 如果不包含目标，保留整个数组
        const arrayItemNames = groupItem
          .map((item) => getSingleItemNameWithColorText(item))
          .join('/');
        itemNames.push(arrayItemNames);
      } else {
        // 如果包含目标，则需查找到具体是哪个对象，将其加入PrintItem
        for (const item of groupItem) {
          if (checkItemMatchesGroup(item, singleItem, excludeFactionId)) {
            printItem.push(item);
            break;
          }
        }
      }
    } else if (groupItem.type === 'itemGroup') {
      // 对于组合，先判断能否查找到对应组合内容，若无对应目标则整个删去
      const group = itemGroups[groupItem.name]?.group;
      if (group !== undefined) {
        // 然后检查是否包含目标singleItem
        const containsTarget = checkItemMatchesGroup(group, singleItem, excludeFactionId);

        if (!containsTarget) {
          // 如果不包含目标，则输出组合名
          itemNames.push(getSingleItemNameWithColorText(groupItem));
        } else {
          // 如果包含目标，则在最终输出时以该组合的name替代原本SingleItem的name
          printItem.push(groupItem);
        }
      }
    } else {
      // 对于单个SingleItem，如果不是目标SingleItem，则保留
      if (!checkItemMatchesGroup(groupItem, singleItem, excludeFactionId)) {
        itemNames.push(getSingleItemNameWithColorText(groupItem));
      }
    }
  });

  // 生成最终格式化的字符串，注意singleItem与itemGroup的颜色区别
  if (itemNames.length === 0) {
    return `${singleItem.name}：${description}`;
  } else {
    const namesString = itemNames.join('、');
    return `${isMinor ? ' └─' : ' • '}${getSingleItemNameWithColorText(printItem[printItem.length - 1]!)} 与 ${namesString}：${description}`;
  }
};

// 辅助函数：查找并生成单个singleItem的文本
const getTraitTextWithSingleItem = (
  trait: Trait,
  singleItem: SingleItem
): string | string[] | null => {
  // 如果传入了singleItem，优先检查spacialCase
  if (!!trait.spacialCase && trait.spacialCase.length > 0) {
    const results: string[] = [];
    //若所给singleItem直接存在于外部Trait，则生成主描述，反之则不生成主描述（非拆解）
    const isMinor: boolean = checkItemMatchesTrait(trait, singleItem, 'default', true, true);
    if (isMinor) {
      results.push(
        formatWithExclusion(trait.group, trait.description, singleItem, trait.excludeFactionId)
      );
    }
    //遍历每个spacialCase，录入
    for (const sc of trait.spacialCase) {
      if (
        checkItemMatchesTrait(
          {
            ...sc,
            ...(trait.excludeFactionId !== undefined && {
              excludeFactionId: trait.excludeFactionId,
            }),
          } as Trait, //将内部sc作为单独的Trait进行索引，并对其额外赋予外部的excludeFactionId属性
          singleItem
        )
      ) {
        results.push(
          formatWithExclusion(sc.group, sc.description, singleItem, trait.excludeFactionId, isMinor)
        );
      }
    }

    if (results.length > 0) return results;
  }

  // 如果在spacialCase中没找到，检查原始Trait
  if (checkItemMatchesTrait(trait, singleItem)) {
    return formatWithExclusion(trait.group, trait.description, singleItem, trait.excludeFactionId);
  }

  return null;
};

// 主函数：输入单条Trait以及一个可选的SingleItem，输出该Trait应当显示的文本
export const OneTraitText = (
  trait: Trait,
  singleItem?: SingleItem,
  searchBuff: boolean = true
): string | string[] => {
  // 如果没有传入singleItem
  if (!singleItem) {
    const results: string[] = [];

    // 为原始Trait生成文本
    results.push(formatWholeGroup(trait.group, trait.description));

    // 如果有spacialCase，为每个spacialCase生成文本
    if (trait.spacialCase && trait.spacialCase.length > 0) {
      trait.spacialCase.forEach((sc) => {
        results.push(formatWholeGroup(sc.group, sc.description, true));
      });
    }

    return results;
  }

  // 处理singleItem的情况
  const singleItemResult = getTraitTextWithSingleItem(trait, singleItem);
  if (singleItemResult !== null) {
    return singleItemResult;
  }

  // 以全部buff作为内容，继续查找
  if (searchBuff) {
    for (const buffItem of searchBuffBySingleItem(singleItem)) {
      const buffItemResult = getTraitTextWithSingleItem(trait, buffItem);
      if (buffItemResult !== null) {
        return buffItemResult;
      }
    }
  }

  // 如果都没找到，返回整个group
  return formatWholeGroup(trait.group, trait.description);
};
