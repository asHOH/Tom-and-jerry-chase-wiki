'use client';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return (
    <CatalogPageLoadingState
      type='special-skill-advice'
      message='加载特技推荐中...'
      count={LOADING_COUNTS.specialSkillAdvice}
    />
  );
}
