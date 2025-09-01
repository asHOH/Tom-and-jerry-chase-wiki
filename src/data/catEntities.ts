import { Entity, EntityDefinition } from './types';

//(interim) use other image instead of missing image
export const getCatEntityImageUrl = (name: string, specialImageUrl: string | undefined): string => {
  if (!!specialImageUrl) return specialImageUrl;
  return `/images/catEntities/${encodeURIComponent(name)}.png`;
};

const catEntitiesDefinitions: Record<string, EntityDefinition> = {
  手型枪: {
    entitytype: '投射物类' as const,
    characterName: '汤姆',
    skillname: '手型枪',
    move: true,
    gravity: false,
    collsion: false,
    description:
      '水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。如果拉回过程[遇到障碍](包括墙壁、叉子的阻挡，或是某些高低差地形)，则额外造成高额伤害。',
    detailedDescription:
      '释放{手型枪(衍生物)}水平飞出、飞回，对[命中](飞出、飞回过程均可命中；包括因遇到护盾而提前返回的情况；至多只能抓回并眩晕一只老鼠)的老鼠造成[15](同时也享受其他来源的攻击增伤加成)伤害、[将其抓回并眩晕2.5秒](本技能造成伤害与造成眩晕的时机不同，所以即便该老鼠因该次伤害而进入"铁血"状态，也仍会受到后续的拉回和眩晕影响)。如果拉回过程[遇到障碍](包括墙壁、叉子的阻挡，或是某些高低差地形)，则[额外造成70伤害](不受攻击增伤影响；可能会重复产生2-3次伤害，具体成因不详，疑似与墙壁厚度及高低差有关)。抓回及眩晕效果对变身状态的老鼠和虚弱的老鼠也生效。若手型枪命中的老鼠持有护盾，则打破一层护盾并提前返回。',
    create: '由汤姆-手型枪召唤。',
    specialImageUrl: '/images/catSkills/汤姆2-手型枪.png', //ToDo: add this entity's image
  },
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
  旋转桶盖: {
    entitytype: '投射物类' as const,
    characterName: '布奇',
    skillname: '旋转桶盖',
    move: true,
    gravity: true,
    collsion: true,
    description: '伤害并眩晕命中的敌方；友方再次碰到桶盖时将其拾取，使自身受到的伤害降低一段时间。',
    detailedDescription:
      '对命中的敌方造成[55](基础伤害30+布奇攻击增伤25，同时也能受到其他来源的攻击增伤加成)伤害并眩晕1.5秒；友方再次碰到桶盖时将其拾取，使自身受到的伤害降低20，持续6秒。桶盖被投掷时的初速度较快，会被道具和墙壁反弹。Lv.3时的桶盖飞行速度增加；捡到桶盖会获得[霸体](免疫虚弱和绝大多数控制效果)。',
    create: '由布奇-旋转桶盖召唤。',
    specialImageUrl: '/images/catSkills/布奇3-旋转桶盖.png', //ToDo: add this entity's image
  },
  泡泡: {
    entitytype: '召唤物类' as const,
    characterName: '托普斯',
    skillname: '泡泡棒',
    move: true,
    gravity: false,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在一段时间后消失](有老鼠在其内被困住时则不会自然消失)，可以提前被道具砸破。泡泡被砸破或因挣脱破碎时，对周围的老鼠造成伤害和短暂的爆炸眩晕。',
    detailedDescription:
      '[鼠方碰到泡泡时会被困住](若有护盾则消耗一层护盾)，需通过挣脱才能离开。[泡泡存在20秒后消失](有老鼠在其内被困住时则不会自然消失)，可以提前被道具砸破。泡泡被砸破或因挣脱破碎时，对周围的老鼠造成[25](不受攻击增伤影响)伤害和短暂的爆炸眩晕。',
    create: '由布奇-旋转桶盖召唤。',
    specialImageUrl: '/images/catSkills/托普斯2-泡泡棒.png', //ToDo: add this entity's image
  },
  垃圾桶: {
    entitytype: '召唤物类' as const,
    characterName: '莱特宁',
    skillname: '垃圾桶',
    move: true,
    gravity: true,
    collsion: true,
    description:
      '阻挡道路，可被推动且被猫推动时的力度更大，可被爪刀打飞，受到4次攻击后会摧毁。垃圾桶的异味会使老鼠受到减速和伤害。由此造成伤害时会减少爪刀CD。',
    detailedDescription:
      '阻挡道路，可被推动且被猫推动时的力度更大，可被爪刀打飞，受到4次攻击后会摧毁。垃圾桶的异味会使老鼠在进入范围时受到[10/15/25伤害](为固定值伤害，伤害值不受任何增伤/减伤效果影响（仍会受伤害转移影响）)，未离开范围还会受到减速且每秒受到[5/8/12伤害](为固定值伤害，伤害值不受任何增伤/减伤效果影响（仍会受伤害转移影响）)。每造成1次伤害会降低0.6秒爪刀CD，每秒只生效一次。垃圾桶不会对倒地的老鼠造成伤害并降低爪刀CD，在垃圾桶范围内倒地并起身的老鼠不会受到垃圾桶的伤害，但重新进入垃圾桶范围仍会受到伤害。',
    create: '由布奇-旋转桶盖召唤。',
    specialImageUrl: '/images/catSkills/莱特宁2-垃圾桶.png', //ToDo: add this entity's image
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
  飞吻: {
    entitytype: '投射物类' as const,
    characterName: '图多盖洛',
    skillname: '魅惑之吻',
    move: true,
    gravity: false,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '飞吻将锁定并追踪附近的老鼠，持续一段时间后消失，也可被护盾、无敌、虚弱抵消，被[部分地形](包括门、厚墙壁、地面等)阻挡。命中老鼠后，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害；受到其他[伤害或部分控制效果](包括爪刀攻击（指甲油外刀除外）、碎片的僵直、夹子、虚弱、部分变身效果（包括变身饮料效果）等，不包括香水反向、烟雾失明、场景物-轮胎造成的击退等)才能解除被吻效果。',
    detailedDescription:
      '飞吻将锁定并全图追踪半径1200范围内的老鼠，锁定后将追踪且不会更换目标，若追踪途中命中其他老鼠将由其他老鼠承担吻效果；飞吻最多存在18秒，超过18秒将自动消失；飞吻可被护盾、无敌、虚弱抵消，也可被[部分地形](包括门、厚墙壁、地面等)阻挡。飞吻命中老鼠后，其移动、跳跃、搬动奶酪等行为期间会受到持续伤害，通常只有受到其他[伤害或部分控制效果](包括爪刀攻击（指甲油外刀除外）、碎片的僵直、夹子、虚弱、部分变身效果（包括变身饮料效果）等，不包括香水反向、烟雾失明、场景物-轮胎造成的击退等)才能解除被吻效果（{牛仔杰瑞}-{牛仔吉他}Lv.2也可以直接解除）。\n\n伤害：每次跳跃受到1.3/1.8/2.3伤害；移动期间以折合8.3/9.8/11.3Hp每秒的速度受到伤害（Lv.1时伤害为[0.55Hp/次](该数值通过米可主动技能进行测段数，逆推计算获得。其他伤害数据参考了过往玩家的测量结果，可根据该方法测量或通过该数据推算得到单次伤害值)，可据此推断其他数值）；搬动奶酪以折合15/21/32Hp每秒的速度受到伤害（现版本推奶酪不扣血）（{朵朵}的Lv.2{机械身躯}可令伤害减半）。\n升级效果：Lv.2额外附加24.6%减速；Lv.3额外使老鼠无法使用技能。',
    create: '由图多盖洛-魅惑之吻召唤。',
    specialImageUrl: '/images/catSkills/图多盖洛1-魅惑之吻.png', //ToDo: add this entity's image
  },
  香水区域: {
    entitytype: '召唤物类' as const,
    characterName: '图多盖洛',
    skillname: '魅力香水',
    move: true,
    gravity: false,
    collsion: false,
    description:
      '图多盖洛在香水内获得增益，敌方在香水内的基础属性下降。香水区域重叠时持续时间会少量减少。香水区域可被部分受力效果影响而弹飞，沿指定方向飞出地图外。',
    detailedDescription:
      '图多盖洛在香水内获得10/15/20Hp每秒的恢复效果，提高-/25/50攻击增伤，减少-/30/70%爪刀CD，Lv.3时使爪刀范围提高到300；敌方在香水区域内移速降低30/55/80%，跳跃速度降低10/20/30%，推速降低10/30/70%，[造成的伤害降低10/20/30](最低为0)，Lv.3时使其无法使用技能。香水区域重叠时持续时间会少量减少。香水区域可被部分受力效果影响而弹飞，沿指定方向飞出地图外。\n可影响香水区域的效果：{小鞭炮}或{鞭炮束}爆炸；{航海士杰瑞}-{火药桶}或{泰菲}-{火箭筒}的爆炸；{佩克斯}-{魔音贯耳}的弹飞道具效果；{马索尔}-{闪亮营救}传送落地触发的弹飞道具效果；{蒙金奇}-{勇往直前}的撞飞道具效果；{霜月}-{滑步踢}的踢飞道具效果。另外{侦探杰瑞}-{视觉干扰器}可以短暂免疫香水效果。',
    create: '由图多盖洛-魅力香水喷洒后，每隔一段时间或在投掷物/爪刀命中敌方时召唤。',
    specialImageUrl: '/images/catSkills/图多盖洛2-魅力香水.png', //ToDo: add this entity's image
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
  汽水罐: {
    entitytype: '投射物类' as const,
    characterName: '图茨',
    skillname: '汽水罐',
    move: true,
    gravity: false,
    collsion: false,
    description:
      '汽水罐直线行进到终点后改为做旋转运动，持续20秒。盘旋的汽水罐在{喵喵叫}范围内时将会提高运动速度和半径。汽水罐命中老鼠或另一个汽水罐时，对小范围内所有老鼠造成少量伤害和冰冻。',
    detailedDescription:
      '汽水罐基础飞行速度1500，直线飞行1.2秒后改为做旋转运动，盘旋路线半径250，飞行速度1000，持续20秒。盘旋的汽水罐在{喵喵叫}范围内时运动速度每秒提升50，半径每秒增加200，喵喵叫结束后速度和半径将逐渐恢复正常。汽水罐直接命中老鼠时，对[半径175范围所有老鼠](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)造成15伤害、3秒冰冻眩晕和两层喵喵叫减速；两个汽水罐相撞将产生更大范围的冰爆，对[半径350范围内所有老鼠](无法被护盾、霸体、无敌抵挡；火箭上的老鼠也会受影响)造成30伤害、3秒冰冻和四层喵喵叫减速。\n\n喵喵叫减速：使老鼠移速和跳跃速度降低8%，并暴露小地图视野；喵喵叫减速叠加到第五层时对其造成{60}伤害并眩晕2秒，然后清空减速层数。{喵喵叫}减速和{防狼锤}减速之间的层数互通，效果类似，但数值有差异。[由于汽水罐而被施加大于五层喵喵叫减速](例如在已有四层减速时被汽水罐命中，因此达到六层减速)的老鼠，[每多出一层都将额外受到](例如五层为正常的60伤害，六层总共120伤害，以此类推)一次{60}伤害。\n\n升级效果：Lv.2时汽水罐自然消失或相撞会形成[特殊冰面](该冰面最多存在60秒，被踩踏3次或持续时间结束后消失，图茨踩上特殊冰面时不会中断喵喵叫)。鼠滑到会进入[脆弱状态](立刻掉落手中的道具，且推速降低33%，救援队友速度降低73%，并暴露小地图位置，持续8秒)，图茨滑到则会使移速提高100%，持续3秒。',
    create: '由图茨-汽水罐召唤。',
    specialImageUrl: '/images/catSkills/图茨3-汽水罐.png', //ToDo: add this entity's image
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
    entitytype: 'NPC类' as const,
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
      imageUrl: getCatEntityImageUrl(entityName, entity.specialImageUrl),
    },
  ])
);

export default catEntitiesWithImages;
