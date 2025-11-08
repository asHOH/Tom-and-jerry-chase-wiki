import { itemGroups } from '@/data';
import { SingleItem, SingleItemOrGroup, Trait, SingleItemTypeChineseNameList } from '@/data/types';

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

// 辅助函数：比较两个SingleItem的factionId
const compareFactionId = (
  factionId1: string | undefined,
  factionId2: string | undefined
): boolean => {
  // 如果任一factionId为undefined，视为相等
  if (factionId1 === undefined || factionId2 === undefined) {
    return true;
  }
  // 如果都有实际值，则比较是否相等
  return factionId1 === factionId2;
};

// 辅助函数：检查Trait中是否包含指定的SingleItem
const traitContainsSingleItem = (trait: Trait, singleItem: SingleItem): boolean => {
  return trait.group.some((groupItem) => {
    if (Array.isArray(groupItem)) {
      return groupItem.some((item) => {
        if (item.type === 'itemGroup') {
          return itemGroups[item.name]?.group.some((childrenItem) => {
            return (
              singleItem.name === childrenItem.name &&
              singleItem.type === childrenItem.type &&
              compareFactionId(singleItem.factionId, childrenItem.factionId)
            );
          });
        } else {
          return (
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
          );
        }
      });
    } else if (groupItem.type === 'itemGroup') {
      const group = itemGroups[groupItem.name]?.group;
      return (
        group?.some(
          (item) =>
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
        ) || false
      );
    } else {
      return (
        groupItem.name === singleItem.name &&
        groupItem.type === singleItem.type &&
        compareFactionId(singleItem.factionId, groupItem.factionId)
      );
    }
  });
};

// 辅助函数：检查Trait中是否直接包含指定的SingleItem（不包括数组或itemGroup拆解）
const traitDirectlyContainsSingleItem = (trait: Trait, singleItem: SingleItem): boolean => {
  return trait.group.some((groupItem) => {
    // 排除数组和itemGroup，只检查直接的单体SingleItem
    if (!Array.isArray(groupItem) && groupItem.type !== 'itemGroup') {
      return (
        groupItem.name === singleItem.name &&
        groupItem.type === singleItem.type &&
        compareFactionId(singleItem.factionId, groupItem.factionId)
      );
    }
    return false;
  });
};

// 辅助函数：检查spacialCase中是否包含指定的SingleItem
const spacialCaseContainsSingleItem = (spacialCase: any, singleItem: SingleItem): boolean => {
  return spacialCase.group.some((groupItem: any) => {
    if (Array.isArray(groupItem)) {
      return groupItem.some((item: any) => {
        if (item.type === 'itemGroup') {
          return itemGroups[item.name]?.group.some((childrenItem: any) => {
            return (
              singleItem.name === childrenItem.name &&
              singleItem.type === childrenItem.type &&
              compareFactionId(singleItem.factionId, childrenItem.factionId)
            );
          });
        } else {
          return (
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
          );
        }
      });
    } else if (groupItem.type === 'itemGroup') {
      const group = itemGroups[groupItem.name]?.group;
      return (
        group?.some(
          (item: any) =>
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
        ) || false
      );
    } else {
      return (
        groupItem.name === singleItem.name &&
        groupItem.type === singleItem.type &&
        compareFactionId(singleItem.factionId, groupItem.factionId)
      );
    }
  });
};

// 辅助函数：格式化整个group的显示
const formatWholeGroup = (group: any[], description: string, isMinor: boolean = false): string => {
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

// 辅助函数：使用排除逻辑格式化文本
const formatWithExclusion = (
  group: any[],
  description: string,
  singleItem: SingleItem,
  isMinor: boolean = false
): string => {
  const itemNames: string[] = [];
  const printName: string[] = [singleItem.name]; // 最终显示时只会显示最后一个名称

  group.forEach((groupItem) => {
    if (Array.isArray(groupItem)) {
      // 对于数组类型，检查是否包含目标singleItem。对itemGroup需进行拆解，且若查找到目标则更改printName
      const containsTarget = groupItem.some((item) => {
        if (item.type === 'itemGroup') {
          return itemGroups[item.name]?.group.some((childrenItem) => {
            if (
              singleItem.name === childrenItem.name &&
              singleItem.type === childrenItem.type &&
              compareFactionId(singleItem.factionId, childrenItem.factionId)
            ) {
              printName.push(item.name);
              return true;
            }
            return false;
          });
        } else {
          return (
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
          );
        }
      });

      if (!containsTarget) {
        // 如果不包含目标，保留整个数组，反之则整个删去
        const arrayItemNames = groupItem
          .map((item) => getSingleItemNameWithColorText(item))
          .join('/');
        itemNames.push(arrayItemNames);
      }
    } else if (groupItem.type === 'itemGroup') {
      // 对于组合，先判断能否查找到对应组合内容，若无对应目标则整个删去
      const group = itemGroups[groupItem.name]?.group;
      if (group !== undefined) {
        // 然后检查是否包含目标singleItem
        const containsTarget = group.some(
          (item) =>
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
        );

        if (!containsTarget) {
          // 如果不包含目标，则输出组合名
          itemNames.push(getSingleItemNameWithColorText(groupItem));
        } else {
          // 如果包含目标，则在最终输出时以该组合的name替代原本SingleItem的name
          printName.push(getSingleItemNameWithColorText(groupItem));
        }
      }
    } else {
      // 对于单个SingleItem，如果不是目标SingleItem，则保留
      if (
        !(
          groupItem.name === singleItem.name &&
          groupItem.type === singleItem.type &&
          compareFactionId(singleItem.factionId, groupItem.factionId)
        )
      ) {
        itemNames.push(getSingleItemNameWithColorText(groupItem));
      }
    }
  });

  // 生成最终格式化的字符串，注意singleItem与itemGroup的颜色区别
  if (itemNames.length === 0) {
    return `${singleItem.name}：${description}`;
  } else {
    const namesString = itemNames.join('、');
    return `${isMinor ? ' └─' : ' • '}${getSingleItemNameWithColorText(singleItem)} 与 ${namesString}：${description}`;
  }
};

// 新函数：输入单条Trait以及一个可选的SingleItem，输出该Trait应当显示的文本
export const OneTraitText = (trait: Trait, singleItem?: SingleItem): string | string[] => {
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

  // 如果传入了singleItem，优先检查spacialCase
  if (trait.spacialCase && trait.spacialCase.length > 0) {
    for (const sc of trait.spacialCase) {
      if (spacialCaseContainsSingleItem(sc, singleItem)) {
        // 如果在spacialCase中找到，检查外部Trait是否也直接包含该singleItem
        if (traitDirectlyContainsSingleItem(trait, singleItem)) {
          // 如果外部Trait也直接包含，返回两段文本
          return [
            formatWithExclusion(trait.group, trait.description, singleItem),
            formatWithExclusion(sc.group, sc.description, singleItem, true),
          ];
        } else {
          // 如果外部Trait不直接包含，只返回spacialCase的文本
          return formatWithExclusion(sc.group, sc.description, singleItem);
        }
      }
    }
  }

  // 如果在spacialCase中没找到，检查原始Trait
  if (traitContainsSingleItem(trait, singleItem)) {
    return formatWithExclusion(trait.group, trait.description, singleItem);
  }

  // 如果都没找到，返回整个group
  return formatWholeGroup(trait.group, trait.description);
};
