'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const FixtureGridClient = dynamic<Props>(
  () => import('@/features/fixtures/components/fixture-grid/FixtureGrid'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='item-grid'
        message='加载地图组件中...'
        count={LOADING_COUNTS.fixtures}
      />
    ),
  }
);

export default FixtureGridClient;
