import { cn, getMapSizeColors, getMapTypeColors } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Map } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function MapCardDisplay({ map }: { map: Map }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${map.name}地图详情`}>
      <GameImage
        src={map.imageUrl}
        alt={`${map.name}地图预览`}
        size='ITEM_CARD'
        className='h-32 w-auto hover:scale-105 md:h-auto'
      />
      <div className='w-full pt-1 pb-3 text-center md:px-3'>
        <h3
          className={cn(
            'h-6 truncate overflow-hidden font-bold whitespace-nowrap text-gray-800 dark:text-white',
            isMobile && map.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'
          )}
          title={map.name}
        >
          {map.name}
        </h3>
        <div
          className='modes-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
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
              {map.size}
            </Tag>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
