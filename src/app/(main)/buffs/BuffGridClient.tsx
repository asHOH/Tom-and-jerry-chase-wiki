'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const BuffGridClient = dynamic<Props>(
  () => import('@/features/buffs/components/buff-grid/BuffGrid'),
  {
    loading: () => (
      <PageLoadingState
        layout='catalog'
        type='buff-grid'
        message='加载状态和效果中...'
        count={LOADING_COUNTS.buffs}
      />
    ),
  }
);

export default BuffGridClient;
