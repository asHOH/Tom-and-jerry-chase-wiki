'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const UsagesClient = dynamic<Props>(() => import('@/features/usages/usagesSection'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
      <LoadingState type='item-grid' message='加载使用指南中...' count={6} />
    </div>
  ),
  ssr: false,
});

export default UsagesClient;
