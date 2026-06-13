'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const KnowledgeCardGrid = dynamic<Props>(
  () => import('@/features/knowledge-cards/components/knowledge-card-grid/KnowledgeCardGrid'),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='knowledge-cards'
        message='加载知识卡列表中...'
        count={LOADING_COUNTS.knowledgeCards}
      />
    ),
  }
);

export default function KnowledgeCardClient(props: Props) {
  return <KnowledgeCardGrid {...props} />;
}
