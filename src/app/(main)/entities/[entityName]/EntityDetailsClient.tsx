'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const EntityDetailsClient = dynamic(
  () => import('@/features/entities/entity-detail/EntityDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载衍生物详情中...' />
      </div>
    ),
    ssr: false,
  }
);

export default EntityDetailsClient;
