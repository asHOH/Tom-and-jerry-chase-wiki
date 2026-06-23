import type { Trait } from '@/data/types';

export const characterRelationMapTraits: Trait[] = [
  {
    description:
      '拥有四个特殊放飞机制的火箭，在积累50线索值情况下可以帮助自身更快的放飞老鼠。且地图平台分布较为集中，便于侦探汤姆收集线索。',
    group: [
      { name: '侦探汤姆', type: 'character' },
      { name: '天宫-云上', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '侦探汤姆', type: 'character' },
      target: { name: '天宫-云上', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '拥有两个特殊放飞机制的火箭，在积累50线索值情况下可以帮助自身更快的放飞老鼠。但地图上下跨度大，不利于轮椅状态中的侦探汤姆追捕或绑火箭，不具有明显优势。',
    group: [
      { name: '侦探汤姆', type: 'character' },
      { name: '天宫', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '侦探汤姆', type: 'character' },
      target: { name: '天宫', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '',
    group: [
      { name: '塔拉', type: 'character' },
      { name: '经典之家I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '塔拉', type: 'character' },
      target: { name: '经典之家I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '',
    group: [
      { name: '塔拉', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '塔拉', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '',
    group: [
      { name: '塔拉', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '塔拉', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '',
    group: [
      { name: '塔拉', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '塔拉', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图表现更稳。',
    group: [
      { name: '库博', type: 'character' },
      { name: '经典之家III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '经典之家III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '库博在该地图节奏更顺。',
    group: [
      { name: '库博', type: 'character' },
      { name: '太空堡垒I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '太空堡垒I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '库博在该地图更有优势。',
    group: [
      { name: '库博', type: 'character' },
      { name: '太空堡垒III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '太空堡垒III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '库博在该地图更容易建立优势。',
    group: [
      { name: '库博', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图推进更顺。',
    group: [
      { name: '库博', type: 'character' },
      { name: '夏日游轮II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '夏日游轮II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图更好发挥。',
    group: [
      { name: '库博', type: 'character' },
      { name: '雪夜古堡II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '雪夜古堡II', type: 'map' },
      isMinor: true,
    },
  },
  {
    description:
      '该地图在电影院左侧走廊处放置藤蔓可到达船长室，且猫咪难以攀爬（位置合适时无法攀爬）。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description:
      '该地图存在多处藤蔓点位（电影院左侧、船长室楼梯、厨房楼梯、锅炉房通风管等），可在不影响鼠方通行的情况下阻止猫方通过；存在多处墙缝点位（电影院、甲板、客舱）可让罗菲借助原生或藤蔓平台多次反弹，达到快速破墙的效果。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '夏日游轮II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '夏日游轮II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '该地图存在多处藤蔓点位（电影院左侧、船长室楼梯、厨房楼梯等），可在不影响鼠方通行的情况下阻止猫方通过；存在多处墙缝点位（电影院、甲板二、客舱）可让罗菲借助原生或藤蔓平台多次反弹，达到快速破墙的效果。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '夏日游轮III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '夏日游轮III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '贯穿线点位：侍卫房洞口（三楼右边洞口）。有传送带时可以攒高尔夫球用于后期破墙',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '雪夜古堡I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '雪夜古堡I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '贯穿线点位：侍卫房洞口（三楼左边洞口），卧室洞口。有传送带时可以攒高尔夫球用于后期破墙',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '雪夜古堡II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '雪夜古堡II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '贯穿线点位：左侍卫房洞口（左三楼左边洞口），右侍卫房洞口（右三楼右边洞口），左卧室洞口。有传送带时可以攒高尔夫球用于后期破墙',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '三个游轮图的船长室与电影院均有贯穿线点位，但需要鞭炮辅助，实用性较古堡图低',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '毛线球有利于搬森林奶酪',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '如此密集的道具使如玉可以频繁触发花枪反击',
    group: [
      { name: '如玉', type: 'character' },
      { name: '经典之家-疯狂奶酪赛', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '如玉', type: 'character' },
      target: { name: '经典之家-疯狂奶酪赛', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '盔甲房与侍卫房较小，鸟哨可起到折返轰炸作用',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '雪夜古堡I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '杰瑞', type: 'character' },
      target: { name: '雪夜古堡I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '雪夜古堡II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '杰瑞', type: 'character' },
      target: { name: '雪夜古堡II', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '杰瑞', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '罗宾汉可利用技能翻越井盖和部分楼层。古堡23同理',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '雪夜古堡I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '雪夜古堡I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉可利用技能翻越绝大多数楼层。游轮23同理',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '罗宾汉可利用技能在牛棚和主人房屋顶间往返飞跃；且该地图小平台多，罗宾占据优势；罗宾汉还能利用降落伞反复钻主人房的两段管道。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉开伞坐车免疫晕车。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '熊猫馆', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '熊猫馆', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉可轻松翻越水城和摩天轮的大部分平台。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '苏蕊跳舞时间持续30秒，抓住老鼠后可跑到杂物间点燃大炸药后跳舞跟随直到放飞。老鼠对此缺乏反制手段',
    group: [
      { name: '苏蕊', type: 'character' },
      { name: '经典之家I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '苏蕊', type: 'character' },
      target: { name: '经典之家I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '广寒宫占有地利（空间小，出入必须钻管道，利于牛仔汤姆布局与酣战）但记住时不时去干扰蟠桃园拿点经验，不然广寒宫会被老鼠强攻沦陷',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '天宫', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '天宫', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '熊猫谷占有地利（空间略小，出入必须走车牌，利于牛仔汤姆布局与酣战，同时能极大拖延老鼠进入墙缝期节奏），熊猫谷老鼠需要喂饱熊猫才能开启老鼠洞，牛仔汤姆的斗牛能够给予持续性的干扰。保护研究基地的奶酪处也是易守难攻，同时两个药水仓能够辅助牛仔汤姆的进攻。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '熊猫馆', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '熊猫馆', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '装饰树大作战特殊地图，牛仔汤姆的斗牛能够来回撞击，能够干扰敌方老鼠捡礼物和推雪橇车。',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '后院', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '后院', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '无敌无视烟花伤害',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '熊猫馆-烟花大作战', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '熊猫馆-烟花大作战', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '夏日游轮II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '夏日游轮II', type: 'map' },
      isMinor: true,
    },
  },
  {
    description:
      '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去，并且能够利用武器技能穿梭于两边钟楼',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '雪夜古堡I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '雪夜古堡I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description:
      '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '雪夜古堡II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '雪夜古堡II', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '夏日游轮I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '夏日游轮I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '夏日游轮III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '夏日游轮III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '斯飞的机动性利于斯飞在大都会的地图穿梭',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '大都会', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '大都会', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '熊猫谷与科普体验馆利于斯飞追击。',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '熊猫馆', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '熊猫馆', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '大堂的七色花能够给予斯飞打好前期的优势，同时自身的高机动性可以在地图里穿梭',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '御门酒店', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '御门酒店', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '斯飞的高机动性利于追击，同时斯飞的强化主动技能与武器技能能够击中通过管道的老鼠',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '天宫', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '天宫', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '房间分布四散，给予老鼠拉扯空间',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '经典之家I', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '经典之家I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '太空环境提高老鼠逃脱斯飞追击的可能',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '太空堡垒I', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '太空堡垒I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '机动性优势在森林的多平台中削弱，同时湖泊给斯飞追击带来阻力',
    group: [
      { name: '斯飞', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '夏日游轮III', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '夏日游轮III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '因地图较平坦，斗牛释放后基本看不见牛回来，还有老鼠被击倒后能从实验舱右侧发射器前往左侧太空，断掉追击节奏',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '太空堡垒II', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '太空堡垒II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '游乐场的地形使斗牛难以频繁折返，但女巫古堡二层常会刷出火箭，这对牛汤来说是不小的优势',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '地图平坦，斗牛作用较小',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '御门酒店', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '御门酒店', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '地图平坦，斗牛作用较小',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '地图平坦，斗牛作用较小',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '大都会', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '大都会', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '天宫-云上', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '天宫-云上', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '地图平坦，斗牛作用较小',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '5V5大都会', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '5V5大都会', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '容易被拉扯，并且防守奶酪只在杂物间占优势',
    group: [
      { name: '牛仔汤姆', type: 'character' },
      { name: '经典之家I', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '经典之家I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图发挥受限。',
    group: [
      { name: '库博', type: 'character' },
      { name: '大都会', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '大都会', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图不易展开。',
    group: [
      { name: '库博', type: 'character' },
      { name: '经典之家I', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '经典之家I', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '库博在该地图整体偏吃亏。',
    group: [
      { name: '库博', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '库博在该地图较难发挥。',
    group: [
      { name: '库博', type: 'character' },
      { name: '天宫', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '库博', type: 'character' },
      target: { name: '天宫', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '横排上下两层的地图使莱特林在下方就能通过闪现管控上方奶酪。',
    group: [
      { name: '莱特宁', type: 'character' },
      { name: '经典之家II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '莱特宁', type: 'character' },
      target: { name: '经典之家II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '典型的拉扯图容易苟到后期。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '经典之家II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '经典之家II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '拉扯图，易于走位。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '中期易拉扯。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '森林牧场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '森林牧场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '比较好拉扯，猫死追一边必定亏奶酪。可以处理一些高危火箭。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '平台高低差大，配合漂浮可以很大程度上遛猫。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '夏日游轮III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '夏日游轮III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '庇护可以防坐车踩夹，但不好跑。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '熊猫馆', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '熊猫馆', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '易于拉扯，且恶菲不怕奶酪刷新差。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '经典之家II', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '经典之家II', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '游乐场存在多处滑坡可以利用，变相提高了音乐家的自保能力和转点能力',
    group: [
      { name: '音乐家杰瑞', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '音乐家杰瑞', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '不怕同一边刷三块奶酪，且好拉扯。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: true,
    },
  },
  {
    description:
      '易于拉扯，且有传送带提供奶酪，可以提前将所有奶酪洞口都放置奶酪，方便队友拉扯换推。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '太空堡垒I', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '太空堡垒I', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '游乐场地图大，开放性强，高低差大适合恶菲一被牵制，而且奶酪转点极其方便，且各奶酪洞口附近蓝色小淘气架点都有明确有效点位。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '游乐场', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '游乐场', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '难以拉扯，易被高熟练度猫咪瓮中捉鳖。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '熊猫馆', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '熊猫馆', type: 'map' },
      isMinor: false,
    },
  },
  {
    description:
      '前期猫容易用七色花展开节奏，不便拉扯。但比较烂的奶酪刷新一定程度上可以凸显恶菲的功能性。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '御门酒店', type: 'map' },
    ],
    relation: {
      kind: 'disadvantageMaps',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '御门酒店', type: 'map' },
      isMinor: true,
    },
  },
  {
    description: '理由同古堡1；该地图追汤还能在两个钟楼间换绑',
    group: [
      { name: '追风汤姆', type: 'character' },
      { name: '雪夜古堡III', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '雪夜古堡III', type: 'map' },
      isMinor: false,
    },
  },
  {
    description: '该地图下方会积蓄较多球和叉子，利于布奇防守',
    group: [
      { name: '布奇', type: 'character' },
      { name: '天宫-云上', type: 'map' },
    ],
    relation: {
      kind: 'advantageMaps',
      subject: { name: '布奇', type: 'character' },
      target: { name: '天宫-云上', type: 'map' },
      isMinor: false,
    },
  },
];
