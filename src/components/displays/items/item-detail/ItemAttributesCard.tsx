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
import Tooltip from '../../../ui/Tooltip';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';

export default function ItemAttributesCard({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const { isDetailedView: isDetailed } = useAppContext();
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
        {/*itemAttributesAsCharacter*/}
        {item.itemAttributesAsCharacter !== undefined && (
          <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
            <span className='text-sm font-bold'>
              该道具特性与<span className={`text-fuchsia-600 dark:text-fuchsia-400`}>角色</span>
              类似，可看作
              {item.itemAttributesAsCharacter.factionBelong === 'cat' ? (
                <span className={`text-sky-600 dark:text-sky-400`}>猫阵营</span>
              ) : item.itemAttributesAsCharacter.factionBelong === 'mouse' ? (
                <span className={`text-amber-700 dark:text-amber-600`}>鼠阵营</span>
              ) : (
                <span className={`text-fuchsia-600 dark:text-fuchsia-400`}>第三阵营</span>
              )}
              的
              {item.itemAttributesAsCharacter.type === 'cat' ? (
                <span className={`text-sky-600 dark:text-sky-400`}>猫角色</span>
              ) : item.itemAttributesAsCharacter.type === 'mouse' ? (
                <span className={`text-amber-700 dark:text-amber-600`}>鼠角色</span>
              ) : (
                <span className={`text-fuchsia-600 dark:text-fuchsia-400`}>特殊角色</span>
              )}
            </span>
            <div
              className='auto-fill-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
              style={{
                gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
              }}
            >
              {[
                item.itemAttributesAsCharacter.maxHp === undefined
                  ? { title: null, text: null }
                  : {
                      title: 'Hp上限',
                      text: item.itemAttributesAsCharacter.maxHp,
                    },
                item.itemAttributesAsCharacter.hpRecovery === undefined
                  ? { title: null, text: null }
                  : {
                      title: 'Hp恢复',
                      text: item.itemAttributesAsCharacter.hpRecovery,
                    },
                item.itemAttributesAsCharacter.moveSpeed === undefined
                  ? { title: null, text: null }
                  : {
                      title: '移速',
                      text: item.itemAttributesAsCharacter.moveSpeed,
                    },
                item.itemAttributesAsCharacter.jumpHeight === undefined
                  ? { title: null, text: null }
                  : {
                      title: '跳跃',
                      text: item.itemAttributesAsCharacter.jumpHeight,
                    },
                item.itemAttributesAsCharacter.attackBoost === undefined
                  ? { title: null, text: null }
                  : {
                      title: '攻击增伤',
                      text: item.itemAttributesAsCharacter.attackBoost,
                    },
              ].map(({ title, text }) =>
                title === null ? null : (
                  <span className={`text-sm whitespace-pre`} key={title}>
                    <Tooltip
                      content={getTooltipContent(
                        title,
                        item.itemAttributesAsCharacter?.type === 'cat' ? 'cat' : 'mouse',
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
              <span className={`text-sm whitespace-pre`}>
                {!!item.collsion ? (
                  <>
                    <span className={`text-orange-600 dark:text-orange-400`}>会</span>与
                    {item.collsion.map((string, key, array) => {
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
                    {'购买CD：'}
                    <span className='text-indigo-700 dark:text-indigo-400'>{item.storeCD}</span>
                    {'秒'}
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
