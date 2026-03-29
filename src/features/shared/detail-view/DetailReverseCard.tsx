import singleItemRreverse from '@/lib/singleItemReverse';
import type { SingleItem } from '@/data/types';

import SingleItemReverseCard from '../components/SingleItemReverseCard';
import TextWithHoverTooltips from '../components/TextWithHoverTooltips';
import DetailRelatedCard from './DetailRelatedCard';
import { getOwnEntities } from './getOwnEntities';

type DetailReverseCardProps = {
  singleItem: SingleItem;
};

export default function DetailReverseCard({ singleItem }: DetailReverseCardProps) {
  const ownEntities = getOwnEntities(singleItem);
  const numberOfOwnReverse: number[] = [singleItem, ...ownEntities].map((item, key) => {
    return singleItemRreverse({
      name: item.name,
      type: key === 0 ? singleItem.type : 'entity',
      ...(item.factionId !== undefined ? { factionId: item.factionId } : {}),
    }).length;
  });

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
  ];

  return (
    <DetailRelatedCard
      title={`${singleItem.name}${ownEntities.length > 0 ? '及其衍生物' : ''}的引用项(${numberOfOwnReverse.reduce((a, b) => a + b)})`}
      color='yellow'
      items={items}
      singleContent={
        numberOfOwnReverse[0] === 0 ? (
          <TextWithHoverTooltips text='$暂无任何引用本项的界面$italic text-gray-500 dark:text-gray-400 text-sm#' />
        ) : (
          <SingleItemReverseCard singleItem={singleItem} />
        )
      }
    />
  );
}
