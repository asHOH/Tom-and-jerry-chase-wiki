'use client';

import dynamic from 'next/dynamic';

import type { SpecialSkillCharacterLookup } from '@/lib/gameData/published/clientProjections';
import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PublishedEntityHistory } from '@/context/PublishedEntityHistoryContext';
import type { FactionId, SpecialSkill } from '@/data/types';
import ReferencePageContent from '@/features/shared/detail-view/ReferencePageContent';
import EditModePageShell from '@/components/ui/EditModePageShell';
import { PageLoadingState } from '@/components/ui/LoadingState';

const SpecialSkillDetails = dynamic(
  () => import('@/features/special-skills/components/special-skill-detail/SpecialSkillDetails'),
  {
    loading: () => <PageLoadingState type='detail' message='加载特技详情中...' />,
  }
);

export default function SpecialSkillDetailClient({
  skill,
  factionId,
  skillId,
  referencePage,
  publishedRevision,
  publishedHistory,
  charactersData,
}: {
  skill: SpecialSkill;
  factionId: FactionId;
  skillId: string;
  referencePage: PackedReferencePage;
  publishedRevision: `v1:${string}`;
  publishedHistory: PublishedEntityHistory;
  charactersData: SpecialSkillCharacterLookup;
}) {
  const entityId = `${factionId}.${skillId}`;

  return (
    <EditModePageShell
      entityType='specialSkills'
      entityId={entityId}
      entityName={skillId}
      publishedRevision={publishedRevision}
      publishedHistory={publishedHistory}
    >
      <ReferencePageContent page={referencePage}>
        <SpecialSkillDetails skill={skill} charactersData={charactersData} />
      </ReferencePageContent>
    </EditModePageShell>
  );
}
