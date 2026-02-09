'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const AchievementDetailsClient = dynamic(
  () => import('@/features/achievements/achievement-detail/AchievementDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载成就详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default AchievementDetailsClient;
