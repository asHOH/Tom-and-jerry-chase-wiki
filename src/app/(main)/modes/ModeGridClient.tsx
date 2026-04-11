'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const ModeGridClient = dynamic<Props>(
  () => import('@/features/modes/components/mode-grid/ModeGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='item-grid' message='加载游戏模式中...' count={LOADING_COUNTS.modes} />
      </div>
    ),
    ssr: false,
  }
);

export default ModeGridClient;
