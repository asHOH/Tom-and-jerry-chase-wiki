'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalBuff } from '@/context/EditModeContext';
import { Buff, SingleItem, SingleItemTypeChineseNameList } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import AccordionCard from '@/components/ui/AccordionCard';
import { editable } from '@/components/ui/editable';
import SingleItemButton from '@/components/ui/SingleItemButton';
import { buffsEdit } from '@/data';

import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  const { isEditMode } = useEditMode();
  const { buffName } = useLocalBuff();
  const ed = editable('buffs');

  const rawLocalBuff = buffsEdit[buffName];
  const localBuffSnapshot = useSnapshot(rawLocalBuff ?? ({} as Buff));
  const effectiveBuff = isEditMode && rawLocalBuff ? (localBuffSnapshot as Buff) : buff;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveBuff.name, 'buff');

  const { isDetailedView } = useAppContext();
  if (!effectiveBuff) return null;

  function setSourceCard() {
    if (!!effectiveBuff.source && effectiveBuff.source?.length >= 10) {
      const filterSourceItemByType = Object.values(
        effectiveBuff.source.reduce(
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
    } else if (!!effectiveBuff.source) {
      return (
        <ul
          className='-mt-4 w-full gap-2'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          }}
        >
          {effectiveBuff.source.map((singleItem, key) => {
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
        value: effectiveBuff.description,
        detailedValue: effectiveBuff.detailedDescription,
      },
      effectiveBuff.stack === undefined
        ? null
        : {
            key: 'stack',
            title: '叠加方式',
            value: effectiveBuff.stack,
            detailedValue: effectiveBuff.detailedStack,
          },
      !!effectiveBuff.source
        ? {
            key: 'source',
            title: '具体来源',
            value:
              (!!effectiveBuff.sourceDescription
                ? effectiveBuff.sourceDescription + '\n此外，'
                : '') +
              `共收录 $${effectiveBuff.source.length}$text-indigo-700 dark:text-indigo-400# 个 $${effectiveBuff.name}$text-fuchsia-600 dark:text-fuchsia-400# 的相关来源，点击下方按钮即可跳转。`,
            detailedValue: null,
          }
        : effectiveBuff.sourceDescription !== undefined
          ? {
              key: 'sourceDescription',
              title: '具体来源',
              value: effectiveBuff.sourceDescription,
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
          renderValue={
            isEditMode &&
            (key === 'description' || key === 'stack' || key === 'sourceDescription') ? (
              <ed.span
                path={
                  key === 'description'
                    ? isDetailedView
                      ? 'detailedDescription'
                      : 'description'
                    : key === 'stack'
                      ? isDetailedView
                        ? 'detailedStack'
                        : 'stack'
                      : 'sourceDescription'
                }
                initialValue={String(value ?? '')}
              />
            ) : undefined
          }
        >
          {key === 'description' && (
            <div className='-mt-4'>
              <DetailTraitsCard singleItem={{ name: effectiveBuff.name, type: 'buff' }} />
            </div>
          )}
          {key === 'source' && setSourceCard()}
        </DetailTextSection>
      ),
    }));

  return (
    <DetailShell
      leftColumn={<BuffAttributesCard buff={effectiveBuff} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
