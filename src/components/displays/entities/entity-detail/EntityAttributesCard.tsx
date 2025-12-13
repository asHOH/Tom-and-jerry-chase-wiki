'use client';

import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';

import { componentTokens, designTokens, getEntityTypeColors } from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemButton from '@/components/ui/SingleItemButton';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

import Tooltip from '../../../ui/Tooltip';
import getEntityFactionId from '../lib/getEntityFactionId';

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const { isDetailedView: isDetailed } = useAppContext();
  const spacing = designTokens.spacing;

  if (!entity) return null;

  const factionId = getEntityFactionId(entity);

  function putTypeTagOn(entity: Entity) {
    if (typeof entity.entitytype === 'string') {
      return (
        <Tag
          size='sm'
          margin='compact'
          colorStyles={getEntityTypeColors(entity.entitytype, isDarkMode)}
        >
          {entity.entitytype}
        </Tag>
      );
    } else {
      return entity.entitytype.map((type) => {
        return (
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getEntityTypeColors(type, isDarkMode)}
            key={type}
          >
            {type}
          </Tag>
        );
      });
    }
  }

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className={`auto-fit-grid grid-container grid`}
            style={{
              gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
            }}
          >
            <GameImage
              src={entity.imageUrl}
              alt={entity.name}
              size={'CARD_DETAILS'}
              style={{
                height: isMobile ? '6rem' : undefined,
                borderRadius: componentTokens.image.container.borderRadius.replace(/ .*? /, ' 0 '),
              }}
            />
            <div>
              <h1
                className='text-2xl font-bold dark:text-white'
                style={{
                  paddingTop: spacing.xs,
                }}
              >
                {entity.name}{' '}
              </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (衍生物
                {factionId === 'cat' ? '·猫' : factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {entity.aliases !== undefined && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {(entity.aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div
          style={{
            paddingBottom: spacing.xxxxxs,
          }}
        >
          <GameImage src={entity.imageUrl} alt={entity.name} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.xs,
            }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>
              {entity.name}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (衍生物
                {factionId === 'cat' ? '·猫' : factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {entity.aliases !== undefined && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {(entity.aliases ?? []).filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}
      {/*------Item Attributes------*/}
      <div
        className='grid items-center gap-1 border-t border-gray-300 dark:border-gray-600'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xxxxxs,
          paddingBottom: spacing.xxxxxs,
        }}
      >
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className={`text-sm whitespace-pre`}>类型: </span>
          {putTypeTagOn(entity)}
        </div>
        {!!entity.owner && (
          <span className={`flex items-center text-sm`}>
            {'归属者：'}
            <SingleItemButton singleItem={entity.owner} />
          </span>
        )}
        {/*itemAttributesAsCharacter*/}
        {entity.entityAttributesAsCharacter !== undefined && (
          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-sm font-bold'>
              该衍生物特性与<span className={`text-fuchsia-600 dark:text-fuchsia-400`}>角色</span>
              类似，可看作
              {entity.entityAttributesAsCharacter.factionBelong === 'cat' ? (
                <span className={`text-sky-600 dark:text-sky-400`}>猫阵营</span>
              ) : entity.entityAttributesAsCharacter.factionBelong === 'mouse' ? (
                <span className={`text-amber-700 dark:text-amber-600`}>鼠阵营</span>
              ) : (
                <span className={`text-fuchsia-600 dark:text-fuchsia-400`}>第三阵营</span>
              )}
              的
              {entity.entityAttributesAsCharacter.type === 'cat' ? (
                <span className={`text-sky-600 dark:text-sky-400`}>猫角色</span>
              ) : entity.entityAttributesAsCharacter.type === 'mouse' ? (
                <span className={`text-amber-700 dark:text-amber-600`}>鼠角色</span>
              ) : (
                <span className={`text-fuchsia-600 dark:text-fuchsia-400`}>特殊角色</span>
              )}
            </span>
            <div
              className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
              style={{
                gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
              }}
            >
              {[
                entity.entityAttributesAsCharacter.maxHp === undefined
                  ? { title: null, text: null }
                  : {
                      title: 'Hp上限',
                      text: entity.entityAttributesAsCharacter.maxHp,
                    },
                entity.entityAttributesAsCharacter.hpRecovery === undefined
                  ? { title: null, text: null }
                  : {
                      title: 'Hp恢复',
                      text: entity.entityAttributesAsCharacter.hpRecovery,
                    },
                entity.entityAttributesAsCharacter.moveSpeed === undefined
                  ? { title: null, text: null }
                  : {
                      title: '移速',
                      text: entity.entityAttributesAsCharacter.moveSpeed,
                    },
                entity.entityAttributesAsCharacter.jumpHeight === undefined
                  ? { title: null, text: null }
                  : {
                      title: '跳跃',
                      text: entity.entityAttributesAsCharacter.jumpHeight,
                    },
                entity.entityAttributesAsCharacter.attackBoost === undefined
                  ? { title: null, text: null }
                  : {
                      title: '攻击增伤',
                      text: entity.entityAttributesAsCharacter.attackBoost,
                    },
              ].map(({ title, text }) =>
                title === null ? null : (
                  <span className={`text-sm whitespace-pre`} key={title}>
                    <Tooltip
                      content={getTooltipContent(
                        title,
                        entity.entityAttributesAsCharacter?.type === 'cat' ? 'cat' : 'mouse',
                        isDetailed
                      )}
                    >
                      {title}
                    </Tooltip>
                    ：<span className='text-indigo-700 dark:text-indigo-400'>{text}</span>
                  </span>
                )
              )}
            </div>
          </div>
        )}
        {(entity.move !== undefined ||
          entity.gravity !== undefined ||
          entity.collsion !== undefined) && (
          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>移动信息</span>
            <div
              className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
              style={{
                gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                gridTemplateRows: 'repeat(2,1fr)',
              }}
            >
              {entity.move !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {entity.move === true ? (
                    <span className={`text-green-600 dark:text-green-500`}>可</span>
                  ) : (
                    <span className={`text-red-600 dark:text-red-500`}>不可</span>
                  )}
                  移动
                </span>
              )}
              {entity.gravity !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {entity.gravity === true ? (
                    <span className={`text-orange-600 dark:text-orange-400`}>会受</span>
                  ) : (
                    <span className={`text-indigo-700 dark:text-indigo-400`}>不受</span>
                  )}
                  重力影响
                </span>
              )}
              <span className={`text-sm whitespace-pre`}>
                {!!entity.collsion ? (
                  <>
                    <span className={`text-orange-600 dark:text-orange-400`}>会</span>与
                    {entity.collsion.map((string, key, array) => {
                      return (
                        <span key={key}>
                          <span
                            className={
                              string === '角色'
                                ? 'text-red-600 dark:text-red-500'
                                : string === '道具'
                                  ? 'text-indigo-700 dark:text-indigo-400'
                                  : 'text-fuchsia-600 dark:text-fuchsia-400'
                            }
                          >
                            {string}
                          </span>
                          {key < array.length - 1 ? '、' : ''}
                        </span>
                      );
                    })}
                    产生碰撞
                  </>
                ) : (
                  <>
                    <span className={`text-indigo-700 dark:text-indigo-400`}>不会</span>
                    产生碰撞
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/*Navigation */}
      <NavigationButtonsRow>
        <SpecifyTypeNavigationButtons currentId={entity.name} specifyType='entity' />
      </NavigationButtonsRow>
    </BaseCard>
  );
}
