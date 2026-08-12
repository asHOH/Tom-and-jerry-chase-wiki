'use client';

import {
  SingleItemTypeChineseNameList,
  type SingleItem,
  type SingleItemTypeName,
} from '@/data/types';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

const SINGLE_ITEM_TYPES = Object.keys(SingleItemTypeChineseNameList) as SingleItemTypeName[];

type SingleItemListEditorProps = {
  items: readonly Readonly<SingleItem>[];
  onChange: (items: SingleItem[]) => void;
  itemLabel: string;
};

export default function SingleItemListEditor({
  items,
  onChange,
  itemLabel,
}: SingleItemListEditorProps) {
  const updateItem = (index: number, update: Partial<SingleItem>) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? ({ ...item, ...update } as SingleItem) : ({ ...item } as SingleItem)
      )
    );
  };

  return (
    <div className='mt-1 space-y-2'>
      {items.map((item, index) => (
        <div
          key={`${itemLabel}-${index}`}
          className='border-border bg-surface-muted grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-md border p-2'
        >
          <div className='grid min-w-0 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_7rem]'>
            <FormSelect
              size='sm'
              value={item.type}
              aria-label={`${itemLabel}${index + 1}类型`}
              onChange={(event) =>
                updateItem(index, { type: event.target.value as SingleItemTypeName })
              }
            >
              {SINGLE_ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SingleItemTypeChineseNameList[type]}
                </option>
              ))}
            </FormSelect>
            <FormInput
              size='sm'
              value={item.name}
              aria-label={`${itemLabel}${index + 1}名称`}
              placeholder='名称'
              onChange={(event) => updateItem(index, { name: event.target.value })}
            />
            <FormSelect
              size='sm'
              value={item.factionId ?? ''}
              aria-label={`${itemLabel}${index + 1}阵营`}
              onChange={(event) => {
                const factionId = event.target.value;
                const nextItem = { ...item } as SingleItem;
                if (factionId === 'cat' || factionId === 'mouse') {
                  nextItem.factionId = factionId;
                } else {
                  delete nextItem.factionId;
                }
                onChange(
                  items.map((candidate, itemIndex) =>
                    itemIndex === index ? nextItem : ({ ...candidate } as SingleItem)
                  )
                );
              }}
            >
              <option value=''>无阵营</option>
              <option value='cat'>猫</option>
              <option value='mouse'>鼠</option>
            </FormSelect>
          </div>
          <IconButton
            type='button'
            aria-label={`删除${itemLabel}${index + 1}`}
            variant='delete'
            size='sm'
            onClick={() =>
              onChange(
                items.flatMap((candidate, itemIndex) =>
                  itemIndex === index ? [] : [{ ...candidate } as SingleItem]
                )
              )
            }
          >
            <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
          </IconButton>
        </div>
      ))}
      <IconButton
        type='button'
        aria-label={`添加${itemLabel}`}
        variant='add'
        size='sm'
        onClick={() =>
          onChange([
            ...items.map((item) => ({ ...item }) as SingleItem),
            { name: '新条目', type: 'character' },
          ])
        }
      >
        <PlusIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
      </IconButton>
    </div>
  );
}
