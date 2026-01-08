import { Map, MapDefinition } from './types';

const getMapImageUrl = (name: string, map: MapDefinition): string => {
  if (!!map.specialImageUrl) return encodeURI(map.specialImageUrl);
  if (map.unuseImage) return `/images/icons/cat-faction.png`;
  return `/images/maps/${encodeURIComponent(name)}.png`;
};

const mapDefinitions: Record<string, MapDefinition> = {
  经典之家I: {
    type: '常规地图',
    size: '小型',
    aliases: ['经典之家', '经典1'],
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
    randomizedRoom: true,
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
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
    randomizedRoom: true,
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
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
    randomizedRoom: true,
    description:
      '$地形更改1$text-fuchsia-600 dark:text-fuchsia-400#：楼梯间通往阁楼的楼梯会随学业等级变化（楼梯→斜坡）。\n$地形更改2$text-fuchsia-600 dark:text-fuchsia-400#：各房间地形均有至少2种预设方案，游戏开始时每个房间会随机选取一种方案并生成。',
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
    aliases: ['雪夜古堡', '雪堡1', '古堡1'],
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
    randomizedRoom: true,
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：钟楼房间会随机从巨钟/弹簧预设地形中生成一种，餐厅会随机从桌子/传送带预设地形中生成一种。\n$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。',
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
    randomizedRoom: true,
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：钟楼房间会随机从巨钟/弹簧预设地形中生成一种，餐厅会随机从桌子/传送带预设地形中生成一种。\n$彩蛋区域1$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。\n$彩蛋区域2$text-fuchsia-600 dark:text-fuchsia-400#：庭院右侧存在一个被隐藏的彩蛋房入口。角色在庭院最右侧跳跃数十次后可[开启彩蛋房入口](从游戏表现来看，该效果实际为“清除彩蛋房入口处原有的隐形地面”。曾有部分角色可借助特性直接进入彩蛋房)（老鼠所需的跳跃次数高于猫咪），此后所有角色均可从此处进入彩蛋房，彩蛋房内有6种饮料各一瓶，以及4个随机高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新）。',
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
    description:
      '$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：两个钟楼房间均会随机从巨钟/弹簧预设地形中生成一种，侍卫房、盔甲房、卧室、餐厅的洞口会各自随机生成在左侧/右侧古堡。\n$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可从侍卫房上方取得钥匙，到盔甲房开启彩蛋房木门，彩蛋房内有1具盔甲人，可被角色穿戴并变身。两侧盔甲房通向同一个彩蛋房，离开彩蛋房时会固定传送到右侧盔甲房。',
    specialImageUrl: '/images/maps/雪夜古堡.png',
  },
  夏日游轮I: {
    type: '常规地图',
    size: '中型',
    aliases: ['夏日游轮', '游轮1'],
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个显示器，打开开关后可使全图所有角色短暂{暴露位置}。',
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个显示器，打开开关后可使全图所有角色短暂{暴露位置}。',
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：电影院放映机每次放映电影时，左上角均有概率出现9位彩蛋房密码，按3×3排布，其中0=红灯、1=绿灯；可在船长室右侧控制面板处调整各开关的开启/关闭状态，当各开关状态均正确时，右侧彩蛋房大门将打开，内有6种饮料各一瓶，以及数个高级道具（随机从{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新），还有一个显示器，打开开关后可使全图所有角色短暂{暴露位置}。',
    specialImageUrl: '/images/maps/夏日游轮.png',
  },
  太空堡垒I: {
    type: '常规地图',
    size: '中型',
    aliases: ['太空堡垒', '太空1', '堡垒1'],
    studyLevelUnlock: '特级学业',
    roomCount: 8,
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可乘坐领航厅右侧发射器前往彩蛋房，内有1个{老鼠夹}、1瓶{神秘药水}和1个{苍蝇拍}，可在彩蛋房乘坐火箭返回本地图的货仓左侧。发射器和火箭的特性与{管道}类似，但使用CD为20秒。\n$特殊机制$text-indigo-700 dark:text-indigo-400#：位于奶酪矿的道具生成口可能会刷新{奶酪}，至多3块。',
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
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：所有角色均可乘坐实验舱右侧发射器前往左侧太空。发射器的特性与{管道}类似，但使用CD为20秒。\n在本地图中，位于货仓的道具生成口可能会刷新{奶酪}，至多3块。',
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
    roomCount: 8,
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：所有角色均可乘坐领航厅右侧发射器前往彩蛋房，内有1个{老鼠夹}、1瓶{神秘药水}和1个{苍蝇拍}，可在彩蛋房乘坐火箭返回本地图的奶酪矿左侧。发射器和火箭的特性与{管道}类似，但使用CD为20秒。\n$特殊机制$text-indigo-700 dark:text-indigo-400#：位于奶酪矿的道具生成口可能会刷新{奶酪}，至多3块。\n$地形更改$text-fuchsia-600 dark:text-fuchsia-400#：在{特工行动}中，本地图维修舱不刷新{老鼠洞}（即本地图只有4个老鼠洞）。',
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：[绝大多数角色](部分有飞行/多段跳能力的角色可以通过技能直接跳到彩蛋房入口处，这样就不需要和其他角色一样借助墙壁进行二次跳跃)可先跳到湖泊沉船右上方的船帮处，再向左上方跳跃到达位于房间左上角的彩蛋房入口，随后向左走并在损坏的吊灯处跳跃即可进入彩蛋房，彩蛋房内有通向牛棚/主人房的单向管道，以及4个高级道具（随机从{神秘饮料}、{遥控器}、{蓝花瓶}、{鞭炮束}、{手枪}、{苍蝇拍}中刷新）。\n在[玩具王国](指本地图的玩具王国换肤)中，彩蛋房位置不变，但入口处有一定坡度，可直接借助坡度二次跳跃。',
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
    description:
      '$彩蛋区域$text-fuchsia-600 dark:text-fuchsia-400#：街道左侧有一个展示柜，陈列了1瓶{隐身饮料}、1瓶{变身饮料}和2瓶{神秘饮料}，投掷道具碰撞该展示柜[数次](不同道具所需次数不同)后可击碎该展示柜，随后可拿取这些饮料。',
    hiddenRoomCount: 1,
  },
  熊猫馆: {
    type: '常规地图',
    size: '中型',
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 10,
    supportedModes: ['经典奶酪赛', '天梯', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：熊猫谷区域的老鼠洞初始被大熊猫堵住，需要向他投喂4个食物后才会起身，随后才可推入该位置的奶酪。作为交换，该位置的奶酪推入所需进度较低。',
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
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：走廊区域的所有道具均会被包裹在{长礼品盒}/{高礼品盒}中，需打开这些礼盒才能得到道具。作为交换，该房间生成的道具[品质](即该房间可能会更多地刷新稀有道具，如蓝花瓶等)较高，且必然会额外刷新1块奶酪。',
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
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：兜率宫处的两个初始火箭为二段火箭，初始燃烧倒计时较低，但起飞到达上方莲花水台后会重置进度且被熄灭，需要二次点燃和放飞。',
  },
  '天宫-云上': {
    type: '常规地图',
    size: '小型',
    aliases: ['新天宫'],
    studyLevelUnlock: '大师学业',
    roomCount: 5,
    pipeCount: 2,
    supportedModes: ['经典奶酪赛', '黄金钥匙赛', '特工行动', '克隆大作战', '房间'],
    description:
      '$特殊机制$text-indigo-700 dark:text-indigo-400#：玉清宫和兜率宫处的各两个初始火箭为二段火箭，初始燃烧倒计时较低，但起飞到达上方莲花水台后会重置进度且被熄灭，需要二次点燃和放飞。',
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
          ? `${mapName}是一张${map.size}的${map.type}${map.studyLevelUnlock ? `，解锁于${map.studyLevelUnlock}` : ''}${map.roomCount ? `，有${map.roomCount}个房间` : ''}${map.pipeCount ? `，有${map.pipeCount}个管道` : ''}${map.doorCount ? `，有${map.doorCount}个传统木门` : ''}。`
          : `${mapName}是一张${map.size}的${map.type}${map.studyLevelUnlock ? `，解锁于${map.studyLevelUnlock}` : ''}${map.roomCount ? `，有${map.roomCount}个房间` : ''}${map.pipeCount ? `，有${map.pipeCount}个管道` : ''}${map.doorCount ? `，有${map.doorCount}个传统木门` : ''}。\n` +
            map.description,
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
