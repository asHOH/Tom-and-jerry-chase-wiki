import { SingleItem } from '@/data/types';
import CollapseCard from '@/components/ui/CollapseCard';

import SingleItemTraitsText from '../components/SingleItemTraitsText';
import { filterTraitsBySingleItem } from '../traits/filterTraitsBySingleItem';

interface DetailTraitsCardProps {
  singleItem: SingleItem;
}

export default function DetailTraitsCard({ singleItem }: DetailTraitsCardProps) {
  return (
    <CollapseCard
      title={`  ${singleItem.name}的相关互动特性(${filterTraitsBySingleItem(singleItem).length})`}
      size='xs'
      color='lime'
      className='rounded-md border-x-1 border-b-1 border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
    >
      <SingleItemTraitsText singleItem={singleItem} />
    </CollapseCard>
  );
}
