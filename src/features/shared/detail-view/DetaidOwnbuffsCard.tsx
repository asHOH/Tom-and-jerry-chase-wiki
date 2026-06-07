import singleItemOwnbuffs from '@/lib/singleItemOwnbuffs';
import type { SingleItem } from '@/data/types';

import SingleItemOwnbuffsCard from '../components/SingleItemOwnbuffsCard';
import DetailRelatedCard from './DetailRelatedCard';

type DetailOwnbuffsCardProps = {
  singleItem: SingleItem;
};

export default function DetailOwnbuffsCard({ singleItem }: DetailOwnbuffsCardProps) {
  const numberOfOwnOwnbuffs: number[] = [singleItem].map((item) => {
    return singleItemOwnbuffs(item).length;
  });
  const totalOwnbuffs = numberOfOwnOwnbuffs.reduce((a, b) => a + b, 0);

  if (totalOwnbuffs === 0) {
    return null;
  }

  const items = [
    {
      id: '0',
      title: `${singleItem.name}(${numberOfOwnOwnbuffs[0]})`,
      children: <SingleItemOwnbuffsCard singleItem={singleItem} />,
      count: numberOfOwnOwnbuffs[0] ?? 0,
      activeColor: 'orange' as const,
    },
  ];

  return (
    <DetailRelatedCard
      title={`${singleItem.name}的相关状态(${totalOwnbuffs})`}
      color='blue'
      items={items}
      singleContent={<SingleItemOwnbuffsCard singleItem={singleItem} />}
      lazyMountContent
    />
  );
}
