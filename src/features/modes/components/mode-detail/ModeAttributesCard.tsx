'use client';

import { getModeTypeColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { Mode } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

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
