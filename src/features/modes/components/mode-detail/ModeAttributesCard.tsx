'use client';

import { getModeTypeColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { Mode, SingleItem } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { maps } from '@/data';

export default function ModeAttributesCard({ mode }: { mode: Mode }) {
  const [isDarkMode] = useDarkMode();

  if (!mode) return null;

  function putTypeTagOn(mode: Mode) {
    return (
      <Tag size='xs' margin='compact' colorStyles={getModeTypeColors(mode.type, isDarkMode)}>
        {mode.type}
      </Tag>
    );
  }
  const supportedMaps = Object.values(maps)
    .filter((map) => map.supportedModes?.includes(mode.name))
    .map((map) => map.name);

  return (
    <AttributesCardLayout
      imageUrl={mode.imageUrl}
      alt={mode.name}
      title={mode.name}
      subtitle='(游戏模式)'
      aliases={mode.aliases}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {putTypeTagOn(mode)}
          </div>
          {mode.openingTime !== undefined && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>
                开放时间：
                <span className='text-indigo-700 dark:text-indigo-400'>{mode.openingTime}</span>
              </span>
            </div>
          )}
          {mode.format !== undefined && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>
                赛制：
                <span className='text-indigo-700 dark:text-indigo-400'>{mode.format}</span>
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
    />
  );
}
