import { getItemSourceColors, getItemTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function ItemCardDisplay({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const typeColors = getItemTypeColors(item.itemtype, isDarkMode);
  const sourceColors = getItemSourceColors(item.itemsource, isDarkMode);

  return (
    <CatalogCard
      title={item.name}
      imageSrc={item.imageUrl}
      imageAlt=''
      href={`/items/${encodeURIComponent(item.name)}`}
      ariaLabel={`查看${item.name}道具详情`}
      contentClassName='w-full px-3 pt-1 pb-3 text-center'
      tagsAriaLabel='道具属性'
      tags={
        <>
          <Tag size='xs' margin='compact' colorStyles={typeColors}>
            {item.itemtype.slice(0, 2)}
          </Tag>
          <Tag size='xs' margin='compact' colorStyles={sourceColors}>
            {item.itemsource.slice(0, 2)}
          </Tag>
        </>
      }
    />
  );
}
