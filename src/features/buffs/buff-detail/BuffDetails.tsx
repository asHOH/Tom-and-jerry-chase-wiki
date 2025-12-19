'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Buff, SingleItem, SingleItemTypeChineseNameList } from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import SingleItemButton from '@/components/ui/SingleItemButton';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import DetailTraitsCard from '@/components/displays/shared/DetailTraitsCard';

import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(buff.name, 'buff');

  const { isDetailedView } = useAppContext();
  if (!buff) return null;

  function setSourceCard() {
    if (!!buff.source && buff.source?.length >= 10) {
      const filterSourceItemByType = Object.values(
        buff.source.reduce(
          (acc, item) => {
            (acc[item.type] ||= []).push(item);
            return acc;
          },
          {} as Record<string, SingleItem[]>
        )
      );
      return (
        <AccordionCard
          items={filterSourceItemByType.map((singleItemList, key) => {
            return {
              id: String(key),
              title: `${SingleItemTypeChineseNameList[singleItemList[0]?.type || 'character']}(${singleItemList.length})`,
              children: (
                <ul
                  className='mx-2 mt-2 gap-2'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  }}
                >
                  {singleItemList.map((singleItem, key) => {
                    return <SingleItemButton key={key} singleItem={singleItem} />;
                  })}
                </ul>
              ),
              activeColor: 'orange' as const,
            };
          })}
          titleClassName='-mt-4'
          size='xs'
          defaultOpenId='0'
        ></AccordionCard>
      );
    } else if (!!buff.source) {
      return (
        <ul
          className='-mt-4 w-full gap-2'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          }}
        >
          {buff.source.map((singleItem, key) => {
            return <SingleItemButton key={key} singleItem={singleItem} />;
          })}
        </ul>
      );
    }
    return null;
  }

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
      !!buff.source
        ? {
            key: 'source',
            title: '具体来源',
            value:
              (!!buff.sourceDescription ? buff.sourceDescription + '\n此外，' : '') +
              `共收录 $${buff.source.length}$text-indigo-700 dark:text-indigo-400# 个 $${buff.name}$text-fuchsia-600 dark:text-fuchsia-400# 的相关来源，点击下方按钮即可跳转。`,
            detailedValue: null,
          }
        : buff.sourceDescription !== undefined
          ? {
              key: 'sourceDescription',
              title: '具体来源',
              value: buff.sourceDescription,
              detailedValue: null,
            }
          : null,
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
          {key === 'source' && setSourceCard()}
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
