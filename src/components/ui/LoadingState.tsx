import React from 'react';
import clsx from 'clsx';
import LoadingSpinner from './LoadingSpinner';
import {
  Skeleton,
  SkeletonCharacterCard,
  SkeletonKnowledgeCard,
  SkeletonCharacterDetail,
} from './Skeleton';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'character-grid' | 'knowledge-cards' | 'character-detail';
  message?: string;
  className?: string;
  count?: number; // For grid layouts
  animate?: boolean;
}

/**
 * Unified loading state component that provides consistent loading UI across the app
 */
export default function LoadingState({
  type = 'spinner',
  message = '加载中...',
  className = '',
  count = 8,
  animate = true,
}: LoadingStateProps) {
  const baseClasses = 'flex items-center justify-center';

  switch (type) {
    case 'spinner':
      return (
        <div className={clsx(baseClasses, 'py-8', className)}>
          <LoadingSpinner message={message} />
        </div>
      );

    case 'skeleton':
      return (
        <div className={clsx('space-y-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className='h-4 w-full' animate={animate} />
          ))}
        </div>
      );

    case 'character-grid':
      return (
        <div className={clsx('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='text-center space-y-4'>
            <Skeleton className='h-12 w-1/2 mx-auto' animate={animate} />
            <Skeleton className='h-6 w-3/4 mx-auto' animate={animate} />
          </div>

          {/* Filter skeleton */}
          <div className='flex justify-center items-center gap-4'>
            <Skeleton className='h-6 w-20' animate={animate} />
            <div className='flex gap-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-16' animate={animate} />
              ))}
            </div>
          </div>

          {/* Character grid skeleton */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCharacterCard key={i} animate={animate} />
            ))}
          </div>

          {/* Loading indicator */}
          <div className='flex justify-center items-center py-4'>
            <LoadingSpinner size='sm' message={message} />
          </div>
        </div>
      );

    case 'knowledge-cards':
      return (
        <div className={clsx('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='text-center space-y-4'>
            <Skeleton className='h-12 w-1/2 mx-auto' animate={animate} />
            <Skeleton className='h-6 w-3/4 mx-auto' animate={animate} />
          </div>

          {/* Filter controls skeleton */}
          <div className='space-y-4'>
            <div className='flex justify-center items-center gap-4'>
              <Skeleton className='h-6 w-16' animate={animate} />
              <div className='flex gap-2'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className='h-8 w-12' animate={animate} />
                ))}
              </div>
            </div>

            {/* Cost range slider skeleton */}
            <div className='flex justify-center items-center gap-4'>
              <Skeleton className='h-6 w-16' animate={animate} />
              <Skeleton className='h-6 w-48' animate={animate} />
            </div>
          </div>

          {/* Knowledge card grid skeleton */}
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonKnowledgeCard key={i} animate={animate} />
            ))}
          </div>

          {/* Loading indicator */}
          <div className='flex justify-center items-center py-4'>
            <LoadingSpinner size='sm' message={message} />
          </div>
        </div>
      );

    case 'character-detail':
      return (
        <div className={className}>
          <SkeletonCharacterDetail animate={animate} />
        </div>
      );

    default:
      return (
        <div className={clsx(baseClasses, 'py-8', className)}>
          <LoadingSpinner message={message} />
        </div>
      );
  }
}

/**
 * Page-level loading wrapper that provides consistent layout
 */
export function PageLoadingState({
  type = 'spinner',
  message = '加载中...',
  children,
}: {
  type?: LoadingStateProps['type'];
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
      <div className='animate-pulse'>
        {children || <LoadingState type={type} message={message} />}
      </div>
    </div>
  );
}
