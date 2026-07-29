'use client';

import dynamic from 'next/dynamic';

import type { KnowledgeCardCharacterLookup } from '@/lib/gameData/published/clientProjections';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import type { PublishedEntityHistoryEntry } from '@/context/PublishedEntityHistoryContext';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

// Dynamic import for KnowledgeCardDetails component
const KnowledgeCardDetails = dynamic(
  () =>
    import('@/features/knowledge-cards/components').then((mod) => ({
      default: mod.KnowledgeCardDetails,
    })),
  {
    loading: () => <PageLoadingState type='detail' message='加载知识卡详情中...' />,
  }
);

type KnowledgeCardDetailsClientProps = KnowledgeCardDetailsProps & {
  cardId: string;
  publishedRevision: `v1:${string}`;
  publishedHistory: readonly PublishedEntityHistoryEntry[];
  charactersData: KnowledgeCardCharacterLookup;
};

export default function KnowledgeCardDetailsClient({
  cardId,
  publishedRevision,
  publishedHistory,
  ...props
}: KnowledgeCardDetailsClientProps) {
  return (
    <EditModePageShell
      entityType='cards'
      entityId={cardId}
      entityName={props.card.id}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <KnowledgeCardDetails {...props} />
    </EditModePageShell>
  );
}
