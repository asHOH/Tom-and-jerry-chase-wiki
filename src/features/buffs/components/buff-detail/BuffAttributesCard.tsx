'use client';

import { getBuffTypeColors } from '@/lib/design';
import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalBuff } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { buffs } from '@/data/static';
import { Buff, buffTypelist, SingleItem } from '@/data/types';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

import '@/lib/design';

import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';

const BUFF_TYPES: readonly buffTypelist[] = ['状态', '瞬时效果', '持续效果', '属性'];

const parseRangeValue = (value: string): number | 'infinity' | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized === 'infinity' || normalized === '∞') return 'infinity';
  const number = Number(normalized);
  return Number.isNaN(number) ? undefined : number;
};

export default function BuffAttributesCard({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { buffName } = useLocalBuff();
  const ed = editable('buffs');

  const editRuntime = useDraftDataRuntime();
  const rawBuff = editRuntime?.stores.buffs[buffName];
  const buffSnapshot = useOptionalEditSnapshot(rawBuff, buff);
  const buffsSnapshot = useOptionalEditSnapshot(editRuntime?.stores.buffs, buffs);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveBuff = usesDraftData && rawBuff ? (buffSnapshot as Buff) : buff;

  const availableAliases = (effectiveBuff.aliases ?? buff.aliases ?? [])
    .filter((i) => i && i[0] !== '#')
    .map((i) => {
      return i[0] === '%' ? i.replace(/[%^$.*+?()[\]{}\\]/g, '') : i; //移除"%"和部分常用元字符
    });

  const aliasesEditor = isEditMode ? (
    <div className='flex items-center gap-1'>
      <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
      {(effectiveBuff.aliases ?? buff.aliases ?? []).length > 0 ? (
        (effectiveBuff.aliases ?? buff.aliases ?? []).map((alias, index, arr) => (
          <span key={`${alias}-${index}`} className='inline-flex items-center'>
            <ed.span
              initialValue={alias || '<无内容>'}
              path={`aliases.${index}`}
              isSingleLine
              onSave={(newValue) => {
                if (!rawBuff) return;
                if (!rawBuff.aliases) rawBuff.aliases = [];
                const trimmed = newValue.trim();
                if (trimmed === '') {
                  rawBuff.aliases = rawBuff.aliases.filter((_, i) => i !== index);
                } else {
                  rawBuff.aliases[index] = trimmed;
                }
              }}
            />
            {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
          </span>
        ))
      ) : (
        <span>{'<无内容>'}</span>
      )}
      <AddAliasButton
        onAdd={() => {
          if (!rawBuff) return;
          if (!rawBuff.aliases) rawBuff.aliases = [];
          if (!rawBuff.aliases.includes('新别名')) {
            rawBuff.aliases.push('新别名');
          }
        }}
      />
    </div>
  ) : undefined;

  const classFilter = effectiveBuff.class
    ? Object.values(buffsSnapshot)
        .filter((b) => b.class === effectiveBuff.class && b.name !== effectiveBuff.name)
        .map((entry) => entry.name)
    : [];

  return (
    <AttributesCardLayout
      imageUrl={buff.imageUrl}
      alt={buff.name}
      title={buff.name}
      subtitle={'(' + buff.type + ')'}
      aliases={isEditMode ? undefined : availableAliases}
      aliasesContent={aliasesEditor}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getBuffTypeColors(effectiveBuff.type, isDarkMode)}
            >
              {isEditMode ? (
                <select
                  aria-label='状态类型'
                  value={effectiveBuff.type}
                  onChange={(event) => {
                    if (rawBuff) rawBuff.type = event.target.value as buffTypelist;
                  }}
                  className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
                >
                  {BUFF_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                effectiveBuff.type
              )}
            </Tag>
          </div>
          {(isEditMode || effectiveBuff.class !== undefined) && (
            <div className='text-sm'>
              同类名称:{' '}
              <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                <ed.span
                  path='class'
                  initialValue={effectiveBuff.class ?? '<无内容>'}
                  isSingleLine
                  deleteOnEmpty
                />
              </span>
            </div>
          )}
          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>基础信息</span>
            <div className='auto-fill-grid grid-container grid grid-cols-[repeat(2,minmax(80px,1fr))] grid-rows-1 items-center justify-center gap-1 text-sm font-normal'>
              {isEditMode ? (
                <div className='col-span-2 space-y-2'>
                  <label className='flex cursor-pointer items-center gap-1 text-xs'>
                    <input
                      type='checkbox'
                      checked={effectiveBuff.range !== undefined}
                      onChange={(event) => {
                        if (!rawBuff) return;
                        if (event.target.checked) rawBuff.range = [0, 'infinity'];
                        else delete rawBuff.range;
                      }}
                      className='h-3 w-3'
                    />
                    <span className='font-bold'>启用取值范围</span>
                  </label>
                  {effectiveBuff.range ? (
                    <div className='grid grid-cols-2 gap-2'>
                      {[0, 1].map((rangeIndex) => (
                        <label className='text-xs' key={rangeIndex}>
                          {rangeIndex === 0 ? '下限' : '上限'}
                          <span className='mt-1 block rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600'>
                            <ed.span
                              path={`range.${rangeIndex}`}
                              initialValue={effectiveBuff.range?.[rangeIndex] ?? 'infinity'}
                              isSingleLine
                              onSave={(value) => {
                                if (!rawBuff?.range) return;
                                const nextValue = parseRangeValue(value);
                                if (nextValue === undefined) {
                                  throw new Error('状态取值范围必须是数值或 infinity。');
                                }
                                rawBuff.range[rangeIndex] = nextValue;
                              }}
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : effectiveBuff.range !== undefined ? (
                <span className='text-sm whitespace-pre'>
                  取值范围：
                  <span className='text-blue-600 dark:text-blue-500'>
                    {effectiveBuff.range[0] === 'infinity' ? '(∞' : '[' + effectiveBuff.range[0]}
                  </span>
                  ,
                  <span className='text-blue-600 dark:text-blue-500'>
                    {effectiveBuff.range[1] === 'infinity' ? '∞)' : effectiveBuff.range[1] + ']'}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          {classFilter.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>
                <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                  {effectiveBuff.class}
                </span>
                的同类内容
              </span>
              <div className='mt-1'>
                <SingleItemAccordionCard
                  items={classFilter.map((str) => {
                    return { name: str, type: 'buff' } as SingleItem;
                  })}
                />
              </div>
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={buff.name} specifyType='buff' />
        </NavigationButtonsRow>
      }
      wikiHistory={<SingleItemWikiHistoryDisplay singleItem={{ name: buff.name, type: 'buff' }} />}
    />
  );
}
