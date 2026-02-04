'use client';

import { useSnapshot } from 'valtio';

import { getBuffGlobalColors, getBuffTypeColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalBuff } from '@/context/EditModeContext';
import { Buff, SingleItem } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { buffsEdit } from '@/data';

import '@/lib/design-tokens';

import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';

export default function BuffAttributesCard({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode } = useEditMode();
  const { buffName } = useLocalBuff();
  const ed = editable('buffs');

  const buffsSnapshot = useSnapshot(buffsEdit);
  if (!buff) return null;

  const rawBuff = buffsEdit[buffName];
  const effectiveBuff = buffsSnapshot[buffName] ?? buff;

  const avilableAliases = (buff.aliases ?? [])
    .filter((i) => i && i[0] !== '#')
    .map((i) => {
      return i[0] === '%' ? i.replace(/[%\^\$\.\*\+\?\[\]\(\)\{\}\\]/g, '') : i; //移除"%"和部分常用元字符
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
      <button
        type='button'
        aria-label='添加别名'
        onClick={() => {
          if (!rawBuff) return;
          if (!rawBuff.aliases) rawBuff.aliases = [];
          if (!rawBuff.aliases.includes('新别名')) {
            rawBuff.aliases.push('新别名');
          }
        }}
        className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
      >
        <PlusIcon className='h-3 w-3' aria-hidden='true' />
      </button>
    </div>
  ) : undefined;

  const classFilter = !!buff.class
    ? Object.values(buffsSnapshot)
        .filter((b) => b.class === buff.class)
        .map((buff) => buff.name)
    : [];

  return (
    <AttributesCardLayout
      imageUrl={buff.imageUrl}
      alt={buff.name}
      title={buff.name}
      subtitle={buff.type.includes('状态') ? '(状态)' : '(效果)'}
      aliases={isEditMode ? undefined : avilableAliases}
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
              <ed.span path='type' initialValue={effectiveBuff.type ?? '<无内容>'} isSingleLine />
            </Tag>
            {isEditMode ? (
              <div className='flex items-center gap-1 text-xs'>
                <span className='text-xs text-gray-400 dark:text-gray-500'>全局:</span>
                <label className='flex cursor-pointer items-center gap-1'>
                  <input
                    type='checkbox'
                    checked={effectiveBuff.global ?? false}
                    onChange={(e) => {
                      if (!rawBuff) return;
                      rawBuff.global = e.target.checked;
                    }}
                    className='h-3 w-3'
                  />
                  <span className='font-bold'>
                    {(effectiveBuff.global ?? false) ? '全局' : '非全局'}
                  </span>
                </label>
              </div>
            ) : effectiveBuff.global === true ? (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getBuffGlobalColors(effectiveBuff.global || false, isDarkMode)}
              >
                全局
              </Tag>
            ) : null}
          </div>

          {(isEditMode ||
            effectiveBuff.target !== undefined ||
            effectiveBuff.duration !== undefined ||
            effectiveBuff.failure !== undefined) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>基础信息</span>
              <div
                className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
                style={{ gridTemplateColumns: `repeat(1, minmax(80px, 1fr))` }}
              >
                {(isEditMode || !!effectiveBuff.target) && (
                  <span className='text-sm'>
                    作用对象：
                    <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                      <ed.span
                        path='target'
                        initialValue={effectiveBuff.target ?? '<无内容>'}
                        isSingleLine
                      />
                    </span>
                  </span>
                )}
                {(isEditMode || effectiveBuff.duration !== undefined) && (
                  <span className='text-sm whitespace-pre'>
                    持续时间：
                    <span className='text-indigo-700 dark:text-indigo-400'>
                      <ed.span
                        path='duration'
                        initialValue={effectiveBuff.duration ?? '<无内容>'}
                        valueType={typeof effectiveBuff.duration === 'number' ? 'number' : 'string'}
                        isSingleLine
                      />
                    </span>
                    {typeof effectiveBuff.duration === 'number' ? ' 秒' : ''}
                  </span>
                )}
                {(isEditMode || effectiveBuff.failure !== undefined) && (
                  <span className='text-sm'>
                    中止条件：
                    <span className='text-orange-600 dark:text-orange-400'>
                      <ed.span
                        path='failure'
                        initialValue={effectiveBuff.failure ?? '<无内容>'}
                        isSingleLine
                      />
                    </span>
                  </span>
                )}
                {(isEditMode || !!effectiveBuff.class) && (
                  <span className='text-sm'>
                    所属分类：
                    <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                      <ed.span
                        path='class'
                        initialValue={effectiveBuff.class ?? '<无内容>'}
                        isSingleLine
                      />
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
          {classFilter.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>[{buff.class}]类状态/效果</span>
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
