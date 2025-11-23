'use client';

import dynamic from 'next/dynamic';

const ItemDetailsClient = dynamic(
  () => import('@/components/displays/items/item-detail/ItemDetails'),
  {
    loading: () => (
      <div className='mx-auto flex min-h-[300px] max-w-3xl flex-col gap-8 p-8'>
        <div className='flex flex-col gap-8 md:flex-row'>
          <div className='flex flex-col items-center md:w-1/3'>
            <div className='mb-4 h-28 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700' />
            <div className='mb-2 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            <div className='mt-4 flex gap-2'>
              <div className='h-6 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            </div>
          </div>
          <div className='flex flex-col gap-4 md:w-2/3'>
            <div className='mb-2 h-7 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            <div className='h-20 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            <div className='h-20 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default ItemDetailsClient;
