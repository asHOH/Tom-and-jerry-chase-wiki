import { Map, MapDefinition } from './types';

export const getMapImageUrl = (name: string, map: MapDefinition): string => {
  if (!!map.specialImageUrl) return encodeURI(map.specialImageUrl);
  if (map.unuseImage) return `/images/icons/cat faction.png`;
  return `/images/maps/${encodeURIComponent(name)}.png`;
};

const mapDefinitions: Record<string, MapDefinition> = {
  经典之家I: {
    type: '常规地图',
    size: '小型',
    aliases: ['经典1'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoomCount: 1,
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家I（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
      {
        name: '经典之家I（圣诞）',
        imageUrl: '/images/maps/经典之家（圣诞）.png',
        description:
          '限时地图皮肤，有时会在圣诞节前后返场，返场时本地图自动更换为此皮肤，同时无法再更换为其它皮肤。',
      },
      {
        name: '经典之家I（国风）',
        imageUrl: '/images/maps/经典之家（国风）.png',
        description:
          '限时地图皮肤，有时会在春节前后返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。\n该换肤会改变部分道具和地图组件外观。',
      },
      {
        name: '经典之家I（虎丘）',
        imageUrl: '/images/maps/经典之家（虎丘）.png',
        description:
          '限时地图皮肤，极少返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。\n该换肤会改变部分道具和地图组件外观。',
      },
    ],
  },
  经典之家II: {
    type: '常规地图',
    size: '中型',
    aliases: ['经典2'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoomCount: 1,
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家II（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
    ],
  },
  经典之家III: {
    type: '常规地图',
    size: '中型',
    aliases: ['经典3'],
    studyLevelUnlock: '见习学业',
    changeWithStudyLevel: true,
    roomCount: 8,
    pipeCount: 2,
    doorCount: 6,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    randomizedRoomCount: 1,
    specialImageUrl: '/images/maps/经典之家.png',
    mapSkin: [
      {
        name: '经典之家III（樱花）',
        imageUrl: '/images/maps/经典之家（樱花）.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变小推车、吊灯等组件的外观。',
      },
    ],
  },
  雪夜古堡I: {
    type: '常规地图',
    size: '中型',
    aliases: ['雪堡1', '古堡1'],
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    randomizedRoomCount: 1,
    specialImageUrl: '/images/maps/雪夜古堡.png',
    mapSkin: [
      {
        name: '夏日古堡I',
        imageUrl: '/images/maps/夏日古堡.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会删除木门遮挡视野的效果，删除钟楼区域两根遮挡视野的柱子。',
      },
      {
        name: '雪夜古堡I（万圣）',
        imageUrl: '/images/maps/雪夜古堡（万圣）.png',
        description:
          '限时地图皮肤，有时会在万圣节前后返场，返场时本地图会自动应用此皮肤，同时无法再更换为其它皮肤。',
      },
    ],
  },
  雪夜古堡II: {
    type: '常规地图',
    size: '中型',
    aliases: ['雪堡2', '古堡2'],
    studyLevelUnlock: '高级学业',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 2,
    randomizedRoomCount: 1,
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  雪夜古堡III: {
    type: '常规地图',
    size: '大型',
    aliases: ['雪堡3', '古堡3', '双古堡'],
    studyLevelUnlock: '高级学业',
    roomCount: 15,
    pipeCount: 4,
    doorCount: 5,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  夏日游轮I: {
    type: '常规地图',
    size: '中型',
    aliases: ['游轮1'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  夏日游轮II: {
    type: '常规地图',
    size: '中型',
    aliases: ['游轮2'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 0,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  夏日游轮III: {
    type: '常规地图',
    size: '中型',
    aliases: ['游轮3'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  太空堡垒I: {
    type: '常规地图',
    size: '中型',
    aliases: ['太空1', '堡垒1'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 0,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/太空堡垒.png',
    mapSkin: [
      {
        name: '星海堡垒I',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  太空堡垒II: {
    type: '常规地图',
    size: '中型',
    aliases: ['太空2', '堡垒2'],
    studyLevelUnlock: '特级学业',
    roomCount: 10,
    pipeCount: 2,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    specialImageUrl: '/images/maps/太空堡垒.png',
    mapSkin: [
      {
        name: '星海堡垒II',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  太空堡垒III: {
    type: '常规地图',
    size: '大型',
    aliases: ['太空3', '堡垒3'],
    studyLevelUnlock: '特级学业',
    roomCount: 9,
    pipeCount: 2,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '特工行动',
      '克隆大作战',
      '房间',
      '创意玩法',
    ],
    changeWithMode: true,
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/太空堡垒.png',
    mapSkin: [
      {
        name: '星海堡垒III',
        imageUrl: '/images/maps/星海堡垒.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换，在创意玩法中会自动应用此皮肤（无法更换）。\n该换肤会改变部分房间名称。',
      },
    ],
  },
  游乐场: {
    type: '常规地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 1,
    supportedModes: ['经典奶酪赛', '天梯'],
  },
  森林牧场: {
    type: '常规地图',
    size: '大型',
    aliases: ['牧场'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 3,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '克隆大作战',
      '5V5经典奶酪赛',
      '房间',
    ],
    hiddenRoomCount: 1,
    mapSkin: [
      {
        name: '玩具王国',
        imageUrl: '/images/maps/玩具王国.png',
        description:
          '常驻地图皮肤，可由地图冠名者自由更换。\n该换肤会改变部分房间名称，删除原湖底区域的部分竖向墙壁。',
      },
    ],
  },
  大都会: {
    type: '常规地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 4,
    supportedModes: ['经典奶酪赛', '房间'],
    hiddenRoomCount: 1,
  },
  熊猫馆: {
    type: '常规地图',
    size: '中型',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 10,
    supportedModes: ['经典奶酪赛', '天梯', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
  },
  御门酒店: {
    type: '常规地图',
    size: '大型',
    aliases: ['酒店'],
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 1,
    supportedModes: [
      '经典奶酪赛',
      '天梯',
      '黄金钥匙赛',
      '奔跑吧老鼠团体赛',
      '特工行动',
      '克隆大作战',
      '房间',
    ],
  },
  天宫: {
    type: '常规地图',
    size: '大型',
    aliases: ['老天宫'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 1,
    supportedModes: ['经典奶酪赛', '天梯', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    mapSkin: [
      {
        name: '天宫（战损）',
        imageUrl: '/images/maps/天宫（战损）.png',
        description: '常驻地图皮肤，可由地图冠名者自由更换。',
      },
    ],
  },
  '天宫-云上': {
    type: '常规地图',
    size: '小型',
    aliases: ['新天宫'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 2,
    supportedModes: ['经典奶酪赛', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
  },
  '经典之家-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 4,
    pipeCount: 0,
    doorCount: 3,
    supportedModes: ['疯狂奶酪赛', '房间'],
  },
  '雪夜古堡-疯狂奶酪赛': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 2,
    pipeCount: 1,
    doorCount: 1,
    supportedModes: ['疯狂奶酪赛', '房间'],
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  金丝雀之家: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战', '房间'],
  },
  '熊猫馆-烟花大作战': {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['烟花大作战', '房间'],
    specialImageUrl: '/images/maps/熊猫馆.png',
  },
  阳光沙滩: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 0,
    supportedModes: ['沙滩排球', '房间'],
  },
  后院: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 1,
    pipeCount: 1,
    supportedModes: ['装饰树大作战', '房间'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '5V5大都会': {
    type: '娱乐地图',
    size: '大型',
    studyLevelUnlock: '大师学业',
    roomCount: 7,
    pipeCount: 4,
    supportedModes: ['5V5经典奶酪赛', '房间'],
    hiddenRoomCount: 1,
    specialImageUrl: '/images/maps/大都会.png',
  },
  家之典经: {
    type: '娱乐地图',
    size: '微型',
    roomCount: 8,
    pipeCount: 2,
    doorCount: 7,
    supportedModes: ['多元乱斗', '房间'],
    specialImageUrl: '/images/maps/经典之家.png',
  },
  '经典之家-谁是外星人': {
    type: '娱乐地图',
    size: '小型',
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
      //为常规地图添加缩略图地址
      mapImageUrl:
        map.mapImageUrl === undefined && map.type === '常规地图'
          ? `/images/maps/${encodeURIComponent(mapName + '-地图')}.png`
          : map.mapImageUrl || '',
      //为地图添加默认描述
      description:
        map.description === undefined
          ? `${mapName}是一张${map.size}的${map.type}${map.studyLevelUnlock ? `，解锁于${map.studyLevelUnlock}` : ''}${map.roomCount ? `，有${map.roomCount}个房间` : ''}${map.pipeCount ? `，有${map.pipeCount}个管道` : ''}${map.doorCount ? `，有${map.doorCount}个传统木门` : ''}${map.hiddenRoomCount ? `，有${map.hiddenRoomCount}个被隐藏的彩蛋区域` : ''}${map.randomizedRoomCount ? `，有${map.randomizedRoomCount}个房间的地形会随机发生变化` : ''}。`
          : map.description,
      //更正地图皮肤的imageUrl
      mapSkin:
        map.mapSkin !== undefined
          ? map.mapSkin.map((mapSkin) => {
              return {
                name: mapSkin.name,
                imageUrl: encodeURI(mapSkin.imageUrl),
                description: mapSkin.description,
              };
            })
          : [],
    },
  ])
);

export default mapsWithImages;
