import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { RANKABLE_PROPERTIES } from '@/features/characters/utils/ranking';
import { Skeleton } from '@/components/ui/Skeleton';

const commonPropertyCount = RANKABLE_PROPERTIES.filter((property) => !property.faction).length;
const factionPropertyCount = RANKABLE_PROPERTIES.filter((property) => property.faction).length;

function FilterRowSkeleton({
  labelWidth,
  buttonWidth,
  count,
}: {
  labelWidth: string;
  buttonWidth: string;
  count: number;
}) {
  return (
    <div className='mt-1 flex items-center justify-center gap-2 md:mt-4'>
      <Skeleton className={`h-6 ${labelWidth}`} />
      <div className='flex flex-wrap gap-1 md:gap-2'>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={`h-10 ${buttonWidth}`} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className='mx-auto max-w-7xl space-y-6 p-6'>
      <div className='space-y-8'>
        {/* Header skeleton */}
        <div className='mb-8 space-y-4 px-4 text-center'>
          <div className='mx-auto h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='mx-auto h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>

        {/* Property selector skeleton */}
        <div className='mx-auto max-w-4xl px-4'>
          <div className='space-y-8'>
            <FilterRowSkeleton labelWidth='w-28' buttonWidth='w-20' count={commonPropertyCount} />
            <FilterRowSkeleton labelWidth='w-32' buttonWidth='w-24' count={factionPropertyCount} />
            <FilterRowSkeleton labelWidth='w-28' buttonWidth='w-24' count={3} />
          </div>
        </div>

        {/* Rankings grid skeleton */}
        <div className='grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4'>
          {Array.from({ length: LOADING_COUNTS.rankings }).map((_, i) => (
            <div
              key={i}
              className='character-card overflow-hidden rounded-lg bg-white shadow-md dark:bg-slate-800'
            >
              {/* Character image skeleton */}
              <div className='flex justify-center'>
                <Skeleton className='mt-4 h-20 w-20' />
              </div>

              {/* Character name skeleton */}
              <div className='mt-4 px-3 pt-1 pb-3 text-center'>
                <Skeleton className='mx-auto mb-2 h-7 w-3/4' />
                <div className='flex justify-center gap-1.5'>
                  <Skeleton className='h-5 w-12 rounded' />
                  <Skeleton className='h-5 w-14 rounded' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary cards skeleton */}
        <div className='mx-auto w-full max-w-4xl border-t border-gray-200 px-4 pt-8 dark:border-gray-700'>
          <div className='grid grid-cols-1 gap-4 text-center md:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='rounded-lg p-4'>
                <Skeleton className='mx-auto h-8 w-20' />
                <Skeleton className='mx-auto mt-2 h-5 w-28' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
