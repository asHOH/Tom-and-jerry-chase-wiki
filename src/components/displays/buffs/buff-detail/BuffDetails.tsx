'use client';

import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import { useAppContext } from '@/context/AppContext';
import { Buff } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SectionHeader from '@/components/ui/SectionHeader';
import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!buff) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <BuffAttributesCard buff={buff} />
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
              ? { title: '', text: '' }
              : {
                  title: '同类效果叠加方式',
                  text: isDetailedView && buff.detailedStack ? buff.detailedStack : buff.stack,
                },
          ].map(
            ({ title, text }) =>
              text !== '' && (
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
              )
          )}
        </div>
      </div>
    </div>
  );
}
