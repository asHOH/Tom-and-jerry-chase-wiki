import {
  designTokens,
  getMapLevelColors,
  getMapSizeColors,
  getMapTypeColors,
} from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Map } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function MapCardDisplay({ map }: { map: Map }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

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

  return (
    <BaseCard variant='item' aria-label={`查看${map.name}地图详情`}>
      <GameImage
        src={map.imageUrl}
        alt={`${map.name}地图预览`}
        size='ITEM_CARD'
        className={`hover:scale-105 ${isMobile ? 'h-48 w-auto' : 'h-64 w-auto'}`}
      />
      <div className={`${isMobile ? '' : 'px-3'} w-full pt-2 pb-4 text-center`}>
        <h3
          className={`${isMobile && map.name.length >= 6 ? 'text-lg' : 'text-xl'} mb-2 font-bold text-gray-800 dark:text-white`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {map.name}
        </h3>
        <div
          className='flex flex-wrap justify-center gap-2 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='地图属性'
        >
          {/* 地图类型标签 */}
          <Tag size='sm' margin='compact' colorStyles={getMapTypeColors(map.type, isDarkMode)}>
            {map.type}
          </Tag>

          {/* 地图大小标签（如果有） */}
          {map.size && (
            <Tag size='sm' margin='compact' colorStyles={getMapSizeColors(map.size, isDarkMode)}>
              {getSizeTagText()}
            </Tag>
          )}

          {/* 解锁等级标签（如果有） */}
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
      </div>
    </BaseCard>
  );
}
