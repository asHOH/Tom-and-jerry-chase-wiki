'use client';

import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import { useAppContext } from '@/context/AppContext';
import { Item } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SectionHeader from '@/components/ui/SectionHeader';
import SpecifyTypeAttributesSection from './SpecifyTypeAttributesSection';

export default function ItemDetailClient({ item }: { item: Item }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(item.name, 'item');

  const { isDetailedView } = useAppContext();
  const spacing = designTokens.spacing;
  if (!item) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: spacing.xl }}>
        <div className='md:w-1/3'>
          <SpecifyTypeAttributesSection item={item} />
        </div>
        <div className='md:w-2/3 space-y-3' style={{ whiteSpace: 'pre-wrap' }}>
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
