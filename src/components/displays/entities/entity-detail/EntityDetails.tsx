'use client';

import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import { useAppContext } from '@/context/AppContext';
import { Entity } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SectionHeader from '@/components/ui/SectionHeader';
import EntitySkillCard from './EntitySkillCard';
import { Skill } from '@/data/types';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import EntityAttributesCard from './EntityAttributesCard';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(entity.name, 'entity');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!entity) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <EntityAttributesCard entity={entity} />
        </div>
        <div className='md:w-2/3 space-y-3' style={{ whiteSpace: 'pre-wrap' }}>
          {[
            entity.description === undefined
              ? { title: '衍生物描述', text: '待补充' }
              : {
                  title: '衍生物描述',
                  text:
                    isDetailedView && entity.detailedDescription
                      ? entity.detailedDescription
                      : entity.description,
                },
            entity.create === undefined
              ? { title: '生成方式', text: '待补充' }
              : {
                  title: '生成方式',
                  text:
                    isDetailedView && entity.detailedCreate ? entity.detailedCreate : entity.create,
                },
          ].map(({ title, text }) => (
            <div key={title}>
              <SectionHeader title={title} />
              <div
                className='card dark:bg-slate-800 dark:border-slate-700 mb-8'
                style={{ padding: spacing.lg }}
              >
                <p
                  className='text-black dark:text-gray-200 text-lg'
                  style={{ paddingTop: spacing.xs, paddingBottom: spacing.xs }}
                >
                  <TextWithHoverTooltips text={text as string} />
                </p>
              </div>
            </div>
          ))}
          {entity.skills !== undefined && (
            <div key='衍生物技能'>
              <SectionHeader title='衍生物技能' />
              {entity.skills
                .map((skill) => {
                  const R: Skill & { colddown?: number } = { ...skill, id: entity.characterName };
                  return R;
                })
                .map<React.ReactNode>(
                  (skill: DeepReadonly<Skill & { colddown?: number }>, index) => (
                    <EntitySkillCard key={skill.id + skill.type} skill={skill} skillIndex={index} />
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
