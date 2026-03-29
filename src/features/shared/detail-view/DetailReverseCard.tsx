import singleItemRreverse from '@/lib/singleItemReverse';
import { getSingleItemPrototype } from '@/lib/singleItemTools';
import type { SingleItem } from '@/data/types';

import SingleItemReverseCard from '../components/SingleItemReverseCard';
import DetailRelatedCard from './DetailRelatedCard';
import { getOwnEntities } from './getOwnEntities';

type DetailReverseCardProps = {
  singleItem: SingleItem;
};

export default function DetailReverseCard({ singleItem }: DetailReverseCardProps) {
  const ownEntities = getOwnEntities(singleItem);
  const ownPrototypes = getSingleItemPrototype(singleItem);
  const numberOfOwnReverse: number[] = [singleItem, ...ownEntities, ...ownPrototypes].map(
    (item) => {
      return singleItemRreverse(item).length;
    }
  );
  const totalReverse = numberOfOwnReverse.reduce((a, b) => a + b, 0);

  if (totalReverse === 0) {
    return null;
  }

  const items = [
    {
      id: '0',
      title: `${singleItem.name}(${numberOfOwnReverse[0]})`,
      children: <SingleItemReverseCard singleItem={singleItem} />,
      count: numberOfOwnReverse[0] ?? 0,
      activeColor: 'orange' as const,
    },

    ...ownEntities.map((entity, key) => {
      const count = numberOfOwnReverse[key + 1] ?? 0;
      return {
        id: String(key + 1),
        title: `${entity.name}${entity.name === singleItem.name ? '-衍生物' : ''}(${count})`,
        children: <SingleItemReverseCard singleItem={{ name: entity.name, type: 'entity' }} />,
        count,
        activeColor: 'orange' as const,
      };
    }),

    ...ownPrototypes.map((singleItem, key) => {
      const count = numberOfOwnReverse[key + 1] ?? 0;
      return {
        id: String(key + 1),
        title: `${singleItem.name}${singleItem.name === singleItem.name ? '-原型' : ''}(${count})`,
        children: <SingleItemReverseCard singleItem={singleItem} />,
        count,
        activeColor: 'orange' as const,
      };
    }),
  ];

  return (
    <DetailRelatedCard
      title={`${singleItem.name}${ownEntities.length > 0 ? '及其衍生物' : ''}${ownPrototypes.length > 0 ? '和原型' : ''}的引用项(${totalReverse})`}
      color='yellow'
      items={items}
      singleContent={<SingleItemReverseCard singleItem={singleItem} />}
    />
  );
}
