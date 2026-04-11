'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const SpecialSkillClient = dynamic<Props>(
  () => import('@/features/special-skills/components/special-skill-grid/SpecialSkillGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState
          type='special-skill-grid'
          message='加载特技列表中...'
          count={LOADING_COUNTS.specialSkills}
        />
      </div>
    ),
    ssr: false,
  }
);

export default SpecialSkillClient;
