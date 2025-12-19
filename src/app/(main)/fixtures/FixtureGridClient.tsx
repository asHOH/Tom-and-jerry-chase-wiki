'use client';

import dynamic from 'next/dynamic';

type Props = { description?: string };

const ItemGridClient = dynamic<Props>(
  () => import('@/features/fixtures/components/fixture-grid/FixtureGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <header className='mb-8 space-y-4 px-4 text-center'>
          <div className='mx-auto mb-4 h-10 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
          <div className='mx-auto mb-2 h-6 w-80 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        </header>
        <div className='mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className='flex animate-pulse flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800'
            >
              <div className='relative mb-2 h-16 w-16'>
                <div className='h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700' />
              </div>
              <div className='h-5 w-20 rounded bg-slate-200 dark:bg-slate-700' />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default ItemGridClient;
