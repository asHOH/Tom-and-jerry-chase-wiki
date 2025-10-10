'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import { useAppContext } from '@/context/AppContext';
import { Entity, Skill } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import EntityAttributesCard from './EntityAttributesCard';
import EntitySkillCard from './EntitySkillCard';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(entity.name, 'entity');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!entity) return null;

  const baseTextStyle: React.CSSProperties = {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  };

  const sections: DetailSection[] = [
    {
      title: '衍生物描述',
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          <TextWithHoverTooltips
            text={
              entity.description === undefined
                ? '待补充'
                : isDetailedView && entity.detailedDescription
                  ? entity.detailedDescription
                  : entity.description
            }
          />
        </p>
      ),
    },
    {
      title: '生成方式',
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          <TextWithHoverTooltips
            text={
              entity.create === undefined
                ? '待补充'
                : isDetailedView && entity.detailedCreate
                  ? entity.detailedCreate
                  : entity.create
            }
          />
        </p>
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
