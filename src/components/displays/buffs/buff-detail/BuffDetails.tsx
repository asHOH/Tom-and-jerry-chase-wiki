'use client';

import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { Buff } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import DetailTraitsCard from '../../shared/DetailTraitsCard';
import BuffAttributesCard from './BuffAttributesCard';
import SingleItemButton from '@/components/ui/SingleItemButton';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  if (!buff) return null;

  const sections: DetailSection[] = (
    [
      {
        key: 'description',
        title: '作用效果',
        value: buff.description,
        detailedValue: buff.detailedDescription,
      },
      buff.stack === undefined
        ? null
        : {
            key: 'stack',
            title: '叠加方式',
            value: buff.stack,
            detailedValue: buff.detailedStack,
          },
      buff.source === undefined
        ? buff.sourceDescription === undefined
          ? null
          : {
              key: 'sourceDescription',
              title: '具体来源',
              value: buff.sourceDescription,
              detailedValue: null,
            }
        : {
            key: 'source',
            title: '具体来源',
            value:
              (!!buff.sourceDescription ? buff.sourceDescription + '\n此外，' : '') +
              `共收录 $${buff.source.length}$text-indigo-700 dark:text-indigo-400# 个 $${buff.name}$text-fuchsia-600 dark:text-fuchsia-400# 的相关来源，点击下方按钮即可跳转。`,
            detailedValue: null,
          },
    ] as const
  )
    .filter(<T,>(section: T | null): section is T => section !== null)
    .map<DetailSection>(({ key, title, value, detailedValue }) => ({
      key,
      render: () => (
        <DetailTextSection
          title={title}
          value={value}
          detailedValue={detailedValue}
          isDetailedView={isDetailedView}
        >
          {key === 'description' && (
            <div className='-mt-4'>
              <DetailTraitsCard singleItem={{ name: buff.name, type: 'buff' }} />
            </div>
          )}
          {key === 'source' && !!buff.source && (
            <ul
              className='-mt-4 gap-2 w-full'
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              }}
            >
              {buff.source.map((singleItem, key) => {
                return <SingleItemButton key={key} singleItem={singleItem} />;
              })}
            </ul>
          )}
        </DetailTextSection>
      ),
    }));

  return (
    <DetailShell
      leftColumn={<BuffAttributesCard buff={buff} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
