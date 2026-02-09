'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const ToolGridClient = dynamic<Props>(() => import('@/features/tools/ToolGrid'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6 dark:text-slate-200'>
      <LoadingState type='item-grid' message='加载工具列表中...' count={9} />
    </div>
  ),
  ssr: false,
});

export default ToolGridClient;
