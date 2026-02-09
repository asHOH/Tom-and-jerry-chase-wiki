'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const MapDetailsClient = dynamic(() => import('@/features/maps/map-detail/MapDetails'), {
  loading: () => (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载地图详情中...' />
    </div>
  ),
  ssr: false,
});

export default MapDetailsClient;
