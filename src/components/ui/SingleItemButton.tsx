import { useMemo } from 'react';

import { getTypeLabelColors } from '@/lib/design-tokens';
import { getSingleItemHref, getSingleItemImageUrl } from '@/lib/singleItemTools';
import { useDarkMode } from '@/context/DarkModeContext';
import { SingleItem } from '@/data/types';
import Image from '@/components/Image';

interface SingleItemButtonProps {
  singleItem: SingleItem;
  size?: 'default' | 'small';
}

export default function SingleItemButton({ singleItem, size = 'default' }: SingleItemButtonProps) {
  const [isDarkMode] = useDarkMode();

  function getSingleItemButtonColor(singleItem: SingleItem) {
    const getOriginalKey = (key: string): string => {
      const SpecificKeyMap: Record<string, string> = {
        skill: 'character-skill',
        knowledgeCard: 'card',
        specialSkill: 'special-skill-cat',
      };
      return SpecificKeyMap[key] || key;
    };
    const typeColorStyles = getTypeLabelColors(getOriginalKey(singleItem.type), isDarkMode);
    return { ...typeColorStyles, borderColor: typeColorStyles.color };
  }

  // 根据 size 计算样式类名
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          li: 'h-8', // 更小的列表项高度
          image: 'h-7 w-7', // 更小的图片尺寸
          text: 'text-xs', // 更小的文字
          padding: 'px-1.5', // 更小的内边距
          gap: 'gap-1', // 更小的间距
        };
      case 'default':
      default:
        return {
          li: 'h-11', // 默认高度
          image: 'h-10 w-10', // 默认图片尺寸
          text: 'text-sm', // 默认文字大小
          padding: 'px-2', // 默认内边距
          gap: 'gap-2', // 默认间距
        };
    }
  }, [size]);

  return (
    <li
      key={singleItem.name}
      className={`flex items-center overflow-hidden rounded-lg border-1 border-dotted transition-all hover:-translate-y-1 ${sizeClasses.li}`}
      style={getSingleItemButtonColor(singleItem)}
    >
      <a
        href={getSingleItemHref(singleItem)}
        className={`flex h-full w-full items-center ${sizeClasses.gap} ${sizeClasses.padding}`}
        tabIndex={0}
      >
        <Image
          src={getSingleItemImageUrl(singleItem)}
          alt={`${singleItem.name}图标`}
          className={`object-contain py-0.5 ${sizeClasses.image}`}
          width={size === 'small' ? 64 : 90} // 根据 size 调整图片宽度
          height={size === 'small' ? 64 : 90} // 根据 size 调整图片高度
        />
        <span className={`truncate dark:text-white ${sizeClasses.text}`}>{singleItem.name}</span>
      </a>
    </li>
  );
}
