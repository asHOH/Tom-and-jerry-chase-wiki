import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import { items as staticItems } from '@/data/static';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { editable } from '@/components/ui/editable';
import { FormSelect } from '@/components/ui/FormControls';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import { Img } from '@/components/Image';
import Link from '@/components/Link';

import { usePublishedCharacter } from '../PublishedCharacterContext';

const DEFAULT_STORE_PLAN = ['盘子', '玻璃杯', '高尔夫球', '鞭炮'] as const;
const e = editable('characters');

export default function RecommendedStorePlansSection() {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const editRuntime = useDraftDataRuntime();
  const rawCharacter = editRuntime?.stores.characters[characterId];
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(rawCharacter, publishedCharacter);
  const items = useOptionalEditSnapshot(editRuntime?.stores.items, staticItems);
  const storePlans = character.recommendedStorePlans ?? [];
  const storeItems = Object.values(items).filter(
    (item) => item.store === true && item.price !== undefined
  );

  if (storePlans.length === 0 && !isEditMode) return null;

  return (
    <div className='border-border mt-6 border-t pt-6'>
      <h3 className='mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200'>推荐商店方案</h3>
      <ul className='space-y-3'>
        {storePlans.map((plan, planIndex) => (
          <li
            key={planIndex}
            className='rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800/50'
          >
            {isEditMode && (
              <div className='mb-3 flex justify-end'>
                <IconButton
                  type='button'
                  aria-label={`移除商店方案 ${planIndex + 1}`}
                  onClick={() => rawCharacter!.recommendedStorePlans!.splice(planIndex, 1)}
                  variant='delete'
                  size='sm'
                >
                  <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
                </IconButton>
              </div>
            )}
            <div className='flex flex-wrap gap-x-3 gap-y-5'>
              {plan.items.map((itemName, itemIndex) => {
                const item = items[itemName];
                const itemLabel = item?.name ?? itemName;
                return (
                  <div key={`${itemName}-${itemIndex}`} className='w-12 sm:w-14'>
                    <Link
                      href={`/items/${encodeURIComponent(itemName)}`}
                      aria-label={`查看${itemLabel}道具详情`}
                      title={itemLabel}
                      onClick={(event) => {
                        if (isEditMode) event.preventDefault();
                      }}
                      className='bg-surface group relative flex aspect-square items-center justify-center rounded-lg border border-gray-200 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-gray-600 dark:hover:border-gray-400 dark:focus-visible:ring-blue-500'
                    >
                      <span className='flex size-full items-center justify-center overflow-hidden'>
                        <Img
                          src={item?.imageUrl ?? '/images/misc/%E7%A6%81%E6%AD%A2.png'}
                          alt={itemLabel}
                          className='h-auto w-auto scale-[0.55] object-contain transition-transform group-hover:scale-[0.6]'
                        />
                      </span>
                      <span className='bg-surface-raised text-muted-foreground absolute bottom-0 left-1/2 min-w-7 -translate-x-1/2 translate-y-1/2 rounded-full px-1.5 py-px text-center text-[10px] leading-4 font-medium shadow-sm'>
                        {item?.price ?? '—'}
                      </span>
                    </Link>
                    {isEditMode && (
                      <FormSelect
                        aria-label={`方案 ${planIndex + 1} 的第 ${itemIndex + 1} 件道具`}
                        value={itemName}
                        onChange={(event) => {
                          rawCharacter!.recommendedStorePlans![planIndex]!.items[itemIndex] =
                            event.target.value;
                        }}
                        size='sm'
                        className='mt-2 rounded px-1 py-1 text-xs'
                      >
                        {storeItems.map((option) => (
                          <option key={option.name} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </FormSelect>
                    )}
                  </div>
                );
              })}
            </div>
            {isEditMode ? (
              <e.p
                initialValue={plan.description}
                path={`recommendedStorePlans.${planIndex}.description`}
                className='mt-4 text-sm whitespace-pre-wrap text-gray-500 dark:text-gray-400'
              />
            ) : (
              <p className='mt-4 text-sm whitespace-pre-wrap text-gray-500 dark:text-gray-400'>
                <TextWithHoverTooltips text={plan.description} />
              </p>
            )}
          </li>
        ))}
      </ul>
      {isEditMode && (
        <div className='mt-4'>
          <IconButton
            type='button'
            aria-label='添加商店方案'
            onClick={() => {
              if (!rawCharacter!.recommendedStorePlans) {
                rawCharacter!.recommendedStorePlans = [];
              }
              rawCharacter!.recommendedStorePlans.push({
                items: [...DEFAULT_STORE_PLAN],
                description: '',
              });
            }}
            variant='add'
            size='md'
          >
            <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
          </IconButton>
        </div>
      )}
    </div>
  );
}
