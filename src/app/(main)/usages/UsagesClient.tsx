'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const UsagesClient = dynamic<Props>(() => import('@/features/usages/usagesSection'), {
  loading: () => (
    <CatalogPageLoadingState
      type='item-grid'
      message='加载使用指南中...'
      count={LOADING_COUNTS.usagesSections}
    />
  ),
});

export default UsagesClient;
