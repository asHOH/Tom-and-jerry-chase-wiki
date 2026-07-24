'use client';

import dynamic from 'next/dynamic';

import type { FactionId, SpecialSkill } from '@/data/types';
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
  publishedRevision,
}: {
  skill: SpecialSkill;
  factionId: FactionId;
  skillId: string;
  publishedRevision: `v1:${string}`;
}) {
  const entityId = `${factionId}.${skillId}`;

  return (
    <EditModePageShell
      entityType='specialSkills'
      entityId={entityId}
      entityName={skillId}
      publishedRevision={publishedRevision}
    >
      <SpecialSkillDetails skill={skill} />
    </EditModePageShell>
  );
}
