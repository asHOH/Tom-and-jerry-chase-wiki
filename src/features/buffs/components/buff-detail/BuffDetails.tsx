'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalBuff } from '@/context/EditModeContext';
import { Buff, SingleItem, SingleItemTypeChineseNameList } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
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

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='详细介绍'
          value={effectiveBuff.description}
          detailedValue={effectiveBuff.detailedDescription}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? String(effectiveBuff.detailedDescription ?? effectiveBuff.description ?? '')
                    : String(effectiveBuff.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard singleItem={{ name: effectiveBuff.name, type: 'buff' }} />
            <DetailReverseCard singleItem={{ name: effectiveBuff.name, type: 'buff' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  if (effectiveBuff.stack !== undefined) {
    sections.push({
      key: 'stack',
      render: () => (
        <DetailTextSection
          title='叠加方式'
          value={effectiveBuff.stack}
          detailedValue={effectiveBuff.detailedStack}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedStack' : 'stack'}
                initialValue={
                  isDetailedView
                    ? String(effectiveBuff.detailedStack ?? effectiveBuff.stack ?? '')
                    : String(effectiveBuff.stack ?? '')
                }
              />
            ) : undefined
          }
        />
      ),
    });
  }

  if (effectiveBuff.source) {
    const sourceItems = effectiveBuff.source;

    sections.push({
      key: 'source',
      render: () => (
        <DetailTextSection
          title='具体来源'
          value={
            (effectiveBuff.sourceDescription ? effectiveBuff.sourceDescription + '\n此外，' : '') +
            `共收录 $${sourceItems.length}$text-indigo-700 dark:text-indigo-400# 个 $${effectiveBuff.name}$text-fuchsia-600 dark:text-fuchsia-400# 的相关来源，点击下方按钮即可跳转。`
          }
          detailedValue={null}
          isDetailedView={isDetailedView}
        >
          {sourceItems.length >= 10 ? (
            <AccordionCard
              items={Object.values(
                sourceItems.reduce(
                  (acc, item) => {
                    (acc[item.type] ||= []).push(item);
                    return acc;
                  },
                  {} as Record<string, SingleItem[]>
                )
              ).map((singleItemList, key) => ({
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
                    {singleItemList.map((singleItem, index) => (
                      <SingleItemButton key={index} singleItem={singleItem} />
                    ))}
                  </ul>
                ),
                activeColor: 'orange' as const,
              }))}
              titleClassName='-mt-4'
              size='xs'
              defaultOpenId='0'
            />
          ) : (
            <ul
              className='-mt-4 w-full gap-2'
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              }}
            >
              {sourceItems.map((singleItem, key) => (
                <SingleItemButton key={key} singleItem={singleItem} />
              ))}
            </ul>
          )}
        </DetailTextSection>
      ),
    });
  } else if (effectiveBuff.sourceDescription !== undefined) {
    sections.push({
      key: 'sourceDescription',
      render: () => (
        <DetailTextSection
          title='具体来源'
          value={effectiveBuff.sourceDescription}
          detailedValue={null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path='sourceDescription'
                initialValue={String(effectiveBuff.sourceDescription ?? '')}
              />
            ) : undefined
          }
        />
      ),
    });
  }

  return (
    <DetailShell
      leftColumn={<BuffAttributesCard buff={effectiveBuff} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
