import { useMemo } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type { CharacterWithFaction } from '@/lib/types';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useEditMode } from '@/context/EditModeContext';
import TableOfContents from '@/components/ui/TableOfContents';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

type CharacterSectionIndexProps = {
  character: DeepReadonly<CharacterWithFaction>;
  showCharacterRelations?: boolean;
};

export default function CharacterSectionIndex({
  character,
  showCharacterRelations = true,
}: CharacterSectionIndexProps) {
  const { isEditMode } = useEditMode();
  const { sections, skills, ids } = useMemo(() => {
    const sections = [
      ...(isEditMode || character.skillAllocations?.length ? ['推荐加点'] : []),
      ...(isEditMode || character.knowledgeCardGroups?.length ? ['推荐知识卡组'] : []),
      '技能描述',
      ...(isEditMode || showCharacterRelations
        ? [character.factionId === 'cat' ? '克制关系' : '克制/协作关系']
        : []),
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
  }, [character, isEditMode, showCharacterRelations]);
  const activeId = useScrollSpy(ids);

  return (
    <>
      <div
        className={cn(
          'border-border bg-background sticky top-(--character-nav-top) z-30 border-b',
          skills.length === 0 && 'mb-4'
        )}
      >
        <TableOfContents
          items={sections}
          activeId={activeId.startsWith('Skill:') ? 'Section:技能描述' : activeId}
          ariaLabel='角色详情索引'
          layout='inline'
          appearance='plain'
        />
      </div>
      {skills.length > 0 && (
        <details className='group mb-4'>
          <summary className='text-muted-foreground hover:text-foreground focus-visible:ring-focus flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none [&::-webkit-details-marker]:hidden'>
            <span>技能目录</span>
            <ChevronDownIcon className='size-3.5 shrink-0 -rotate-90 transition-transform group-open:rotate-0 motion-reduce:transition-none' />
          </summary>
          <div className='pb-2'>
            <TableOfContents
              items={skills}
              activeId={activeId}
              ariaLabel='角色技能目录'
              layout='wrap'
              appearance='plain'
            />
          </div>
        </details>
      )}
    </>
  );
}
