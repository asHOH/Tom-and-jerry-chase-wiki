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
  const numberOfOwnTraits: number[] = [singleItem, ...ownEntities].map((item, key) => {
    return filterTraitsBySingleItem({
      name: item.name,
      type: key === 0 ? singleItem.type : 'entity',
    }).length;
  });

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
  ];

  return (
    <DetailRelatedCard
      title={`${singleItem.name}${ownEntities.length > 0 ? '及其衍生物' : ''}的相关互动特性(${numberOfOwnTraits.reduce((a, b) => a + b)})`}
      color='lime'
      items={items}
      singleContent={<SingleItemTraitsText singleItem={singleItem} />}
    />
  );
}
