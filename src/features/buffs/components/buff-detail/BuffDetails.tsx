'use client';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalBuff } from '@/hooks/useLocalEditEntity';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { Buff, SingleItem, SingleItemTypeChineseNameList } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import SingleItemListEditor from '@/features/shared/detail-view/SingleItemListEditor';
import AccordionCard from '@/components/ui/AccordionCard';
import { editable } from '@/components/ui/editable';
import SingleItemButton from '@/components/ui/SingleItemButton';

import BuffAttributesCard from './BuffAttributesCard';

export default function BuffDetailClient({ buff }: { buff: Buff }) {
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { buffName } = useLocalBuff();
  const ed = editable('buffs');

  const editRuntime = useDraftDataRuntime();
  const rawLocalBuff = editRuntime?.stores.buffs[buffName];
  const localBuffSnapshot = useOptionalEditSnapshot(rawLocalBuff, buff);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveBuff = usesDraftData && rawLocalBuff ? (localBuffSnapshot as Buff) : buff;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveBuff.name, 'buff');

  const { isDetailedView } = useAppContext();
  if (!effectiveBuff) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      content: (
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
                deleteOnEmpty
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

  if (isEditMode || effectiveBuff.stack !== undefined) {
    sections.push({
      key: 'stack',
      content: (
        <DetailTextSection
          title='叠加/结算细节'
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
                deleteOnEmpty
              />
            ) : undefined
          }
        />
      ),
    });
  }

  if (isEditMode) {
    const sourceItems = effectiveBuff.source ?? [];

    sections.push({
      key: 'source',
      content: (
        <DetailTextSection
          title={`具体来源（${sourceItems.length}个）`}
          sectionId='Section:具体来源'
          value={effectiveBuff.sourceDescription ?? ''}
          fallbackText=''
          detailedValue={null}
          isDetailedView={isDetailedView}
          renderValue={
            <ed.span
              path='sourceDescription'
              initialValue={effectiveBuff.sourceDescription ?? '<无内容>'}
              deleteOnEmpty
            />
          }
        >
          <SingleItemListEditor
            actionPath={`${buffName}.source`}
            items={sourceItems}
            itemLabel='状态来源'
            onChange={(items) => {
              if (!rawLocalBuff) return;
              if (items.length > 0) rawLocalBuff.source = items;
              else delete rawLocalBuff.source;
            }}
          />
        </DetailTextSection>
      ),
    });
  } else if (effectiveBuff.source) {
    const sourceItems = effectiveBuff.source;

    sections.push({
      key: 'source',
      content: (
        <DetailTextSection
          title={`具体来源（${sourceItems.length}个）`}
          sectionId='Section:具体来源'
          value={effectiveBuff.sourceDescription ?? ''}
          fallbackText=''
          detailedValue={null}
          isDetailedView={isDetailedView}
        >
          <div className='text-lg font-bold text-blue-600'>
            （注意：以下只列举由“角色状态”导致的效果的来源）
          </div>
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
              size='xs'
              defaultOpenId='0'
            />
          ) : (
            <ul
              className='w-full gap-2'
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
      content: (
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
                deleteOnEmpty
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
