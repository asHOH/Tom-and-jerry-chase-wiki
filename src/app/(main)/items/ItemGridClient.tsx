'use client';
import dynamic from 'next/dynamic';

type Props = { description?: string };

const ItemGridClient = dynamic<Props>(
  () => import('@/components/displays/items/item-grid/ItemGrid'),
  {
    loading: () => (
      <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
        <header className='text-center space-y-4 mb-8 px-4'>
          <div className='h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse mb-4' />
          <div className='h-6 w-80 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse mb-2' />
        </header>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className='bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700 flex flex-col items-center animate-pulse'
            >
              <div className='relative w-16 h-16 mb-2'>
                <div className='w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full' />
              </div>
              <div className='h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded' />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default ItemGridClient;
