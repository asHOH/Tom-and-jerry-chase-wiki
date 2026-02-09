'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

const SpecialSkillDetailClient = dynamic(
  () => import('@/features/special-skills/components/special-skill-detail/SpecialSkillDetails'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载特技详情中...' />
      </div>
    ),
    ssr: false,
  }
);
export default SpecialSkillDetailClient;
