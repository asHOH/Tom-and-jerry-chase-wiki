import { ItemGroup } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';

import { getItemGroupImageUrl } from './getItemGroupImageUrl';

export default function ItemGroupCardDisplay({ itemGroup }: { itemGroup: ItemGroup }) {
  return (
    <CatalogCard
      title={itemGroup.name}
      imageSrc={getItemGroupImageUrl(itemGroup)}
      imageAlt={`${itemGroup.name}效果图标`}
      ariaLabel={`查看${itemGroup.name}效果详情`}
      contentClassName='w-full px-3 pt-1 pb-3 text-center'
    />
  );
}
