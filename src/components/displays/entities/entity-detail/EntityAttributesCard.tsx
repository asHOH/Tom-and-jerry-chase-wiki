'use client';

import BaseCard from '@/components/ui/BaseCard';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import { designTokens, componentTokens, getEntityTypeColors } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { useMobile } from '@/hooks/useMediaQuery';

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const spacing = designTokens.spacing;
  if (!entity) return null;
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
                {entity.factionId === 'cat' ? '·猫' : entity.factionId === 'mouse' ? '·鼠' : ''})
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
                {entity.factionId === 'cat' ? '·猫' : entity.factionId === 'mouse' ? '·鼠' : ''})
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
        className='grid items-center border-t border-gray-300 dark:border-gray-600 gap-1'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xxxxxs,
          paddingBottom: spacing.xxxxxs,
        }}
      >
        <div className='text-sm font-normal gap-1 flex flex-wrap items-center'>
          <span className={`text-sm whitespace-pre`}>类型: </span>
          {putTypeTagOn(entity)}
        </div>
        {!!entity.factionId && !!entity.characterName && (
          <span className={`text-sm whitespace-pre`}>
            {'归属者：'}
            <span className='text-indigo-700 dark:text-indigo-400'>
              <TextWithHoverTooltips text={`{${entity.characterName}}`} />
            </span>
            {!!entity.skillname ? (
              <>
                {' → '}
                <span className='text-orange-600 dark:text-orange-400'>
                  <TextWithHoverTooltips text={`{${entity.skillname}}`} />
                </span>
              </>
            ) : null}
          </span>
        )}
        {(entity.move !== undefined ||
          entity.gravity !== undefined ||
          entity.collsion !== undefined) && (
          <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
            <span className='text-lg font-bold whitespace-pre'>移动信息</span>
            <div
              className='auto-fill-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
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
              {entity.collsion !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {entity.collsion === true ? (
                    <>
                      <span className={`text-orange-600 dark:text-orange-400`}>会</span>
                      产生碰撞
                      {!!entity.ignore ? (
                        <>
                          ，但不与
                          <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                            {(entity.ignore ?? []).filter(Boolean).join(', ')}
                          </span>
                          碰撞
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className={`text-indigo-700 dark:text-indigo-400`}>不会</span>
                      产生碰撞
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/*Navigation */}
      <div
        className='flex items-center flex-wrap border-t text-sm border-gray-300 dark:border-gray-600'
        style={{
          gap: spacing.sm,
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.md,
        }}
      >
        <SpecifyTypeNavigationButtons currentId={entity.name} specifyType='entity' />
      </div>
    </BaseCard>
  );
}
