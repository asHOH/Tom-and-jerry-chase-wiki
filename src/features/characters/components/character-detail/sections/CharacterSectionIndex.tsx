import { useMemo } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterWithFaction } from '@/lib/types';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useEditMode } from '@/context/EditModeContext';
import TableOfContents from '@/components/ui/TableOfContents';

type CharacterSectionIndexProps = {
  character: DeepReadonly<CharacterWithFaction>;
};

export default function CharacterSectionIndex({ character }: CharacterSectionIndexProps) {
  const { isEditMode } = useEditMode();
  const { sections, skills, ids } = useMemo(() => {
    const sections = [
      ...(isEditMode || character.skillAllocations?.length ? ['推荐加点'] : []),
      ...(isEditMode || character.knowledgeCardGroups?.length ? ['推荐知识卡组'] : []),
      '技能描述',
      character.factionId === 'cat' ? '克制关系' : '克制/协作关系',
    ].map((label) => ({ id: `Section:${label}`, label, depth: 0 }));
    const skills = character.skills.map((skill) => ({
      id: `Skill:${skill.name}`,
      label: skill.name,
      depth: 0,
    }));
    const ids = sections.flatMap((section) =>
      section.id === 'Section:技能描述'
        ? [section.id, ...skills.map((skill) => skill.id)]
        : [section.id]
    );
    return { sections, skills, ids };
  }, [character, isEditMode]);
  const activeId = useScrollSpy(ids);

  return (
    <>
      <div className='bg-surface-raised sticky top-(--character-nav-top) z-30 mb-2 h-12 px-1 py-1 shadow-sm'>
        <TableOfContents
          items={sections}
          activeId={activeId.startsWith('Skill:') ? 'Section:技能描述' : activeId}
          ariaLabel='角色详情索引'
          layout='inline'
        />
      </div>
      {skills.length > 0 && (
        <details className='mb-4'>
          <summary className='focus-visible:ring-focus cursor-pointer rounded px-2 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'>
            技能目录
          </summary>
          <TableOfContents items={skills} activeId={activeId} ariaLabel='角色技能目录' />
        </details>
      )}
    </>
  );
}
