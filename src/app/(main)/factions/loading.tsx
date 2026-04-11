'use client';

import { usePathname } from 'next/navigation';

import { getFactionLoadingCount } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  const pathname = usePathname();

  return (
    <PageLoadingState
      type='character-grid'
      message='加载角色列表中...'
      count={getFactionLoadingCount(pathname)}
    />
  );
}
