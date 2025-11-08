import { itemGroups } from '@/data';
import traits from '@/data/traits';
import { SingleItem, Trait } from '@/data/types';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
// 导入buffs数据
import buffs from '@/data/buffs'; // 请根据实际路径调整
// 导入OneTraitText函数
import { OneTraitText } from './OneTraitText';

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

export const filterTraitsBySingleItem = (singleItem: SingleItem): Trait[] => {
  return traits.filter((trait) => {
    // 优先检查spacialCase
    if (trait.spacialCase && trait.spacialCase.length > 0) {
      for (const sc of trait.spacialCase) {
        if (
          sc.group.some((groupItem) => {
            if (Array.isArray(groupItem)) {
              return groupItem.some(
                (item) =>
                  singleItem.name === item.name &&
                  singleItem.type === item.type &&
                  compareFactionId(singleItem.factionId, item.factionId)
              );
            } else if (groupItem.type === 'itemGroup') {
              return itemGroups[groupItem.name]?.group.some(
                (item) =>
                  singleItem.name === item.name &&
                  singleItem.type === item.type &&
                  compareFactionId(singleItem.factionId, item.factionId)
              );
            } else {
              return (
                groupItem.name === singleItem.name &&
                groupItem.type === singleItem.type &&
                compareFactionId(singleItem.factionId, groupItem.factionId)
              );
            }
          })
        ) {
          return true;
        }
      }
    }

    // 如果没有在spacialCase中找到，检查原始group
    return trait.group.some((groupItem) => {
      if (Array.isArray(groupItem)) {
        return groupItem.some(
          (item) =>
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
        );
      } else if (groupItem.type === 'itemGroup') {
        return itemGroups[groupItem.name]?.group.some(
          (item) =>
            singleItem.name === item.name &&
            singleItem.type === item.type &&
            compareFactionId(singleItem.factionId, item.factionId)
        );
      } else {
        return (
          groupItem.name === singleItem.name &&
          groupItem.type === singleItem.type &&
          compareFactionId(singleItem.factionId, groupItem.factionId)
        );
      }
    });
  });
};

interface SingleItemTraitsTextProps {
  singleItem: SingleItem;
  searchBuff?: boolean; // 新增的searchBuff属性
}

// 辅助函数：根据Trait的内容生成唯一标识符
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

export default function SingleItemTraitsText({
  singleItem,
  searchBuff = true, // 默认值为true
}: SingleItemTraitsTextProps) {
  // 第1步：引用先前的函数，筛选包含该SingleItem的Trait
  const filteredTraits = filterTraitsBySingleItem(singleItem);

  // 新增：如果searchBuff为true，检索相关的buff
  const buffRelatedTraits: Trait[] = [];
  const buffItems: SingleItem[] = [];

  if (searchBuff) {
    // 查找所有source包含当前singleItem的buff
    Object.values(buffs).forEach((buff) => {
      if (
        buff.source &&
        buff.source.some(
          (sourceItem) =>
            sourceItem.name === singleItem.name &&
            sourceItem.type === singleItem.type &&
            compareFactionId(singleItem.factionId, sourceItem.factionId)
        )
      ) {
        // 创建buff对应的SingleItem
        const buffItem: SingleItem = {
          name: buff.name,
          type: 'buff',
          // 如果有其他必要属性，请根据实际情况添加
        };
        buffItems.push(buffItem);

        // 检索该buff相关的trait
        const buffTraits = filterTraitsBySingleItem(buffItem);
        buffRelatedTraits.push(...buffTraits);
      }
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
  const allTraits = [...baseTraits, ...buffTraits];

  if (allTraits.length === 0) {
    return (
      <TextWithHoverTooltips text='    $暂未收录相关特性$italic text-gray-500 dark:text-gray-400 text-sm#' />
    );
  }

  // 第2步：使用导入的OneTraitText函数为每个Trait生成格式化字符串
  const result: string[] = [];

  allTraits.forEach((trait) => {
    // 判断当前trait是来自原生singleItem还是buff
    const isFromBuff = buffTraits.includes(trait);
    const currentItem = isFromBuff
      ? buffItems.find((buffItem) =>
          filterTraitsBySingleItem(buffItem).some((t) => getTraitKey(t) === getTraitKey(trait))
        )
      : singleItem;

    if (!currentItem) return;

    // 使用导入的函数生成文本
    const textResult = OneTraitText(trait, currentItem);

    // 处理OneTraitText返回的结果（可能是字符串或字符串数组）
    if (Array.isArray(textResult)) {
      result.push(...textResult);
    } else {
      result.push(textResult);
    }
  });

  // 使用合适的分隔符，比如换行符或逗号
  return <TextWithHoverTooltips text={result.join('\n')} />;
}
