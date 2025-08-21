// GotoPreviewCard.tsx
import BaseCard from './BaseCard';
import clsx from 'clsx';
import Link from 'next/link';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import Tag from './Tag';

export type GotoPreviewCardProps = {
  url: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  hideImage?: boolean;
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
};

// kept for backward reference if needed, but not used now; tokens provide colors

const typeTokenStyles: Record<string, React.CSSProperties> = {
  character: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  card: { backgroundColor: '#FEF9C3', color: '#A16207' },
  item: { backgroundColor: '#DCFCE7', color: '#15803D' },
  entity: { backgroundColor: '#FFEDD5', color: '#C2410C' },
  'special-skill-cat': { backgroundColor: '#FCE7F3', color: '#BE185D' },
  'special-skill-mouse': { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  doc: { backgroundColor: '#F3F4F6', color: '#374151' },
  'character-skill': { backgroundColor: '#E0E7FF', color: '#4338CA' },
};
const defaultTypeStyle: React.CSSProperties = { backgroundColor: '#F3F4F6', color: '#374151' };

export default function PreviewCard({
  url,
  type,
  name,
  description,
  imageUrl,
  className = '',
  hideImage = false,
}: GotoPreviewCardProps) {
  return (
    <Link href={url} tabIndex={0} aria-label={`前往${typeLabels[type] || type}: ${name}`}>
      <BaseCard
        className={clsx(
          'flex flex-row items-start p-4 w-full max-w-xs shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer',
          className
        )}
        variant='details'
        role='link'
        tabIndex={-1}
      >
        {!hideImage && imageUrl ? (
          <div className='w-24 h-24 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mr-4'>
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
                colorStyles={typeTokenStyles[type] ?? defaultTypeStyle}
                size='xs'
                variant='compact'
                className='mb-2'
              >
                {typeLabels[type] || type}
              </Tag>
              <div
                className='font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 truncate w-full'
                title={name}
              >
                {name}
              </div>
            </>
          ) : (
            <div className='flex items-center gap-2 w-full mb-1'>
              <div
                className='font-bold text-lg text-gray-900 dark:text-gray-100 truncate flex-1'
                title={name}
              >
                {name}
              </div>
              <Tag
                colorStyles={typeTokenStyles[type] ?? defaultTypeStyle}
                size='xs'
                variant='compact'
                className='flex-shrink-0'
              >
                {typeLabels[type] || type}
              </Tag>
            </div>
          )}
          {description && (
            <div
              className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 w-full'
              title={description}
            >
              <TextWithHoverTooltips text={description} />
            </div>
          )}
        </div>
      </BaseCard>
    </Link>
  );
}
