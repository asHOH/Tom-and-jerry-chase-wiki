import { getItemSourceColors, getItemTypeColors } from '@/lib/design';
import { Item } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function ItemCardDisplay({ item }: { item: Item }) {
  const typeColors = getItemTypeColors(item.itemtype);
  const sourceColors = getItemSourceColors(item.itemsource);

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
