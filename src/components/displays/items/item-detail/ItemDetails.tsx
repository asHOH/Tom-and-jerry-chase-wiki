'use client';

import BaseCard from '@/components/ui/BaseCard';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import SectionHeader from '@/components/ui/SectionHeader';

export default function ItemDetailClient({ item }: { item: Item }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(item.name, 'item');

  const { isDetailedView } = useAppContext();
  const [isDarkMode] = useDarkMode();
  const spacing = designTokens.spacing;
  const tagColorStyles = isDarkMode
    ? { background: '#334155', color: '#e0e7ef' }
    : { background: '#e0e7ef', color: '#1e293b' };
  if (!item) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <GameImage src={item.imageUrl} alt={item.name} size='CARD_DETAILS' />
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
                {item.name}{' '}
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({item.itemtype}
                  {item.itemsource})
                </span>
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{ gap: spacing.sm, marginTop: spacing.sm }}
              >
                {!!(item.aliases && item.aliases.length) && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    别名: {(item.aliases ?? []).filter(Boolean).join(', ')}
                  </Tag>
                )}
                {item.factionId != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {item.factionId == 'cat' ? '限猫咪使用' : '限老鼠使用'}
                  </Tag>
                )}
                {item.damage != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    伤害: {item.damage}
                  </Tag>
                )}
                {item.walldamage != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    破墙伤害: {item.walldamage}
                  </Tag>
                )}
                {item.exp != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    {item.exp == 0 ? '(猫) 命中无经验' : `(猫) 命中获得经验: ${item.exp}`}
                  </Tag>
                )}
                <div className='flex items-center flex-wrap' style={{ gap: spacing.sm }}>
                  {item.store != undefined && (
                    <Tag colorStyles={tagColorStyles} size='md'>
                      {item.store == true ? '局内商店有售' : '局内商店不售'}
                    </Tag>
                  )}
                  {!!item.price && (
                    <Tag colorStyles={tagColorStyles} size='md'>
                      价格: {item.price}
                    </Tag>
                  )}
                  {!!item.storeCD && (
                    <Tag colorStyles={tagColorStyles} size='md'>
                      购买CD: {item.storeCD}秒 {item.teamCD == true ? '(团队共享)' : ''}
                    </Tag>
                  )}
                  {item.unlocktime != undefined && (
                    <Tag colorStyles={tagColorStyles} size='md'>
                      解锁时间: {item.unlocktime}
                    </Tag>
                  )}

                  {/*Navigation */}
                  <SpecifyTypeNavigationButtons currentId={item.name} specifyType='item' />
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3 space-y-3'>
          {[
            item.description === undefined
              ? { title: '道具描述', text: '待补充' }
              : {
                  title: '道具描述',
                  text:
                    isDetailedView && item.detailedDescription
                      ? item.detailedDescription
                      : item.description,
                },
            item.create === undefined
              ? { title: '生成方式', text: '待补充' }
              : {
                  title: '生成方式',
                  text: isDetailedView && item.detailedCreate ? item.detailedCreate : item.create,
                },
          ].map(({ title, text }) => (
            <div key={title}>
              <SectionHeader title={title} />
              <div
                className='card dark:bg-slate-800 dark:border-slate-700  mb-8'
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
