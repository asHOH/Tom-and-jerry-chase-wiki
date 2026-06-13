'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const BuffGridClient = dynamic<Props>(
  () => import('@/features/buffs/components/buff-grid/BuffGrid'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='buff-grid'
        message='加载状态和效果中...'
        count={LOADING_COUNTS.buffs}
      />
    ),
  }
);

export default BuffGridClient;
