'use client';

import React from 'react';
import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalEntity } from '@/context/EditModeContext';
import { Entity, Skill } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';
import { entitiesEdit } from '@/data';

import EntityAttributesCard from './EntityAttributesCard';
import EntitySkillCard from './EntitySkillCard';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
  const { isEditMode } = useEditMode();
  const { entityName } = useLocalEntity();
  const ed = editable('entities');

  const rawLocalEntity = entitiesEdit[entityName];
  const localEntitySnapshot = useSnapshot(rawLocalEntity ?? ({} as Entity));
  const effectiveEntity = isEditMode && rawLocalEntity ? (localEntitySnapshot as Entity) : entity;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveEntity.name, 'entity');

  const { isDetailedView } = useAppContext();
  if (!effectiveEntity) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='衍生物描述'
          value={effectiveEntity.description ?? null}
          detailedValue={effectiveEntity.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveEntity.detailedDescription ?? effectiveEntity.description ?? '')
                    : (effectiveEntity.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: effectiveEntity.name, type: 'entity' }} />
          </div>
        </DetailTextSection>
      ),
    },
    {
      key: 'create',
      render: () => (
        <DetailTextSection
          title='生成方式'
          value={effectiveEntity.create ?? null}
          detailedValue={effectiveEntity.detailedCreate ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedCreate' : 'create'}
                initialValue={
                  isDetailedView
                    ? (effectiveEntity.detailedCreate ?? effectiveEntity.create ?? '')
                    : (effectiveEntity.create ?? '')
                }
              />
            ) : undefined
          }
        />
      ),
    },
  ];

  if (effectiveEntity.skills !== undefined) {
    sections.push({
      title: '衍生物技能',
      cardOptions: { variant: 'none' },
      content: (
        <div className='space-y-4'>
          {effectiveEntity.skills
            .map((skill) => {
              const R: Skill & { cooldown?: number } = { ...skill, id: skill.type };
              return R;
            })
            .map<React.ReactNode>((skill: DeepReadonly<Skill & { cooldown?: number }>, index) => (
              <EntitySkillCard key={skill.id} skill={skill} skillIndex={index} />
            ))}
        </div>
      ),
    });
  }

  return (
    <DetailShell
      leftColumn={<EntityAttributesCard entity={effectiveEntity} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
