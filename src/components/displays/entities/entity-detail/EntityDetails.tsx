'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';

export default function EntityDetailClient({ entity }: { entity: Entity }) {
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
                style={{ gap: spacing.sm, marginTop: spacing.lg }}
              >
                {entity.factionId != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {entity.factionId == 'cat' ? '猫阵营' : '鼠阵营'}
                  </Tag>
                )}
                {entity.characterName != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    所属角色: {entity.characterName}
                  </Tag>
                )}
                {entity.skillname != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    所属技能: {entity.skillname}
                  </Tag>
                )}
                {!!(entity.aliases && entity.aliases.length) && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    别名: {(entity.aliases ?? []).filter(Boolean).join(', ')}
                  </Tag>
                )}
                {entity.move != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {entity.move == true ? '可移动' : '不可移动'}
                  </Tag>
                )}
                {entity.gravity != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {entity.gravity == true ? '受重力影响' : '不受重力影响'}
                  </Tag>
                )}
                {!!entity.collsion && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {entity.collsion == true ? '会产生碰撞' : '不会产生碰撞'}
                  </Tag>
                )}
                {!!entity.ignore && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    不会与{(entity.ignore ?? []).filter(Boolean).join(', ')}产生碰撞
                  </Tag>
                )}
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3'>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            {[
              {
                title: '衍生物描述',
                text:
                  isDetailedView && entity.detailedDescription
                    ? entity.detailedDescription
                    : entity.description,
              },
              {
                title: '生成方式',
                text:
                  isDetailedView && entity.detailedCreate ? entity.detailedCreate : entity.create,
              },
            ].map(({ title, text }) => (
              <div key={title}>
                <h2
                  className='text-2xl font-bold dark:text-white'
                  style={{
                    paddingTop: spacing.xs,
                    paddingBottom: spacing.xs,
                    marginBottom: spacing.md,
                  }}
                >
                  {title}
                </h2>
                <div
                  className='card dark:bg-slate-800 dark:border-slate-700'
                  style={{ padding: spacing.lg }}
                >
                  <p
                    className='text-black dark:text-gray-200 text-lg'
                    style={{ paddingTop: spacing.xs, paddingBottom: spacing.xs }}
                  >
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
