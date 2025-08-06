import { Item, ItemDefinition } from './types';

export const getItemImageUrl = (name: string): string => {
  return `/images/items/${encodeURIComponent(name)}.png`;
};

const damage50Object = {
  itemtype: '投掷类' as const,
  itemsource: '常规道具' as const,
  damage: 50,
  description: '击中敌人时造成减速以及50点伤害，击中地面时生成数个碎片。',
  create: '自然刷新。',
};

const itemDefinitions: Record<string, ItemDefinition> = {
  /* ----------------------------------- 投掷类常规道具 ----------------------------------- */
  盘子: Object.assign(
    {
      aliases: ['圆盘子,'],
      walldamage: 5,
      store: true,
      price: 500,
      storeCD: 90,
    },
    damage50Object
  ),
  扁盘: Object.assign(
    {
      aliases: ['盘子', '碟子'],
      walldamage: 8,
      store: false,
    },
    damage50Object
  ),
  玻璃杯: Object.assign(
    {
      aliases: ['杯子'],
      walldamage: 5,
      store: true,
      price: 500,
      storeCD: 90,
    },
    damage50Object
  ),
  碗: Object.assign(
    {
      walldamage: 6,
      store: false,
    },
    damage50Object
  ),
  叉子: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['餐叉', '铁叉'],
    damage: 25,
    walldamage: 5,
    description:
      '击中敌人时造成减速以及25点伤害，击中地面或墙壁时（部分墙壁和地面除外）插在对应平面上，阻碍角色通行，可通过交互键拔下，或受到来自下方的3次碰撞后顶飞。',
    create: '自然刷新，当对局中存在人工智能角色时则不刷新。',
    store: false,
  },
  高尔夫球: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['高尔夫', '球'],
    damage: 25,
    walldamage: 3,
    description: '击中敌人时造成减速以及25点伤害，可反复弹跳。',
    create: '自然刷新。',
    store: true,
    price: 1500,
    storeCD: 180,
    teamCD: true,
  },
  香水瓶: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['香水'],
    damage: 0,
    walldamage: 8,
    description:
      '击中敌人时造成反向，击中地面时生成香水区域(碰触的角色会反向，60秒后或被碰触5次后消失)。',
    create: '自然刷新。',
    store: true,
    price: 500,
    storeCD: 120,
  },
  胡椒瓶: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['烟雾', '胡椒粉', '烟雾瓶'],
    damage: 0,
    walldamage: 8,
    description:
      '击中敌人时造成致盲，击中地面时生成烟雾区域(碰触的角色会致盲，60秒后或被碰触5次后消失)。',
    create: '自然刷新。',
    store: true,
    price: 500,
    storeCD: 120,
  },
  冰块: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['冰'],
    damage: 25,
    walldamage: 3,
    description:
      '击中敌人或队友时造成2.4秒眩晕以及25点伤害，击中地面时生成冰面(碰触的角色将会在其上滑行，60秒后或被碰触5次后消失)。拿在手中时会倒计时5秒，倒计时结束时对自身造成2.4秒冻结及25点伤害，放下后重置倒计时。角色处于由冰块/鞭炮/花瓶导致的眩晕时，不会再次受到来自它们的眩晕。',
    create: '自然刷新，或从冰桶中拾取得到。',
    store: true,
    price: 1300,
    storeCD: 180,
  },
  小鞭炮: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['鞭炮', '小鞭炮', '炸药'],
    damage: 75,
    walldamage: 7,
    description:
      '拿在手中时可以点燃，点燃5秒后爆炸，对周围所有目标造成2秒眩晕和75点伤害（不受攻击增伤影响）。拿在手中时可通过喝饮料重置倒计时。角色处于由冰块/鞭炮/花瓶导致的眩晕时，不会再次受到来自它们的眩晕。',
    create: '自然刷新，或从鞭炮堆中拾取得到。',
    store: true,
    price: 600,
    storeCD: 180,
    unlocktime: '奶酪期 10:00',
  },
  鞭炮束: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['鞭炮', '大鞭炮', '核弹头', '炸药'],
    damage: 75,
    walldamage: 4,
    description:
      '拿在手中时可以点燃，点燃5秒后爆炸，对周围所有目标造成2秒眩晕和75点伤害（不受攻击增伤影响），并分裂出6个小鞭炮，各自延迟1秒后爆炸，对周围所有目标造成2秒眩晕和75点伤害（不受攻击增伤影响，没有伤害来源）。拿在手中时可通过喝饮料重置倒计时。角色处于由冰块/鞭炮/花瓶导致的眩晕时，不会再次受到来自它们的眩晕。',
    create:
      '自然刷新，每个房间初始最多刷新以下道具中的一个：果盘，冰桶，鞭炮堆，灰花瓶，蓝花瓶，拳套盒子，鞭炮束。',
    store: true,
    price: 2400,
    storeCD: 120,
    unlocktime: '墙缝期 03:30',
  },
  灰花瓶: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: [
      '花瓶',
      '灰色花瓶',
      '灰罐子',
      '灰色大花瓶',
      '灰缸',
      '黑色花瓶',
      '黑罐子',
      '黑色大花瓶',
    ],
    damage: 50,
    walldamage: 8,
    description:
      '击中敌人时造成2.8秒眩晕以及50点伤害，击中地面时生成数个碎片。角色处于由冰块/鞭炮/花瓶导致的眩晕时，不会再次受到来自它们的眩晕。',
    create:
      '自然刷新，每个房间初始最多刷新以下道具中的一个：果盘，冰桶，鞭炮堆，灰花瓶，蓝花瓶，拳套盒子，鞭炮束。',
    store: true,
    price: 1600,
    storeCD: 240,
  },
  蓝花瓶: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['花瓶', '蓝白花瓶', '蓝罐子', '蓝白大花瓶', '蓝缸'],
    damage: 50,
    walldamage: 8,
    description:
      '击中敌人时造成2.8秒眩晕以及50点伤害，击中地面时生成数个碎片。可将至多3个其他投掷类常规道具（不包括番茄和其他蓝花瓶）装入蓝花瓶内，击中敌人或地面时使花瓶内的道具掉出，造成对应效果。角色处于由冰块/鞭炮/花瓶导致的眩晕时，不会再次受到来自它们的眩晕。',
    create:
      '自然刷新，每个房间初始最多刷新以下道具中的一个：果盘，冰桶，鞭炮堆，灰花瓶，蓝花瓶，拳套盒子，鞭炮束。',
    store: true,
    price: 2400,
    teamCD: true,
  },
  番茄: {
    itemtype: '投掷类' as const,
    itemsource: '常规道具' as const,
    aliases: ['大番茄', '西红柿'],
    damage: 0,
    walldamage: 3,
    description:
      '击中敌人时造成减速，击中地面时生成番茄区域（碰触到的角色会减速，可叠加，可影响火箭上的老鼠，一段时间或碰触数次后消失）。',
    create: '自然刷新。',
    store: false,
  },
  /* ----------------------------------- 手持类常规道具 ----------------------------------- */
  遥控器: {
    itemtype: '手持类' as const,
    itemsource: '常规道具' as const,
    damage: 75,
    description:
      '猫/鼠使用后召唤对应的机械猫/鼠，撞到对方阵营角色时爆炸，对周围的对方阵营角色造成2.3秒眩晕和75伤害。',
    create: '自然不刷新，只能通过纸盒/小黄鸭（鼠）/传送带/彩蛋房等途径获得。',
    store: false,
  },
  /* ----------------------------------- 物件类常规道具 ----------------------------------- */
  鞭炮堆: {
    itemtype: '物件类' as const,
    itemsource: '常规道具' as const,
    aliases: ['鞭炮桶', '小鞭炮堆'],
    description:
      '可从中取出小鞭炮，第一次取出时冷却为10秒，此后每次增加3秒，至多25秒。猫从鞭炮堆中取鞭炮的速度要快于老鼠。',
    create:
      '在物件的刷新点自然刷新，每个房间初始最多刷新以下道具中的一个：果盘，冰桶，鞭炮堆，灰花瓶，蓝花瓶，拳套盒子，鞭炮束。',
    store: true,
    price: 1600,
    storeCD: 120,
  },
  /* ----------------------------------- 食物类常规道具 ----------------------------------- */
  神秘饮料: {
    itemtype: '食物类' as const,
    itemsource: '常规道具' as const,
    aliases: ['神秘药水', '随机饮料', '随机药水', '五颜六色的变大药水'],
    description:
      '拾取后储存在饮料栏，饮用后随机获得远视、隐身、护盾、兴奋、变身效果中的一个,各效果获得概率均等。',
    create:
      '在药水的刷新点自然刷新，游戏开始时会且仅会刷新1个。也可以通过空投包裹、商店、彩蛋房等途径获得。',
    store: true,
    price: 2200,
    storeCD: 180,
    teamCD: true,
  },
  /* ----------------------------------- 流程类常规道具 ----------------------------------- */
  奶酪: {
    itemtype: '流程类' as const,
    itemsource: '常规道具' as const,
    factionId: 'mouse' as const,
    description:
      '拾取后降低移速和视野范围，被投掷时的速度较低。投掷到空置的洞口内时会自动填入，然后可以推奶酪。',
    create:
      '在不同学业等级的地图中的刷新方式有所不同。对于大师学业：开局时随机在3个房间刷新奶酪，推入第2/3块奶酪时再在随机房间刷新奶酪，已刷新过奶酪的房间不会重复刷新。也可以通过开启纸盒，商店购买等方式获得。',
    store: true,
    price: 2800,
    storeCD: 120,
    unlocktime: '奶酪期 08:00',
  },
  /* ----------------------------------- 地图道具 ----------------------------------- */
  狗骨头: {
    itemtype: '投掷类' as const,
    itemsource: '地图道具' as const,
    aliases: ['骨头'],
    damage: 50,
    description:
      '击中敌人时造成眩晕以及50点伤害。掉落到地面时召唤小泰克，根据召唤者的阵营获得以下能力：猫：自动寻找老鼠进行攻击，造成眩晕和伤害；自动寻找有老鼠被绑上的火箭，对其进行鼓舞，增加引线燃烧速度。鼠：自动寻找猫咪进行攻击，造成眩晕和伤害；自动寻找正在推奶酪的老鼠，对其进行鼓舞，增加推奶酪速度。小泰克一段时间后消失，若正在进行鼓舞则暂时不会消失。',
    create: '击倒斯派克后掉落，若游戏内已存在其他狗骨头/小泰克，则不掉落。',
  },
  /* ----------------------------------- 技能道具 ----------------------------------- */
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
