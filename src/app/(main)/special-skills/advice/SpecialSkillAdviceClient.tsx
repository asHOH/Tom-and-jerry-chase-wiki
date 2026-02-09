'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const SpecialSkillAdviceClient = dynamic(
  () => import('@/features/special-skills/components/special-skill-advice/SpecialSkillAdvice'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
        <LoadingState type='item-grid' message='加载特技推荐中...' count={12} />
      </div>
    ),
    ssr: false,
  }
);

export default SpecialSkillAdviceClient;
