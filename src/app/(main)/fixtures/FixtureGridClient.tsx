'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const FixtureGridClient = dynamic<Props>(
  () => import('@/features/fixtures/components/fixture-grid/FixtureGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='item-grid' message='加载地图组件中...' count={18} />
      </div>
    ),
    ssr: false,
  }
);

export default FixtureGridClient;
