'use client';

import dynamic from 'next/dynamic';

import type { KnowledgeCardCharacterLookup } from '@/lib/gameData/published/clientProjections';
import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
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
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
  charactersData: KnowledgeCardCharacterLookup;
};

export default function KnowledgeCardDetailsClient({
  cardId,
  referencePage,
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
      <ReferencePageContent page={referencePage}>
        <KnowledgeCardDetails {...props} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
