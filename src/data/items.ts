import { Item, ItemDefinition } from './types';

export const getItemImageUrl = (name: string): string => {
  return `/images/items/${encodeURIComponent('道具-' + name)}.png`;
};

const damage50Object = {
  damage: 50,
  description: '击中敌人时造成减速以及50点伤害。',
};

// TODO: Complete it
const itemDefinitions: Record<string, ItemDefinition> = {
  盘子: damage50Object,
  扁盘: damage50Object,
  杯子: damage50Object,
  碗: damage50Object,
  冰块: {
    damage: 25,
    description: '击中敌人时造成3秒眩晕以及25点伤害，。',
  },
  高尔夫球: {
    damage: 25,
    description: '击中敌人时造成减速以及25点伤害。',
  },
  灰罐: {
    damage: 50,
    description: '击中敌人时造成3秒眩晕以及50点伤害。',
  },
  蓝罐: {
    damage: 50,
    description: '击中敌人时造成3秒眩晕以及50点伤害。',
  },
};

const itemsWithImages: Record<string, Item> = Object.fromEntries(
  Object.entries(itemDefinitions).map(([itemName, item]) => [
    itemName,
    {
      ...item,
      name: itemName,
      imageUrl: getItemImageUrl(itemName),
    },
  ])
);

export default itemsWithImages;
