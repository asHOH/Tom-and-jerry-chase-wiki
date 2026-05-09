'use client';

import dynamic from 'next/dynamic';

import { KnowledgeCardDetailsProps } from '@/lib/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

// Dynamic import for KnowledgeCardDetails component
const KnowledgeCardDetails = dynamic(
  () =>
    import('@/features/knowledge-cards/components').then((mod) => ({
      default: mod.KnowledgeCardDetails,
    })),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='detail' message='加载知识卡详情中...' />
      </div>
    ),
  }
);

type KnowledgeCardDetailsClientProps = KnowledgeCardDetailsProps & { cardId: string };

export default function KnowledgeCardDetailsClient({
  cardId,
  ...props
}: KnowledgeCardDetailsClientProps) {
  return (
    <EditModePageShell entityType='cards' entityId={cardId} entityName={props.card.id}>
      <KnowledgeCardDetails {...props} />
    </EditModePageShell>
  );
}
