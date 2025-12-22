import { Mode, ModeDefinition } from '@/data/types';

export const getModeImageUrl = (name: string): string => {
  return `/images/items/${encodeURIComponent(name)}.png`;
};

const ModeDefinitions: Record<string, ModeDefinition> = {
  经典模式: { type: '经典模式', openingTime: '全天', description: '经典模式。' },
};

const ModeWithImages: Record<string, Mode> = Object.fromEntries(
  Object.entries(ModeDefinitions).map(([itemName, item]) => [
    itemName,
    {
      ...item,
      name: itemName,
      imageUrl: getModeImageUrl(itemName),
    },
  ])
);

export default ModeWithImages;
