'use client';

export default function Loading() {
  return (
    <div className='flex flex-col gap-8 p-8 max-w-3xl mx-auto min-h-[300px]'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='md:w-1/3 flex flex-col items-center'>
          <div className='rounded-full bg-slate-200 dark:bg-slate-700 w-28 h-28 mb-4 animate-pulse' />
          <div className='h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse' />
          <div className='flex gap-2 mt-4'>
            <div className='h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
            <div className='h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
          </div>
        </div>
        <div className='md:w-2/3 flex flex-col gap-4'>
          <div className='h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2' />
          <div className='h-20 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
          <div className='h-20 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse' />
        </div>
      </div>
    </div>
  );
}
