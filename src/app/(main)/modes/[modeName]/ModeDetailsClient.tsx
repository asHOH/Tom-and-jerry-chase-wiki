'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const ModeDetailsClient = dynamic(
  () => import('@/features/modes/components/mode-detail/ModeDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载游戏模式详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default ModeDetailsClient;
