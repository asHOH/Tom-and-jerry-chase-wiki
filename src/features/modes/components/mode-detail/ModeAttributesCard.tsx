'use client';

import { useSnapshot } from 'valtio';

import { getModeTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalMode } from '@/context/EditModeContext';
import { Mode, SingleItem } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { mapsEdit, modesEdit } from '@/data';

export default function ModeAttributesCard({ mode }: { mode: Mode }) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode } = useEditMode();
  const { modeName } = useLocalMode();
  const ed = editable('modes');

  const rawMode = modesEdit[modeName];
  const mapsSnapshot = useSnapshot(mapsEdit);
  const mapsSource = mapsSnapshot;

  function putTypeTagOn(mode: Mode) {
    return (
      <Tag size='xs' margin='compact' colorStyles={getModeTypeColors(mode.type, isDarkMode)}>
        <ed.span path='type' initialValue={mode.type ?? '<无内容>'} isSingleLine />
      </Tag>
    );
  }
  const supportedMaps = Object.values(mapsSource)
    .filter((map) => map.supportedModes?.includes(mode.name))
    .map((map) => map.name);

  return (
    <AttributesCardLayout
      imageUrl={mode.imageUrl}
      alt={mode.name}
      title={mode.name}
      subtitle='(游戏模式)'
      aliases={isEditMode ? undefined : mode.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(rawMode?.aliases ?? mode.aliases ?? []).length > 0 ? (
              (rawMode?.aliases ?? mode.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawMode) return;
                      if (!rawMode.aliases) rawMode.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawMode.aliases = rawMode.aliases.filter((_, i) => i !== index);
                      } else {
                        rawMode.aliases[index] = trimmed;
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
                if (!rawMode) return;
                if (!rawMode.aliases) rawMode.aliases = [];
                if (!rawMode.aliases.includes('新别名')) {
                  rawMode.aliases.push('新别名');
                }
              }}
              className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
            >
              <PlusIcon className='h-3 w-3' aria-hidden='true' />
            </button>
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {putTypeTagOn(mode)}
          </div>
          {(isEditMode || mode.openingTime !== undefined) && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>
                开放时间：
                <span className='text-indigo-700 dark:text-indigo-400'>
                  <ed.span path='openingTime' initialValue={mode.openingTime ?? '<无内容>'} />
                </span>
              </span>
            </div>
          )}
          {(isEditMode || mode.format !== undefined) && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>
                赛制：
                <span className='text-indigo-700 dark:text-indigo-400'>
                  <ed.span path='format' initialValue={mode.format ?? '<无内容>'} />
                </span>
              </span>
            </div>
          )}
          {supportedMaps.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>支持地图</span>
              <div className='mt-1'>
                <SingleItemAccordionCard
                  items={supportedMaps.map((str) => {
                    return { name: str, type: 'map' } as SingleItem;
                  })}
                />
              </div>
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={mode.name} specifyType='mode' />
        </NavigationButtonsRow>
      }
      wikiHistory={<SingleItemWikiHistoryDisplay singleItem={{ name: mode.name, type: 'mode' }} />}
    />
  );
}
