'use client';

import { getMapLevelColors, getMapSizeColors, getMapTypeColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { Map, SingleItem } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';

export default function MapAttributesCard({ map }: { map: Map }) {
  const [isDarkMode] = useDarkMode();

  if (!map) return null;

  return (
    <AttributesCardLayout
      imageUrl={map.imageUrl}
      alt={map.name}
      title={map.name}
      subtitle='(地图)'
      aliases={map.aliases}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            <Tag size='sm' margin='compact' colorStyles={getMapTypeColors(map.type, isDarkMode)}>
              {map.type}
            </Tag>
            {map.size && (
              <Tag size='sm' margin='compact' colorStyles={getMapSizeColors(map.size, isDarkMode)}>
                {map.size}
              </Tag>
            )}
            {map.studyLevelUnlock && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getMapLevelColors(map.studyLevelUnlock, isDarkMode)}
              >
                {map.studyLevelUnlock}
              </Tag>
            )}
          </div>

          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>地图信息</span>
            <div
              className='auto-fill-grid grid-container mt-1 grid items-center justify-center gap-1 text-sm font-normal'
              style={{ gridTemplateColumns: `repeat(2, minmax(80px, 1fr))` }}
            >
              {map.roomCount !== undefined && (
                <span className='text-sm whitespace-pre'>
                  <Tooltip content={'地图中的房间数。只计入有名称的房间，不计彩蛋房、过渡房间'}>
                    房间数
                  </Tooltip>
                  ：<span className='text-indigo-700 dark:text-indigo-400'>{map.roomCount}</span>
                </span>
              )}
              {map.pipeCount !== undefined && (
                <span className='text-sm whitespace-pre'>
                  <Tooltip
                    content={'地图中的管道组数。只计入常规管道，不计彩蛋房管道，且双向管道只计一个'}
                  >
                    管道数
                  </Tooltip>
                  ：<span className='text-indigo-700 dark:text-indigo-400'>{map.pipeCount}</span>
                </span>
              )}
            </div>
            <div
              className='auto-fill-grid grid-container mt-1 grid items-center justify-center gap-1 text-sm font-normal'
              style={{ gridTemplateColumns: `repeat(1, minmax(80px, 1fr))` }}
            >
              {map.doorCount !== undefined && map.doorCount > 0 && (
                <span className='text-sm whitespace-pre'>
                  该地图有
                  <span className='text-indigo-700 dark:text-indigo-400'> {map.doorCount} </span>
                  扇传统木门
                </span>
              )}
              {map.hiddenRoomCount !== undefined && map.hiddenRoomCount > 0 && (
                <span className='text-sm whitespace-pre'>
                  该地图有
                  <span className='text-red-600 dark:text-red-500'> {map.hiddenRoomCount} </span>
                  个被隐藏的彩蛋区域
                </span>
              )}
              {map.randomizedRoomCount !== undefined && map.randomizedRoomCount > 0 && (
                <span className='text-sm whitespace-pre'>
                  该地图有
                  <span className='text-red-600 dark:text-red-500'>
                    {' '}
                    {map.randomizedRoomCount}{' '}
                  </span>
                  个房间的地形会随机发生变化
                </span>
              )}
              {map.changeWithStudyLevel === true && (
                <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                  该地图的部分地形会随学业等级提升而变化
                </span>
              )}
              {map.changeWithMode === true && (
                <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                  该地图的部分地形在部分模式中会发生变化
                </span>
              )}
            </div>
          </div>

          {map.supportedModes && map.supportedModes.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>支持模式</span>
              <div className='mt-1'>
                <SingleItemAccordionCard
                  items={map.supportedModes.map((str) => {
                    return { name: str, type: 'mode' } as SingleItem;
                  })}
                />
              </div>
            </div>
          )}

          {map.mapSkin && map.mapSkin.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>地图换肤</span>
              <div className='mt-1'>
                <span className='flex items-center text-sm'>
                  <span className='text-indigo-700 dark:text-indigo-400'>
                    {map.mapSkin.join('、')}
                  </span>
                </span>
              </div>
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={map.name} specifyType='map' />
        </NavigationButtonsRow>
      }
    />
  );
}
