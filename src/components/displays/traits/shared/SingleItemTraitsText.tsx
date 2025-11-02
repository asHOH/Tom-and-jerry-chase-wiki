import { itemGroups } from '@/data';
import traits from '@/data/traits';
import { SingleItem, Trait } from '@/data/types';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';

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

export const filterTraitsBySingleItem = (singleItem: SingleItem): Trait[] => {
  return traits.filter((trait) => {
    return trait.group.some((groupItem) => {
      if (Array.isArray(groupItem)) {
        return groupItem.some(
          (item) => singleItem.name === item.name && singleItem.type === item.type
        );
      } else if (groupItem.type === 'itemGroup') {
        return itemGroups[groupItem.name]?.group.some(
          (item) => singleItem.name === item.name && singleItem.type === item.type
        );
      } else {
        return groupItem.name === singleItem.name && groupItem.type === singleItem.type;
      }
    });
  });
};

interface SingleItemTraitsTextProps {
  singleItem: SingleItem;
}

export default function SingleItemTraitsText({ singleItem }: SingleItemTraitsTextProps) {
  // 第1步：引用先前的函数，筛选包含该SingleItem的Trait
  const filteredTraits = filterTraitsBySingleItem(singleItem);
  if (filteredTraits.length === 0) {
    return (
      <TextWithHoverTooltips text='    $暂未收录相关特性$italic text-gray-500 dark:text-gray-400 text-sm#' />
    );
  }

  // 第2步：为每个Trait生成格式化字符串
  const result: string[] = filteredTraits.map((trait) => {
    // 处理group内的所有SingleItem，生成名称列表（排除当前singleItem）
    const itemNames: string[] = [];
    const printName: string[] = [singleItem.name]; //最终显示时只会显示最后一个名称

    trait.group.forEach((groupItem) => {
      if (Array.isArray(groupItem)) {
        // 对于数组类型，检查是否包含目标singleItem。对itemGroup需进行拆解，且若查找到目标则更改printName
        const containsTarget = groupItem.some((item) => {
          if (item.type === 'itemGroup') {
            return itemGroups[item.name]?.group.some((childrenItem) => {
              if (
                singleItem.name === childrenItem.name &&
                singleItem.type === childrenItem.type &&
                (childrenItem.factionId === undefined ||
                  singleItem.factionId === childrenItem.factionId)
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
              (item.factionId === undefined || singleItem.factionId === item.factionId)
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
              singleItem.name === item.name &&
              singleItem.type === item.type &&
              (item.factionId === undefined || singleItem.factionId === item.factionId)
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
            groupItem.name === singleItem.name &&
            groupItem.type === singleItem.type &&
            (singleItem.factionId === undefined || groupItem.factionId === singleItem.factionId)
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
      return `{${singleItem.name}}：${trait.description}`;
    } else {
      const namesString = itemNames.join('}、{$');
      return ` • {$${printName[printName.length - 1]}${
        printName[printName.length - 1] !== printName[0]
          ? '$text-orange-600 dark:text-orange-400#(组合)'
          : `$text-blue-700 dark:text-blue-400#(${SingleItemType(singleItem)})`
      }} 与 {$${namesString}}：${trait.description}`;
    }
  });

  // 使用合适的分隔符，比如换行符或逗号
  return <TextWithHoverTooltips text={result.join('\n')} />;
}
