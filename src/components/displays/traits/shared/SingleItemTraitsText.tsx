import { itemGroups } from '@/data';
import traits from '@/data/traits';
import { SingleItem, Trait } from '@/data/types';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
// 导入buffs数据
import buffs from '@/data/buffs'; // 请根据实际路径调整

const SingleItemType = (singleItem: SingleItem): string => {
  return {
    buff: '状态',
    character: '角色',
    entity: '衍生物',
    item: '道具',
    knowledgeCard: '知识卡',
    skill: '技能',
    specialSkill: '特技',
  }[singleItem.type];
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

export const filterTraitsBySingleItem = (singleItem: SingleItem): Trait[] => {
  return traits.filter((trait) => {
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
  let buffRelatedTraits: Trait[] = [];
  let buffItems: SingleItem[] = [];

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

  // 第2步：为每个Trait生成格式化字符串
  const result: string[] = allTraits.map((trait) => {
    // 判断当前trait是来自原生singleItem还是buff
    const isFromBuff = buffTraits.includes(trait);
    const currentItem = isFromBuff
      ? buffItems.find((buffItem) =>
          filterTraitsBySingleItem(buffItem).some((t) => getTraitKey(t) === getTraitKey(trait))
        )
      : singleItem;

    if (!currentItem) return '';

    // 处理group内的所有SingleItem，生成名称列表（排除当前singleItem）
    const itemNames: string[] = [];
    const printName: string[] = [currentItem.name]; //最终显示时只会显示最后一个名称

    trait.group.forEach((groupItem) => {
      if (Array.isArray(groupItem)) {
        // 对于数组类型，检查是否包含目标singleItem。对itemGroup需进行拆解，且若查找到目标则更改printName
        const containsTarget = groupItem.some((item) => {
          if (item.type === 'itemGroup') {
            return itemGroups[item.name]?.group.some((childrenItem) => {
              if (
                currentItem.name === childrenItem.name &&
                currentItem.type === childrenItem.type &&
                compareFactionId(currentItem.factionId, childrenItem.factionId)
              ) {
                printName.push(item.name);
                return true;
              }
              return false;
            });
          } else {
            return (
              currentItem.name === item.name &&
              currentItem.type === item.type &&
              compareFactionId(currentItem.factionId, item.factionId)
            );
          }
        });

        if (!containsTarget) {
          // 如果不包含目标，保留整个数组，反之则整个删去
          const arrayItemNames = groupItem
            .map((item) =>
              item.type === 'itemGroup'
                ? item.name + `$text-orange-600 dark:text-orange-400#(组合)`
                : item.name + `$text-blue-700 dark:text-blue-400#(${SingleItemType(item)})`
            )
            .join('}/{$');
          itemNames.push(arrayItemNames);
        }
      } else if (groupItem.type === 'itemGroup') {
        //对于组合，先判断能否查找到对应组合内容，若无对应目标则整个删去
        const group = itemGroups[groupItem.name]?.group;
        if (group !== undefined) {
          // 然后检查是否包含目标singleItem
          const containsTarget = group.some(
            (item) =>
              currentItem.name === item.name &&
              currentItem.type === item.type &&
              compareFactionId(currentItem.factionId, item.factionId)
          );

          if (!containsTarget) {
            // 如果不包含目标，则输出组合名
            itemNames.push(groupItem.name + `$text-orange-600 dark:text-orange-400#(组合)`);
          } else {
            //如果包含目标，则在最终输出时以该组合的name替代原本SingleItem的name
            printName.push(groupItem.name);
          }
        }
      } else {
        // 对于单个SingleItem，如果不是目标SingleItem，则保留
        if (
          !(
            groupItem.name === currentItem.name &&
            groupItem.type === currentItem.type &&
            compareFactionId(currentItem.factionId, groupItem.factionId)
          )
        ) {
          itemNames.push(
            groupItem.name + `$text-blue-700 dark:text-blue-400#(${SingleItemType(groupItem)})`
          );
        }
      }
    });

    // 第3步：生成最终格式化的字符串，注意singleItem与itemGroup的颜色区别
    if (itemNames.length === 0) {
      return `{${currentItem.name}}：${trait.description}`;
    } else {
      const namesString = itemNames.join('}、{$');
      return ` • {$${printName[printName.length - 1]}${
        printName[printName.length - 1] !== printName[0]
          ? '$text-orange-600 dark:text-orange-400#(组合)'
          : `$text-blue-700 dark:text-blue-400#(${SingleItemType(currentItem)})`
      }} 与 {$${namesString}}：${trait.description}`;
    }
  });

  // 使用合适的分隔符，比如换行符或逗号
  return <TextWithHoverTooltips text={result.join('\n')} />;
}
