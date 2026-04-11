import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

/**
 * Base skeleton component for loading states
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = true,
  animate = true,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-gray-200 dark:bg-gray-700',
        rounded && 'rounded',
        animate && 'animate-pulse',
        className
      )}
      style={style}
    >
      {animate && <div className='skeleton-shimmer absolute inset-0'></div>}
    </div>
  );
}

/**
 * Skeleton for text content
 */
function SkeletonText({
  lines = 1,
  className = '',
  animate = true,
}: {
  lines?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full' // Last line is shorter
          )}
          animate={animate}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for character card
 */
export function SkeletonCharacterCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className='space-y-4'>
      {/* Character image */}
      <Skeleton className='h-48 w-full' animate={animate} />

      {/* Character info */}
      <div className='space-y-2 px-6 pt-1 pb-6 text-center'>
        {/* Character name */}
        <Skeleton className='mx-auto h-6 w-3/4' animate={animate} />

        {/* Tags */}
        <div className='flex justify-center gap-1'>
          <Skeleton className='h-4 w-12' animate={animate} />
          <Skeleton className='h-4 w-16' animate={animate} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for knowledge card
 */
export function SkeletonKnowledgeCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className='space-y-2'>
      {/* Card image */}
      <Skeleton className='aspect-square w-full' animate={animate} />

      {/* Card name */}
      <Skeleton className='h-4 w-full' animate={animate} />

      {/* Card cost */}
      <Skeleton className='mx-auto h-3 w-1/2' animate={animate} />
    </div>
  );
}

/**
 * Skeleton for item-style card
 */
export function SkeletonItemCard({
  animate = true,
  tagCount = 2,
}: {
  animate?: boolean;
  tagCount?: number;
}) {
  return (
    <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
      <Skeleton className='h-48 w-full rounded-none' animate={animate} />
      <div className='space-y-2 px-3 pt-2 pb-4 text-center'>
        <Skeleton className='mx-auto h-4 w-3/4' animate={animate} />
        {tagCount > 0 && (
          <div className='flex flex-wrap justify-center gap-2'>
            {Array.from({ length: tagCount }).map((_, i) => (
              <Skeleton key={i} className='h-4 w-12 rounded-full' animate={animate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton for special skill card
 */
export function SkeletonSpecialSkillCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
      <Skeleton className='h-48 w-full rounded-none' animate={animate} />
      <div className='space-y-2 px-3 pt-2 pb-4 text-center'>
        <Skeleton className='mx-auto h-5 w-3/4' animate={animate} />
      </div>
    </div>
  );
}

/**
 * Skeleton for buff-style card
 */
export function SkeletonBuffCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
      <div className='flex items-center gap-3 border border-dotted border-gray-200 p-2 dark:border-slate-600'>
        <Skeleton className='h-10 w-10 rounded' animate={animate} />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-3/4' animate={animate} />
          <div className='flex gap-2'>
            <Skeleton className='h-4 w-12 rounded-full' animate={animate} />
            <Skeleton className='h-4 w-10 rounded-full' animate={animate} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for article card
 */
export function SkeletonArticleCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className='space-y-3 rounded-lg border border-gray-200 bg-white px-4 pt-2 pb-5 dark:border-gray-700 dark:bg-gray-800'>
      {/* Article title */}
      <Skeleton className='h-7 w-3/4' animate={animate} />

      {/* Author and category */}
      <div className='flex items-center gap-3'>
        <Skeleton className='h-4 w-20' animate={animate} />
        <Skeleton className='h-6 w-16 rounded' animate={animate} />
      </div>

      {/* Content preview */}
      <SkeletonText lines={3} animate={animate} />

      {/* Metadata and actions */}
      <div className='flex items-center justify-between pt-2'>
        <div className='space-y-1'>
          <Skeleton className='h-3 w-24' animate={animate} />
          <Skeleton className='h-3 w-24' animate={animate} />
          <Skeleton className='h-3 w-16' animate={animate} />
        </div>
        <Skeleton className='h-8 w-8 rounded-lg' animate={animate} />
      </div>
    </div>
  );
}

/**
 * Skeleton for character detail page
 */
export function SkeletonCharacterDetail({ animate = true }: { animate?: boolean }) {
  return <SkeletonDetailLayout animate={animate} sectionCount={4} />;
}

/**
 * Skeleton for detail pages
 */
export function SkeletonDetailLayout({
  animate = true,
  sectionCount = 3,
  className = '',
}: {
  animate?: boolean;
  sectionCount?: number;
  className?: string;
}) {
  return (
    <div className={clsx('space-y-8', className)}>
      <div className='flex flex-col gap-8 md:flex-row'>
        <div className='md:w-1/3'>
          <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
            <Skeleton className='h-48 w-full rounded-none' animate={animate} />
            <div className='space-y-3 px-4 py-4'>
              <Skeleton className='h-6 w-3/4' animate={animate} />
              <Skeleton className='h-4 w-1/2' animate={animate} />
              <div className='flex flex-wrap gap-2'>
                <Skeleton className='h-4 w-16 rounded-full' animate={animate} />
                <Skeleton className='h-4 w-12 rounded-full' animate={animate} />
              </div>
              <div className='space-y-2 pt-2'>
                <Skeleton className='h-3 w-full' animate={animate} />
                <Skeleton className='h-3 w-5/6' animate={animate} />
                <Skeleton className='h-3 w-2/3' animate={animate} />
              </div>
            </div>
          </div>
        </div>
        <div className='space-y-6 md:w-2/3'>
          {Array.from({ length: sectionCount }).map((_, i) => (
            <div key={i} className='space-y-3'>
              <Skeleton className='h-5 w-32' animate={animate} />
              <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
                <Skeleton className='h-4 w-full' animate={animate} />
                <Skeleton className='mt-2 h-4 w-5/6' animate={animate} />
                <Skeleton className='mt-2 h-4 w-3/4' animate={animate} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
