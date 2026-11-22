import { useEffect, useMemo, useRef, useState } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type { CharacterWithFaction } from '@/lib/types';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useEditMode } from '@/context/EditModeContext';
import TableOfContents from '@/components/ui/TableOfContents';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

type CharacterSectionIndexProps = {
  character: DeepReadonly<CharacterWithFaction>;
  showCharacterRelations?: boolean;
};

const SKILL_CATALOG_ID = 'character-skill-catalog';

export default function CharacterSectionIndex({
  character,
  showCharacterRelations = true,
}: CharacterSectionIndexProps) {
  const { isEditMode } = useEditMode();
  const [isSkillCatalogOpen, setIsSkillCatalogOpen] = useState(false);
  const skillCatalogTriggerRef = useRef<HTMLButtonElement>(null);
  const skillCatalogPanelRef = useRef<HTMLDivElement>(null);
  const { sections, skills, skillItems, ids } = useMemo(() => {
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
      imageUrl: skill.imageUrl,
      depth: 0,
    }));
    const skillItems = skills.map((skill) => ({
      id: skill.id,
      depth: skill.depth,
      label: (
        <span className='inline-flex min-w-0 items-center gap-1.5'>
          {skill.imageUrl ? (
            <Image
              src={skill.imageUrl}
              alt=''
              width={24}
              height={24}
              className='size-6 shrink-0 rounded-full object-contain'
            />
          ) : null}
          <span className='wrap-anywhere'>{skill.label}</span>
        </span>
      ),
    }));
    const ids = sections.flatMap((section) =>
      section.id === 'Section:技能描述'
        ? [section.id, ...skills.map((skill) => skill.id)]
        : [section.id]
    );
    return { sections, skills, skillItems, ids };
  }, [character, isEditMode, showCharacterRelations]);
  const activeId = useScrollSpy(ids);
  const hasSkills = skills.length > 0;
  const isSkillSectionActive = activeId === 'Section:技能描述' || activeId.startsWith('Skill:');

  useEffect(() => {
    if (!isSkillCatalogOpen) return;

    const panel = skillCatalogPanelRef.current;
    panel?.querySelector<HTMLAnchorElement>('a[href]')?.focus();

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel?.contains(target) || skillCatalogTriggerRef.current?.contains(target)) return;
      setIsSkillCatalogOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setIsSkillCatalogOpen(false);
      skillCatalogTriggerRef.current?.focus();
    };
    const closeOnHashChange = () => setIsSkillCatalogOpen(false);

    document.addEventListener('pointerdown', closeOnOutsidePointerDown, true);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('hashchange', closeOnHashChange);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown, true);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('hashchange', closeOnHashChange);
    };
  }, [isSkillCatalogOpen]);

  useEffect(() => {
    if (!hasSkills) setIsSkillCatalogOpen(false);
  }, [hasSkills]);

  const sectionItems = sections.map((section) =>
    section.id === 'Section:技能描述' && hasSkills
      ? {
          ...section,
          extra: (
            <button
              ref={skillCatalogTriggerRef}
              type='button'
              aria-label='技能目录'
              aria-expanded={isSkillCatalogOpen}
              aria-controls={SKILL_CATALOG_ID}
              onClick={() => setIsSkillCatalogOpen((open) => !open)}
              className={cn(
                'focus-visible:ring-focus -ml-3 flex min-h-12 min-w-11 cursor-pointer items-center justify-center rounded-none border-b-2 px-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none',
                isSkillSectionActive
                  ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              <ChevronDownIcon
                className={cn(
                  'size-4 shrink-0 transition-transform motion-reduce:transition-none',
                  isSkillCatalogOpen && 'rotate-180'
                )}
              />
            </button>
          ),
        }
      : section
  );

  return (
    <div className='border-border bg-background sticky top-(--character-nav-top) z-30 mb-4 border-b'>
      <TableOfContents
        items={sectionItems}
        activeId={activeId.startsWith('Skill:') ? 'Section:技能描述' : activeId}
        ariaLabel='角色详情索引'
        layout='inline'
        appearance='plain'
      />
      {hasSkills && (
        <div
          ref={skillCatalogPanelRef}
          id={SKILL_CATALOG_ID}
          hidden={!isSkillCatalogOpen}
          onClick={() => setIsSkillCatalogOpen(false)}
          className='border-border bg-background absolute inset-x-0 top-full z-40 max-h-[60vh] overflow-y-auto overscroll-contain border-b px-2 py-2 shadow-lg'
        >
          <TableOfContents
            items={skillItems}
            activeId={activeId}
            ariaLabel='角色技能目录'
            layout='wrap'
            appearance='plain'
          />
        </div>
      )}
    </div>
  );
}
