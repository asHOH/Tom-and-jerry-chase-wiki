import { Fixture, FixtureDefinition } from '@/data/types';

export const getFixtureImageUrl = (name: string): string => {
  return `/images/items/${encodeURIComponent(name)}.png`;
};

const FixtureDefinitions: Record<string, FixtureDefinition> = {
  平台: {
    type: '平台类',
    source: '通用组件',
    move: false,
    gravity: false,
    collsion: ['道具', '角色'],
    description:
      '平台不会移动，可以承载位于其上方的物体，不会与左/右/下方的物体产生碰撞。与地面的区别在于，平台允许被可穿墙物体穿越。',
  },
  地面: {
    type: '地面类',
    source: '通用组件',
    move: false,
    gravity: false,
    collsion: ['道具', '角色'],
    description:
      '地面不会移动，可以承载位于其上方的物体，不会与左/右/下方的物体产生碰撞。与平台的区别在于，地面只允许被少数可穿墙物体穿越。',
  },
  墙壁: {
    type: '墙壁类',
    source: '通用组件',
    move: false,
    gravity: false,
    collsion: ['道具', '角色'],
    description: '墙壁不会移动，可以阻挡物体，且只允许被少数可穿墙物体穿越。',
  },
  老鼠洞: {
    type: ['物件类', '可交互'],
    source: '通用组件',
    move: false,
    gravity: false,
    description:
      '老鼠可在初始房间自由选择老鼠洞出洞。游戏进程中可将{奶酪}投掷进老鼠洞，随后老鼠与之交互可以推奶酪。',
  },
  小黄鸭: {
    type: 'NPC',
    source: '通用组件',
    move: false,
    gravity: false,
    description:
      '小黄鸭在地图中自由游荡，接触猫咪/老鼠时会随机丢出一件道具帮助对方。小黄鸭通常不与其它道具/角色产生碰撞，但极少数情况下除外。',
  },
};

const FixtureWithImages: Record<string, Fixture> = Object.fromEntries(
  Object.entries(FixtureDefinitions).map(([itemName, item]) => [
    itemName,
    {
      ...item,
      name: itemName,
      imageUrl: getFixtureImageUrl(itemName),
    },
  ])
);

export default FixtureWithImages;
