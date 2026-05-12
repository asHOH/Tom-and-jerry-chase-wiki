import { getMapSizeColors, getMapTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Map } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function MapCardDisplay({ map }: { map: Map }) {
  const [isDarkMode] = useDarkMode();

  return (
    <CatalogCard
      title={map.name}
      imageSrc={map.imageUrl}
      imageAlt=''
      ariaLabel={`查看${map.name}地图详情`}
      truncateTitle
      tagsAriaLabel='地图属性'
      tagsClassName='modes-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
      tags={
        <>
          <Tag size='sm' margin='compact' colorStyles={getMapTypeColors(map.type, isDarkMode)}>
            {map.type}
          </Tag>
          {map.size && (
            <Tag size='sm' margin='compact' colorStyles={getMapSizeColors(map.size, isDarkMode)}>
              {map.size}
            </Tag>
          )}
        </>
      }
    />
  );
}
