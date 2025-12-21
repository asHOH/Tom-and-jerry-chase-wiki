import { Map, MapDefinition } from './types';

export const getMapImageUrl = (name: string, map: MapDefinition): string => {
  if (!!map.specialImageUrl) return map.specialImageUrl;
  if (map.unuseImage) return `/images/icons/cat faction.png`;
  return `/images/maps/${encodeURIComponent(name)}.png`;
};

const mapDefinitions: Record<string, MapDefinition> = {
  经典之家I: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '见习学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    randomizedRoom: true,
    specialImageUrl: '/images/maps/经典之家.png',
  },
  经典之家II: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '见习学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    randomizedRoom: true,
    specialImageUrl: '/images/maps/经典之家.png',
  },
  经典之家III: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '见习学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 6,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    randomizedRoom: true,
    specialImageUrl: '/images/maps/经典之家.png',
  },
  雪夜古堡I: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: [
      '匹配模式',
      '天梯模式',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '自定义地图',
    ],
    randomizedRoom: true,
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  雪夜古堡II: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    hiddenRoom: true,
    randomizedRoom: true,
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  雪夜古堡III: {
    type: '常规地图',
    size: '小',
    studyLevelUnlock: '高级学业',
    roomCount: 15,
    pipeCount: 4,
    doorCount: 5,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  夏日游轮I: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  夏日游轮II: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 0,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  夏日游轮III: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: [
      '匹配模式',
      '天梯模式',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '自定义地图',
    ],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  太空堡垒I: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 0,
    supportedModes: [
      '匹配模式',
      '天梯模式',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '自定义地图',
    ],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  太空堡垒II: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 10,
    pipeCount: 2,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    unuseImage: true, //ToDo: Add Map Image
  },
  太空堡垒III: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 2,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战', '自定义地图'],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  游乐场: {
    type: '常规地图',
    size: '大',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 1,
    supportedModes: ['匹配模式', '天梯模式'],
    unuseImage: true, //ToDo: Add Map Image
  },
  森林牧场: {
    type: '常规地图',
    size: '大',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 3,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '克隆大作战', '5V5团队奶酪赛'],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  大都会: {
    type: '常规地图',
    size: '大',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 4,
    supportedModes: ['匹配模式', '5V5团队奶酪赛'],
    hiddenRoom: true,
    unuseImage: true, //ToDo: Add Map Image
  },
  熊猫馆: {
    type: '常规地图',
    size: '中',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 10,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战'],
    unuseImage: true, //ToDo: Add Map Image
  },
  御门酒店: {
    type: '常规地图',
    size: '大',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 1,
    supportedModes: [
      '匹配模式',
      '天梯模式',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
    ],
    unuseImage: true, //ToDo: Add Map Image
  },
  天宫: {
    type: '常规地图',
    size: '大',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 1,
    supportedModes: ['匹配模式', '天梯模式', '黄金钥匙赛', '特工行动', '克隆大作战'],
    unuseImage: true, //ToDo: Add Map Image
  },
  '经典之家-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '小',
    roomCount: 4,
    pipeCount: 0,
    doorCount: 3,
    supportedModes: ['疯狂奶酪赛'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '雪夜古堡-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '小',
    roomCount: 2,
    pipeCount: 1,
    doorCount: 1,
    supportedModes: ['疯狂奶酪赛'],
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  '经典之家-烟花大作战': {
    type: '娱乐地图',
    size: '小',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '熊猫馆-烟花大作战': {
    type: '娱乐地图',
    size: '小',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战'],
    unuseImage: true, //ToDo: Add Map Image
  },
  阳光沙滩: {
    type: '娱乐地图',
    size: '小',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['沙滩排球'],
    unuseImage: true, //ToDo: Add Map Image
  },
  后院: {
    type: '娱乐地图',
    size: '小',
    roomCount: 1,
    pipeCount: 1,
    supportedModes: ['装饰树大作战'],
    unuseImage: true, //ToDo: Add Map Image
  },
  家之典经: {
    type: '常规地图',
    size: '小',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: ['多元乱斗'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '经典之家-谁是外星人': {
    type: '娱乐地图',
    size: '小',
    roomCount: 6,
    supportedModes: ['谁是外星人'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
};

const mapsWithImages: Record<string, Map> = Object.fromEntries(
  Object.entries(mapDefinitions).map(([mapName, map]) => [
    mapName,
    {
      ...map,
      name: mapName,
      imageUrl: getMapImageUrl(mapName, map),
    },
  ])
);

export default mapsWithImages;
