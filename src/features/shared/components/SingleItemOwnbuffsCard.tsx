import singleItemOwnbuffs from '@/lib/singleItemOwnbuffs';
import { SingleItem } from '@/data/types';

import TextWithHoverTooltips from './TextWithHoverTooltips';

interface SingleItemOwnbuffsTextProps {
  singleItem: SingleItem;
}

export default function SingleItemOwnbuffsCard({ singleItem }: SingleItemOwnbuffsTextProps) {
  const allStrings = singleItemOwnbuffs(singleItem);

  if (allStrings.length === 0) {
    return (
      <TextWithHoverTooltips text='    $暂未收录相关状态$italic text-gray-500 dark:text-gray-400 text-sm#' />
    );
  }

  return <TextWithHoverTooltips text={allStrings.join('\n')} />;
}
