'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const BuffDetailsClient = dynamic(
  () => import('@/features/buffs/components/buff-detail/BuffDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载状态详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default BuffDetailsClient;
