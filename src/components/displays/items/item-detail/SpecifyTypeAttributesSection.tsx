'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity, Item } from '@/data/types';
import { designTokens, componentTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { useMobile } from '@/hooks/useMediaQuery';
import {
  getItemTypeColors,
  getItemSourceColors /* , getCardCostColors */,
} from '@/lib/design-tokens';

export default function SpecifyTypeAttributesSection({
  item,
  entity,
}: {
  item?: Item;
  entity?: Entity;
}) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const spacing = designTokens.spacing;
  const type: 'item' | 'entity' | undefined = !!item ? 'item' : !!entity ? 'entity' : undefined;
  if (type === undefined) return null;

  const imageUrl = item?.imageUrl || entity?.imageUrl || '/images/icons/cat faction.png';
  const name = item?.name || entity?.name || '';
  const aliases = item?.aliases || entity?.aliases || [];
  const factionId = item?.factionId || entity?.factionId || undefined;

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
              src={imageUrl}
              alt={name}
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
                {name}{' '}
              </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                ({{ item: '道具', entity: '衍生物' }[type]}
                {factionId === 'cat' ? '·猫' : factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {aliases.length > 0 && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {(aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div>
          <GameImage src={imageUrl} alt={name} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
            }}
          >
            <h1
              className='text-3xl font-bold dark:text-white'
              style={{
                paddingTop: spacing.xs,
              }}
            >
              {name}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                ({{ item: '道具', entity: '衍生物' }[type]})
              </span>
            </h1>
          </div>
          {aliases.length > 0 && (
            <span
              className={`text-sm text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'} whitespace-pre`}
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {(aliases ?? []).filter(Boolean).join('、')}
            </span>
          )}
        </div>
      )}
      {/*------Item Attributes------*/}
      {type === 'item' && (
        <div
          className='grid items-center border-t border-gray-300 dark:border-gray-600'
          style={{
            gap: spacing.sm,
            marginLeft: spacing.md,
            marginRight: spacing.md,
            paddingTop: spacing.xs,
            paddingBottom: spacing.xs,
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
              className='auto-fit-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(40px, 1fr))`,
              }}
            >
              {item.damage !== undefined && (
                <span className={`text-sm whitespace-pre`}>伤害：{item.damage}</span>
              )}
              {item.walldamage !== undefined && (
                <span className={`text-sm whitespace-pre`}>破墙伤害：{item.walldamage}</span>
              )}
            </div>
          )}
          {item?.exp != undefined && (
            <span className={`text-sm whitespace-pre`}>
              {item.exp == 0 ? '(猫) 命中不获得经验' : `(猫) 命中获得 ${item.exp} 经验`}
            </span>
          )}
          {item?.store !== undefined && item.store === false ? (
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
                  gridTemplateColumns: `repeat(auto-fit, minmax(60px, 1fr))`,
                }}
              >
                <span className={`text-sm whitespace-pre`}>
                  售价：
                  <span className='text-orange-600 dark:text-orange-400'>{item?.price || 0}</span>
                </span>
                <span className={`text-sm whitespace-pre`}>
                  {item?.unlocktime === undefined ? '初始解锁' : `于${item.unlocktime}解锁`}
                </span>
              </div>
              <div
                className='auto-fit-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
                style={{
                  gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))`,
                }}
              >
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
          )}
        </div>
      )}

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
        <SpecifyTypeNavigationButtons currentId={name} specifyType={type} />
      </div>
    </BaseCard>
  );
}
