'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalItem } from '@/context/EditModeContext';
import { Item } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';
import { itemsEdit } from '@/data';

import ItemAttributesCard from './ItemAttributesCard';

export default function ItemDetailClient({ item }: { item: Item }) {
  const { isEditMode } = useEditMode();
  const { itemName } = useLocalItem();
  const ed = editable('items');

  const rawLocalItem = itemsEdit[itemName];
  const localItemSnapshot = useSnapshot(rawLocalItem ?? ({} as Item));
  const effectiveItem = isEditMode && rawLocalItem ? (localItemSnapshot as Item) : item;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveItem.name, 'item');

  const { isDetailedView } = useAppContext();
  if (!effectiveItem) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='道具描述'
          value={effectiveItem.description ?? null}
          detailedValue={effectiveItem.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveItem.detailedDescription ?? effectiveItem.description ?? '')
                    : (effectiveItem.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard singleItem={{ name: effectiveItem.name, type: 'item' }} />
            <DetailReverseCard singleItem={{ name: effectiveItem.name, type: 'item' }} />
          </div>
        </DetailTextSection>
      ),
    },
    {
      key: 'create',
      render: () => (
        <DetailTextSection
          title='生成方式'
          value={effectiveItem.create ?? null}
          detailedValue={effectiveItem.detailedCreate ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedCreate' : 'create'}
                initialValue={
                  isDetailedView
                    ? (effectiveItem.detailedCreate ?? effectiveItem.create ?? '')
                    : (effectiveItem.create ?? '')
                }
              />
            ) : undefined
          }
        />
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<ItemAttributesCard item={effectiveItem} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
