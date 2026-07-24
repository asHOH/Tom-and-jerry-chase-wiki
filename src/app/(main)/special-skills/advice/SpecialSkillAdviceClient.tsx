'use client';

import dynamic from 'next/dynamic';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = {
  charactersData: PublishedGameDataByType['characters'];
  specialSkillsData: PublishedGameDataByType['specialSkills'];
  publishedRevision: `v1:${string}`;
};

const SpecialSkillAdviceClient = dynamic<Props>(
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
