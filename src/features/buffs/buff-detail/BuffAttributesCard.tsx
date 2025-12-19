'use client';

import { getBuffGlobalColors, getBuffTypeColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { Buff } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

import '@/lib/design-tokens';

export default function BuffAttributesCard({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  if (!buff) return null;

  const avilableAliases = (buff.aliases ?? [])
    .filter((i) => i[0] !== '#')
    .map((i) => {
      return i[0] === '%' ? i.replace(/[%\^\$\.\*\+\?\[\]\(\)\{\}\\]/g, '') : i; //移除"%"和部分常用元字符
    });

  return (
    <AttributesCardLayout
      imageUrl={buff.imageUrl}
      alt={buff.name}
      title={buff.name}
      subtitle='(状态/效果)'
      aliases={avilableAliases}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            <Tag size='sm' margin='compact' colorStyles={getBuffTypeColors(buff.type, isDarkMode)}>
              {buff.type}
            </Tag>
            {buff.global === true && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getBuffGlobalColors(buff.global || false, isDarkMode)}
              >
                全局
              </Tag>
            )}
          </div>

          {(buff.target !== undefined ||
            buff.duration !== undefined ||
            buff.failure !== undefined) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>基础信息</span>
              <div
                className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
                style={{ gridTemplateColumns: `repeat(1, minmax(80px, 1fr))` }}
              >
                {!!buff.target && (
                  <span className='text-sm'>
                    作用对象：
                    <span className='text-fuchsia-600 dark:text-fuchsia-400'>{buff.target}</span>
                  </span>
                )}
                {buff.duration !== undefined && (
                  <span className='text-sm whitespace-pre'>
                    持续时间：
                    <span className='text-indigo-700 dark:text-indigo-400'>{buff.duration}</span>
                    {typeof buff.duration === 'number' ? ' 秒' : ''}
                  </span>
                )}
                {buff.failure !== undefined && (
                  <span className='text-sm'>
                    中止条件：
                    <span className='text-orange-600 dark:text-orange-400'>{buff.failure}</span>
                  </span>
                )}
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
    />
  );
}
