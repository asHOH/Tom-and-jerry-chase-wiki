'use client';

import BaseCard from '@/components/ui/BaseCard';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import SectionHeader from '@/components/ui/SectionHeader';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(entity.name, 'entity');

  const { isDetailedView } = useAppContext();
  const [isDarkMode] = useDarkMode();
  const spacing = designTokens.spacing;
  const tagColorStyles = isDarkMode
    ? { background: '#334155', color: '#e0e7ef' }
    : { background: '#e0e7ef', color: '#1e293b' };
  if (!entity) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <GameImage src={entity.imageUrl} alt={entity.name} size='CARD_DETAILS' />
            <div
              style={{
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
                paddingBottom: spacing.md,
              }}
            >
              <h1
                className='text-3xl font-bold dark:text-white'
                style={{
                  paddingTop: spacing.xs,
                  paddingBottom: spacing.xs,
                }}
              >
                {entity.name}{' '}
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({entity.entitytype})
                </span>
              </h1>
              <div
                className='flex entitys-center flex-wrap'
                style={{ gap: spacing.sm, marginTop: spacing.sm }}
              >
                {entity.factionId != undefined && entity.characterName != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    <TextWithHoverTooltips
                      text={`所属者：${entity.factionId == 'cat' ? '猫阵营' : '鼠阵营'}-{${entity.characterName}}
                    ${entity.skillname === undefined ? '' : `-{${entity.skillname}(技能)}`}`}
                    />
                  </Tag>
                )}
                {!!(entity.aliases && entity.aliases.length) && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    别名：{(entity.aliases ?? []).filter(Boolean).join(', ')}
                  </Tag>
                )}
                {(entity.move != undefined || entity.gravity != undefined) && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    移动情况：
                    {entity.move == true ? '可移动' : entity.move == undefined ? '' : '不可移动'}
                    {entity.move != undefined && entity.gravity != undefined && '，'}
                    {entity.gravity == true
                      ? `${entity.move == false ? '但' : ''}会受重力影响`
                      : entity.gravity == undefined
                        ? ''
                        : '不受重力影响'}
                  </Tag>
                )}
                {entity.collsion != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {entity.collsion == true ? '会产生碰撞' : '不会产生碰撞'}
                    {entity.ignore === undefined
                      ? ''
                      : `，但无视${(entity.ignore ?? []).filter(Boolean).join(', ')}`}
                  </Tag>
                )}

                {/* Entity Navigation */}
                <SpecifyTypeNavigationButtons currentId={entity.name} specifyType='entity' />
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3 space-y-3'>
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
        </div>
      </div>
    </div>
  );
}
