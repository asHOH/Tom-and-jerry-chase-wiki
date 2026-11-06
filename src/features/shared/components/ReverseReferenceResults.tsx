import type { ReactNode } from 'react';

import { cn, getTypeLabelColors } from '@/lib/design';
import { getFactionLabel } from '@/constants/factions';
import {
  SingleItemTypeChineseNameList,
  type FactionId,
  type SingleItemTypeName,
} from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import Image from '@/components/Image';
import Link from '@/components/Link';

interface ReverseResult {
  name: string;
  type: SingleItemTypeName;
  factionId?: FactionId;
  description: string;
}

type HighlightTerms = {
  originalKeywords: string[];
  aliasKeywords: string[];
  groupKeywords: string[];
};

export function createReferenceHighlighter(categorizedKeywords: HighlightTerms) {
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

  return (text: string): ReactNode => {
    if (!text || !allKeywordsWithPriority.length) return text;
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
          <span key={`highlight-${index}`} className={cn('font-bold', keywordInfo.colorClass)}>
            {part}
          </span>
        );
      }

      return part;
    });
  };
}

export function ReverseResultButton({
  result,
  highlightKeywords,
  href,
  imageUrl,
  ownerSuffix,
  published = false,
}: {
  result: ReverseResult;
  href: string;
  imageUrl: string;
  ownerSuffix?: string | undefined;
  published?: boolean;
  highlightKeywords: (text: string) => ReactNode;
}) {
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
    return getTypeLabelColors(originalKey);
  }

  const buttonColors = getButtonColors();
  const RowLink = published ? Link : 'a';
  const factionLabel = getFactionLabel(result.factionId);

  return (
    <li className='w-full'>
      <RowLink
        {...(published ? { prefetch: false } : {})}
        href={href}
        className='flex w-full items-start rounded-lg p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
        style={{
          borderColor: buttonColors.color,
          backgroundColor: buttonColors.backgroundColor,
        }}
      >
        {/* Image on the left */}
        <div className='mr-2 shrink-0'>
          <Image
            src={imageUrl}
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
            <div className='mr-2 flex flex-1 items-baseline gap-1.5 overflow-hidden'>
              <span className='truncate font-medium text-gray-900 dark:text-white'>
                {highlightKeywords(result.name)}
              </span>
              {ownerSuffix ? (
                <span className='shrink-0 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400'>
                  {ownerSuffix}
                </span>
              ) : null}
            </div>

            {/* Type and faction tags */}
            <div className='flex shrink-0 items-center'>
              <span className='bg-surface/70 dark:bg-surface/80 rounded-md px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-300'>
                {SingleItemTypeChineseNameList[result.type]}
              </span>
              {factionLabel ? (
                <span className='bg-surface/70 dark:bg-surface/80 rounded-md px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-300'>
                  {factionLabel}
                </span>
              ) : null}
            </div>
          </div>

          {/* Description at the bottom with smaller gray text */}
          <div className='text-muted-foreground line-clamp-2 text-xs'>
            {result.description ? highlightKeywords(result.description) : '暂无描述'}
          </div>
        </div>
      </RowLink>
    </li>
  );
}

export function ReverseReferenceResults<Row>({
  rows,
  typeOf,
  renderRow,
}: {
  rows: Row[];
  typeOf: (row: Row) => SingleItemTypeName;
  renderRow: (row: Row, index: number) => ReactNode;
}) {
  if (rows.length === 0) {
    return null;
  }

  if (rows.length >= 10) {
    // Group by type for accordion
    const groupedByType = rows.reduce(
      (acc, item) => {
        const type = typeOf(item);
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      },
      {} as Record<SingleItemTypeName, Row[]>
    );

    // Convert to array for AccordionCard
    const accordionItems = Object.entries(groupedByType).map(([type, items], index) => {
      const chineseName = SingleItemTypeChineseNameList[type as SingleItemTypeName] || type;

      return {
        id: String(index),
        title: `${chineseName} (${items.length})`,
        children: <ul className='space-y-2'>{items.map(renderRow)}</ul>,
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
    return <ul className='mt-2 w-full space-y-2'>{rows.map(renderRow)}</ul>;
  }
}
