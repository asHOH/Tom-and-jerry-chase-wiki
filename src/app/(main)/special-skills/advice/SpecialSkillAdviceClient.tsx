'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

const SpecialSkillAdviceClient = dynamic(
  () => import('@/features/special-skills/components/special-skill-advice/SpecialSkillAdvice'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='special-skill-advice'
        message='加载特技推荐中...'
        count={LOADING_COUNTS.specialSkillAdvice}
      />
    ),
  }
);

export default SpecialSkillAdviceClient;
