import { Entity, EntityDefinition } from './types';

export const getMouseEntityImageUrl = (name: string): string => {
  return `/images/mouseEntities/${encodeURIComponent(name)}.png`;
};

const mouseEntitiesDefinitions: Record<string, EntityDefinition> = {
  '金丝雀(鸟哨)': {
    entitytype: 'NPC类' as const,
    characterName: '杰瑞',
    skillname: '鸟哨',
    move: true,
    gravity: false,
    collsion: false,
    description:
      '金丝雀会来回盘旋，持续向下方投掷小鞭炮(鸟哨)，轰炸一段时间后自行飞离。同一房间内最多只能有1只由鸟哨召唤的金丝雀。',
    detailedDescription:
      '金丝雀会来回盘旋，每0.8/0.75/0.6秒向下方投掷小鞭炮(鸟哨)，轰炸一段时间后自行飞离。同一房间内最多只能有1只由鸟哨召唤的金丝雀。',
    create: '由杰瑞-鸟哨召唤。',
  },
  '小鞭炮(鸟哨)': {
    entitytype: '投射物类' as const,
    characterName: '杰瑞',
    skillname: '鸟哨',
    aliases: ['炸弹', '鸟哨炸弹'],
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '命中敌方时爆炸，造成伤害和眩晕，被命中的目标短暂免疫该道具效果；掉落一定时间后也会自行爆炸。',
    detailedDescription:
      '命中敌方时造成55伤害和2秒爆炸眩晕，可触发投掷类知识卡和特技，并会获得300商店金钱，但被命中的目标在眩晕期间及眩晕结束后1秒内免疫该道具效果。掉落一定时间后也会自行爆炸，不造成伤害和眩晕。该道具外观酷似小鞭炮，但它无法被拾取、不会攻击友方、也不会造成范围伤害，这点与普通的小鞭炮不同。',
    create: '由杰瑞-鸟哨召唤的金丝雀进行投掷。',
  },
  '烟雾(烟雾弹)': {
    entitytype: '其它' as const,
    characterName: '侦探杰瑞',
    skillname: '烟雾弹',
    move: false,
    gravity: false,
    collsion: false,
    description:
      '烟雾会遮蔽敌方视野，使其无法看到烟雾背后的情况，且无法查看小地图；对我方则是半透明的。',
    detailedDescription:
      '烟雾会遮蔽敌方视野，使其无法看到烟雾背后的情况，且无法查看小地图；对我方则是半透明的，持续4.8/4.8/6.5秒。Lv.2烟雾弹使友方在烟雾范围内加速20%，跳跃高度提升50%，推速固定提升5.75%/秒。Lv.3烟雾弹使敌方在烟雾范围内减速20%，跳跃高度降低20%，爪刀CD延长50%，无法使用技能和道具。',
    create: '由侦探杰瑞-烟雾弹召唤。也可以通过莱恩-蘸水笔在蓝图上以■+■配方合成。',
  },
  干扰器: {
    entitytype: '投射物类' as const,
    characterName: '侦探杰瑞',
    skillname: '视觉干扰器',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台'],
    description: '干扰器落地时，使小范围内的友方老鼠获得短暂隐身。',
    detailedDescription:
      '干扰器落地时，使小范围内的友方老鼠获得3.5秒隐身。Lv.1干扰器提供的隐身会被部分交互行为破除。Lv.2干扰器提供的隐身不再会被交互破除，且能免疫香水反向、烟雾失明、魅力香水烟雾的效果。Lv.3干扰器提供的隐身附带移速提高20%的效果。',
    create: '由侦探杰瑞-视觉干扰器召唤。',
  },
  '金币(道具)': {
    entitytype: '道具类' as const,
    characterName: '航海士杰瑞',
    skillname: '飞翔金币',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '金币命中敌方造成眩晕，被命中的敌方短暂免疫该道具效果。金币不会因虚弱而从手中掉落。',
    detailedDescription:
      '金币命中敌方时造成2秒眩晕,但被命中的敌方在眩晕期间及眩晕结束后1秒内免疫该道具效果。金币不会因虚弱而从手中掉落。Lv.3金币命中敌方会连续造成两段35伤害，但猫咪每次只会受到一次伤害（可击破两层护盾，或击破一层护盾并造成一次伤害）。金币造成的伤害可受攻击增伤影响。',
    create: '通过航海士杰瑞-飞翔金币召唤。',
  },
  '火药桶(召唤物)': {
    entitytype: '召唤物类' as const,
    characterName: '航海士杰瑞',
    skillname: '火药桶',
    aliases: ['桶', '炸药桶'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '延迟数秒后爆炸，对周围造成不分敌我的伤害和眩晕，对墙缝造成伤害，并炸毁范围内的火箭。猫咪可以通过交互拆除火药桶，老鼠可以通过交互推动火药桶。',
    detailedDescription:
      '延迟8/8/3秒后爆炸，对周围造成不分敌我的1/25/50伤害和眩晕，对墙缝造成20伤害，并炸毁范围内的火箭。猫咪可以通过交互拆除火药桶，老鼠可以通过交互推动火药桶。火药桶造成的伤害可受攻击/破坏增伤影响。',
    create:
      '通过航海士杰瑞-火药桶召唤。也可以通过仙女鼠-魔镜召唤咒Lv.3概率许愿获得，或通过莱恩-蘸水笔在蓝图上以▲+●配方合成。',
  },
  火炮: {
    entitytype: '召唤物类' as const,
    characterName: '航海士杰瑞',
    skillname: '舰艇火炮',
    move: false,
    gravity: false,
    collsion: true,
    ignore: ['平台'],
    description:
      '老鼠可通过交互键进入，通过投掷键发射，对碰到的敌方造成伤害与眩晕，碰到绑在火箭上的队友时自动进行救援交互。火炮内不会被投掷道具及部分技能命中。若火炮内老鼠进入虚弱，则火炮会提前消失。同一房间最多出现两个火炮。火炮持续数秒后消失。',
    detailedDescription:
      '老鼠可通过交互键进入，通过投掷键发射，对碰到的敌方造成50伤害与1.5秒眩晕，碰到绑在火箭上的队友时自动进行救援交互。火炮内不会被投掷道具及部分技能命中。若火炮内老鼠进入虚弱，则火炮会提前消失。同一房间最多出现两个火炮。火炮持续15/25/25秒后消失。火炮造成的伤害可受乘坐者的攻击增伤影响。',
    create: '通过航海士杰瑞-舰艇火炮召唤。',
  },
  攻击战旗: {
    entitytype: '召唤物类' as const,
    characterName: '国王杰瑞',
    skillname: '国王战旗',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '碰触的友方攻击增伤提高一段时间。被碰触若干次后获得强化，之后碰触的友方额外使墙缝增伤提高，并免疫受伤。获得战旗效果后的15秒内无法再次获得同类型的效果。同一时间游戏内只能存在一面战旗。',
    detailedDescription:
      '碰触的友方攻击增伤提高35，持续10秒。被其他队友碰触2/1/0次后获得强化，之后碰触的友方额外使墙缝增伤提高2，并免疫受伤。获得战旗效果后的15秒内无法再次获得同类型的效果（五种战旗共用CD，未强化和强化效果分别计算CD）。同一时间游戏内只能存在一面战旗。',
    create: '通过国王杰瑞-国王战旗召唤。',
  },
  救援战旗: {
    entitytype: '召唤物类' as const,
    characterName: '国王杰瑞',
    skillname: '国王战旗',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '碰触的友方救援速度短暂提高。被碰触若干次后获得强化，之后碰触的友方额外获得瞬息救援能力（碰触火箭自动救援成功）。获得战旗效果后的15秒内无法再次获得同类型的效果。同一时间游戏内只能存在一面战旗。',
    detailedDescription:
      '碰触的友方救援速度提高100%，持续5秒。被其他队友碰触2/1/0次后获得强化，之后碰触的友方额外获得瞬息救援能力（碰触火箭自动救援成功）。获得战旗效果后的15秒内无法再次获得同类型的效果（五种战旗共用CD，未强化和强化效果分别计算CD）。同一时间游戏内只能存在一面战旗。',
    create: '通过国王杰瑞-国王战旗召唤。',
  },
  守护战旗: {
    entitytype: '召唤物类' as const,
    characterName: '国王杰瑞',
    skillname: '国王战旗',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '碰触的友方解除虚弱，且Hp低于上限的30%时获得短暂恢复效果。被碰触若干次后获得强化，之后碰触的友方额外获得一层护盾。获得战旗效果后的15秒内无法再次获得同类型的效果。同一时间游戏内只能存在一面战旗。',
    detailedDescription:
      '碰触的友方解除虚弱，且Hp低于上限的30%时瞬间解除反向、失明、受伤等异常状态，获得7.5Hp/秒的恢复效果且移速提高25%，持续2秒。被其他队友碰触2/1/0次后获得强化，之后碰触的友方额外获得一层护盾，持续4秒。获得战旗效果后的15秒内无法再次获得同类型的效果（五种战旗共用CD，未强化和强化效果分别计算CD）。同一时间游戏内只能存在一面战旗。',
    create: '通过国王杰瑞-国王战旗召唤。',
  },
  感知战旗: {
    entitytype: '召唤物类' as const,
    characterName: '国王杰瑞',
    skillname: '国王战旗',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '碰触的友方隐藏自身在敌方小地图上的位置一段时间。被碰触若干次后获得强化，之后碰触的友方额外短暂获知猫的位置。获得战旗效果后的15秒内无法再次获得同类型的效果。同一时间游戏内只能存在一面战旗。',
    detailedDescription:
      '碰触的友方隐藏自身在敌方小地图上的位置，持续10秒。被其他队友碰触2/1/0次后获得强化，之后碰触的友方额外获知猫的位置，持续5秒。获得战旗效果后的15秒内无法再次获得同类型的效果（五种战旗共用CD，未强化和强化效果分别计算CD）。同一时间游戏内只能存在一面战旗。',
    create: '通过国王杰瑞-国王战旗召唤。',
  },
  灵巧战旗: {
    entitytype: '召唤物类' as const,
    characterName: '国王杰瑞',
    skillname: '国王战旗',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '碰触的友方短暂提高跳跃高度。被碰触若干次后获得强化，之后碰触的友方获得二段跳状态。获得战旗效果后的15秒内无法再次获得同类型的效果。同一时间游戏内只能存在一面战旗。',
    detailedDescription:
      '碰触的友方提高50%跳跃高度，持续5秒。被其他队友碰触2/1/0次后获得强化，之后碰触的友方获得二段跳状态。获得战旗效果后的15秒内无法再次获得同类型的效果（五种战旗共用CD，未强化和强化效果分别计算CD）。同一时间游戏内只能存在一面战旗。',
    create: '通过国王杰瑞-国王战旗召唤。',
  },
  '火箭筒(投射物)': {
    entitytype: '投射物类' as const,
    characterName: '泰菲',
    skillname: '火箭筒',
    aliases: ['炮', '炮弹'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '直接命中敌方时造成一段伤害，命中后爆炸对一定范围内敌方造成伤害和眩晕。火箭筒可对墙缝造成伤害。爆炸产生的冲击波可以炸飞老鼠夹、叉子等道具。',
    detailedDescription:
      '直接命中敌方时造成50伤害，该伤害先于爆炸伤害结算且可触发投掷类知识卡和特技；命中敌方角色/墙壁/平台/其他道具后爆炸，对一定范围内敌方造成15/30/30伤害和1.5/2.1/2.1秒爆炸眩晕。火箭筒可对墙缝造成伤害。爆炸产生的冲击波可以炸飞老鼠夹、叉子等道具。火箭筒造成的伤害可受攻击增伤影响。',
    create: '由泰菲-火箭筒技能射出。',
  },
  感应雷: {
    entitytype: '召唤物类' as const,
    characterName: '泰菲',
    skillname: '隐形感应雷',
    aliases: ['地雷', '隐形雷'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '被放置一小段时间后进入隐身状态，敌方靠近时现身，并在短暂延迟后飞向敌方并爆炸，对小范围内的敌方造成伤害和眩晕，对墙缝造成伤害，对范围内所有角色产生小幅度的爆炸击退效果。感应雷被道具击中会原地倒计时并爆炸。感应雷30秒后自然消失。',
    detailedDescription:
      '被放置一小段时间后进入隐身状态，敌方靠近时现身，并在1.5秒延迟后飞向敌方并爆炸，对小范围内的敌方造成50/50/80伤害和1.9秒爆炸眩晕，对墙缝造成10/10/15伤害，对范围内所有角色产生小幅度的爆炸击退效果。感应雷被道具击中会原地倒计时并爆炸。感应雷30秒后自然消失。Lv.2感应雷可击落敌方手中的老鼠和道具。',
    create: '由泰菲-隐形感应雷技能召唤。也可以通过莱恩-蘸水笔在蓝图上以●+■配方合成。',
  },
  长枪: {
    entitytype: '投射物类' as const,
    characterName: '剑客泰菲',
    skillname: '剑客长枪',
    aliases: ['长矛'],
    move: true,
    gravity: false,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '对触碰的敌方造成伤害和控制效果，可携带触碰的1名友方角色和1个指定道具，以及再次使用技能的剑客泰菲一同飞行。长枪的速度和部分特性可随蓄力时间改变。携带的易碎道具碰到敌方自动产生投掷效果。',
    detailedDescription:
      '对触碰的敌方造成伤害和控制效果，可携带触碰的1名友方角色和1个易碎道具(玻璃杯/碗/盘子/扁盘/灰花瓶/蓝花瓶/香水瓶/胡椒瓶)或打开的老鼠夹，以及再次使用技能的剑客泰菲一同飞行。携带的易碎道具碰到敌方自动产生投掷效果。长枪的速度和部分特性可随蓄力时间改变。初始可对敌方造成50伤害（可受攻击增伤加成）和2.4秒20%减速。Lv.2及以上时，蓄力达到2/3但未满时改为对敌方造成50伤害（可受攻击增伤加成）和2.8秒眩晕（该眩晕与灰花瓶眩晕类似，会受到连控保护，详见灰花瓶界面），蓄满力时改为造成75伤害（不受攻击增伤加成）和2秒爆炸眩晕。',
    create: '由剑客泰菲-剑客长枪召唤。',
  },
  大仙人掌: {
    entitytype: '召唤物类' as const,
    characterName: '牛仔杰瑞',
    skillname: '仙人掌',
    aliases: ['仙人掌'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '被猫咪踩踏时消失，并对其造成短暂硬直，使其移速降低且每秒受到伤害，减速效果可叠加；被老鼠踩踏数次后消失；存在较长时间后会自然消失。同一角色踩踏有内置CD。',
    detailedDescription:
      '被猫咪踩踏时消失，并对其造成1.2/1.2/2.2秒硬直，移速降低15/20/25%，每秒受到7.5/10/10无来源伤害（共计15/40/90伤害），持续3/5/10秒，减速效果可叠加最多3层；被老鼠踩踏2/1/1次后消失；存在90秒后会自然消失。同一角色踩踏大/小仙人掌后，在3秒内不会踩踏其他大/小仙人掌。Lv.2及以上的大仙人掌在消失时（自然消失除外），在周围产生3个小仙人掌，大/小仙人掌的减速和伤害效果分别独立计算。场上存在持有西部风情Lv.3的牛仔杰瑞时，现有和之后召唤的所有大/小仙人掌都会延长控制时间（无论所属角色是谁）。',
    create: '由牛仔杰瑞-仙人掌召唤。',
  },
  小仙人掌: {
    entitytype: '召唤物类' as const,
    characterName: '牛仔杰瑞',
    skillname: '仙人掌',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '被猫咪踩踏时消失，并对其造成短暂硬直，使其移速降低且每秒受到伤害，减速效果可叠加；被老鼠踩踏数次后消失；存在较长时间后会自然消失。同一角色踩踏有内置CD。',
    detailedDescription:
      '被猫咪踩踏时消失，并对其造成0.8秒硬直，移速降低13%，每秒受到7.5无来源伤害（共计15伤害），持续3秒，减速效果可叠加最多3层，大/小仙人掌的减速和伤害效果分别独立计算；被老鼠踩踏2次后消失；存在90秒后会自然消失。同一角色踩踏大/小仙人掌后，在3秒内不会踩踏其他大/小仙人掌。场上存在持有西部风情Lv.3的牛仔杰瑞时，现有和之后召唤的所有大/小仙人掌都会延长控制时间（无论所属角色是谁）。',
    create: '牛仔杰瑞-仙人掌Lv.2及以上时，召唤的大仙人掌在非自然消失时产生3个小仙人掌。',
  },
  '地狱裂隙(衍生物)': {
    entitytype: '其它' as const,
    characterName: '恶魔杰瑞',
    skillname: '地狱裂隙',
    move: false,
    gravity: false,
    collsion: false,
    description: '用于标记恶魔杰瑞传送回的位置，技能结束后自然消失。',
    create: '恶魔杰瑞-地狱裂隙在使用时自动生成。',
  },
  恶魔之门: {
    entitytype: '召唤物类' as const,
    characterName: '恶魔杰瑞',
    skillname: '三叉戟',
    aliases: ['传送门', '地狱之门'],
    move: false,
    gravity: false,
    collsion: false,
    description:
      '两个恶魔之门间会建立连接，友方可与其交互，被传送并获得一种随机强化效果，效果持续时间随恶魔之门间的距离增大而增大（有下限和上限）；敌方碰到恶魔之门后会被强制传送（短时间内不会重复触发）；处于被投掷状态的道具碰到恶魔之门也会被传送。恶魔之门持续一定时间后消失，进行传送会使恶魔之门的持续时间减少。',
    detailedDescription:
      '由同一次技能创造的两个恶魔之门间会建立连接，友方可与其交互，被传送并获得一种随机强化效果，效果持续时间随恶魔之门间的距离增大而增大（下限15/15/25秒，上限45秒）；敌方碰到恶魔之门后会被强制传送（10秒内不会重复触发）；处于被投掷状态的道具碰到恶魔之门也会被传送。未建立连接的恶魔之门在技能结束时消失；建立连接的恶魔之门持续一定时间后一同消失，进行传送会使恶魔之门的持续时间减少。Lv.2以上的地狱之门会使被传送的敌方受到60无来源伤害。\n友方可通过恶魔之门获得的强化效果列表如下：\n1：主动技能CD减少70%；\n2：武器技能CD减少70%；\n3：推奶酪速度提高100%；\n4：攻击增伤提升50；\n5：获得一层护盾；\n6：获得远视；\n7：获得隐身；\n8：获得5Hp/秒的恢复效果，移速提高20%，跳跃高度提高50%。',
    create: '由恶魔杰瑞-三叉戟召唤。',
  },
  /*--------------------------------------20250820 记录留档-------------------------------------------------*/
  蓝色小淘气: {
    entitytype: '道具类' as const,
    characterName: '恶魔泰菲',
    aliases: ['蓝恶魔', '蓝色小恶魔'],
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台', '墙壁'],
    description:
      '被投掷后留在原地自动索敌，范围内出现敌方时自动飞向对方，命中时造成20基础伤害，并使敌方3秒内无法使用技能和道具。',
    create: '通过恶魔泰菲-小淘气转化盘子/扁盘/玻璃杯/碗获得。',
  },
  红色小淘气: {
    entitytype: '道具类' as const,
    characterName: '恶魔泰菲',
    aliases: ['红恶魔', '红色小恶魔'],
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台', '墙壁'],
    description:
      '投掷轨迹为一条直线，可穿墙（无法穿越部分实体类的墙体，如地面和部分障碍物等），命中时向右击退敌方。',
    create: '通过恶魔泰菲-小淘气转化冰块/灰花瓶/蓝花瓶获得。',
  },
  绿色小淘气: {
    entitytype: '道具类' as const,
    characterName: '恶魔泰菲',
    aliases: ['绿恶魔', '绿色小恶魔'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '具有高尔夫球的特点，但有比高尔夫球有更大的弹性。被恶魔泰菲投掷时，命中敌方不会消耗恶魔泰菲的黑暗印记。',
    create: '通过恶魔泰菲-小淘气转化高尔夫球获得。',
  },
  红色卡牌: {
    entitytype: '道具类' as const,
    characterName: '魔术师',
    skillname: '奇思妙想',
    aliases: ['红牌', '红色纸牌'],
    move: true,
    gravity: true,
    collsion: false,
    description:
      '可穿墙且被投掷时的初速度较高，命中目标被强制传送一段距离且改变朝向，立刻受到伤害并掉落手中道具，然后禁用技能且移速降低一段时间。',
    detailedDescription:
      '可穿墙且被投掷时的初速度较高，使命中的敌方向卡牌飞行方向传送80距离且改变角色朝向，立刻受到65点伤害并掉落手中道具，6秒内禁用技能且减速18.5%。',
    create: '通过魔术师-奇思妙想召唤，或通过魔术师-魔术戏法Lv.1效果自动生成。',
  },
  黄色卡牌: {
    entitytype: '道具类' as const,
    characterName: '魔术师',
    aliases: ['黄牌', '黄色纸牌'],
    move: true,
    gravity: true,
    collsion: false,
    description:
      '可穿墙且被投掷时的初速度较高，命中目标被强制传送一段距离且改变朝向，获得间歇性的反向+高额移速，持续一段时间。',
    detailedDescription:
      '可穿墙且被投掷时的初速度较高，使命中的敌方向卡牌飞行方向传送80距离且改变角色朝向，每2秒获得1.5秒反向且移速增加150%，持续7秒。',
    create: '通过魔术师-奇思妙想召唤，或通过魔术师-魔术戏法Lv.1效果自动生成。',
  },
  蓝色卡牌: {
    entitytype: '道具类' as const,
    characterName: '魔术师',
    aliases: ['蓝牌', '蓝色纸牌'],
    move: true,
    gravity: true,
    collsion: false,
    description:
      '可穿墙且被投掷时的初速度较高，命中目标被强制传送一段距离且改变朝向，获得一段时间的失重状态且降低跳跃速度，但可在空中进行跳跃。',
    detailedDescription:
      '可穿墙且被投掷时的初速度较高，使命中的敌方向卡牌飞行方向传送80距离且改变角色朝向，获得8秒失重状态，并且降低跳跃速度，但可在空中进行跳跃。',
    create: '通过魔术师-奇思妙想召唤，或通过魔术师-魔术戏法Lv.1效果自动生成。',
  },
  闪耀足球: {
    entitytype: '投射物类' as const,
    characterName: '拿坡里鼠',
    aliases: ['足球'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '命中敌方时造成“强光耀眼”状态（受到伤害，并且失明，降低交互速度，此期间受来自拿坡里鼠的伤害会眩晕2秒，眩晕有内置CD）。足球存在时间与拿坡里鼠蓄力时间有关。足球可以反复弹跳。',
    detailedDescription:
      '命中敌方时造成“强光耀眼”状态（受到30伤害，并且失明，降低25%交互速度，此期间受来自同一个拿坡里鼠的伤害会眩晕2秒，眩晕有内置CD，该状态持续8秒，免疫失明的技能也会完全免疫该状态效果），且可触发知识卡-缴械/投手。拿坡里鼠踢出足球时，有效蓄力时间越长，足球存在时间越长（足球持续时间和速度由蓄力时间阶段性决定，并非线性关系)。足球碰到道具/墙壁/地板后会被反弹，可以反复弹跳。',
    create: '由拿坡里鼠-世界波蓄力并踢出。',
  },
  战矛: {
    entitytype: '投射物类' as const,
    characterName: '蒙金奇',
    aliases: ['矛', '长矛'],
    move: true,
    gravity: true,
    collsion: true,
    description: '命中敌方或墙缝造成伤害。',
    detailedDescription:
      '命中敌方造成30伤害（无法受到攻击增伤加成），命中墙缝造成5点伤害，可触发投掷类知识卡和特技（知识卡-追风除外）。',
    create: '由蒙金奇-军团战车在技能期间通过技能键掷出。',
  },
  小电球: {
    entitytype: '道具类' as const,
    characterName: '朵朵',
    aliases: ['电球'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '命中敌方造成电击伤害和眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加，可叠加）。可二次充能。',
    detailedDescription:
      '命中敌方造成70电击伤害和1.2秒眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加15，持续9.9秒，可叠加。感电结束时获得5秒电免疫状态，免疫电击伤害），命中墙缝造成1.5伤害。可像其他投掷物一样被朵朵-强能灌注充能，充能效果相同。',
    create: '通过朵朵-强能灌注Lv.3在非过载状态下召唤。',
  },
  大电球: {
    entitytype: '道具类' as const,
    characterName: '朵朵',
    aliases: ['电球'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '效果与小电球相同：命中敌方造成电击伤害和眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加，可叠加）。可二次充能。',
    detailedDescription:
      '效果与小电球相同：命中敌方造成70电击伤害和1.2秒眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加15，持续9.9秒，可叠加。感电结束时获得5秒电免疫状态，免疫电击伤害），命中墙缝造成1.5伤害。可像其他投掷物一样被朵朵-强能灌注充能，充能效果相同。',
    create: '通过朵朵-强能灌注Lv.3在过载状态下召唤。',
  },
  电池: {
    entitytype: '道具类' as const,
    characterName: '朵朵',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '可被朵朵碰触，解除虚弱并恢复Hp和电量，且对周围造成电击伤害和眩晕；也可被其他老鼠拾取和投掷，命中敌方时破碎并造成电击伤害和眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加，可叠加）。电池存在一定时间后自行消失。',
    detailedDescription:
      '可被朵朵碰触，解除朵朵的虚弱状态，并立即恢复其50Hp和100电量，且对自身半径250范围内造成30电击伤害和0.7秒眩晕；也可被其他老鼠拾取和投掷，命中敌方时破碎并造成70电击伤害和0.7秒眩晕（电击伤害会对目标附加感电，使受到的电击伤害增加15，持续9.9秒，可叠加。感电结束时获得5秒电免疫状态，免疫电击伤害）。被其他老鼠投掷的电池在命中敌方或碰到平台、地面时将会消失，电池存在12秒后也会自行消失。可因牛仔汤姆-斗牛等技能碰撞而损毁并消失。',
    create: '朵朵-能源装置达到Lv.2后，朵朵进入虚弱状态时自动召唤并弹出。',
  },
  金币符: {
    entitytype: '投射物类' as const,
    characterName: '霜月',
    aliases: ['分金符', '符', '纸符'],
    move: true,
    gravity: true,
    collsion: false,
    description: '命中敌方造成伤害，并扣除一定局内金币。可穿墙且被投掷时的初速度较高。',
    detailedDescription:
      '命中敌方造成50伤害，并扣除500局内金币。被投掷时无前摇，可穿墙且被投掷时的初速度较高，可触发投掷类知识卡和特技。',
    create: '由霜月-滑步踢在跳起且无手持道具的情况下投掷出。',
  },
  定身符: {
    entitytype: '投射物类' as const,
    characterName: '霜月',
    aliases: ['分金符', '符', '纸符'],
    move: true,
    gravity: true,
    collsion: false,
    description: '命中敌方造成伤害和短暂定身状态。可穿墙且被投掷时的初速度较高。',
    detailedDescription:
      '命中敌方造成30伤害和2秒定身状态（无法移动、交互、使用道具或技能，且自身完全失重）。可穿墙且被投掷时的初速度较高，可触发投掷类知识卡和特技。',
    create: '由霜月-滑步踢在跳起且手持部分道具的情况下投掷出。',
    detailedCreate:
      '由霜月-滑步踢在跳起且手持部分道具的情况下投掷出，包括盘子/扁盘/玻璃杯/碗/叉子/高尔夫球/香水瓶/胡椒瓶。',
  },
  '乾坤袋(投射物)': {
    entitytype: '投射物类' as const,
    characterName: '霜月',
    aliases: ['胖呆呆', '袋子'],
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '未落地时可命中猫咪造成减速，或命中墙缝造成伤害；落地后生成乾坤袋(召唤物)。霜月再次使用技能时，乾坤袋(召唤物)变回乾坤袋(道具)，并飞向霜月。',
    detailedDescription:
      '未落地时可命中猫咪使其移速降低40%持续5秒，或命中墙缝造成3伤害，可触发投掷类知识卡和特技；命中敌方角色/墙缝/平台/地面后生成乾坤袋(召唤物)，若因极端情况导致乾坤袋(道具)飞行时间过长，则在飞行数秒后会立刻生成乾坤袋(召唤物)。霜月再次使用技能时，乾坤袋(召唤物)变回乾坤袋(道具)，并飞向霜月。',
    create: '由霜月-乾坤袋在使用时掷出，或是在结束技能时短暂变回。',
  },
  柠檬: {
    entitytype: '投射物类' as const,
    characterName: '表演者•杰瑞',
    move: true,
    gravity: true,
    collsion: true,
    description: '命中敌方造成极少量伤害和减速。',
    detailedDescription: '命中敌方造成2.5伤害并在2.5秒内降低10%移速，可触发投掷类知识卡和特技。',
    create: '表演者•杰瑞-喜剧之王达到Lv.3并触发放飞返场后，其可通过拖拽道具键掷出，有内置CD。',
  },
  '蓝图(投射物)': {
    entitytype: '投射物类' as const,
    characterName: '莱恩',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具'],
    description:
      '命中后或莱恩使用技能时，展开蓝图(场景物)。当莱恩-蓝图达到Lv.3时，命中猫咪会直接将其变为线条猫。',
    detailedDescription:
      '命中敌方/平台/地面、或莱恩再次使用技能时，展开蓝图(场景物)。命中敌方可触发投掷类知识卡和特技。当莱恩-蓝图达到Lv.3时，命中猫咪会直接将其变为线条猫。',
    create: '通过莱恩-蓝图技能丢出。',
  },
  毛线球: {
    entitytype: '投射物类' as const,
    characterName: '梦游杰瑞',
    aliases: ['毛线', '毛线团'],
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '毛线球与梦游杰瑞通过毛线连接。毛线球与敌方碰撞时使其受到减速，拉出的毛线也能使敌方受到减速。毛线球分为抛出、滞留和收回三个阶段。1.抛出：抛出毛线球，无视平台，会被敌方或墙壁反弹，坠落至地面时进入滞留状态；2.滞留：暂时不移动；3.收回：沿着毛线的轨迹进行移动，带回自身碰到的部分道具（有数量上限）和虚弱队友。',
    detailedDescription:
      '毛线球与梦游杰瑞通过毛线连接。毛线球与敌方碰撞时使其受到减速（可触发知识卡-缴械/投手），拉出的毛线也能使敌方受到减速（不触发知识卡）。毛线球分为抛出、滞留和收回三个阶段。1.抛出：抛出毛线球，无视平台，会被敌方或墙壁反弹，坠落至地面时进入滞留状态；2.滞留：暂时不移动；3.收回：沿着毛线的轨迹进行移动，带回自身碰到的奶酪/盘子/高尔夫球/灰花瓶/蓝花瓶/打开的老鼠夹/虚弱队友，携带道具有数量上限（队友不计入在内）。',
    create: '由梦游杰瑞-毛线球技能掷出。',
  },
};

const mouseEntitiesWithImages: Record<string, Entity> = Object.fromEntries(
  Object.entries(mouseEntitiesDefinitions).map(([entityName, entity]) => [
    entityName,
    {
      ...entity,
      name: entityName,
      factionId: 'mouse' as const,
      imageUrl: getMouseEntityImageUrl(entityName),
    },
  ])
);

export default mouseEntitiesWithImages;
