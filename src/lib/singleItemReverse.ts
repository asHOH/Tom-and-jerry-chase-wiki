import { autoWrapNames } from '@/data/autoWrapNames';
import { FactionId, SingleItem, SingleItemTypeName } from '@/data/types';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

import { getReferenceKeywords } from './referenceKeywords';
import { matchesReference, referenceSources } from './referenceSources';
import { getReferenceExcerpt, type CategorizedKeywords } from './referenceText';

export type { CategorizedKeywords } from './referenceText';

// Define return type interface
interface ReverseResultItem {
  name: string;
  type: SingleItemTypeName;
  factionId?: FactionId;
  description: string;
}

const catalog = {
  characters,
  cards,
  specialSkills,
  items,
  entities,
  buffs,
  maps,
  modes,
  fixtures,
  achievements,
};

export function getCategorizedKeywords(singleItem: SingleItem): CategorizedKeywords {
  return getReferenceKeywords(catalog, itemGroups, autoWrapNames, singleItem);
}

export default function singleItemRreverse(
  singleItem: SingleItem,
  isMobile: boolean = false
): ReverseResultItem[] {
  const { allKeywords } = getCategorizedKeywords(singleItem);

  const result: ReverseResultItem[] = [];
  for (const source of referenceSources(catalog)) {
    if (matchesReference(source, allKeywords)) {
      result.push({
        ...source.item,
        description: getReferenceExcerpt(source.fields, allKeywords, isMobile),
      });
    }
  }

  // Remove the input singleItem from results if present
  const index = result.findIndex(
    (item) =>
      item.name === singleItem.name &&
      item.type === singleItem.type &&
      item.factionId === singleItem.factionId
  );
  if (index > -1) result.splice(index, 1);

  return result;
}
