'use client';

import dynamic from 'next/dynamic';

import LoadingState from '@/components/ui/LoadingState';

type Props = { description?: string };

const KnowledgeCardGrid = dynamic<Props>(
  () => import('@/features/knowledge-cards/components/knowledge-card-grid/KnowledgeCardGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='knowledge-cards' message='加载知识卡列表中...' />
      </div>
    ),
    ssr: false,
  }
);

export default function KnowledgeCardClient(props: Props) {
  return <KnowledgeCardGrid {...props} />;
}
