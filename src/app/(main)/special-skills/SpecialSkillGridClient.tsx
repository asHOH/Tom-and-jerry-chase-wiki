'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const SpecialSkillClient = dynamic<Props>(
  () => import('@/features/special-skills/components/special-skill-grid/SpecialSkillGrid'),
  {
    loading: () => (
      <PageLoadingState
        layout='catalog'
        type='special-skill-grid'
        message='加载特技列表中...'
        count={LOADING_COUNTS.specialSkills}
      />
    ),
  }
);

export default SpecialSkillClient;
