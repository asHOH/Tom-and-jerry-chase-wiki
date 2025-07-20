import { Item, ItemDefinition } from './types';

export const getItemImageUrl = (name: string): string => {
  return `/images/items/${encodeURIComponent(name)}.png`;
};

const damage50Object = {
  damage: 50,
  description: '击中敌人时造成减速以及50点伤害。',
};

// TODO: Complete it
const itemDefinitions: Record<string, ItemDefinition> = {
  盘子: Object.assign(
    {
      aliases: ['圆盘子'],
    },
    damage50Object
  ),
  扁盘: Object.assign(
    {
      aliases: ['盘子'],
    },
    damage50Object
  ),
  玻璃杯: Object.assign(
    {
      aliases: ['杯子'],
    },
    damage50Object
  ),
  碗: damage50Object,
  冰块: {
    damage: 25,
    description: '击中敌人时造成2.4秒眩晕以及25点伤害。',
  },
  高尔夫球: {
    damage: 25,
    description: '击中敌人时造成减速以及25点伤害。',
  },
  灰花瓶: {
    aliases: ['灰色花瓶', '灰罐子', '灰色大花瓶'],
    damage: 50,
    description: '击中敌人时造成2.8秒眩晕以及50点伤害。',
  },
  蓝花瓶: {
    aliases: ['蓝白花瓶', '蓝罐子', '蓝白大花瓶'],
    damage: 50,
    description: '击中敌人时造成2.8秒眩晕以及50点伤害。',
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
