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
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>(道具)</span>
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
            className='auto-fit-grid grid-container grid text-sm font-normal items-center justify-center gap-1'
            style={{
              gridTemplateColumns: `repeat(2, minmax(40px, 1fr))`,
            }}
          >
            <span className={`text-sm whitespace-pre`}>
              伤害：{item.damage === undefined ? '--' : item.damage}
            </span>
            <span className={`text-sm whitespace-pre`}>
              破墙伤害：{item.walldamage === undefined ? '--' : item.walldamage}
            </span>
          </div>
        )}
        {item?.exp != undefined && (
          <span className={`text-sm whitespace-pre`}>
            {item.exp == 0 ? `(猫)命中不获得经验` : `(猫)命中获得 ${item.exp} 经验`}
          </span>
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
                className='auto-fit-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
                style={{
                  gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                  gridTemplateRows: 'repeat(2,1fr)',
                }}
              >
                <span className={`text-sm whitespace-pre`}>
                  售价：
                  <span className='text-orange-600 dark:text-orange-400'>{item?.price || 0}</span>
                </span>
                <span className={`text-sm whitespace-pre`}>
                  {item?.unlocktime === undefined ? '初始解锁' : `于${item.unlocktime}解锁`}
                </span>
                <span className={`text-sm whitespace-pre`}>
                  {item?.storeCD === undefined ? '无购买CD' : `购买有${item.storeCD}秒CD`}
                </span>
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
