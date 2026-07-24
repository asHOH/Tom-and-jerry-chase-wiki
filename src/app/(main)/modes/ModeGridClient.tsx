'use client';

import dynamic from 'next/dynamic';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = {
  description?: string;
  data: PublishedGameDataByType['modes'];
  publishedRevision: `v1:${string}`;
};

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
