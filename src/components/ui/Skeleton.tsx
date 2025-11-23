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
export function SkeletonText({
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
 * Skeleton for character detail page
 */
export function SkeletonCharacterDetail({ animate = true }: { animate?: boolean }) {
  return (
    <div className='mx-auto max-w-4xl space-y-8 p-6'>
      <div className='animate-pulse'>
        {/* Header */}
        <div className='mb-8 space-y-4 text-center'>
          <Skeleton className='mx-auto h-12 w-1/2' animate={animate} />
          <Skeleton className='mx-auto h-6 w-3/4' animate={animate} />
        </div>

        {/* Character image and basic info */}
        <div className='mb-8 flex flex-col gap-8 md:flex-row'>
          <div className='md:w-1/3'>
            <Skeleton className='mx-auto aspect-square w-full max-w-sm' animate={animate} />
          </div>
          <div className='space-y-4 md:w-2/3'>
            <SkeletonText lines={3} animate={animate} />
            <div className='grid grid-cols-2 gap-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='space-y-1'>
                  <Skeleton className='h-4 w-16' animate={animate} />
                  <Skeleton className='h-6 w-12' animate={animate} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills section */}
        <div className='space-y-6'>
          <Skeleton className='h-8 w-32' animate={animate} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-4 rounded-lg border p-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-12 w-12' animate={animate} />
                <div className='flex-1'>
                  <Skeleton className='mb-2 h-6 w-32' animate={animate} />
                  <SkeletonText lines={2} animate={animate} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
