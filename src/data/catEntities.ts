import { Entity, EntityDefinition } from './types';

export const getCatEntityImageUrl = (name: string): string => {
  return `/images/catEntities/${encodeURIComponent(name)}.png`;
};

const catEntitiesDefinitions: Record<string, EntityDefinition> = {
  煎蛋: {
    entitytype: '投射物类' as const,
    characterName: '汤姆',
    skillname: '平底锅',
    aliases: ['胡椒粉', '胡椒罐'],
    move: true,
    gravity: true,
    collsion: true,
    description: '对命中的老鼠造成伤害和致盲，并降低其救援速度。',
    detailedDescription:
      '对命中的老鼠造成[15伤害](可受攻击增伤加成)，并附加5秒煎蛋失明和55%救援减速效果。',
    create: '汤姆-平底锅在使用时自动飞出。',
  },
  咸鱼: {
    entitytype: '召唤物类' as const,
    characterName: '莱特宁',
    skillname: '咸鱼',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '鼠方踩到后会受到小幅全属性减益。莱特宁爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD、减少爪刀CD，并回复Hp。瞬移闪击将优先追踪带有咸鱼效果的敌方；手中有老鼠时，则优先追踪最近的咸鱼。',
    detailedDescription:
      '咸鱼持续一分钟，鼠方踩到后会受咸鱼影响，持续20秒，期间推速降低40%，救援、治疗速度降低33%，移速降低10%，跳跃高度降低，同时暴露小地图位置。可通过吃{蛋糕}、喝{牛奶}、喝饮料、{应急治疗}、{牛仔吉他}Lv.2来解除。爪刀命中[带有咸鱼效果的敌方](包括虚弱老鼠)时，将重置瞬移闪击CD，爪刀CD减少至1.9秒，并获得50Hp/秒的恢复效果，持续1秒。瞬移闪击将优先追踪带有咸鱼效果的敌方，并大幅提高追踪范围；手中有老鼠时，则优先追踪最近的咸鱼。',
    create: '由莱特宁-咸鱼召唤。',
  },
  斗牛: {
    entitytype: '召唤物类' as const,
    characterName: '牛仔汤姆',
    skillname: '斗牛',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '斗牛会来回冲撞，破坏[部分道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)，并对老鼠造成伤害和[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
    detailedDescription:
      '斗牛会来回冲撞，破坏[部分道具](包括玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶，以及纸盒、吊灯、牛仔杰瑞的仙人掌等)，并对老鼠造成25伤害和1.5秒[眩晕](内置CD：4秒)。被牛眩晕的老鼠可以被直接抓取。斗牛每次撞墙或老鼠减少1秒持续时间，撞到墙体或插入地板的叉子会掉头，会带走已经布置的老鼠夹。',
    create: '由牛仔汤姆-斗牛技能召唤。',
  },
  小仙人掌球: {
    entitytype: '投射物类' as const,
    characterName: '牛仔汤姆',
    skillname: '仙人掌弹弓',
    move: true,
    gravity: true,
    collsion: false,
    description: '命中时造成伤害和受伤状态、并获得老鼠的小地图位置。',
    detailedDescription:
      '命中时造成26伤害和受伤状态、获得老鼠的小地图位置4.85秒，同时牛仔汤姆获得持续5.85秒的12%加速。小仙人掌球最多存在1.5秒。',
    create: '由牛仔汤姆-仙人掌弹弓第1、2段射出，或由{大仙人掌球}分裂。',
  },
  大仙人掌球: {
    entitytype: '投射物类' as const,
    characterName: '牛仔汤姆',
    skillname: '仙人掌弹弓',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '在碰触实体时爆炸，对周围的敌方造成伤害和眩晕，同时分裂成10颗{小仙人掌球}飞向不同方向。',
    detailedDescription:
      '在碰触实体时爆炸，对周围的敌方造成[60伤害](不造成受伤)和3.5秒眩晕，同时分裂成10颗小仙人掌球飞向不同方向。',
    create: '由牛仔汤姆-仙人掌弹弓Lv.3时的第3段射出。',
  },
  皇家火炮: {
    entitytype: '召唤物类' as const,
    characterName: '侍卫汤姆',
    skillname: '皇家火炮',
    move: false,
    gravity: false,
    collsion: false,
    description:
      '侍卫汤姆可以拖动技能键远程操纵火炮发射，命中时对老鼠造成眩晕和伤害，同时侍卫汤姆获得大幅加速和护盾。火炮可射击数次，有内置CD。',
    detailedDescription:
      '侍卫汤姆可以拖动技能键远程操纵火炮发射，命中时对老鼠造成0.56秒眩晕和[50伤害](不受攻击增伤加成)、移除其[部分增益](隐身、兴奋、远视；天宫图香炉的远视；除了尼宝三级翻滚和魔术师三级卡牌以外的技能与被动隐身)；同时侍卫汤姆加速49%并获得两层护盾，效果持续2.96秒。火炮可射击3/3/7次，每次射击之间有最短间隔。Lv.3火炮对命中的老鼠额外施加减速、禁用其技能和道具键3.5秒。',
    create: '由侍卫汤姆-皇家火炮召唤。',
  },
  胡椒粉罐头: {
    entitytype: '道具类' as const,
    characterName: '米特',
    skillname: '胡椒粉罐头',
    aliases: ['胡椒粉', '胡椒罐'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '米特将其拿在手中时持续受到轻微伤害，并因此获得“刺激”状态，增加移速和跳跃速度。再次使用技能将投掷胡椒粉、造成伤害并形成胡椒粉烟雾，持续对范围内角色造成伤害。米特在烟雾中也会获得“刺激”状态。',
    detailedDescription:
      '米特将其拿在手中时持续受到轻微伤害，并因此获得“刺激”状态，增加移速和跳跃速度。再次使用技能将投掷胡椒粉、造成伤害，落地后破碎并形成胡椒粉烟雾，[持续对范围内角色造成伤害](不会破米特的护盾)、在停止接触后会残留约3秒。米特在烟雾中也会获得“刺激”状态。Lv.3时，胡椒粉罐头伤害频率会更高,且米特在“刺激”状态下获得50%减伤并提高绑火箭速度50%。',
    create: '通过米特-胡椒粉罐头召唤。',
  },
  饭盒: {
    entitytype: '召唤物类' as const,
    characterName: '米特',
    skillname: '饭盒陷阱',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '被老鼠踩中或被砸中后，饭盒会爆炸，对附近所有老鼠造成伤害和眩晕，并使其暴露小地图视野、大量减少推速。',
    detailedDescription:
      '被老鼠踩中或被投掷物砸中后，饭盒会爆炸，对附近所有老鼠造成伤害和眩晕，并使其暴露小地图视野、大量减少推速，持续10秒。Lv.2及以上的饭盒伤害增加，且爆炸后留下食物，米特触碰后会获得持续Hp恢复效果。',
    create: '通过米特-饭盒陷阱召唤。',
  },
  套索: {
    entitytype: '投射物类' as const,
    characterName: '塔拉',
    skillname: '牛仔鞭索',
    move: true,
    gravity: true,
    collsion: false,
    description: '若套中老鼠，对老鼠造成伤害和减速；再次点击按钮使塔拉位移向该老鼠位置。',
    detailedDescription:
      '套索存在时间0.75秒，存在时间内最大飞行距离为1750，对套中的老鼠造成[30伤害](受其他攻击增伤影响)并减速20%；在使用技能后进入2.9秒技能读条（若未套中老鼠则提前结束读条），套中老鼠后可再次点击技能，塔拉将[以1850的速度位移向该老鼠位置](位移期间获得无法选中效果，位移时间最多4.9秒，超过时间将会被直接传送至老鼠旁边)。当塔拉用技能位移到老鼠旁边时或套中老鼠4.9秒后，解除[套索效果](包括老鼠受到的减速效果，以及塔拉与老鼠之间连接的套绳贴图效果)。Lv.2及以上的套索命中敌方时，[对其造成2.9秒眩晕](本技能造成伤害与造成眩晕的时机不同，所以即便该老鼠因该次伤害而进入"铁血"状态，也仍会受到后续的眩晕影响)，并使塔拉的移速提高18.5%，持续5秒。',
    create: '由塔拉-牛仔鞭索在手中没有老鼠时掷出。',
  },
  天空扶梯: {
    entitytype: '召唤物类' as const,
    characterName: '库博',
    skillname: '虚幻梦影',
    aliases: ['天梯'],
    move: false,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '在地面时：任何角色均可与其交互进入天堂，最多同时存在2个。\n在天堂时：猫咪与其交互可获知所有老鼠的位置，并任意选择房间传送；老鼠则可传送到随机洞口。',
    detailedDescription:
      '判定和交互区域为矩形。\n在地面时：所有角色都可以[与天梯交互并传送到天堂](该交互优先级极低)，最多同时存在2个，达到上限则销毁最早生成的1个。\n在天堂时：猫咪与其交互可[打开传送面板](显示所有老鼠的位置，可任意选择房间传送；该交互不打断移动)；老鼠与其交互将被传送到随机洞口。',
    create: '通过库博-虚幻梦影召唤。',
  },
  追求者: {
    entitytype: '召唤物类' as const,
    characterName: '凯特',
    skillname: '追求者出击',
    aliases: ['舔狗'],
    move: true,
    gravity: false,
    collsion: false,
    description: '奔跑时对碰触的老鼠造成伤害。',
    detailedDescription:
      '奔跑时对碰触的老鼠造成伤害。Lv.3追求者额外造成[25](受其他攻击增伤影响)的爆炸伤害和控制。',
    create: '通过凯特-追求者出击召唤。',
  },
};

const catEntitiesWithImages: Record<string, Entity> = Object.fromEntries(
  Object.entries(catEntitiesDefinitions).map(([entityName, entity]) => [
    entityName,
    {
      ...entity,
      name: entityName,
      factionId: 'cat' as const,
      imageUrl: getCatEntityImageUrl(entityName),
    },
  ])
);

export default catEntitiesWithImages;
