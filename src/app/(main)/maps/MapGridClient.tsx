'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const MapGridClient = dynamic<Props>(() => import('@/features/maps/map-grid/MapGrid'), {
  loading: () => (
    <PageLoadingState
      layout='catalog'
      type='item-grid'
      message='加载地图列表中...'
      count={LOADING_COUNTS.maps}
    />
  ),
});

export default MapGridClient;
