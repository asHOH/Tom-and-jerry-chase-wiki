'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';
import { designTokens, componentTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { useMobile } from '@/hooks/useMediaQuery';
import {
  getItemTypeColors,
  getItemSourceColors /* , getCardCostColors */,
} from '@/lib/design-tokens';

export default function ItemAttributesCard({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const spacing = designTokens.spacing;
  if (!item) return null;

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
              src={item.imageUrl}
              alt={item.name}
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
                {item.name}{' '}
              </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (道具{item.factionId === 'cat' ? '·猫' : item.factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {item.aliases !== undefined && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {(item.aliases ?? []).filter(Boolean).join('、')}
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
          <GameImage src={item.imageUrl} alt={item.name} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.xs,
            }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>
              {item.name}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (道具{item.factionId === 'cat' ? '·猫' : item.factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {item.aliases !== undefined && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {(item.aliases ?? []).filter(Boolean).join('、')}
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
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getItemTypeColors(item?.itemtype || '', isDarkMode)}
          >
            {item?.itemtype}
          </Tag>
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getItemSourceColors(item?.itemsource || '', isDarkMode)}
          >
            {item?.itemsource}
          </Tag>
        </div>
        {(item?.damage !== undefined || item?.walldamage !== undefined) && (
          <div
            className='auto-fill-grid grid-container grid text-sm font-normal items-center justify-center gap-1'
            style={{
              gridTemplateColumns: `repeat(2, minmax(40px, 1fr))`,
            }}
          >
            <span className={`text-sm whitespace-pre`}>
              伤害：
              <span className='text-red-600 dark:text-red-400'>
                {item.damage === undefined ? '--' : item.damage}
              </span>
            </span>
            <span className={`text-sm whitespace-pre`}>
              破墙伤害：
              <span className='text-yellow-700 dark:text-yellow-500'>
                {item.walldamage === undefined ? '--' : item.walldamage}
              </span>
            </span>
          </div>
        )}
        {item?.exp != undefined &&
          (item.exp == 0 ? (
            <span className={`text-sm whitespace-pre`}>(猫)命中不获得经验</span>
          ) : (
            <span className={`text-sm whitespace-pre`}>
              {'(猫)命中获得 '}
              <span className='text-indigo-700 dark:text-indigo-400'>{item.exp}</span>
              {' 经验'}
            </span>
          ))}
        {(item.move !== undefined || item.gravity !== undefined || item.collsion !== undefined) && (
          <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
            <span className='text-lg font-bold whitespace-pre'>移动信息</span>
            <div
              className='auto-fill-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
              style={{
                gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                gridTemplateRows: 'repeat(2,1fr)',
              }}
            >
              {item.move !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {item.move === true ? (
                    <span className={`text-green-600 dark:text-green-500`}>可</span>
                  ) : (
                    <span className={`text-red-600 dark:text-red-500`}>不可</span>
                  )}
                  移动
                </span>
              )}
              {item.gravity !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {item.gravity === true ? (
                    <span className={`text-orange-600 dark:text-orange-400`}>会受</span>
                  ) : (
                    <span className={`text-indigo-700 dark:text-indigo-400`}>不受</span>
                  )}
                  重力影响
                </span>
              )}
              {item.collsion !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {item.collsion === true ? (
                    <>
                      <span className={`text-orange-600 dark:text-orange-400`}>会</span>
                      产生碰撞
                      {!!item.ignore ? (
                        <>
                          ，但不与
                          <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                            {(item.ignore ?? []).filter(Boolean).join(', ')}
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
        {item?.store !== undefined &&
          (item.store !== true ? (
            <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
              <span className='text-lg font-bold whitespace-pre text-red-600 dark:text-red-500'>
                局内商店不售
              </span>
            </div>
          ) : (
            <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
              <span className='text-lg font-bold whitespace-pre text-green-600 dark:text-green-500'>
                局内商店有售
              </span>
              <div
                className='auto-fill-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
                style={{
                  gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                  gridTemplateRows: 'repeat(2,1fr)',
                }}
              >
                {
                  <span className={`text-sm whitespace-pre`}>
                    售价：
                    <span className='text-orange-600 dark:text-orange-400'>{item?.price || 0}</span>
                  </span>
                }
                {item?.unlocktime === undefined ? (
                  <span className={`text-sm whitespace-pre`}>初始解锁</span>
                ) : (
                  <span className={`text-sm whitespace-pre`}>
                    {'于'}
                    <span className='text-indigo-700 dark:text-indigo-400'>{item.unlocktime}</span>
                    {'解锁'}
                  </span>
                )}
                {item?.storeCD === undefined ? (
                  <span className={`text-sm whitespace-pre`}>无购买CD</span>
                ) : (
                  <span className={`text-sm whitespace-pre`}>
                    {'购买CD '}
                    <span className='text-indigo-700 dark:text-indigo-400'>{item.storeCD}</span>
                    {' 秒'}
                  </span>
                )}
                {item?.teamCD === true && (
                  <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                    (鼠)团队共享CD
                  </span>
                )}
              </div>
            </div>
          ))}
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
        <SpecifyTypeNavigationButtons currentId={item.name} specifyType='item' />
      </div>
    </BaseCard>
  );
}
