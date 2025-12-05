// GotoPreviewCard.tsx
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data';
import type { SkillType } from '@/data/types';
import clsx from 'clsx';

import { getTypeLabelColors } from '@/lib/design-tokens';
import Link from '@/components/Link';

import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import BaseCard from './BaseCard';
import Tag from './Tag';

export type GotoPreviewCardProps = {
  url: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  hideImage?: boolean;
  factionId?: FactionId;
  ownerName?: string;
  ownerFactionId?: FactionId;
  skillLevel?: number;
  skillType?: SkillType;
  skillLevelDescription?: string;
  clickable?: boolean; // when false, render preview as non-anchor to avoid nested <a>
};

const typeLabels: Record<string, string> = {
  character: '角色',
  card: '知识卡',
  item: '道具',
  entity: '衍生物',
  'special-skill-cat': '猫特技',
  'special-skill-mouse': '鼠特技',
  doc: '文档',
  'character-skill': '技能',
  buff: '状态',
  itemGroup: '组合',
};

const typeTokenStyles = (type: string, isDarkMode: boolean) => getTypeLabelColors(type, isDarkMode);

export default function PreviewCard({
  url,
  type,
  name,
  description,
  imageUrl,
  className = '',
  hideImage = false,
  factionId,
  ownerName,
  ownerFactionId,
  skillLevel,
  skillType,
  skillLevelDescription,
  clickable = true,
}: GotoPreviewCardProps) {
  const [isDarkMode] = useDarkMode();
  const factionLabel = (f: FactionId | undefined) =>
    f === 'cat' ? '猫' : f === 'mouse' ? '鼠' : undefined;
  const characterTypeLabel = factionLabel(factionId)
    ? `${factionLabel(factionId)}${typeLabels[type] || type}`
    : typeLabels[type] || type;
  const ownerSuffix =
    type === 'character-skill' && ownerName
      ? `（${ownerFactionId ? factionLabel(ownerFactionId) + '‐' : ''}${ownerName}）`
      : undefined;
  const content = (
    <BaseCard
      className={clsx(
        'flex w-full max-w-xs cursor-pointer flex-row items-start p-4 shadow-md transition-shadow duration-200 hover:shadow-lg sm:max-w-sm md:max-w-md md:p-5 lg:max-w-lg lg:p-6',
        className
      )}
      variant='details'
      role='link'
      tabIndex={-1}
    >
      {!hideImage && imageUrl ? (
        <div className='mr-4 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:h-28 md:w-28 lg:h-32 lg:w-32 dark:bg-gray-800'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className='h-full w-full object-contain'
            loading='lazy'
            draggable={false}
          />
        </div>
      ) : null}
      <div className='flex w-0 flex-1 flex-col items-start'>
        {!hideImage && imageUrl ? (
          <>
            <Tag
              colorStyles={typeTokenStyles(type, isDarkMode)}
              size='xs'
              margin='compact'
              className='mb-2'
            >
              {type === 'character' ? characterTypeLabel : typeLabels[type] || type}
            </Tag>
            <div className='mb-1 flex w-full min-w-0 items-baseline' title={name}>
              <span className='min-w-0 truncate text-lg font-bold text-gray-900 dark:text-gray-100'>
                {typeof skillLevel === 'number' && type === 'character-skill'
                  ? `${skillLevel}级 ${name}`
                  : name}
              </span>
              {ownerSuffix && (
                <span className='text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
                  {'\u00A0\u00A0'}
                  {ownerSuffix}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className='mb-1 flex w-full items-center gap-2'>
            <div className='flex flex-shrink-0 items-center gap-2'>
              <Tag colorStyles={typeTokenStyles(type, isDarkMode)} size='xs' margin='compact'>
                {type === 'character' ? characterTypeLabel : typeLabels[type] || type}
              </Tag>
            </div>
            <div className='flex min-w-0 flex-1 items-baseline' title={name}>
              <span className='min-w-0 truncate text-lg font-bold text-gray-900 dark:text-gray-100'>
                {typeof skillLevel === 'number' && type === 'character-skill'
                  ? `${skillLevel}级 ${name}`
                  : name}
              </span>
              {ownerSuffix && (
                <span className='text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
                  {'\u00A0\u00A0'}
                  {ownerSuffix}
                </span>
              )}
            </div>
          </div>
        )}
        {(() => {
          if (type !== 'character-skill') {
            if (!description) return null;
            return (
              <div
                className='line-clamp-3 w-full text-sm text-gray-600 dark:text-gray-300'
                title={description}
              >
                <TextWithHoverTooltips text={description} />
              </div>
            );
          }
          // character-skill description composition for level
          if (skillType === 'passive') {
            const text =
              skillLevelDescription && skillLevelDescription.trim().length > 0
                ? skillLevelDescription
                : description || '';
            if (!text) return null;
            return (
              <div
                className='line-clamp-3 w-full text-sm text-gray-600 dark:text-gray-300'
                title={text}
              >
                <TextWithHoverTooltips text={text} />
              </div>
            );
          }
          // non-passive: base description + optional level line
          const base = description || '';
          const levelLine =
            skillLevelDescription && String(skillLevel ?? '').length > 0
              ? `\nLv. ${skillLevel}: ${skillLevelDescription}`
              : '';
          const composed = `${base}${levelLine}`.trim();
          if (!composed) return null;
          return (
            <div
              className='line-clamp-3 w-full text-sm text-gray-600 dark:text-gray-300'
              title={composed}
            >
              <TextWithHoverTooltips text={composed} />
            </div>
          );
        })()}
      </div>
    </BaseCard>
  );

  if (!clickable) {
    return (
      <div tabIndex={0} role='group' aria-label={`${typeLabels[type] || type}: ${name}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={url} tabIndex={0} aria-label={`前往${typeLabels[type] || type}: ${name}`}>
      {content}
    </Link>
  );
}
