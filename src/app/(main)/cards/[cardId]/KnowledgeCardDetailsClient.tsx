'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
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
    ssr: false,
  }
);

export default function KnowledgeCardDetailsClient(props: KnowledgeCardDetailsProps) {
  const pathname = usePathname();
  const cardId = getPathSegmentFromEnd(pathname, 0) || props.card.id;

  return (
    <EditModePageShell entityType='cards' entityId={cardId} entityName={props.card.id}>
      <KnowledgeCardDetails {...props} />
    </EditModePageShell>
  );
}
