'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { getPathSegmentFromEnd } from '@/lib/edit/editModeRouteUtils';
import type { SpecialSkill } from '@/data/types';
import EditModePageShell from '@/components/ui/EditModePageShell';
import LoadingState from '@/components/ui/LoadingState';

const SpecialSkillDetails = dynamic(
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

export default function SpecialSkillDetailClient({ skill }: { skill: SpecialSkill }) {
  const pathname = usePathname();
  const skillId = getPathSegmentFromEnd(pathname, 0) || skill.name;
  const factionId = getPathSegmentFromEnd(pathname, 1) || skill.factionId;
  const entityId = `${factionId}.${skillId}`;

  return (
    <EditModePageShell entityType='specialSkills' entityId={entityId} entityName={skillId}>
      <SpecialSkillDetails skill={skill} />
    </EditModePageShell>
  );
}
