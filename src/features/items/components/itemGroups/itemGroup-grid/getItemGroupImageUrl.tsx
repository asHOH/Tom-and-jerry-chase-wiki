import { ItemGroupDefinition } from '@/data/types';

import { getSingleItemImageUrl } from '@/lib/singleItemTools';

export const getItemGroupImageUrl = (group: ItemGroupDefinition): string => {
  if (!!group.specialImageUrl) return group.specialImageUrl;

  const firstItem = group.group[0] ? group.group[0] : { name: '', type: 'character' as const };
  return getSingleItemImageUrl(firstItem) || '/images/icons/cat faction.png';
};
