// GotoPreviewCard.tsx
import BaseCard from './BaseCard';
import clsx from 'clsx';
import Link from 'next/link';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';

export type GotoPreviewCardProps = {
  url: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  className?: string;
};

const typeLabels: Record<string, string> = {
  character: '角色',
  card: '知识卡',
  item: '道具',
  'special-skill-cat': '猫特技',
  'special-skill-mouse': '鼠特技',
  doc: '文档',
  'character-skill': '技能',
};

const typeColors: Record<string, string> = {
  character: 'bg-blue-100 text-blue-700',
  card: 'bg-yellow-100 text-yellow-700',
  item: 'bg-green-100 text-green-700',
  'special-skill-cat': 'bg-pink-100 text-pink-700',
  'special-skill-mouse': 'bg-purple-100 text-purple-700',
  doc: 'bg-gray-100 text-gray-700',
  'character-skill': 'bg-indigo-100 text-indigo-700',
};

export default function PreviewCard({
  url,
  type,
  name,
  description,
  imageUrl,
  className = '',
}: GotoPreviewCardProps) {
  return (
    <Link href={url} tabIndex={0} aria-label={`前往${typeLabels[type] || type}: ${name}`}>
      <BaseCard
        className={clsx(
          'flex flex-col items-center p-4 w-full max-w-xs shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer',
          className
        )}
        variant='details'
        role='link'
        tabIndex={-1}
      >
        <div className='w-24 h-24 mb-3 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden'>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className='object-contain w-full h-full'
              loading='lazy'
              draggable={false}
            />
          ) : (
            <div className='text-4xl text-gray-400'>?</div>
          )}
        </div>
        <div className='flex flex-col items-center w-full'>
          <span
            className={clsx(
              'px-2 py-0.5 rounded text-xs font-semibold mb-2',
              typeColors[type] || 'bg-gray-200 text-gray-700'
            )}
          >
            {typeLabels[type] || type}
          </span>
          <div
            className='font-bold text-lg text-center text-gray-900 dark:text-gray-100 mb-1 truncate w-full'
            title={name}
          >
            {name}
          </div>
          {description && (
            <div
              className='text-sm text-gray-600 dark:text-gray-300 text-center line-clamp-3 w-full'
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
