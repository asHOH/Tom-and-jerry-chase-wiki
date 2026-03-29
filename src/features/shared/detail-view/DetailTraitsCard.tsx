import { getSingleItemPrototype } from '@/lib/singleItemTools';
import type { SingleItem } from '@/data/types';

import SingleItemTraitsText from '../components/SingleItemTraitsText';
import { filterTraitsBySingleItem } from '../traits/filterTraitsBySingleItem';
import DetailRelatedCard from './DetailRelatedCard';
import { getOwnEntities } from './getOwnEntities';

type DetailTraitsCardProps = {
  singleItem: SingleItem;
};

export default function DetailTraitsCard({ singleItem }: DetailTraitsCardProps) {
  const ownEntities = getOwnEntities(singleItem);
  const ownPrototypes = getSingleItemPrototype(singleItem);
  const numberOfOwnTraits: number[] = [singleItem, ...ownEntities, ...ownPrototypes].map((item) => {
    return filterTraitsBySingleItem(item).length;
  });
  const totalTraits = numberOfOwnTraits.reduce((a, b) => a + b, 0);

  if (totalTraits === 0) {
    return null;
  }

  const items = [
    {
      id: '0',
      title: `${singleItem.name}(${numberOfOwnTraits[0]})`,
      children: <SingleItemTraitsText singleItem={singleItem} />,
      count: numberOfOwnTraits[0] ?? 0,
      activeColor: 'orange' as const,
    },

    ...ownEntities.map((entity, key) => {
      const count = numberOfOwnTraits[key + 1] ?? 0;
      return {
        id: String(key + 1),
        title: `${entity.name}${entity.name === singleItem.name ? '-衍生物' : ''}(${count})`,
        children: <SingleItemTraitsText singleItem={{ name: entity.name, type: 'entity' }} />,
        count,
        activeColor: 'orange' as const,
      };
    }),

    ...ownPrototypes.map((singleItem, key) => {
      const count = numberOfOwnTraits[key + 1] ?? 0;
      return {
        id: String(key + 1),
        title: `${singleItem.name}${singleItem.name === singleItem.name ? '-原型' : ''}(${count})`,
        children: <SingleItemTraitsText singleItem={singleItem} />,
        count,
        activeColor: 'orange' as const,
      };
    }),
  ];

  return (
    <DetailRelatedCard
      title={`${singleItem.name}${ownEntities.length > 0 ? '及其衍生物' : ''}${ownPrototypes.length > 0 ? '和原型' : ''}的互动特性(${totalTraits})`}
      color='lime'
      items={items}
      singleContent={<SingleItemTraitsText singleItem={singleItem} />}
    />
  );
}
