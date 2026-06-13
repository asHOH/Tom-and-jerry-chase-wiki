'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const ModeGridClient = dynamic<Props>(
  () => import('@/features/modes/components/mode-grid/ModeGrid'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='item-grid'
        message='加载游戏模式中...'
        count={LOADING_COUNTS.modes}
      />
    ),
  }
);

export default ModeGridClient;
