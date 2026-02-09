'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const MapGridClient = dynamic<Props>(() => import('@/features/maps/map-grid/MapGrid'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
      <LoadingState type='item-grid' message='加载地图列表中...' count={12} />
    </div>
  ),
  ssr: false,
});

export default MapGridClient;
