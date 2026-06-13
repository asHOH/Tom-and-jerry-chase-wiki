'use client';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return (
    <CatalogPageLoadingState
      type='special-skill-grid'
      message='加载特技列表中...'
      count={LOADING_COUNTS.specialSkills}
    />
  );
}
