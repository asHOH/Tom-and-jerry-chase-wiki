'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const FixtureDetailsClient = dynamic(
  () => import('@/features/fixtures/components/fixture-detail/FixtureDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载地图组件详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default FixtureDetailsClient;
