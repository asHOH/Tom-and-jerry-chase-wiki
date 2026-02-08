import { useMemo } from 'react';

import { getTypeLabelColors } from '@/lib/design';
import singleItemRreverse, { getCategorizedKeywords } from '@/lib/singleItemReverse';
import { getSingleItemHref, getSingleItemImageUrl } from '@/lib/singleItemTools';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import {
  FactionId,
  SingleItem,
  SingleItemTypeChineseNameList,
  SingleItemTypeName,
} from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import Image from '@/components/Image';

interface SingleItemReverseProps {
  singleItem: SingleItem;
}

interface ReverseResult {
  name: string;
  type: SingleItemTypeName;
  factionId?: FactionId;
  description: string;
}

// New button component integrated directly
function ReverseResultButton({
  result,
  categorizedKeywords,
}: {
  result: ReverseResult;
  categorizedKeywords: {
    originalKeywords: string[];
    aliasKeywords: string[];
    groupKeywords: string[];
  };
}) {
  const [isDarkMode] = useDarkMode();

  // Get button colors based on type
  function getButtonColors() {
    // Map type to the original keys used in getTypeLabelColors
    const typeKeyMap: Record<SingleItemTypeName, string> = {
      character: 'character',
      skill: 'character-skill',
      knowledgeCard: 'card',
      specialSkill: 'special-skill-cat',
      item: 'item',
      entity: 'entity',
      buff: 'buff',
      map: 'map',
      fixture: 'fixture',
      mode: 'mode',
      achievement: 'achievement',
    };

    const originalKey = typeKeyMap[result.type] || result.type;
    return getTypeLabelColors(originalKey, isDarkMode);
  }

  const buttonColors = getButtonColors();

  // Helper function to highlight matched keywords in text with priority
  const highlightKeywords = (text: string): React.ReactNode => {
    if (!text) return text;

    // Combine all keywords with their types and priority
    // Priority order: 1 (highest) - original, 2 - alias, 3 - group
    const allKeywordsWithPriority = [
      ...categorizedKeywords.originalKeywords.map((keyword) => ({
        keyword,
        priority: 1,
        colorClass: 'text-blue-600 dark:text-blue-400', // 原名：蓝色
      })),
      ...categorizedKeywords.aliasKeywords.map((keyword) => ({
        keyword,
        priority: 2,
        colorClass: 'text-violet-600 dark:text-violet-400', // 别名：紫罗兰色
      })),
      ...categorizedKeywords.groupKeywords.map((keyword) => ({
        keyword,
        priority: 3,
        colorClass: 'text-orange-600 dark:text-orange-400', // 组合名：橙色
      })),
    ];

    // Sort by keyword length (longest first) to avoid partial matches
    // Then sort by priority (lower priority number first) to ensure correct color
    allKeywordsWithPriority.sort((a, b) => {
      if (b.keyword.length !== a.keyword.length) {
        return b.keyword.length - a.keyword.length; // Longer keywords first
      }
      return a.priority - b.priority; // Lower priority number first
    });

    // Create a regex pattern that matches any keyword
    // Escape special regex characters
    const escapedKeywords = allKeywordsWithPriority.map((k) =>
      k.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    // Use a non-capturing group to match any keyword
    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'g');

    // Split text by pattern
    const parts = text.split(pattern);

    // If no matches found, return original text
    if (parts.length === 1) return text;

    // Map each part to either highlighted span or plain text
    return parts.map((part, index) => {
      // Find the keyword info for this part
      const keywordInfo = allKeywordsWithPriority.find((k) => k.keyword === part);

      if (keywordInfo) {
        return (
          <span key={`highlight-${index}`} className={`font-bold ${keywordInfo.colorClass}`}>
            {part}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <li className='w-full'>
      <a
        href={getSingleItemHref(result)}
        className='flex w-full items-start rounded-lg border-1 border-dotted p-1.5 transition-all hover:-translate-y-1'
        style={{
          borderColor: buttonColors.color,
          backgroundColor: buttonColors.backgroundColor,
        }}
      >
        {/* Image on the left */}
        <div className='mr-2 flex-shrink-0'>
          <Image
            src={getSingleItemImageUrl(result)}
            alt={`${result.name}图标`}
            className='h-12 w-12 object-contain'
            width={48}
            height={48}
          />
        </div>

        {/* Text content on the right */}
        <div className='min-w-0 flex-1'>
          {/* Top row: name and tags */}
          <div className='mb-1 flex items-center justify-between'>
            {/* Object name */}
            <div className='mr-2 flex-1 truncate font-medium text-gray-900 dark:text-white'>
              {highlightKeywords(result.name)}
            </div>

            {/* Type and faction tags */}
            <div className='flex flex-shrink-0 items-center gap-2'>
              <span className='rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                {SingleItemTypeChineseNameList[result.type]}
              </span>
              {result.factionId && (
                <span className='rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                  {result.factionId === 'cat' ? '猫' : '鼠'}
                </span>
              )}
            </div>
          </div>

          {/* Description at the bottom with smaller gray text */}
          <div className='line-clamp-2 text-xs text-gray-600 dark:text-gray-400'>
            {result.description ? highlightKeywords(result.description) : '暂无描述'}
          </div>
        </div>
      </a>
    </li>
  );
}

export default function SingleItemReverseCard({ singleItem }: SingleItemReverseProps) {
  const isMobile = useMobile();
  const reverse = singleItemRreverse(singleItem, isMobile);

  const categorizedKeywords = useMemo(() => {
    return getCategorizedKeywords(singleItem);
  }, [singleItem]);

  if (!reverse || reverse.length === 0) {
    return null;
  }

  if (reverse.length >= 10) {
    // Group by type for accordion
    const groupedByType = reverse.reduce(
      (acc, item) => {
        const type = item.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      },
      {} as Record<SingleItemTypeName, typeof reverse>
    );

    // Convert to array for AccordionCard
    const accordionItems = Object.entries(groupedByType).map(([type, items], index) => {
      const chineseName = SingleItemTypeChineseNameList[type as SingleItemTypeName] || type;

      return {
        id: String(index),
        title: `${chineseName} (${items.length})`,
        children: (
          <ul className='space-y-2'>
            {items.map((item, key) => (
              <ReverseResultButton
                key={key}
                result={item}
                categorizedKeywords={categorizedKeywords}
              />
            ))}
          </ul>
        ),
        activeColor: 'orange' as const,
      };
    });

    return (
      <AccordionCard
        items={accordionItems}
        titleClassName='mt-2'
        className='mt-2'
        size='xs'
        defaultOpenId='0'
      />
    );
  } else {
    // Display all results directly in a list
    return (
      <ul className='mt-2 w-full space-y-2'>
        {reverse.map((item, key) => (
          <ReverseResultButton key={key} result={item} categorizedKeywords={categorizedKeywords} />
        ))}
      </ul>
    );
  }
}
