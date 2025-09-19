'use client';

import BaseCard from '@/components/ui/BaseCard';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Buff } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import SectionHeader from '@/components/ui/SectionHeader';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  const [isDarkMode] = useDarkMode();
  const spacing = designTokens.spacing;
  const tagColorStyles = isDarkMode
    ? { background: '#334155', color: '#e0e7ef' }
    : { background: '#e0e7ef', color: '#1e293b' };
  if (!buff) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <GameImage src={buff.imageUrl} alt={buff.name} size='CARD_DETAILS' />
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
                {buff.name}{' '}
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({buff.bufftype})
                </span>
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{ gap: spacing.sm, marginTop: spacing.sm }}
              >
                {!!(buff.aliases && buff.aliases.length) && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    别名：{(buff.aliases ?? []).filter(Boolean).join(', ')}
                  </Tag>
                )}
                {buff.duration != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    持续时间：{buff.duration == 'infinite' ? '无限' : `${buff.duration}秒`}
                  </Tag>
                )}
                {buff.failure != undefined && (
                  <Tag colorStyles={tagColorStyles} size='md'>
                    效果中止条件: {buff.failure}
                  </Tag>
                )}

                {/*Navigation*/}
                <SpecifyTypeNavigationButtons currentId={buff.name} specifyType='buff' />
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3 space-y-3' style={{ whiteSpace: 'pre-wrap' }}>
          {[
            buff.description === undefined
              ? { title: '效果介绍', text: '待补充' }
              : {
                  title: '效果介绍',
                  text:
                    isDetailedView && buff.detailedDescription
                      ? buff.detailedDescription
                      : buff.description,
                },
            buff.source === undefined
              ? { title: '效果来源', text: '待补充' }
              : {
                  title: '效果来源',
                  text: isDetailedView && buff.detailedSource ? buff.detailedSource : buff.source,
                },
            buff.stack === undefined
              ? { title: '同类效果叠加方式', text: '待补充' }
              : {
                  title: '同类效果叠加方式',
                  text: isDetailedView && buff.detailedStack ? buff.detailedStack : buff.stack,
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
