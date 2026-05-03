import { getSingleItemImageUrl } from '@/lib/singleItemTools';
import { SingleItem } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';

export default function SingleItemCardDisplay({ singleItem }: { singleItem: SingleItem }) {
  return (
    <CatalogCard
      title={singleItem.name}
      imageSrc={getSingleItemImageUrl(singleItem)}
      imageAlt={`${singleItem.name}道具图标`}
      ariaLabel={`查看${singleItem.name}详情`}
      contentClassName='w-full px-3 pt-1 pb-3 text-center'
    />
  );
}
