import type { SingleItem } from '@/data/types';
import { entities } from '@/data';

export const getOwnEntities = (singleItem: SingleItem): SingleItem[] => {
  return Object.values(entities)
    .filter((entity) => {
      const owner = entity.owner;

      if (!owner) return false;

      if (Array.isArray(owner)) {
        return owner.some(
          (item) => item?.type === singleItem.type && item?.name === singleItem.name
        );
      }

      return owner.type === singleItem.type && owner.name === singleItem.name;
    })
    .map((entity) => {
      return { name: entity.name, type: 'entity' };
    });
};
