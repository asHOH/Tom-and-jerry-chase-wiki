'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const EntityGridClient = dynamic<Props>(
  () => import('@/features/entities/entity-grid/EntityGrid'),
  {
    loading: () => (
      <PageLoadingState
        layout='catalog'
        type='item-grid'
        message='加载衍生物列表中...'
        count={LOADING_COUNTS.entities}
      />
    ),
  }
);

export default EntityGridClient;
