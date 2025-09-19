// GotoPreviewCard.tsx
import BaseCard from './BaseCard';
import clsx from 'clsx';
import Link from 'next/link';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import Tag from './Tag';
import { getTypeLabelColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data';

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
  skillType?: 'passive' | 'active' | 'weapon1' | 'weapon2';
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
  buff: '状态效果',
  itemGroup: '道具组',
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
        'flex flex-row items-start p-4 md:p-5 lg:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer',
        className
      )}
      variant='details'
      role='link'
      tabIndex={-1}
    >
      {!hideImage && imageUrl ? (
        <div className='w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mr-4'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className='object-contain w-full h-full'
            loading='lazy'
            draggable={false}
          />
        </div>
      ) : null}
      <div className='flex flex-col items-start w-0 flex-1'>
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
            <div className='mb-1 w-full flex items-baseline min-w-0' title={name}>
              <span className='font-bold text-lg text-gray-900 dark:text-gray-100 truncate min-w-0'>
                {typeof skillLevel === 'number' && type === 'character-skill'
                  ? `${skillLevel}级 ${name}`
                  : name}
              </span>
              {ownerSuffix && (
                <span className='text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                  {'\u00A0\u00A0'}
                  {ownerSuffix}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className='flex items-center gap-2 w-full mb-1'>
            <div className='flex items-center gap-2 flex-shrink-0'>
              <Tag colorStyles={typeTokenStyles(type, isDarkMode)} size='xs' margin='compact'>
                {type === 'character' ? characterTypeLabel : typeLabels[type] || type}
              </Tag>
            </div>
            <div className='flex-1 min-w-0 flex items-baseline' title={name}>
              <span className='font-bold text-lg text-gray-900 dark:text-gray-100 truncate min-w-0'>
                {typeof skillLevel === 'number' && type === 'character-skill'
                  ? `${skillLevel}级 ${name}`
                  : name}
              </span>
              {ownerSuffix && (
                <span className='text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
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
                className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 w-full'
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
                className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 w-full'
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
              className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 w-full'
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
