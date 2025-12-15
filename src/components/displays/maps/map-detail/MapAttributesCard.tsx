'use client';

import { getMapLevelColors, getMapSizeColors, getMapTypeColors } from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Map } from '@/data/types';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import AttributesCardLayout from '@/components/displays/shared/AttributesCardLayout';

export default function MapAttributesCard({ map }: { map: Map }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();

  if (!map) return null;

  // 根据地图大小获取标签文本
  const getSizeTagText = () => {
    if (!map.size) return '';

    switch (map.size) {
      case '大':
        return '大型';
      case '中':
        return '中型';
      case '小':
        return '小型';
      default:
        return map.size;
    }
  };

  function putTypeTagOn(map: Map) {
    return (
      <>
        <Tag size='sm' margin='compact' colorStyles={getMapTypeColors(map.type, isDarkMode)}>
          {map.type}
        </Tag>

        {map.size && (
          <Tag size='sm' margin='compact' colorStyles={getMapSizeColors(map.size, isDarkMode)}>
            {getSizeTagText()}
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
      </>
    );
  }

  // 将string[]转换为长串显示
  const renderStringArray = (array: string[] | undefined, label: string) => {
    if (!array || array.length === 0) return null;
    return (
      <span className='flex items-center text-sm'>
        {label}
        <span className='ml-1 text-indigo-700 dark:text-indigo-400'>{array.join('、')}</span>
      </span>
    );
  };

  // 渲染数字属性
  const renderNumberAttribute = (value: number | undefined, label: string, tooltipKey?: string) => {
    if (value === undefined) return null;
    return (
      <span className='text-sm whitespace-pre'>
        {tooltipKey ? (
          <Tooltip
            content={getTooltipContent(
              label,
              'cat', // 使用默认阵营
              isDetailed
            )}
          >
            {label}
          </Tooltip>
        ) : (
          label
        )}
        ：<span className='text-indigo-700 dark:text-indigo-400'>{value}</span>
      </span>
    );
  };

  // 渲染布尔属性
  const renderBooleanAttribute = (
    value: boolean | undefined,
    label: string,
    trueText: string,
    falseText: string
  ) => {
    if (value === undefined) return null;
    return (
      <span className='text-sm whitespace-pre'>
        {label}：
        {value === true ? (
          <span className='text-green-600 dark:text-green-500'>{trueText}</span>
        ) : (
          <span className='text-red-600 dark:text-red-500'>{falseText}</span>
        )}
      </span>
    );
  };

  // 渲染地图大小标签
  const renderSizeTag = () => {
    if (!map.size) return null;
    const sizeColors = {
      大: isDarkMode ? 'text-red-400' : 'text-red-600',
      中: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      小: isDarkMode ? 'text-green-400' : 'text-green-600',
    };
    return (
      <span className='text-sm whitespace-pre'>
        大小：
        <span className={sizeColors[map.size]}>{map.size}</span>
      </span>
    );
  };

  // 渲染解锁等级
  const renderStudyLevel = () => {
    if (!map.studyLevelUnlock) return null;
    const levelColors = {
      见习学业: isDarkMode ? 'text-gray-400' : 'text-gray-600',
      高级学业: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      特级学业: isDarkMode ? 'text-purple-400' : 'text-purple-600',
      大师学业: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    };
    return (
      <span className='text-sm whitespace-pre'>
        解锁等级：
        <span className={levelColors[map.studyLevelUnlock]}>{map.studyLevelUnlock}</span>
      </span>
    );
  };

  return (
    <AttributesCardLayout
      imageUrl={map.imageUrl}
      alt={map.name}
      title={map.name}
      subtitle='(地图)'
      aliases={map.aliases}
      attributes={
        <>
          {/* 类型标签 */}
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            {putTypeTagOn(map)}
          </div>

          {/* 地图基本信息 */}
          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>地图信息</span>
            <div
              className='auto-fill-grid grid-container mt-1 grid items-center justify-center gap-1 text-sm font-normal'
              style={{ gridTemplateColumns: `repeat(2, minmax(80px, 1fr))` }}
            >
              {renderSizeTag()}
              {renderStudyLevel()}
              {renderNumberAttribute(map.roomCount, '房间数')}
              {renderNumberAttribute(map.pipeCount, '管道数')}
              {renderNumberAttribute(map.doorCount, '门数')}
              {renderBooleanAttribute(map.hiddenRoom, '彩蛋房', '有', '无')}
              {renderBooleanAttribute(map.randomizedRoom, '随机房间', '存在', '不存在')}
            </div>
          </div>

          {/* 支持的模式 */}
          {map.supportedModes && map.supportedModes.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>支持模式</span>
              <div className='mt-1'>{renderStringArray(map.supportedModes, '')}</div>
            </div>
          )}

          {/* 地图换肤 */}
          {map.mapSkin && map.mapSkin.length > 0 && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>地图换肤</span>
              <div className='mt-1'>{renderStringArray(map.mapSkin, '')}</div>
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
