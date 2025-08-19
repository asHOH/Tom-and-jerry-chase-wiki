import { Entity, EntityDefinition } from './types';

export const getMouseEntityImageUrl = (name: string): string => {
  return `/images/mouseEntities/${encodeURIComponent(name)}.png`;
};

const mouseEntitiesDefinitions: Record<string, EntityDefinition> = {
  '金币(道具)': {
    entitytype: '道具类' as const,
    characterName: '航海士杰瑞',
    move: true,
    gravity: true,
    collsion: true,
    ignore: ['道具', '平台'],
    description:
      '能穿过大部分平台，命中敌方造成眩晕，被命中的敌方短暂免疫该道具效果。通过Lv.3飞翔金币召唤的金币命中敌方会连续造成两段伤害和眩晕，但猫咪每次只会受到一段伤害。',
    detailedDescription:
      '能穿过大部分平台，命中敌方时造成2秒眩晕,但被命中的敌方在眩晕期间及眩晕结束后1秒内免疫该道具效果。金币不会因虚弱而从手中掉落。通过Lv.3飞翔金币召唤的金币命中敌方会连续造成两段35伤害，但猫咪每次只会受到一段伤害（或只能击破一层护盾）。',
    create: '通过航海士杰瑞-飞翔金币召唤。当该技能达到Lv.3时，召唤的金币能造成伤害。',
  },
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
  '小鞭炮(鸟哨)': {
    entitytype: '投射物类' as const,
    characterName: '杰瑞',
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
  火箭筒: {
    entitytype: '投射物类' as const,
    characterName: '泰菲',
    aliases: ['炮', '炮弹'],
    move: true,
    gravity: true,
    collsion: true,
    description:
      '直接命中敌方时造成一段伤害，命中后爆炸对一定范围内敌方造成伤害和眩晕。火箭筒可对墙缝造成伤害。爆炸产生的冲击波可以炸飞老鼠夹、叉子等道具。',
    detailedDescription:
      '直接命中敌方时造成50伤害，可触发投掷类知识卡和特技，该伤害先于爆炸伤害结算；命中敌方角色/墙壁/平台/其他道具后爆炸，对一定范围内敌方造成15伤害和1.5秒爆炸眩晕；。火箭筒技能等级达到Lv.2时，发射的火箭筒爆炸时对周围的伤害提高到30，爆炸眩晕时间提高到2.1秒。火箭筒可对墙缝造成伤害。爆炸产生的冲击波可以炸飞老鼠夹、叉子等道具。',
    create: '由泰菲-火箭筒技能射出。',
    detailedCreate: '由泰菲-火箭筒技能射出。Lv.2及以上的火箭筒造成的伤害和控制时间更长。',
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
