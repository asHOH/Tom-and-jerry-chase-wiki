import { SingleItem } from '@/data/types';

import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import { filterTraitsBySingleItem } from './filterTraitsBySingleItem';
import { OneTraitText } from './OneTraitText';

interface SingleItemTraitsTextProps {
  singleItem: SingleItem;
  searchBuff?: boolean;
}

//主函数 - 根据SingleItem生成所需文本。searchBuff决定是否需要拆解并筛选buff的来源
export default function SingleItemTraitsText({
  singleItem,
  searchBuff = true,
}: SingleItemTraitsTextProps) {
  // 第1步：筛选包含该SingleItem的Trait
  const allTraits = filterTraitsBySingleItem(singleItem, 'default', searchBuff);

  if (allTraits.length === 0) {
    return (
      <TextWithHoverTooltips text='    $暂未收录相关特性$italic text-gray-500 dark:text-gray-400 text-sm#' />
    );
  }

  // 第2步：使用导入的OneTraitText函数为每个Trait生成格式化字符串
  const result: string[] = [];

  allTraits.forEach((trait) => {
    // 使用导入的函数生成文本
    const textResult = OneTraitText(trait, singleItem);

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
