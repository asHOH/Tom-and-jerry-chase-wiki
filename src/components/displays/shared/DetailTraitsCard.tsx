import React from 'react';
import { SingleItem } from '@/data/types';
import CollapseCard from '@/components/ui/CollapseCard';
import { filterTraitsBySingleItem } from '../traits/shared/SingleItemTraitsText';
import SingleItemTraitsText from '../traits/shared/SingleItemTraitsText';

interface DetailTraitsCardProps {
  singleItem: SingleItem;
}

export default function DetailTraitsCard({ singleItem }: DetailTraitsCardProps) {
  return (
    <CollapseCard
      title={`  ${singleItem.name}的相关互动特性(${filterTraitsBySingleItem(singleItem).length})`}
      size='xs'
      color='lime'
      className='pb-1 px-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
    >
      <SingleItemTraitsText singleItem={singleItem} />
    </CollapseCard>
  );
}
