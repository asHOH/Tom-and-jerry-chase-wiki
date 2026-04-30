import React from 'react';

import { cn } from '@/lib/design';

import LoadingSpinner from './LoadingSpinner';
import {
  Skeleton,
  SkeletonBuffCard,
  SkeletonCharacterCard,
  SkeletonCharacterDetail,
  SkeletonDetailLayout,
  SkeletonItemCard,
  SkeletonKnowledgeCard,
  SkeletonSpecialSkillCard,
} from './Skeleton';

interface LoadingStateProps {
  type?:
    | 'spinner'
    | 'skeleton'
    | 'character-grid'
    | 'knowledge-cards'
    | 'character-detail'
    | 'item-grid'
    | 'special-skill-grid'
    | 'special-skill-advice'
    | 'buff-grid'
    | 'detail';
  message?: string;
  className?: string;
  count?: number; // For grid layouts
  animate?: boolean;
}

const gridItemClasses = [
  'grid-item-1',
  'grid-item-2',
  'grid-item-3',
  'grid-item-4',
  'grid-item-5',
  'grid-item-6',
  'grid-item-7',
  'grid-item-8',
] as const;

const getGridItemClass = (index: number) => gridItemClasses[index % gridItemClasses.length];

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
        <div className={cn(baseClasses, 'py-8', className)}>
          <LoadingSpinner message={message} />
        </div>
      );

    case 'skeleton':
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className='h-4 w-full' animate={animate} />
          ))}
        </div>
      );

    case 'character-grid':
      return (
        <div className={cn('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-12 w-1/2' animate={animate} />
            <Skeleton className='mx-auto h-6 w-3/4' animate={animate} />
          </div>

          {/* Filter skeleton */}
          <div className='flex items-center justify-center gap-4'>
            <Skeleton className='h-6 w-20' animate={animate} />
            <div className='flex gap-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-16' animate={animate} />
              ))}
            </div>
          </div>

          {/* Character grid skeleton */}
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('animate-fadeInUp', getGridItemClass(i))}>
                <SkeletonCharacterCard animate={animate} />
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className='flex items-center justify-center py-4'>
            <LoadingSpinner size='sm' message={message} />
          </div>
        </div>
      );

    case 'knowledge-cards':
      return (
        <div className={cn('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-12 w-1/2' animate={animate} />
            <Skeleton className='mx-auto h-6 w-3/4' animate={animate} />
          </div>

          {/* Filter controls skeleton */}
          <div className='space-y-4'>
            <div className='flex items-center justify-center gap-4'>
              <Skeleton className='h-6 w-16' animate={animate} />
              <div className='flex gap-2'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className='h-8 w-12' animate={animate} />
                ))}
              </div>
            </div>

            {/* Cost range slider skeleton */}
            <div className='flex items-center justify-center gap-4'>
              <Skeleton className='h-6 w-16' animate={animate} />
              <Skeleton className='h-6 w-48' animate={animate} />
            </div>
          </div>

          {/* Knowledge card grid skeleton */}
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('animate-slideInLeft', getGridItemClass(i))}>
                <SkeletonKnowledgeCard animate={animate} />
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className='flex items-center justify-center py-4'>
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

    case 'detail':
      return (
        <div className={className}>
          <SkeletonDetailLayout animate={animate} sectionCount={3} />
        </div>
      );

    case 'item-grid':
      return (
        <div className={cn('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-10 w-1/3' animate={animate} />
            <Skeleton className='mx-auto h-5 w-2/3' animate={animate} />
          </div>

          {/* Filters skeleton */}
          <div className='space-y-3'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='flex flex-wrap items-center justify-center gap-2'>
                <Skeleton className='h-6 w-20' animate={animate} />
                <div className='flex flex-wrap gap-2'>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className='h-8 w-16' animate={animate} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Item grid skeleton */}
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('animate-fadeInUp', getGridItemClass(i))}>
                <SkeletonItemCard animate={animate} tagCount={2} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'special-skill-grid':
      return (
        <div className={cn('space-y-8', className)}>
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-10 w-1/3' animate={animate} />
            <Skeleton className='mx-auto h-5 w-2/3' animate={animate} />
          </div>

          <div className='flex items-center justify-center gap-4'>
            <Skeleton className='h-6 w-20' animate={animate} />
            <div className='flex gap-2'>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-16' animate={animate} />
              ))}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('animate-fadeInUp', getGridItemClass(i))}>
                <SkeletonSpecialSkillCard animate={animate} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'special-skill-advice':
      return (
        <div className={cn('space-y-8', className)}>
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-10 w-1/3' animate={animate} />
            <Skeleton className='mx-auto h-5 w-2/3' animate={animate} />
          </div>

          <div className='flex items-center justify-center gap-4'>
            <Skeleton className='h-6 w-20' animate={animate} />
            <div className='flex gap-2'>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-16' animate={animate} />
              ))}
            </div>
          </div>

          <div className='space-y-4'>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'
              >
                <div className='flex flex-col gap-4 md:flex-row'>
                  <div className='md:w-1/5'>
                    <SkeletonSpecialSkillCard animate={animate} />
                  </div>
                  <div className='space-y-3 md:w-4/5'>
                    <Skeleton className='h-5 w-2/3' animate={animate} />
                    <Skeleton className='h-4 w-full' animate={animate} />
                    <Skeleton className='h-4 w-5/6' animate={animate} />
                    <Skeleton className='h-4 w-3/4' animate={animate} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'buff-grid':
      return (
        <div className={cn('space-y-8', className)}>
          {/* Header skeleton */}
          <div className='space-y-4 text-center'>
            <Skeleton className='mx-auto h-10 w-1/3' animate={animate} />
            <Skeleton className='mx-auto h-5 w-2/3' animate={animate} />
          </div>

          {/* Filters skeleton */}
          <div className='flex items-center justify-center gap-4'>
            <Skeleton className='h-6 w-20' animate={animate} />
            <div className='flex flex-wrap gap-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-16' animate={animate} />
              ))}
            </div>
          </div>

          {/* Buff grid skeleton */}
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('animate-fadeInUp', getGridItemClass(i))}>
                <SkeletonBuffCard animate={animate} />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className={cn(baseClasses, 'py-8', className)}>
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
  count,
  children,
}: {
  type?: LoadingStateProps['type'];
  message?: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      {children || (
        <LoadingState
          type={type}
          message={message}
          {...(typeof count === 'number' ? { count } : {})}
        />
      )}
    </div>
  );
}
