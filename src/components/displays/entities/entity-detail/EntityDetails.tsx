'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Entity, Skill } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import EntityAttributesCard from './EntityAttributesCard';
import EntitySkillCard from './EntitySkillCard';
import CollapseCard from '@/components/ui/CollapseCard';
import SingleItemTraitsText from '../../traits/shared/TextOfSingleItemTraits';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(entity.name, 'entity');

  const { isDetailedView } = useAppContext();
  if (!entity) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='衍生物描述'
          value={entity.description ?? null}
          detailedValue={entity.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <CollapseCard
              title={`  ${entity.name}的相关互动特性`}
              size='xs'
              color='orange'
              className='pb-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
            >
              <SingleItemTraitsText singleItem={{ name: entity.name, type: 'entity' }} />
            </CollapseCard>
          </div>
        </DetailTextSection>
      ),
    },
    {
      key: 'create',
      render: () => (
        <DetailTextSection
          title='生成方式'
          value={entity.create ?? null}
          detailedValue={entity.detailedCreate ?? null}
          isDetailedView={isDetailedView}
        />
      ),
    },
  ];

  if (entity.skills !== undefined) {
    sections.push({
      title: '衍生物技能',
      cardOptions: { variant: 'none' },
      content: (
        <div className='space-y-4'>
          {entity.skills
            .map((skill) => {
              const R: Skill & { colddown?: number } = { ...skill, id: entity.characterName };
              return R;
            })
            .map<React.ReactNode>((skill: DeepReadonly<Skill & { colddown?: number }>, index) => (
              <EntitySkillCard key={skill.id + skill.type} skill={skill} skillIndex={index} />
            ))}
        </div>
      ),
    });
  }

  return (
    <DetailShell
      leftColumn={<EntityAttributesCard entity={entity} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
