'use client';

import { useSnapshot } from 'valtio';

import { getBuffTypeColors } from '@/lib/design';
import { useLocalBuff } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Buff, SingleItem } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { buffsEdit } from '@/data';

import '@/lib/design';

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
              <ed.span path='type' initialValue={effectiveBuff.type ?? '<无内容>'} isSingleLine />
            </Tag>
          </div>
          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>基础信息</span>
            <div className='auto-fill-grid grid-container grid grid-cols-[repeat(2,minmax(80px,1fr))] grid-rows-1 items-center justify-center gap-1 text-sm font-normal'>
              {effectiveBuff.range !== undefined && (
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
              )}
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
