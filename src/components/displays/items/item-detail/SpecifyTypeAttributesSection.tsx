'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity, Item } from '@/data/types';
import { designTokens, componentTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { useMobile } from '@/hooks/useMediaQuery';

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
  const tagColorStyles = isDarkMode
    ? { background: '#334155', color: '#e0e7ef' }
    : { background: '#e0e7ef', color: '#1e293b' };
  const type: 'item' | 'entity' | undefined = !!item ? 'item' : !!entity ? 'entity' : undefined;
  if (type === undefined) return null;

  const imageUrl = item?.imageUrl || entity?.imageUrl || '/images/icons/cat faction.png';
  const name = item?.name || entity?.name || '';
  const aliases = item?.aliases || entity?.aliases || [];

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
                ({{ item: '道具', entity: '衍生物' }[type]})
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
          className='flex items-center flex-wrap border-t border-gray-300 dark:border-gray-600'
          style={{
            gap: spacing.sm,
            marginLeft: spacing.md,
            marginRight: spacing.md,
            paddingBottom: spacing.md,
          }}
        >
          <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
            ({item?.itemtype}
            {item?.itemsource})
          </span>
          {item?.factionId != undefined && (
            <Tag colorStyles={tagColorStyles} size='md'>
              {item.factionId == 'cat' ? '限猫咪使用' : '限老鼠使用'}
            </Tag>
          )}
          {item?.damage != undefined && (
            <Tag colorStyles={tagColorStyles} size='md'>
              伤害: {item.damage}
            </Tag>
          )}
          {item?.walldamage != undefined && (
            <Tag colorStyles={tagColorStyles} size='md'>
              破墙伤害: {item.walldamage}
            </Tag>
          )}
          {item?.exp != undefined && (
            <Tag colorStyles={tagColorStyles} size='md'>
              {item.exp == 0 ? '(猫) 命中无经验' : `(猫) 命中获得经验: ${item.exp}`}
            </Tag>
          )}
          <div className='flex items-center flex-wrap' style={{ gap: spacing.sm }}>
            {item?.store != undefined && (
              <Tag colorStyles={tagColorStyles} size='md'>
                {item.store == true ? '局内商店有售' : '局内商店不售'}
              </Tag>
            )}
            {!!item?.price && (
              <Tag colorStyles={tagColorStyles} size='md'>
                价格: {item.price}
              </Tag>
            )}
            {!!item?.storeCD && (
              <Tag colorStyles={tagColorStyles} size='md'>
                购买CD: {item.storeCD}秒 {item.teamCD == true ? '(团队共享)' : ''}
              </Tag>
            )}
            {item?.unlocktime != undefined && (
              <Tag colorStyles={tagColorStyles} size='md'>
                解锁时间: {item.unlocktime}
              </Tag>
            )}

            {/*Navigation */}
            <SpecifyTypeNavigationButtons currentId={name} specifyType='item' />
          </div>
        </div>
      )}
    </BaseCard>
  );
}
