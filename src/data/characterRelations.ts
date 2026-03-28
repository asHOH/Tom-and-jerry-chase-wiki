import type { FactionId, SingleItem, Trait, TraitRelationKind } from '@/data/types';

const character = (name: string): SingleItem => ({ name, type: 'character' });
const map = (name: string): SingleItem => ({ name, type: 'map' });
const mode = (name: string): SingleItem => ({ name, type: 'mode' });
const knowledgeCard = (name: string, factionId: FactionId): SingleItem => ({
  name,
  type: 'knowledgeCard',
  factionId,
});
const specialSkill = (name: string, factionId: FactionId): SingleItem => ({
  name,
  type: 'specialSkill',
  factionId,
});

type CharacterRelationDefinition = {
  description: string;
  isMinor?: boolean;
  target: SingleItem;
};

type SourceCharacterRelationKind = Exclude<TraitRelationKind, 'counteredBy'>;

type CharacterRelationDefinitions = Partial<
  Record<SourceCharacterRelationKind, readonly CharacterRelationDefinition[]>
>;

export const characterRelationDefinitions = {
  鲍姆: {
    counters: [
      {
        target: character('剑客汤姆'),
        description: '鲍姆本身具备较强干扰能力，且剑客汤姆没有霸体上火箭困难。',
        isMinor: true,
      },
      {
        target: character('如玉'),
        description: '鲍姆爆炸无法触发如玉反击。',
      },
      {
        target: character('斯飞'),
        description:
          '自身具备的高HP使斯飞短时间难以击倒，同时鲍姆主动技能的控制与拆除火箭的能力极大干扰斯飞节奏',
      },
    ],
    counterEachOther: [
      {
        target: character('图茨'),
        description: '鲍姆爆炸会打断喵喵叫，但前提条件是鲍姆需要近身攻击图茨。',
      },
      {
        target: character('兔八哥'),
        description:
          '鲍姆爆炸可换下兔八哥手中的队友，且不会触发宣战，因此拦截和救援较强，但一旦被飞镖远程打中并宣战后就难以救援。',
      },
      {
        target: character('托普斯'),
        description: '二者克制关系主要取决于托普斯操作水平和与分身是否保持距离。',
        isMinor: true,
      },
      {
        target: character('汤姆'),
        description: '主动技能无敌使鲍姆爆炸无自保，但能干扰汤姆无敌上火箭。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '鲍姆的爆炸一定程度上限制了绝地反击的解控，但如果提前使用则可完全免疫爆炸。',
        isMinor: true,
      },
    ],
  },
  '表演者•杰瑞': {
    counters: [
      {
        target: character('天使汤姆'),
        description: '1级被动配合铁血，既可以强救队友，也可以消耗天汤飞行导致不好吸火箭。',
      },
      {
        target: character('图多盖洛'),
        description: '后期高血量且很难被放飞，克制图多的死守。',
        isMinor: true,
      },
      {
        target: character('库博'),
        description: '',
        isMinor: true,
      },
      {
        target: character('图茨'),
        description: '柠檬的二级跳舞时，喵喵叫和汽水瓶都不能给柠檬叠加减速。',
      },
      {
        target: character('斯飞'),
        description: '跳舞中的表演者杰瑞可以免疫咸鱼的效果，并且强大的自保可以主动帮助队友吸闪。',
      },
    ],
  },
  布奇: {
    counters: [
      {
        target: character('米可'),
        description:
          '布奇伤害较高，容易击倒米可；虚弱起身无敌时间长，三级桶盖还有霸体，相对更容易处理米可。',
      },
      {
        target: character('泰菲'),
        description:
          '布奇基础伤害高，能一刀或配合道具快速击倒泰菲；三级桶盖赋予霸体，一定程度上限制泰菲火箭筒、地雷和圆滚滚的发挥。',
      },
      {
        target: character('表演者•杰瑞'),
        description:
          '布奇的高攻击和冲刺的高频伤害可以反制表演者•杰瑞的跳舞，高频控制效果有时也能阻止表演者•杰瑞利用被动和铁血强行救援的意图。',
        isMinor: true,
      },
      {
        target: character('恶魔泰菲'),
        description:
          '布奇的爪刀可以秒恶魔泰菲，冲飞洞口的奶酪也能克制恶菲的游击策略，且加强后可以无限霸体不怕蓝恶魔和绿恶魔，冲刺刀可以秒回家恶菲。',
      },
      {
        target: character('罗宾汉泰菲'),
        description:
          '布奇的爪刀可以秒罗宾汉泰菲，且罗菲在近距离干扰时容易被布奇抓到机会，但罗菲可以远距离拉扯。',
        isMinor: true,
      },
      {
        target: character('侦探泰菲'),
        description:
          '布奇的爪刀可以秒侦探泰菲，冲飞洞口的奶酪也能克制侦菲的游击策略。同时缺少强推和干扰能力，救援也容易被桶盖干扰。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '缴械禁用爪刀，影响关键时刻的衔接。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('魔术漂浮', 'mouse'),
        description: '魔术漂浮能躲开布奇的冲撞。',
        isMinor: true,
      },
      {
        target: specialSkill('冰冻保鲜', 'mouse'),
        description: '冰冻保鲜可以躲过布奇的一波冲撞。',
      },
    ],
  },
  朝圣者泰菲: {
    counters: [
      {
        target: character('苏蕊'),
        description:
          '朝圣者泰菲武器技能的高伤可对苏蕊造成有效伤害，虽然朝圣者泰菲血量较低易被苏蕊反杀，但仍更偏向于克制苏蕊。',
        isMinor: true,
      },
      {
        target: character('图茨'),
        description:
          '图茨本身血量偏低，朝圣者泰菲的高伤易使图茨快速被击倒，且图茨技能均无法对朝圣者泰菲伸出的枪管造成伤害。',
      },
    ],
    counterEachOther: [
      {
        target: character('布奇'),
        description: '二者均拥有较高伤害和较低血量，易击倒对方，但整体来看布奇仍略克朝圣者泰菲。',
      },
      {
        target: character('斯飞'),
        description:
          '朝圣者泰菲的武器高伤害容易一次性给予斯飞重击，同时斯飞无法对因主动技能变身的朝圣者泰菲造成有效威胁，但朝圣者泰菲自身仍然缺乏逃脱斯飞追击的手段',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('猛攻', 'cat'),
        description:
          '朝圣者泰菲处于圆球状态时获得猛攻效果期间无法撞击敌方，同时也无法主动取消圆球状态。',
        isMinor: true,
      },
    ],
  },
  朵朵: {
    counters: [
      {
        target: character('托普斯'),
        description: '朵朵伤害较高，能较好的处理托普斯的分身。',
      },
      {
        target: character('剑客汤姆'),
        description: '全面克制，2级被动减控防连招，3级被动断连斩，高伤克皮糙，且控制多。',
      },
      {
        target: character('莱特宁'),
        description: '灌伤克制防守，后期自保与输出能力克制追击。',
      },
      {
        target: character('苏蕊'),
        description: '过载加伤可快速多次击倒2级被动苏蕊。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('斯飞'),
        description:
          '朵朵武器技能前期给予的高伤害使斯飞难以承受，但斯飞点出三级被动后能够恢复追击节奏',
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('皮糙肉厚', 'cat'),
        description: '单次输出高，可无视减伤输出。',
        isMinor: true,
      },
      {
        target: knowledgeCard('蓄势一击', 'cat'),
        description: '3级被动使蓄势加伤无法正常打出，且会对猫自己造成控制。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('击晕', 'cat'),
        description: '使充能道具掉落。',
      },
      {
        target: knowledgeCard('猛攻', 'cat'),
        description: '使全面失去输出能力。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '绝地反击能暂时免疫朵朵的控制，但免疫不了伤害。',
        isMinor: true,
      },
    ],
  },
  恶魔杰瑞: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description:
          '恶魔杰瑞的3级被动可以免掉关键伤害与控制，主动技能的护盾与武器技能的强制传送使牛仔汤姆防守难度倍增。',
      },
      {
        target: character('苏蕊'),
        description: '后期恶魔杰瑞可刷盾免疫苏蕊攻击，但较长前摇可能会被苏蕊反制。',
        isMinor: true,
      },
      {
        target: character('图多盖洛'),
        description: '图多盖洛指甲油被后期恶魔杰瑞地狱裂隙克制。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '恶魔杰瑞的被动能够免疫斯飞的关键伤害或者控制，同时恶魔杰瑞的传送门能够大幅限制斯飞的攻势',
      },
    ],
    counterEachOther: [
      {
        target: character('恶魔汤姆'),
        description: '火车头红温克制刷盾强推强救，但传送门流放克制死守，',
      },
      {
        target: character('追风汤姆'),
        description:
          '恶杰前期对战追风比较白板，但后期的3级被动和3级主动使其自保极强，且具有较强救援能力。',
      },
    ],
    collaborators: [
      {
        target: character('天使杰瑞'),
        description:
          '天使杰瑞和恶魔杰瑞都属于后期角色，恶魔杰瑞被复活后的存活能力较强，恶魔为天使提供增益，天使为恶魔提供复活和雷云。',
      },
      {
        target: character('恶魔泰菲'),
        description: '恶魔泰菲的红色小淘气可以将猫咪打进流放门强行流放，但实战实现难度偏高。',
        isMinor: true,
      },
    ],
  },
  恶魔泰菲: {
    counters: [
      {
        target: character('托普斯'),
        description: '恶魔泰菲的绿色小恶魔配合三级被动，能很好的处理托普斯的分身。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description:
          '恶菲一被对胡萝卜飞镖有一定躲避能力，且蓝色小淘气可以稳定破除兔八哥的二级被动。在猫方没有钻地洞的情况下，先蓝后绿的二武组合可以瞬秒兔八哥。而主点地洞的兔八哥恶菲不好进行击杀。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '恶魔泰菲绿恶魔的高伤和蓝恶魔的禁技能快速击倒牛仔汤姆，但牛仔汤姆同样能利用高爆发、三被和绿恶魔反制恶魔泰菲。',
      },
      {
        target: character('苏蕊'),
        description:
          '苏蕊血量极低，可以被三被恶菲轻易打死无数次，但苏蕊作为前期强势猫，容易将有恶菲的阵容在前期就速通，且二被苏蕊起身极快，苏蕊可以被击倒后起身但恶菲没有容错。',
      },
      {
        target: character('斯飞'),
        description:
          '恶魔泰菲的三级被动能轻易击倒斯飞，但斯飞克制恶菲的高移速，且三级被动恢复能力强。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('剑客莉莉'),
        description: '恶魔泰菲的蓝色小淘气可以显著降低剑客莉莉利用二级被动的救援难度。',
        isMinor: true,
      },
      {
        target: character('尼宝'),
        description:
          '防止尼宝被猫方对策角色托普斯克制，蓝恶魔让尼宝在托普斯没有护盾时放不出捕虫网，从而按照正常节奏救援。',
        isMinor: true,
      },
      {
        target: character('米雪儿'),
        description:
          '米雪儿可以变身成红色小淘气，被恶菲向上掷出进行快速跨楼层支援；也可以变身成捕鼠夹与恶菲进行主动布夹，拦截没有带细心的猫咪。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('皮糙肉厚', 'cat'),
        description:
          '恶菲的伤害形式为单段伤害，且触发次数极多，皮糙肉厚的减伤幅度在恶菲+100的三被增伤面前完全不够看，脆皮猫带了皮糙照样被秒。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('守株待鼠', 'cat'),
        description:
          '守株待鼠对道具基础伤害的固定减伤会抵消小绿恶魔的伤害，使伤害为零，导致不触发恶菲的三被增伤。彻底失去伤害',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('全垒打', 'cat'),
        description: '可一击击倒泰菲类角色，且给的反应时间短。',
        isMinor: true,
      },
    ],
    advantageMaps: [
      {
        target: map('经典之家II'),
        description: '易于拉扯，且恶菲不怕奶酪刷新差。',
      },
      {
        target: map('雪夜古堡III'),
        description: '不怕同一边刷三块奶酪，且好拉扯。',
        isMinor: true,
      },
      {
        target: map('太空堡垒I'),
        description:
          '易于拉扯，且有传送带提供奶酪，可以提前将所有奶酪洞口都放置奶酪，方便队友拉扯换推。',
      },
      {
        target: map('游乐场'),
        description:
          '游乐场地图大，开放性强，高低差大适合恶菲一被牵制，而且奶酪转点极其方便，且各奶酪洞口附近蓝色小淘气架点都有明确有效点位。',
      },
    ],
    advantageModes: [
      {
        target: mode('奔跑吧老鼠团体赛'),
        description: '恶菲跑得快、跳得高、后期三被伤害高。',
      },
      {
        target: mode('5V5经典奶酪赛'),
        description:
          '5v5模式中，好的队伍可以快速升级到近六级成型，且5v5模式中道具刷新量大，恶菲可以造出满屋子绿恶魔，对敌方猫和鼠压力都非常大。',
      },
    ],
    disadvantageMaps: [
      {
        target: map('熊猫馆'),
        description: '难以拉扯，易被高熟练度猫咪瓮中捉鳖。',
      },
      {
        target: map('御门酒店'),
        description:
          '前期猫容易用七色花展开节奏，不便拉扯。但比较烂的奶酪刷新一定程度上可以凸显恶菲的功能性。',
        isMinor: true,
      },
    ],
  },
  恶魔汤姆: {
    counters: [
      {
        target: character('罗宾汉杰瑞'),
        description: '罗宾汉杰瑞没有破局能力，打防守猫比较吃力。',
      },
      {
        target: character('罗宾汉泰菲'),
        description: '恶魔汤姆有霸体和护盾能力，不怕罗菲的圆球控制；迷乱列车还能克制圆球的霸体。',
      },
      {
        target: character('表演者•杰瑞'),
        description: '列车克制霸体角色，表演者跳舞期间易被火车连撞。',
      },
      {
        target: character('国王杰瑞'),
        description: '恶魔汤姆主流特技我生气了和列车克制国王小盾，降低国王容错。',
        isMinor: true,
      },
      {
        target: character('米可'),
        description: '恶魔汤姆技能免控，列车冲撞会给予其护盾，列车克制霸体角色。',
      },
      {
        target: character('牛仔杰瑞'),
        description: '列车克制霸体角色，且恶魔汤姆技能免控以及列车给予护盾，牛仔杰瑞很难刷出霸体。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('无畏', 'mouse'),
        description:
          '恶汤正常防守时都要绑火箭。使用无畏知识卡救完人后就强推。找几个人送一下，吃蛋糕刷新知识卡CD，反复几次救援就能破局。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '恶魔汤姆打碟期间免疫眩晕。',
        isMinor: true,
      },
    ],
  },
  国王杰瑞: {
    counters: [
      {
        target: character('凯特'),
        description: '凯特难以处理国王杰瑞的国王权杖以及国王战旗。',
        isMinor: true,
      },
      {
        target: character('牛仔汤姆'),
        description: '国王杰瑞的频繁护盾与高救援效率使牛汤防守火箭压力上升。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description: '国王杰瑞自保与救援能力强，同时能展开战旗给予老鼠增益，容易使斯飞对局节奏拉长',
      },
      {
        target: character('苏蕊'),
        description:
          '国王杰瑞技能较全面，守护旗的护盾苏蕊不好处理，救援旗的秒救可以搭配其他老鼠实现无伤救，例如大表哥传送，蒙金奇战车等等。进攻旗提高攻击力可能导致苏蕊多倒。但国王单救能力较差。',
        isMinor: true,
      },
      {
        target: character('图多盖洛'),
        description: '甲油缺少破盾手段，被护盾克制。',
      },
      {
        target: character('托普斯'),
        description:
          '国王杰瑞护盾挡托普斯的网，旗子团队增益能力强，能为队友提供更多增益来应对托普斯。',
      },
    ],
    counterEachOther: [
      {
        target: character('恶魔汤姆'),
        description:
          '火车头配合我生气了，克制国王护盾。但权杖的无敌，进攻战旗的高伤，救援战旗的速救，克制恶汤。',
      },
      {
        target: character('布奇'),
        description:
          '国王杰瑞主救能力较差，但战旗与其队友配合会有较大的威胁。例如进攻旗加伤，守护旗在冲刺真空期不好处理，感知旗拉扯，灵巧旗躲冲刺。',
      },
    ],
    collaborators: [
      {
        target: character('朝圣者泰菲'),
        description: '国王杰瑞战旗与朝圣者泰菲配合可打出极高伤害。',
      },
      {
        target: character('朵朵'),
        description: '进一步增强输出。',
      },
      {
        target: character('表演者•杰瑞'),
        description: '国王杰瑞的强化救援战旗配合表演者•杰瑞的梦幻舞步可以实现稳救。',
      },
      {
        target: character('尼宝'),
        description: '国王杰瑞的强化救援战旗可以大幅降低尼宝使用灵活跳跃的救援难度。',
        isMinor: true,
      },
      {
        target: character('泰菲'),
        description: '国王杰瑞的强化救援战旗配合泰菲的圆滚滚无敌位移，可以实现稳救。',
      },
      {
        target: character('音乐家杰瑞'),
        description: '国王杰瑞的进攻战旗可以为音乐家杰瑞提供高额增伤。',
      },
      {
        target: character('剑客杰瑞'),
        description: '战旗的增益能使剑杰的输出能力进一步提升。',
        isMinor: true,
      },
      {
        target: character('马索尔'),
        description:
          '国王杰瑞的救援战旗能为马索尔提供救援速度，守护战旗或国王权杖能提供护盾，辅助其稳定救援。',
        isMinor: true,
      },
    ],
  },
  航海士杰瑞: {
    counters: [
      {
        target: character('布奇'),
        description: '海盗的金币可以打断冲刺前摇，炸毁的火箭也可以拖延桶盖的霸体，但救援能力较差。',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description: '航海士杰瑞的火药桶和金币使剑客汤姆在无护盾的情况下几乎无法绑上二手火箭。',
      },
      {
        target: character('牛仔汤姆'),
        description: '航海士杰瑞的控制与墙缝期的高速破墙使牛仔汤姆压力倍增。',
      },
      {
        target: character('如玉'),
        description:
          '航海士杰瑞的1或2级金币没有伤害，不会触发如玉舞花枪反击，搭配1级被动可以有效干扰如玉。不过火药桶和火炮是可以触发如玉反击的。',
        isMinor: true,
      },
      {
        target: character('侍卫汤姆'),
        description: '航海士杰瑞控制时间长，控制频率高，火药桶还能炸火箭，对侍卫汤姆有很强压制力。',
      },
      {
        target: character('斯飞'),
        description:
          '航海士杰瑞的控制、减速与火药桶都能打断斯飞追击节奏，火药桶炸火箭也让斯飞头疼；同时航海士杰瑞破墙很快，斯飞较难守住墙缝。',
      },
      {
        target: character('塔拉'),
        description:
          '航海士杰瑞的火药桶炸完火箭之后塔拉无法通过套索扔老鼠的方式上火箭，并且自身缺乏霸体。',
      },
    ],
    counterEachOther: [
      {
        target: character('追风汤姆'),
        description:
          '火药桶炸掉火箭后能让追风被迫落地修二手火箭，大幅提高拦截几率。但是航海士杰瑞没有自保，一旦被针对很难逃脱。而且火药桶会被追风汤姆的风吹走。',
      },
      {
        target: character('天使汤姆'),
        description: '被火药桶炸毁的火箭无法被天使汤姆吸走，但高机动性使航海士杰瑞难以拦截和逃跑。',
      },
      {
        target: character('库博'),
        description:
          '库博可以通过频繁换绑和转点来规避海盗的技能与被拆火箭，但自身较低的血量也容易被火炮的高伤连招控到死',
      },
    ],
    collaborators: [
      {
        target: character('朵朵'),
        description: '金币与火炮衔接控制。',
        isMinor: true,
      },
      {
        target: character('拿坡里鼠'),
        description: '航海士杰瑞和拿坡里鼠能相互补充控制，火药桶和斜塔还能一起守火箭。',
        isMinor: true,
      },
      {
        target: character('马索尔'),
        description: '马索尔的升龙拳可以使霸体中的猫咪修不了火箭，提高拦截几率。',
        isMinor: true,
      },
      {
        target: character('罗宾汉泰菲'),
        description: '航海士杰瑞与罗菲的控制能互相弥补CD。罗菲还能提供航海士杰瑞急需的恢复能力。',
      },
      {
        target: character('魔术师'),
        description:
          '魔术师的卡牌和航海士杰瑞的金币可以相互弥补控制真空期，提高干扰能力。魔术师在干扰的同时还能推奶酪。',
      },
      {
        target: character('牛仔杰瑞'),
        description: '牛仔软控配合海盗硬控',
        isMinor: true,
      },
      {
        target: character('霜月'),
        description: '航海士杰瑞可拆掉火箭，便于霜月守火箭。',
        isMinor: true,
      },
      {
        target: character('泰菲'),
        description:
          '感应雷可以中断交互动作，和火药桶可以相互配合，让猫难以绑上火箭，硬拖时间给队友机会。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '猫咪会利用绝地反击解除或免疫控制。',
      },
    ],
    advantageModes: [
      {
        target: mode('装饰树大作战'),
        description: '火炮可以强势守家，但需注意该技能可被敌方老鼠使用',
      },
    ],
  },
  剑客杰瑞: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description: '剑客杰瑞的格挡使斗牛立即消失（我不吃牛肉！）。',
        isMinor: true,
      },
      {
        target: character('莱特宁'),
        description: '有效牵制习惯闪现接爪刀的莱特宁玩家。',
      },
      {
        target: character('如玉'),
        description: '格挡的主动反击可以反击如玉的反击，使其反击无效的同时还能牵制如玉。',
      },
      {
        target: character('图茨'),
        description: '华尔兹无敌与格挡无敌可有效规避喵喵叫，高伤能快速击倒血脆的图茨。',
      },
      {
        target: character('托普斯'),
        description: '二武和高伤都可以迅速消灭分身，需要注意二武不能主动戳到分身。',
      },
      {
        target: character('斯飞'),
        description:
          '剑客杰瑞HP高，斯飞短时间难以击倒，并且剑客杰瑞能够击倒三级被动状态下的斯飞，同时剑客杰瑞的格挡能够抵挡并反击斯飞',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('如玉'),
        description: '剑客杰瑞可以使用格挡免疫反击伤害，但是剑客杰瑞伤害较高，容易触发坚毅。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('雪梨'),
        description: '爱心之吻，提高容错与基础数值',
      },
      {
        target: character('罗宾汉泰菲'),
        description:
          '剑客杰瑞的伤害和罗菲的控制能互相弥补短板。罗菲还能提供恢复，发挥剑客杰瑞的Hp上限优势。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '猫咪会利用绝地反击解除或免疫控制。',
        isMinor: true,
      },
    ],
  },
  剑客莉莉: {
    counters: [
      {
        target: character('布奇'),
        description:
          '剑客莉莉的风墙能阻挡冲刺的布奇，Lv.2被动提供的无敌和武器技能提供的位移也能相对安全地进行救援。',
        isMinor: true,
      },
      {
        target: character('凯特'),
        description: '凯特难以处理剑客莉莉二级被动强行救人。',
        isMinor: true,
      },
      {
        target: character('如玉'),
        description: '剑客莉莉兼具2级被动的无敌、主动技能的干扰和武器技能的机动性，较为克制如玉。',
        isMinor: true,
      },
      {
        target: character('汤姆'),
        description:
          '剑客莉莉的风墙可以阻挡开启无敌的汤姆；剑客莉莉Lv.2被动的护盾持续时间也够长，救援能力足够稳定。',
        isMinor: true,
      },
      {
        target: character('托普斯'),
        description:
          '托普斯的分身也会触发剑客莉莉二级被动的护盾，提高其救援能力。同时剑客莉莉的基础伤害较高，也容易击倒托普斯的分身。剑客莉莉的风墙也在一定程度上拦截托普斯与分身的汇合。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '剑客莉莉的道具击中获得无敌以及主动技能的风墙给予牛仔汤姆防守与追击很大压力，但牛仔汤姆基本无视剑客莉莉的被动减伤。',
      },
      {
        target: character('斯飞'),
        description:
          '莉莉的无敌与减伤使斯飞难以快速击倒莉莉，莉莉剑气的减速也能有效干扰斯飞，但莉莉的风墙无法困住或有效影响斯飞攻势',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('鲍姆'),
        description:
          '鲍姆救援后自保差不好走，可以通过剑客莉莉风墙掩护其撤退；莉莉救援时鲍姆也可提供干扰效果。',
      },
      {
        target: character('罗宾汉泰菲'),
        description:
          '剑客莉莉与罗菲的控制能互相弥补CD。罗菲还能提供恢复，发挥剑客莉莉的Hp上限优势，并触发她的Lv.1被动。',
      },
      {
        target: character('马索尔'),
        description: '剑客莉莉的剑气能为马索尔提供回溯能力，帮助其救援后返回。',
        isMinor: true,
      },
      {
        target: character('梦游杰瑞'),
        description: '莉莉的风墙可困住或阻挡猫，方便梦游安全地拉取毛线球。',
        isMinor: true,
      },
      {
        target: character('尼宝'),
        description: '可以配合泥巴救援后传送',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '风墙的干扰无法被绝地反击免疫，且莉莉2级被动命中霸体敌方也能触发。',
        isMinor: true,
      },
    ],
  },
  剑客泰菲: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description: '',
      },
      {
        target: character('斯飞'),
        description: '剑客泰菲的头盔斯飞束手无策，并且剑客泰菲的长枪也能给予斯飞有效的干扰',
      },
    ],
    collaborators: [
      {
        target: character('剑客莉莉'),
        description: '剑客莉莉的低成本拦截可以帮助头盔撤离和协作长枪打连控。',
      },
      {
        target: character('音乐家杰瑞'),
        description:
          '仅限长枪剑菲。长枪上的音乐家杰瑞释放礼服可让长枪强制位移，对猫造成极高爆发伤害。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('严防死守', 'cat'),
        description: '总结头盔克制守奶酪，守奶酪。断节奏，破局强，ban位买房。',
      },
    ],
  },
  剑客汤姆: {
    counters: [
      {
        target: character('剑客泰菲'),
        description:
          '头盔未3级的时候可以有效拖延时间且震慑也可以加速放飞减少可能被剑菲救援的次数，但是后期难以反制且被长枪克制。',
        isMinor: true,
      },
      {
        target: character('尼宝'),
        description: '剑客汤姆的剑舞可以强行拉走救援的尼宝，剑舞也能打断正常救援。',
      },
    ],
  },
  杰瑞: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description:
          '杰瑞的主动技能能够解除附近老鼠的受伤状态，且牛仔汤姆怕控制，易被鸟哨干扰防守。',
      },
      {
        target: character('斯飞'),
        description:
          '杰瑞自身具备的高推速能够缩短奶酪期，同时斯飞需要注意杰瑞鸟哨下落的鞭炮，并且杰瑞主动技能给予的部分回血与延长火箭燃烧CD能够延长斯飞的节奏',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('米可'),
        description: '二级鼓舞可以在米可采访时帮米可回血和加速，提高续航。',
        isMinor: true,
      },
    ],
    advantageMaps: [
      {
        target: map('雪夜古堡I'),
        description: '盔甲房与侍卫房较小，鸟哨可起到折返轰炸作用',
        isMinor: true,
      },
      {
        target: map('雪夜古堡II'),
        description: '',
        isMinor: true,
      },
      {
        target: map('雪夜古堡III'),
        description: '',
        isMinor: true,
      },
    ],
    advantageModes: [
      {
        target: mode('疯狂奶酪赛'),
        description: '杰瑞推速较快，二级被动增加搬奶酪速度；鸟哨可破除部分猫的防守',
      },
    ],
  },
  凯特: {
    counters: [
      {
        target: character('罗宾汉泰菲'),
        description:
          '凯特被动提供减控和攻击增伤，克制罗菲的控制。但凯特Hp不高，要小心被罗菲直接击倒。',
        isMinor: true,
      },
      {
        target: character('表演者•杰瑞'),
        description: '凯特的破绽是多段伤害，可以使表演者杰瑞跳舞结束大幅提前。',
        isMinor: true,
      },
      {
        target: character('航海士杰瑞'),
        description: '凯特二级被动减少控制时间，航海士杰瑞难以打出连控。',
        isMinor: true,
      },
      {
        target: character('剑客杰瑞'),
        description:
          '凯特二级被动会导致剑客杰瑞华尔兹剑舞或者格挡无法与剑与苹果形成配合进行二次连控。',
        isMinor: true,
      },
    ],
  },
  库博: {
    counters: [
      {
        target: character('恶魔泰菲'),
        description: '库博能一击击倒恶魔泰菲，还能在天堂看到恶魔泰菲，从而推断藏匿道具的位置。',
      },
      {
        target: character('佩克斯'),
        description: '高伤、高回复和强机动性非常克制佩克斯。',
      },
      {
        target: character('天使泰菲'),
        description:
          '库博的被动和主动技能提供额外的攻击增伤，能击晕接道具秒天菲，或利用蓄势90*2的伤害打死三级翅膀的天菲。',
      },
      {
        target: character('泰菲'),
        description:
          '库博的伤害很高，克制血量少的泰菲，克制泰菲的被动；库博机动性强，思路很难被判断，泰菲无法及时支援队友；库博的隐身导致地雷无法被触发',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('幸运', 'mouse'),
        description: '幸运可以让老鼠主动下火箭一次，能断库博的节奏，这对库博来说是致命的。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝处逢生', 'mouse'),
        description:
          '绝处逢生能破除库博在天堂布置的老鼠夹；此外部分地图中的猫传送点距离鼠洞过远，老鼠有概率利用铁血+绝处逢生逃跑。',
        isMinor: true,
      },
    ],
    advantageMaps: [
      {
        target: map('经典之家III'),
        description: '库博在该地图表现更稳。',
        isMinor: true,
      },
      {
        target: map('太空堡垒I'),
        description: '库博在该地图节奏更顺。',
        isMinor: true,
      },
      {
        target: map('太空堡垒III'),
        description: '库博在该地图更有优势。',
        isMinor: true,
      },
      {
        target: map('夏日游轮I'),
        description: '库博在该地图更容易建立优势。',
      },
      {
        target: map('夏日游轮II'),
        description: '库博在该地图推进更顺。',
      },
      {
        target: map('雪夜古堡II'),
        description: '库博在该地图更好发挥。',
        isMinor: true,
      },
    ],
    disadvantageMaps: [
      {
        target: map('大都会'),
        description: '库博在该地图发挥受限。',
      },
      {
        target: map('经典之家I'),
        description: '库博在该地图不易展开。',
        isMinor: true,
      },
      {
        target: map('森林牧场'),
        description: '库博在该地图整体偏吃亏。',
      },
      {
        target: map('天宫'),
        description: '库博在该地图较难发挥。',
      },
    ],
  },
  莱恩: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description: '莱恩武器画的阻挡物能阻挡牛仔汤姆的斗牛。',
      },
      {
        target: character('汤姆'),
        description:
          '莱恩方块提前拦截汤姆无敌，阻止上火箭，蓝图影响火箭燃烧效率。但莱恩拦截要小心汤姆2级被动。',
        isMinor: true,
      },
      {
        target: character('天使汤姆'),
        description: '蓝图打断飞行，圆消耗武器道具，且莱恩多缴械。',
        isMinor: true,
      },
      {
        target: character('追风汤姆'),
        description:
          '莱恩的圆形、方块可以封锁追汤的走位，并阻挡旋风和铁砧，且命中率极高，能快速削减追汤的飞行时间和血量。',
      },
    ],
    counterEachOther: [
      {
        target: character('如玉'),
        description:
          '如玉的爪刀无法破除莱恩的方块，但莱恩用三角或圆命中开启主动技能的如玉仍可触发其花枪反击。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '莱恩画出的方块能阻碍斯飞行动，同时三角形的减速与圆的伤害不可忽视，但莱恩无法轻易逃脱斯飞的追击。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '霸体期间也能变线条猫，让猫不能稳上秒飞',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('我生气了！', 'cat'),
        description: '某些猫带此特技在缴械cd期间，可快速破圆和方块，快速接近无自保的莱恩。',
        isMinor: true,
      },
    ],
  },
  莱特宁: {
    counters: [
      {
        target: character('恶魔杰瑞'),
        description: '恶魔杰瑞两个技能均有较长前摇，被莱特宁3级闪现克制。',
      },
      {
        target: character('梦游杰瑞'),
        description: '梦游拉毛线时会被莱特宁3级闪现恐吓，莱特宁的垃圾桶还能略微反制梦游的破局。',
        isMinor: true,
      },
      {
        target: character('剑客泰菲'),
        description: '头盔过长的前摇与全图可见的音效容易被闪现抓住机会。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('护佑', 'mouse'),
        description: '护佑克制莱特宁在游戏前期的追击能力。',
        isMinor: true,
      },
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '莱特宁依赖爪刀造成伤害，缴械几乎削弱了莱特宁一半的进攻能力。',
      },
      {
        target: knowledgeCard('无畏', 'mouse'),
        description: '无畏提供无敌和推速增加效果，能强行突破垃圾桶对最后一块奶酪的防守。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('应急治疗', 'mouse'),
        description: '治疗可以解除Lv.1被动的标记与咸鱼效果。',
      },
    ],
  },
  罗宾汉杰瑞: {
    counters: [
      {
        target: character('布奇'),
        description:
          '罗宾汉杰瑞拉扯能力较强，二段跳和降落伞能更好规避布奇的冲刺；不过布奇的武器技能对罗宾汉杰瑞仍有威慑。',
        isMinor: true,
      },
      {
        target: character('汤姆'),
        description:
          '罗宾汉杰瑞可以为团队提供二段跳，增强拉扯和自保能力，而776锅汤前期不好找节奏，',
      },
      {
        target: character('剑客汤姆'),
        description: '罗宾汉杰瑞利用Lv.2被动和降落伞可以脱离剑客汤姆的连斩。',
      },
      {
        target: character('莱特宁'),
        description:
          '罗宾汉杰瑞的降落伞和莱特宁闪现CD差不多，罗宾汉杰瑞听到闪现立马降落伞就能规避，且伞可以免疫垃圾桶伤害。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '罗宾汉杰瑞的解控和高机动性让牛汤难以将其抓住，特别是携带鞭子的牛汤。不过，罗宾汉也没有破局能力，打以防守为主的弹弓牛汤比较吃力。',
        isMinor: true,
      },
      {
        target: character('如玉'),
        description:
          '罗宾汉杰瑞拥有更高的机动性，如玉触发反击后罗宾汉可以使用降落伞免疫反击，也能使用二段跳躲避反击。',
      },
      {
        target: character('苏蕊'),
        description: '苏蕊跳舞时爪刀难以命中罗宾汉杰瑞，瑜伽球可以二段跳或伞躲开。',
      },
      {
        target: character('图茨'),
        description: '罗宾汉杰瑞的降落伞和加速不怕图茨的喵喵叫和汽水罐。',
      },
      {
        target: character('兔八哥'),
        description: '兔八哥萝卜可以被罗宾的伞躲避，且二段的加速也可很好的帮队友和自己躲萝卜。',
      },
    ],
    counterEachOther: [
      {
        target: character('斯飞'),
        description:
          '罗宾汉杰瑞的主动能够给予老鼠高机动性以抗衡斯飞，同时罗宾汉杰瑞的降落伞能够抵挡斯飞攻势，但斯飞能够找机会一套击倒罗宾汉杰瑞并持续保持追击节奏',
      },
    ],
    collaborators: [
      {
        target: character('国王杰瑞'),
        description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
      },
      {
        target: character('剑客莉莉'),
        description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
      },
      {
        target: character('剑客泰菲'),
        description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
      },
      {
        target: character('马索尔'),
        description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
      },
      {
        target: character('尼宝'),
        description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('捕鼠夹', 'cat'),
        description:
          'Lv.2被动受伤清除控制效果，包括夹子；捕鼠夹的伤害会立刻触发该效果，直接清理夹子。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('击晕', 'cat'),
        description: '用击晕可以抓住机会一套秒罗宾汉。',
      },
    ],
  },
  罗宾汉泰菲: {
    counters: [
      {
        target: character('汤姆'),
        description: '罗宾汉泰菲拉扯能力较强，藤蔓团队增益能力较强',
        isMinor: true,
      },
      {
        target: character('托普斯'),
        description: '罗宾汉泰菲能快速击倒托普斯的分身。',
      },
      {
        target: character('剑客汤姆'),
        description: '剑客汤姆缺乏霸体能力，很容易被罗菲连续控制。',
      },
      {
        target: character('库博'),
        description:
          '库博缺乏霸体能力，很容易被罗菲连续控制。罗菲的高机动性难以让库博抓住破绽。但库博主动和被动技能可提供高额攻击增伤和极强生存能力，不易被罗菲击倒，可以伺机偷袭罗菲。',
        isMinor: true,
      },
      {
        target: character('莱特宁'),
        description: '莱特宁缺乏霸体能力，可被罗菲连续控制。',
      },
      {
        target: character('米特'),
        description:
          '米特缺乏主动霸体能力，并且机动性较差，可被罗菲连续控制或拉扯。罗菲能用控制效果击落米特手中的胡椒瓶，还能为全队提供恢复，克制胡椒粉的持续伤害。但米特爪刀伤害高，被动还有禁疗效果，一定程度上也能反制罗菲。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '牛仔汤姆缺乏霸体能力，并且机动性较差，可被罗菲连续控制或拉扯。罗菲的高低差爬树和高额恢复还克制弹弓和斗牛的远程消耗。牛仔汤姆只有利用弹弓的高爆发伤害才有机会主动击倒罗菲。',
      },
      {
        target: character('侍卫汤姆'),
        description:
          '侍卫汤姆霸体减控能力间隔较长，所需等级较高，前期很容易被罗菲连续控制,且火炮的远程消耗可以被藤蔓的恢复化解。不过，侍卫汤姆移速快，Lv.2被动伤害高，超大的视野范围也能防范罗菲的偷袭，可以尝试抓住罗菲的破绽。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description: '罗宾汉泰菲的圆球和投掷道具都能打断斯飞的疾冲状态，并削弱其攻势。',
        isMinor: true,
      },
      {
        target: character('图茨'),
        description:
          '图茨缺乏霸体能力，并且机动性较差，可被罗菲连续控制或拉扯，但要小心对方的绝地反击特技。',
      },
    ],
    counterEachOther: [
      {
        target: character('如玉'),
        description:
          '罗宾汉泰菲机动性强，善于拉扯，可以让如玉占不到便宜；但Hp上限低，进行干扰时又依赖近身连续控制，容易被反击击倒。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description: '罗菲技能控制多且可以无视二被，但Hp较低无技能不好跑。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('朵朵'),
        description: '圆球衔接控制，藤蔓提供续航。',
        isMinor: true,
      },
      {
        target: character('米可'),
        description: '米可与罗菲的控制能互相弥补CD。罗菲还能提供米可相对匮乏的恢复能力。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '罗菲需要近距离接触猫咪才能干扰，一旦猫咪使用绝地反击就很容易形成反打。',
      },
    ],
    advantageMaps: [
      {
        target: map('夏日游轮I'),
        description:
          '该地图在电影院左侧走廊处放置藤蔓可到达船长室，且猫咪难以攀爬（位置合适时无法攀爬）。',
        isMinor: true,
      },
      {
        target: map('夏日游轮II'),
        description:
          '该地图存在多处藤蔓点位（电影院左侧、船长室楼梯、厨房楼梯、锅炉房通风管等），可在不影响鼠方通行的情况下阻止猫方通过；存在多处墙缝点位（电影院、甲板、客舱）可让罗菲借助原生或藤蔓平台多次反弹，达到快速破墙的效果。',
      },
      {
        target: map('夏日游轮III'),
        description:
          '该地图存在多处藤蔓点位（电影院左侧、船长室楼梯、厨房楼梯等），可在不影响鼠方通行的情况下阻止猫方通过；存在多处墙缝点位（电影院、甲板二、客舱）可让罗菲借助原生或藤蔓平台多次反弹，达到快速破墙的效果。',
      },
    ],
  },
  马索尔: {
    counters: [
      {
        target: character('布奇'),
        description: '马索尔干扰能力较强，破局能力较强，易断节奏。',
        isMinor: true,
      },
      {
        target: character('库博'),
        description:
          '马索尔的闪亮传送能无视距离传送，当老鼠被绑到远位火箭上时，让马索尔去救是个不错的选择',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description:
          '马索尔周围有老鼠或者自己被连斩的时候会快速积攒怒气，二级被动发怒后的马索尔剑客汤姆几乎无法处理。',
      },
      {
        target: character('汤姆'),
        description: '马索尔的升龙拳能够阻拦无敌汤姆上火箭，拦截成功几率大幅提高。',
      },
      {
        target: character('天使汤姆'),
        description: '传送救援让天汤的拦截能力大打折扣，同时无畏配合逃之夭夭很容易拉开吸火箭范围。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '马索尔强大的输出控制手段与传送使牛仔汤姆要时刻关注，但马索尔发怒结束后无法逃离牛仔汤姆的攻击范围，且使用主动技能时无法知道牛对于火箭的位置。',
      },
      {
        target: character('斯飞'),
        description:
          '马索尔进入被动状态时免疫斯飞疾冲状态的感电，同时强化后的拳头对斯飞威胁很大，但脱离发怒状态后的马索尔短时间无法逃离斯飞的追击，同时斯飞的感电能干扰未进入被动状态的马索尔进行救援',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description:
          '闪现导致兔子只能守在火箭底下，且三级拳头打奶酪也可以防止死守，且拳头不怕兔子二被，二被的霸体也可以减少被秒的概率',
      },
    ],
    collaborators: [
      {
        target: character('米可'),
        description: '米可的相机能为马索尔提供回溯能力，帮助其救援后返回。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '绝地反击能克制大表哥的拳头干扰，不过无法免疫升龙拳的击飞效果。',
        isMinor: true,
      },
    ],
  },
  玛丽: {
    counters: [
      {
        target: character('图多盖洛'),
        description: '扇子作为有效破局手段，主动技能可以禁用图多的核心爪刀。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '玛丽的主动技能可以禁用爪刀，同时扇子的失明与反向会造成很大干扰，但玛丽的免疫虚弱被牛仔汤姆克制，同时扇子的回血起身让牛仔汤姆具有利用2级被动的可能性。',
      },
      {
        target: character('如玉'),
        description:
          '玛丽的主动技能无法封锁如玉的爪刀，折扇会触发如玉的花枪反击；但如玉较怕鼠方的拉扯破局，而玛丽折扇能救起队友或快速地推入奶酪，有助于拉扯破局；玛丽后期的禁用技能效果也克制如玉的反击。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description:
          '玛丽吹扇子给的debuff会被兔子秒解还会给自己挂宣战，但是后期玛丽三级礼仪能禁技能。',
      },
    ],
  },
  蒙金奇: {
    counters: [
      {
        target: character('天使汤姆'),
        description: '不好处理战车，且蒙金奇多干扰投掷和缴械。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description: '战车能帮队友挡胡萝卜飞镖，且冲撞可以将兔子从洞里撞出来。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '蒙金奇主动技能能够给予斯飞有效干扰与中断斯飞追击的可能，同时斯飞无法有效处理战车',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '蒙金奇主动技能的控制与霸体对于牛汤来说较为棘手，同时战车能够挡下牛仔汤姆的大部分输出，但牛仔汤姆的3级被动很容易打爆战车以及击倒蒙金奇。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('猛攻', 'cat'),
        description: '猛攻能让乘坐战车的蒙金奇无法脱离，失去干扰能力的同时还可能被战车炸死。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '绝地反击能免疫眩晕，还会大幅降低冲撞的击退距离',
      },
    ],
  },
  梦游杰瑞: {
    counters: [
      {
        target: character('布奇'),
        description:
          '梦游杰瑞强推和自保能力都较强；同时布奇冲撞会将奶酪撞出洞口，而梦游杰瑞能利用这一点进一步推进奶酪。',
      },
      {
        target: character('托普斯'),
        description: '梦游杰瑞的强推能力较强，主动技能让托普斯不好衔接技能与道具。',
        isMinor: true,
      },
      {
        target: character('追风汤姆'),
        description: '梦游杰瑞受击后的滑行碰撞可以秒破追汤飞行，而且蓄势一刀秒不掉，推得也快。',
        isMinor: true,
      },
      {
        target: character('恶魔汤姆'),
        description: '梦游杰瑞毛线球特性克制恶魔汤姆火车死守。',
      },
      {
        target: character('剑客汤姆'),
        description:
          '梦游在主动技能梦游期间免疫击晕，不会被剑汤用击晕和连斩直接击倒；但破除梦游状态后自保较为孱弱。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '梦游杰瑞主动技能带来的被动位移能够化解斯飞的突袭，同时梦游杰瑞的毛线球能够加快奶酪推进与快速破墙，斯飞难以牵制',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '梦游杰瑞受到伤害时的位移能略微摆脱牛仔汤姆的追击，同时毛线团容易加快游戏节奏与破墙时间，但牛仔汤姆的攻击很容易波及到梦游杰瑞。',
        isMinor: true,
      },
      {
        target: character('如玉'),
        description:
          '梦游杰瑞推奶酪能力和破局能力很强，但香甜梦境状态会被掷花枪破除，高Hp上限也被如玉的高攻击所克制，因此自保能力有所不足。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description: '后期毛线球可以秒奶酪，且不怕兔子把奶酪挤出洞口。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('捕鼠夹', 'cat'),
        description: '梦游杰瑞的香甜梦境可以直接解除该知识卡影响下的夹子的控制。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('长爪', 'cat'),
        description:
          '携带长爪的猫咪使用拍子不会造成伤害，不会触发香甜梦境的解控和位移，如果被拍中将可以直接抓起来。',
      },
    ],
  },
  米可: {
    counters: [
      {
        target: character('凯特'),
        description: '米可的采访减伤与回血还有霸体让凯特不好击倒米可。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '米可采访期间免控、有高额减伤，且牛仔汤姆每次释放技能都会被米可叠素材（弹弓会被叠多层）。',
      },
      {
        target: character('侍卫汤姆'),
        description: '米可生存能力非常强，容易采访到侍卫汤姆的素材，侍卫汤姆对此缺乏反制手段。',
      },
      {
        target: character('天使汤姆'),
        description: '采访容易打断飞行，同时也不好处理采访中的米可',
        isMinor: true,
      },
      {
        target: character('图多盖洛'),
        description: '米可拥有高额减伤，图多打不死。',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description: '米可主动技能霸体、被动减伤，克制骑士连斩。',
      },
      {
        target: character('莱特宁'),
        description:
          '莱特宁攻击手段有限，而米可有高额减伤，配上逃窜和特技治疗很难被击倒。回溯可以吸莱特宁闪现，且还可以给莱特宁拍照、闪现后回溯原位。',
      },
      {
        target: character('米特'),
        description:
          '米可的减伤使胡椒粉难以造成伤害；照相机回溯可以舍己救人后不会因为胡椒粉而虚弱。',
      },
    ],
    counterEachOther: [
      {
        target: character('兔八哥'),
        description: '米可前期不好救援，但后期高减伤加霸体很难被兔八哥击倒。',
      },
      {
        target: character('追风汤姆'),
        description:
          '追汤的飞行霸体无视米可采访的弱化和叠素材，可以蓄势一刀打死；但后期米可点了二三级被动后，追汤就难以将其击倒了',
      },
    ],
    collaborators: [
      {
        target: character('鲍姆'),
        description: '鲍姆救援后可通过米可拍照撤退。',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('猛攻', 'cat'),
        description: '猛攻能阻止米可曝光和回溯，且米可的霸体无法抵御猛攻的效果。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '绝地反击能免疫米可技能的眩晕，但无法免疫伤害及拍摄效果。',
        isMinor: true,
      },
      {
        target: specialSkill('蓄力重击', 'cat'),
        description: '蓄力重击能直接秒掉高减伤米可，不过不太容易命中采访期间的米可。',
        isMinor: true,
      },
    ],
  },
  米特: {
    counters: [
      {
        target: character('泰菲'),
        description:
          '米特的野性叠加到7层可以一刀秒泰菲，并且当手持胡椒粉抓着老鼠时，即使被火箭炮或地雷炸下来，残血老鼠也会被胡椒粉毒死，绑火箭的时候还有野性层数赋予的霸体。',
        isMinor: true,
      },
      {
        target: character('国王杰瑞'),
        description: '米特的胡椒粉罐头能快速破盾，使国王杰瑞很难单独救人。',
      },
      {
        target: character('莱恩'),
        description:
          '米特在六层野性后能够一刀秒莱恩，而且米特被变线条猫后，不会掉落胡椒粉，还能减少爪刀CD。然而莱恩也是为数不多可以破胡椒粉守火箭的干扰型角色。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('舍己', 'mouse'),
        description: '老鼠舍己救人后一般为空血，若无特殊技能，将会被胡椒粉直接击倒。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('无畏', 'mouse'),
        description: '大幅度提高老鼠救人后逃离能力。I',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('应急治疗', 'mouse'),
        description: '增加血量，防止被胡椒粉击倒',
      },
    ],
  },
  米雪儿: {
    counters: [
      {
        target: character('如玉'),
        description:
          '米雪儿的二级变身可抵挡如玉的一次反击；后期制造大量比利鼠，消耗如玉坚毅的同时快速破墙。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('表演者•杰瑞'),
        description: '可以在表演者•杰瑞铁血的时候将其变为大老鼠，防止被抓。',
        isMinor: true,
      },
      {
        target: character('音乐家杰瑞'),
        description:
          '米雪儿2武附身音乐家后可以提高音乐家杰瑞的自保能力，同时由于附身后仍然可以触发共鸣，所以能卡好距离仅用一段礼服拆掉火箭',
      },
    ],
  },
  魔术师: {
    counters: [
      {
        target: character('莱特宁'),
        description: '魔术师的兔子吞闪现，影响追击能力',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description:
          '兔子大表哥的体型较大可以挡住胡萝卜飞镖并且也能被宣战，挡住大部分火力。另外红牌的沉默效果使兔八哥的防守和进攻能力都大打折扣。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '魔术师的主动技能获取的红牌可对牛汤造成干扰，在红牌命中后牛汤将无法使用技能，且正在释放前摇中的技能释放将会中断。兔子大表哥能挡住仙人掌弹弓，该技能Lv.3的免疫受伤效果还能克制牛汤的Lv.3被动。',
      },
      {
        target: character('侍卫汤姆'),
        description:
          '兔子们的血量较高，能逼出侍卫汤姆的蓄势一击或蓄力重击。魔术师还能利用红牌封禁侍卫的技能，令其无法开炮。',
        isMinor: true,
      },
      {
        target: character('塔拉'),
        description: '兔子们的血量较高，能逼出塔拉的蓄势一击或蓄力重击。',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description: '剑客汤姆除了携带特技蓄力一击几乎没有办法快速击倒兔子大表哥从而无法及时减员。',
      },
    ],
    counterEachOther: [
      {
        target: character('恶魔汤姆'),
        description: '大小兔子都能给撞击火车头触发红温，但魔术师的红牌克制恶魔汤姆',
      },
      {
        target: character('托普斯'),
        description:
          '兔子们也能触发托普斯的一级被动，配合特技我生气了可以快速刷取经验，但过长的分身释放前摇很容易被魔术师丢中红牌导致分身释放失败。',
      },
      {
        target: character('如玉'),
        description:
          '魔术师的红牌封锁技能使如玉无法释放花枪反击，黄蓝牌造成无伤害的控制也能克制如玉；如玉的前刺回马枪伤害极高，可以快速击倒兔子先生或兔子大表哥，此外掷花枪也能以兔子为跳板进行反击。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '魔术师的红牌能给斯飞一定的威胁，同时斯飞无法快速清理兔子，但斯飞迅捷效果下免疫魔术师的黄牌，蓝牌能用武器技能拉回，同时魔术师无法轻易逃脱斯飞追击',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('蓄力重击', 'cat'),
        description: '蓄力重击可以直接击倒魔术师的兔子。',
        isMinor: true,
      },
    ],
  },
  拿坡里鼠: {
    counters: [
      {
        target: character('汤姆'),
        description: '拿坡里斜塔干扰汤姆无敌上火箭。',
        isMinor: true,
      },
      {
        target: character('塔拉'),
        description: '斜塔能防止套索上火箭。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '拿坡里的主动技能能够阻挡牛，但也会加速牛的来回。武器能够给予牛仔汤姆控制以及视野方面的干扰，但自身缺乏逃脱手段。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '拿坡里的主动技能和披萨饼能够给予斯飞干扰，但斯飞迅捷效果下免疫拿破里足球带来的失明',
      },
    ],
    collaborators: [
      {
        target: character('罗宾汉泰菲'),
        description:
          '罗宾汉泰菲与拿坡里鼠的高频控制能互相弥补CD，提高容错。罗菲还能利用圆球与斜塔的碰撞，快速碰撞破墙。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('皮糙肉厚', 'cat'),
        description: '大幅度降低足球和披萨饼的伤害。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '用塔使猫咪强制位移，防止绑上火箭。',
        isMinor: true,
      },
    ],
  },
  尼宝: {
    counters: [
      {
        target: character('布奇'),
        description: '尼宝翻滚救援不会被布奇拦截，桶盖霸体也会被鱼钩勾下。',
      },
      {
        target: character('库博'),
        description: '尼宝的鱼钩可以在天堂对库博造成控制，并且自保较强而难以让库博抓住破绽。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '牛仔汤姆拦不住尼宝的翻滚，也不好抓到尼宝；另外尼宝往往携带逃窜，进一步克制牛仔汤姆。',
        isMinor: true,
      },
      {
        target: character('侍卫汤姆'),
        description: '侍卫汤姆基本无法阻止尼宝救人，也难以突破尼宝的鱼钩防守。',
      },
      {
        target: character('苏蕊'),
        description:
          '尼宝的翻滚救援不好拦截，虽然跳舞可以在一定程度上克制钩子，但尼宝可以选择优先被动、放弃钩子、更早点出3级被动提高生存能力。',
      },
      {
        target: character('汤姆'),
        description:
          '泥巴的钩子在一定程度上影响汤姆无敌上火箭（无敌也会被勾到位移），翻滚救援拦截不了。',
      },
      {
        target: character('天使汤姆'),
        description: '翻滚救援不好拦截，也能在一定程度上反制放生转身刀。',
        isMinor: true,
      },
      {
        target: character('图多盖洛'),
        description: '尼宝武器技能无视图多的霸体、主动技能可以轻松救人。',
      },
      {
        target: character('兔八哥'),
        description: '尼宝提供稳定救援，克制兔八哥。',
      },
      {
        target: character('斯飞'),
        description:
          '斯飞拦不住尼宝的翻滚，也无法免疫鱼钩的控制；但斯飞在“疾冲”状态下被勾时，抓在手上的老鼠仍会被电。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('如玉'),
        description:
          '尼宝有一定自保能力，2级灵活跳跃能躲避花枪反击，鱼钩也能进行有效干扰。但翻滚期间有机会被回马枪沿移动方向戳飞，可能会中断救援。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '钩子可以勾霸体猫手上的老鼠。',
      },
    ],
  },
  牛仔杰瑞: {
    counters: [
      {
        target: character('如玉'),
        description:
          '牛仔杰瑞的两个技能都能打断舞花枪和花枪反击，且仙人掌的控制和持续伤害属于无来源伤害，吉他的第一段控制效果不附带伤害，因此均不会触发反击；但吉他后续的持续伤害有伤害来源，如玉可借助该伤害进行反击，因此需避免如玉在吉他范围内待得过久。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description: '斯飞须格外小心牛仔杰瑞仙人掌和琴带来的控制、减速与霸体反制。',
      },
      {
        target: character('塔拉'),
        description: '牛仔杰瑞1级被动减控、移速高，不好抓。',
      },
      {
        target: character('天使汤姆'),
        description: '两个技能都可以打断飞行，也会消耗天汤道具。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description: '牛仔杰瑞二级吉他给的移速较快，可以躲过胡萝卜飞镖。',
      },
      {
        target: character('追风汤姆'),
        description:
          '牛仔杰瑞的1级被动提升自保，2级琴和2级被动进一步提升自保并且具有副推副救能力，追风汤姆难以将其击倒。',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description: '剑客汤姆怕干扰，不好上火箭，同时牛仔杰瑞的霸体免疫挑起',
      },
      {
        target: character('库博'),
        description: '库博怕干扰，容易被牛仔杰瑞的僵直打掉蓄势，同时还会被传送点位的仙人掌拖延时间',
      },
      {
        target: character('莱特宁'),
        description:
          '牛仔杰瑞可以通过弹琴解除莱特宁的被动标记、用仙人掌防止闪现刀，且莱特宁本身怕干扰、难以处理124Hp老鼠',
      },
      {
        target: character('米特'),
        description: '米特怕干扰，不好处理火箭仙人掌',
      },
      {
        target: character('侍卫汤姆'),
        description: '侍卫怕干扰，容易被牛仔杰瑞的僵直打掉蓄势',
        isMinor: true,
      },
      {
        target: character('图茨'),
        description: '图茨怕干扰，不好处理火箭仙人掌，喵喵叫也会被仙人掌打断',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('托普斯'),
        description:
          '牛仔杰瑞的干扰在托普斯没有三级分身时影响较大；但托普斯三级分身在附近时拥有霸体，且捕虫网无视牛仔杰瑞的霸体',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '牛仔杰瑞二级被动带来的霸体使牛汤姆技能的控制失效，同时二级琴带来的回复与加速让牛仔汤姆不容易击倒牛仔杰瑞，但牛仔汤姆能够强打牛仔杰瑞，同时斗牛会清除仙人掌并进行干扰，三级被动也能轻易击倒霸体的牛仔杰瑞。',
      },
    ],
    collaborators: [
      {
        target: character('罗宾汉泰菲'),
        description:
          '牛仔杰瑞与罗菲的控制能互相弥补CD。罗菲还能提供恢复，发挥牛仔杰瑞的Hp上限优势。',
      },
      {
        target: character('佩克斯'),
        description: '牛仔控住可接弹琴，1级被动提供的经验可以助他活到后期。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '猫咪会利用绝地反击解除或免疫控制。',
        isMinor: true,
      },
      {
        target: specialSkill('蓄力重击', 'cat'),
        description: '蓄力重击可以直接击倒高Hp老鼠。',
        isMinor: true,
      },
    ],
  },
  牛仔汤姆: {
    counters: [
      {
        target: character('朵朵'),
        description: '牛会撞碎电池。',
        isMinor: true,
      },
      {
        target: character('鲍姆'),
        description:
          '牛仔汤姆攻击易波及鲍姆，会使其提前被引爆；技能提供直接抓取效果，克制鲍姆的高Hp。',
        isMinor: true,
      },
      {
        target: character('表演者•杰瑞'),
        description: '牛仔汤姆的3级被动可以压制表演者•杰瑞。',
        isMinor: true,
      },
      {
        target: character('米雪儿'),
        description: '牛仔汤姆的攻击很容易波及到米雪儿的变身。',
        isMinor: true,
      },
      {
        target: character('佩克斯'),
        description:
          '牛仔汤姆可用技能控制直接抓取，佩克斯3级被动复活甲和3级武器技能给予的免疫虚弱基本无效',
        isMinor: true,
      },
      {
        target: character('仙女鼠'),
        description:
          '牛仔汤姆的弹弓和斗牛在混战中很容易打到仙女鼠，从而掠夺仙女鼠的星星；此外牛汤被变为大星星时依旧能触发3级被动。',
        isMinor: true,
      },
      {
        target: character('侦探泰菲'),
        description: '侦探泰菲的分身会触发牛仔汤姆的2级被动，大幅减少技能CD',
      },
      {
        target: character('泰菲'),
        description:
          '泰菲的炮和地雷可协助牛汤的斗牛鞭尸，触发二级被动；牛汤伤害高，克制血量低的泰菲；牛汤技能冷却快，攻击、控制手段多，泰菲圆滚滚冷却时间长，疲于应对；泰菲火箭筒前摇长、地雷预警时间长，容易被牛汤卡时间击倒',
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('护佑', 'mouse'),
        description: '牛仔汤姆的攻击很容易波及并打破护佑',
      },
      {
        target: knowledgeCard('铁血', 'mouse'),
        description: '牛仔汤姆的技能控制很足，同时也能直接抓起老鼠。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('回家', 'mouse'),
        description: '在墙缝出现的时候让老鼠获得大量增益，让牛仔汤姆的墙缝期较为难打',
      },
      {
        target: knowledgeCard('缴械', 'mouse'),
        description:
          '缴械会使携带鞭子的牛仔汤姆前中期的输出能力降低。携带弹弓的牛汤则相对没那么怕缴械。',
        isMinor: true,
      },
      {
        target: knowledgeCard('强健', 'mouse'),
        description: '当被斗牛在离牛仔汤姆较远距离击倒后能快速起身。',
        isMinor: true,
      },
      {
        target: knowledgeCard('祝愿', 'mouse'),
        description:
          '老鼠被放飞时能解除其他老鼠的受伤状态和回复其他老鼠血量，对牛仔汤姆的进攻造成干扰。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝处逢生', 'mouse'),
        description: '牛仔汤姆的鞭子能有效的使绝处逢生无效，斗牛和弹弓能给予压制。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('应急治疗', 'mouse'),
        description: '应急治疗能解除受伤和恢复Hp，克制牛仔汤姆的远程消耗和2级被动。',
      },
    ],
    advantageMaps: [
      {
        target: map('天宫'),
        description:
          '广寒宫占有地利（空间小，出入必须钻管道，利于牛仔汤姆布局与酣战）但记住时不时去干扰蟠桃园拿点经验，不然广寒宫会被老鼠强攻沦陷',
      },
      {
        target: map('熊猫馆'),
        description:
          '熊猫谷占有地利（空间略小，出入必须走车牌，利于牛仔汤姆布局与酣战，同时能极大拖延老鼠进入墙缝期节奏），熊猫谷老鼠需要喂饱熊猫才能开启老鼠洞，牛仔汤姆的斗牛能够给予持续性的干扰。保护研究基地的奶酪处也是易守难攻，同时两个药水仓能够辅助牛仔汤姆的进攻。',
      },
      {
        target: map('后院'),
        description:
          '装饰树大作战特殊地图，牛仔汤姆的斗牛能够来回撞击，能够干扰敌方老鼠捡礼物和推雪橇车。',
      },
      {
        target: map('熊猫馆-烟花大作战'),
        description: '无敌无视烟花伤害',
        isMinor: true,
      },
    ],
    advantageModes: [
      {
        target: mode('5V5经典奶酪赛'),
        description: '三级被动对猫的斩杀线很高，但是怕控制和猛攻',
        isMinor: true,
      },
    ],
    disadvantageMaps: [
      {
        target: map('夏日游轮III'),
        description: '',
      },
      {
        target: map('太空堡垒II'),
        description:
          '因地图较平坦，斗牛释放后基本看不见牛回来，还有老鼠被击倒后能从实验舱右侧发射器前往左侧太空，断掉追击节奏',
      },
      {
        target: map('游乐场'),
        description:
          '游乐场的地形使斗牛难以频繁折返，但女巫古堡二层常会刷出火箭，这对牛汤来说是不小的优势',
        isMinor: true,
      },
      {
        target: map('御门酒店'),
        description: '',
      },
      {
        target: map('森林牧场'),
        description: '',
      },
      {
        target: map('大都会'),
        description: '',
      },
      {
        target: map('天宫-云上'),
        description: '',
      },
      {
        target: map('5V5大都会'),
        description: '',
      },
      {
        target: map('经典之家I'),
        description: '容易被拉扯，并且防守奶酪只在杂物间占优势',
      },
    ],
    disadvantageModes: [
      {
        target: mode('疯狂奶酪赛'),
        description: '只在部分地图占优势（见上文牛仔汤姆的优势地图/模式）',
      },
      {
        target: mode('5V5经典奶酪赛'),
        description: '',
      },
    ],
  },
  佩克斯: {
    counters: [
      {
        target: character('汤姆'),
        description: '佩克斯团队增益较强，击退也有一定能力反制汤姆的无敌。',
        isMinor: true,
      },
      {
        target: character('剑客汤姆'),
        description: '缺霸体不好上火箭，伤害还高。',
      },
      {
        target: character('莱特宁'),
        description: '缺霸体不好上火箭，后期三级闪有一定反制能力。',
      },
      {
        target: character('米特'),
        description: '一个琴高伤害远击退还掉胡椒粉。',
      },
      {
        target: character('如玉'),
        description: '不能反击，124血还不容易打死。',
      },
      {
        target: character('苏蕊'),
        description: '击退和高伤有一定能力反制跳舞。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('斯飞'),
        description:
          '佩克斯被动的复活甲让斯飞短时间无法击倒佩克斯，同时佩克斯武器带来的范围回血能够缓解斯飞进攻带来的部分损失，但斯飞感电或者强化技能能打断佩克斯的武器技能持续',
        isMinor: true,
      },
      {
        target: character('苏蕊'),
        description: '佩克斯的琴可以眩晕苏蕊，但如果在苏蕊跳舞中被击倒会使三级被动失效。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('蓄力重击', 'cat'),
        description: '蓄力重击可以直接击倒高Hp老鼠。',
      },
    ],
  },
  如玉: {
    counters: [
      {
        target: character('朝圣者泰菲'),
        description:
          '朝圣者泰菲子弹伤害高，容易触发如玉坚毅状态；同时这些子弹也可能被如玉主动技能反向利用刷反击。',
      },
      {
        target: character('朵朵'),
        description: '充能的道具会触发反击，被动霸体使无效输出。',
      },
      {
        target: character('恶魔杰瑞'),
        description:
          '掷花枪可以破除恶魔杰瑞的护盾，前刺回马枪同时命中将共计造成3次高额伤害，克制恶魔杰瑞的自保能力。',
        isMinor: true,
      },
      {
        target: character('国王杰瑞'),
        description:
          '掷花枪可以破除国王杰瑞的护盾，前刺回马枪同时命中将共计造成3次高额伤害，能够拦截国王救援。',
      },
      {
        target: character('剑客泰菲'),
        description:
          '剑客泰菲开启头盔移动期间能被回马枪沿移动方向戳飞，他的长枪和冲刺可以触发如玉的“花枪反击”。不过剑菲勇气释放期间的长枪有禁用技能效果，能反制如玉的反击。',
        isMinor: true,
      },
      {
        target: character('杰瑞'),
        description:
          '杰瑞的鸟哨能触发如玉的“花枪反击”，大铁锤需要近身才能干扰，导致自身自保相对较差，容易成为如玉的突破口。',
        isMinor: true,
      },
      {
        target: character('蒙金奇'),
        description: '如玉的高额伤害能轻易击毁战车，战矛也会触发如玉的反击。',
        isMinor: true,
      },
      {
        target: character('米可'),
        description:
          '如玉的前刺回马枪同时命中时能造成极高额基础伤害，米可在点出3级被动前都会被秒杀，且如玉被动提供的“坚毅”效果也克制米可的伤害。',
        isMinor: true,
      },
      {
        target: character('拿坡里鼠'),
        description: '如玉2级被动让她被连续控制时会自动反击反击，对拿坡里鼠有一定反制作用。',
        isMinor: true,
      },
      {
        target: character('音乐家杰瑞'),
        description:
          '音乐家杰瑞狂想状态下拥有较高伤害，容易触发如玉坚毅。同时音乐家杰瑞使用位移救队友拆火箭，当如玉距离音乐家较近会触发反击。',
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('护佑', 'mouse'),
        description: '如玉的掷花枪能破除护佑。',
        isMinor: true,
      },
      {
        target: knowledgeCard('回家', 'mouse'),
        description: '如玉的掷花枪能比较轻松地破除回家的护盾。',
        isMinor: true,
      },
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '如玉完全免疫缴械效果，不要试图用缴械对抗如玉。',
      },
      {
        target: knowledgeCard('无畏', 'mouse'),
        description: '掷花枪能轻易击倒无畏后摇眩晕的老鼠。',
      },
      {
        target: knowledgeCard('舍己', 'mouse'),
        description:
          '队友救完人后如果血量非常低，如玉可以直接使用掷花枪将队友造成伤害触发虚弱或铁血。',
        isMinor: true,
      },
      {
        target: knowledgeCard('铁血', 'mouse'),
        description: '如玉触发反击将老鼠打飞时，可以无视铁血效果直接打上火箭。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('冰冻保鲜', 'mouse'),
        description: '冰冻保鲜的无敌可以抵挡如玉的反击。',
      },
    ],
    advantageMaps: [
      {
        target: map('经典之家-疯狂奶酪赛'),
        description: '如此密集的道具使如玉可以频繁触发花枪反击',
      },
    ],
    advantageModes: [
      {
        target: mode('烟花大作战'),
        description: '烟花大作战的鞭炮容易触发如玉的反击。',
      },
    ],
  },
  侍卫汤姆: {
    counters: [
      {
        target: character('恶魔杰瑞'),
        description: '侍卫汤姆的警戒可消除恶魔杰瑞提供的增益效果。',
      },
      {
        target: character('泰菲'),
        description:
          '侍卫汤姆移速快，在Lv.2被动加成下能快速击倒泰菲；视野大克制远程火箭筒，还能用火炮刷新护盾、禁用技能并解除增益，进一步限制泰菲。',
      },
      {
        target: character('杰瑞'),
        description: '侍卫汤姆视野范围大，杰瑞自保能力差，容易成为突破口。',
      },
      {
        target: character('米雪儿'),
        description: '侍卫汤姆能用警戒直接看穿变身状态的米雪儿。',
      },
      {
        target: character('侦探杰瑞'),
        description: '侍卫汤姆的警戒会导致侦探杰瑞的隐身失效，且降低推速。',
      },
    ],
  },
  霜月: {
    counters: [
      {
        target: character('布奇'),
        description: '霜月的血量正好不能被布奇一刀击倒，滑铲干扰能力较强，同时拖延桶盖的霸体。',
      },
      {
        target: character('汤姆'),
        description: '霜月滑铲拦截汤姆无敌上火箭，且霜月滑铲霸体自保能力强。',
      },
      {
        target: character('天使汤姆'),
        description: '滑铲打断飞行且免死。',
      },
      {
        target: character('兔八哥'),
        description: '霜月的滑铲和袋子使兔八哥难以绑火箭，且滑铲可以将兔子从洞中顶出来。',
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '霜月滑铲期间免疫牛的控制并且定身符会对牛仔汤姆造成干扰，但霜月容易被牛仔汤姆击倒且武器能协助牛仔汤姆触发2级被动。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description:
          '霜月的主动技能能够中断斯飞追击以及使斯飞脱离疾冲状态，定身符也能极大拖延斯飞追击节奏，但斯飞能够一套击倒霜月',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '霜月的乾坤袋吞噬无视霸体，滑步踢踢飞火箭也能阻止猫咪绑火箭',
        isMinor: true,
      },
    ],
  },
  斯飞: {
    counters: [
      {
        target: character('魔术师'),
        description: '斯飞的被动免疫魔术师黄色卡牌，',
        isMinor: true,
      },
      {
        target: character('米雪儿'),
        description:
          '斯飞疾冲状态带来的感电能够破掉米雪儿的变身与主动时的护盾，并且主动技能的拖拽能够中断米雪儿的主动技能',
      },
      {
        target: character('侦探泰菲'),
        description:
          '侦探泰菲分身带来的失明时长跟斯飞进入疾冲状态时间差不多，同时侦探泰菲隐身期间不容易逃脱斯飞追击范围',
      },
      {
        target: character('国王杰瑞'),
        description:
          '国王杰瑞的护盾能够被斯飞疾冲状态的感电效果轻易破掉，同时国王杰瑞无法轻易逃离斯飞追击',
        isMinor: true,
      },
      {
        target: character('玛丽'),
        description:
          '斯飞迅捷效果下免疫玛丽的扇子技能，当玛丽被动锁血时斯飞被动的感电效果能直接击倒玛丽，同时玛丽无法轻易逃离斯飞的追击。',
      },
      {
        target: character('仙女鼠'),
        description:
          '斯飞变成大星星也能触发被动，同时仙女鼠的减速可以忽略，带来的反向能被斯飞的迅捷效果免疫。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('护佑', 'mouse'),
        description: '斯飞身上环绕的电流能直接破掉护佑。',
      },
      {
        target: knowledgeCard('无畏', 'mouse'),
        description: '处于无畏状态下的老鼠不容易逃脱斯飞的追击。',
        isMinor: true,
      },
      {
        target: knowledgeCard('孤军奋战', 'mouse'),
        description: '在斯飞面前这张卡生效不明显',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '缴械能使斯飞的输出短时间大幅降低。',
      },
      {
        target: knowledgeCard('绝地反击', 'mouse'),
        description: '使老鼠具有反打斯飞的可能。',
        isMinor: true,
      },
      {
        target: knowledgeCard('投手', 'mouse'),
        description: '投手的高额减速很容易使斯飞退出疾冲状态。',
      },
      {
        target: knowledgeCard('有难同当', 'mouse'),
        description: '能够提高斯飞袭击时的存活率',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('魔术漂浮', 'mouse'),
        description: '斯飞疾冲状态带来的感电效果能直接中断漂浮持续',
      },
      {
        target: specialSkill('急速翻滚', 'mouse'),
        description: '斯飞高移速能几乎无视翻滚的位移',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '干扰投掷可以使斯飞退出疾冲状态。',
      },
    ],
    advantageMaps: [
      {
        target: map('夏日游轮II'),
        description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
        isMinor: true,
      },
      {
        target: map('雪夜古堡III'),
        description:
          '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去，并且能够利用武器技能穿梭于两边钟楼',
      },
      {
        target: map('雪夜古堡I'),
        description:
          '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去',
        isMinor: true,
      },
      {
        target: map('雪夜古堡II'),
        description:
          '斯飞的高机动性使老鼠的拉扯不容易干扰节奏，同时斯飞的武器技能能够使斯飞从井盖下方飞上去',
        isMinor: true,
      },
      {
        target: map('夏日游轮I'),
        description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
        isMinor: true,
      },
      {
        target: map('夏日游轮III'),
        description: '斯飞能够利用武器技能从甲板飞上电影院，同时地形利于斯飞追击',
        isMinor: true,
      },
      {
        target: map('大都会'),
        description: '斯飞的机动性利于斯飞在大都会的地图穿梭',
      },
      {
        target: map('熊猫馆'),
        description: '熊猫谷与科普体验馆利于斯飞追击。',
        isMinor: true,
      },
      {
        target: map('御门酒店'),
        description: '大堂的七色花能够给予斯飞打好前期的优势，同时自身的高机动性可以在地图里穿梭',
      },
      {
        target: map('天宫'),
        description:
          '斯飞的高机动性利于追击，同时斯飞的强化主动技能与武器技能能够击中通过管道的老鼠',
        isMinor: true,
      },
    ],
    advantageModes: [
      {
        target: mode('疯狂奶酪赛'),
        description: '开局十级给予斯飞极大优势',
      },
      {
        target: mode('装饰树大作战'),
        description:
          '疾冲的感电能够干扰敌方老鼠捡挂件，同时强化主动技能与武器技能容易命中敌方猫，三级被动给予的续航也能持续作战',
      },
    ],
    disadvantageMaps: [
      {
        target: map('经典之家I'),
        description: '房间分布四散，给予老鼠拉扯空间',
      },
      {
        target: map('太空堡垒I'),
        description: '太空环境提高老鼠逃脱斯飞追击的可能',
      },
      {
        target: map('森林牧场'),
        description: '机动性优势在森林的多平台中削弱，同时湖泊给斯飞追击带来阻力',
      },
    ],
    disadvantageModes: [
      {
        target: mode('黄金钥匙赛'),
        description: '没有知识渊博的加持，斯飞无法正常开局',
      },
    ],
  },
  苏蕊: {
    counters: [
      {
        target: character('鲍姆'),
        description:
          '苏蕊跳舞霸体后几乎完全不受鲍姆爆炸的影响，但鲍姆可通过升级被动实现在火箭上爆炸自救。',
        isMinor: true,
      },
      {
        target: character('罗宾汉泰菲'),
        description: '苏蕊跳舞提供霸体和攻击增伤，一定程度上能克制罗菲的控制。',
      },
      {
        target: character('米可'),
        description: '苏蕊的霸体和高伤能有效克制米可。',
      },
      {
        target: character('牛仔杰瑞'),
        description: '苏蕊跳舞时被控影响较小 而且可以绕过火箭下的仙人掌',
      },
      {
        target: character('泰菲'),
        description:
          '苏蕊跳舞有霸体且伤害高，克制伤害高但血量低、主要依赖控制的泰菲；同时跳舞可直接把老鼠带上火箭，也能打断泰菲火箭筒前摇。',
      },
      {
        target: character('航海士杰瑞'),
        description: '苏蕊在律动时间中免疫航海士杰瑞各个技能的控制效果。',
      },
      {
        target: character('杰瑞'),
        description: '杰瑞自保能力较差，容易被抓，且杰瑞阵容多三保一，易被针对。',
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('铁血', 'mouse'),
        description: '苏蕊可以使铁血状态的老鼠自主跟随。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '苏蕊攻击手段较为单一，跳舞爪刀cd长，主要输出又依赖跳舞蓄势爪刀。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '苏蕊跳舞期间免疫眩晕。',
      },
    ],
    advantageMaps: [
      {
        target: map('经典之家I'),
        description:
          '苏蕊跳舞时间持续30秒，抓住老鼠后可跑到杂物间点燃大炸药后跳舞跟随直到放飞。老鼠对此缺乏反制手段',
      },
    ],
    advantageModes: [
      {
        target: mode('烟花大作战'),
        description: '烟花模式地图小，猫开局5级，苏蕊可以利用跳舞和烟花带来的眩晕一波杀穿。',
      },
    ],
  },
  塔拉: {
    counters: [
      {
        target: character('天使泰菲'),
        description:
          '塔拉的超大视野逼迫天菲救人拦截方面提前开技能，蓄势重击克制翅膀流，拍子克制庇护流。',
        isMinor: true,
      },
    ],
  },
  泰菲: {
    counters: [
      {
        target: character('斯飞'),
        description: '泰菲的圆滚滚是无敌状态，可以解控，克制斯飞的疾冲电击、穿刺以及勾子控制',
      },
      {
        target: character('剑客汤姆'),
        description:
          '剑汤的连招会被圆滚滚的无敌和解控死死克制，并且泰菲的角色模型矮，连斩很多情况无法锁定。',
      },
      {
        target: character('莱特宁'),
        description:
          '地雷的强制位移能带走垃圾桶，咸鱼可以被圆滚滚强行踩掉，莱特宁闪现过来泰菲也可以秒开圆滚滚躲避攻击，被三级闪震慑到，泰菲也可以开圆滚滚解控。',
      },
      {
        target: character('如玉'),
        description:
          '泰菲可以在花枪反击前摇时使用圆滚滚，即使被击中，也可以开圆滚滚解控，避免二次伤害。',
        isMinor: true,
      },
      {
        target: character('图茨'),
        description: '圆滚滚的无敌和解控克制喵喵叫，但三级汽水罐使泰菲有些疲于应对',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('追风汤姆'),
        description:
          '追风飞行时机动性很强，使其很难被预警太长的地雷和炮命中。但泰菲的圆滚滚可以解控，强行打断追风技能造成的眩晕，追风伤害较低，不易将其击倒；追风可以利用飞行碰撞箱强行顶开在平台推奶酪的泰菲',
      },
      {
        target: character('托普斯'),
        description:
          '泰菲的圆滚滚可以解控，导致托普斯很难刀接网或使用我生气了抓住泰菲。但泰菲的炮前摇长，近身很容易被托普斯找到机会网住，托普斯三级分身可以转移伤害，炮无法控制住本体，而且泰菲在圆滚滚真空期内时，只要被托普斯找到机会，就会被网住，因此泰菲被动的减伤霸体无法发挥用处',
      },
      {
        target: character('米特'),
        description:
          '泰菲的圆滚滚可以解控，配合治疗可以克制米特的刷尸；泰菲的圆滚滚可以强行把米特的饭盒踩掉，克制米特的防守。但米特的野性层数叠加到七层时可以一刀秒泰菲，被动还可以短时间内取消泰菲被动的回血buff，不利于泰菲强行推奶酪；泰菲火箭筒或者地雷击中米特时，米特的胡椒粉会自动掉落，导致救下来的队友再次被胡椒粉毒死，被米特抓住，浪费了一次技能',
      },
      {
        target: character('天使汤姆'),
        description:
          '泰菲的二级圆滚滚没有前摇，有无敌，可以克制天汤开飞行刷虚弱拉火箭；但天汤机动性高、伤害高，二被有霸体，克制机动性差、血量少、主要打控制的泰菲',
      },
      {
        target: character('汤姆'),
        description:
          '泰菲的圆滚滚可以解控，克制汤姆的枪、锅眩晕，地雷可以强行击飞汤姆无敌，拖延汤姆的无敌绑火箭时间；汤姆的发怒冲刺为无敌状态，可以解控，克制泰菲火箭筒和地雷打控制，汤姆三级被动可以禁用泰菲的圆滚滚，后期很克制泰菲',
      },
      {
        target: character('恶魔汤姆'),
        description:
          '泰菲的圆滚滚可以解控，克制恶汤的打碟、被动控制和红温爪刀，泰菲的火箭筒有两段伤害，克制恶汤的的火车盾（盾只有一层）；恶汤的火车有强制位移，克制泰菲被动霸体减伤推奶酪，恶汤的打碟有霸体，克制泰菲的火箭筒打控制，恶汤的绑火箭速度快，打碟有霸体，克制泰菲的地雷拖延绑火箭',
      },
    ],
    collaborators: [
      {
        target: character('雪梨'),
        description: '雪梨的回血配合泰菲被动霸体和减伤，没有强制位移和高伤的情况下可以强行推奶酪',
      },
      {
        target: character('罗宾汉泰菲'),
        description: '泰菲可以利用罗菲的树快速回血，弥补健康值低的缺点，有利于强行推奶酪',
        isMinor: true,
      },
      {
        target: character('玛丽'),
        description: '玛丽的扇子可以加快泰菲推速，帮助泰菲回血，有利于在残血前尽可能多推进奶酪',
      },
      {
        target: character('米雪儿'),
        description:
          '米雪儿的漂浮气球配合泰菲圆滚滚解控，可大大提高泰菲的续航和容错率，使其不易被击倒',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('皮糙肉厚', 'cat'),
        description: '皮糙肉厚减伤导致绝反炮菲无法发挥伤害高的优势。',
        isMinor: true,
      },
      {
        target: knowledgeCard('乾坤一掷', 'cat'),
        description:
          '有乾坤一掷加持下的猫扔一个基础伤害为50的道具就可以秒掉泰菲，但带乾坤一掷的猫很少，所以克制不明显。',
        isMinor: true,
      },
      {
        target: knowledgeCard('猛攻', 'cat'),
        description: '猛攻可以禁用泰菲的圆滚滚，导致泰菲无法使用圆滚滚解控',
      },
      {
        target: knowledgeCard('屈打成招', 'cat'),
        description: '猫在抓着老鼠时，可以通过屈打看到泰菲的位置，从而堤防泰菲的远程炮',
        isMinor: true,
      },
      {
        target: knowledgeCard('穷追猛打', 'cat'),
        description: '泰菲血量低，前期三级自保较弱，容易被伤害高的穷追猫针对',
      },
      {
        target: knowledgeCard('乘胜追击', 'cat'),
        description: '泰菲机动性差，基础速度不高，没队友干扰的情况下容易被速度高的乘胜猫追杀',
      },
      {
        target: knowledgeCard('暴怒', 'cat'),
        description: '暴怒赋予猫长时间高伤，克制血量低的泰菲',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('我生气了！', 'cat'),
        description: '泰菲的圆滚滚可以解控，猫无法用无限爪刀秒掉泰菲',
      },
      {
        target: specialSkill('蓄力重击', 'cat'),
        description: '泰菲的圆滚滚可以解控，克制猫用击晕接蓄重',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '炮不能取消后摇，容易被霸体反杀。',
        isMinor: true,
      },
      {
        target: specialSkill('全垒打', 'cat'),
        description: '全垒打赋予猫高伤，克制血量低的泰菲',
        isMinor: true,
      },
    ],
  },
  汤姆: {
    counters: [
      {
        target: character('朝圣者泰菲'),
        description: '主动技能无敌可免疫朝圣者泰菲伤害。',
      },
      {
        target: character('剑客杰瑞'),
        description: '汤姆无敌挡伤害和干扰，二级锅解决124血量，且推速和救援能力差。',
      },
      {
        target: character('杰瑞'),
        description: '杰瑞自保能力差，汤姆无敌挡鸟哨轰炸。',
      },
      {
        target: character('牛仔杰瑞'),
        description: '汤姆无敌挡仙人掌和琴，二级锅解决124血量，平底锅击飞干扰冰冻保鲜救援。',
      },
    ],
  },
  天使杰瑞: {
    counters: [
      {
        target: character('斯飞'),
        description:
          '天使杰瑞的被动禁用爪刀与沉默给予斯飞极大的进攻阻力，同时雷云的的减速与雷击给予斯飞有效干扰',
      },
      {
        target: character('恶魔汤姆'),
        description:
          '天使Lv.1被动禁用爪刀使红温流恶汤无法发挥效果；雷云使被动流恶汤一直遭雷劈；后期3级被动禁用技能，对于恶汤技能型防守特别难受；主动技能复活，能够避免恶汤的死守火箭救不下来而减员，也能尽可能的拖时间，恶魔汤姆没有很强的追击性，很难再把复活的人击倒。',
      },
      {
        target: character('凯特'),
        description:
          '凯特的技能命中天使杰瑞会造成爪刀与技能被禁，并且雷云范围内会削弱凯特伤害，并会被雷云攻击。',
      },
      {
        target: character('牛仔汤姆'),
        description:
          '天使杰瑞被动带来的禁用技能与爪刀能使牛仔汤姆的进攻大幅削弱，并且牛仔汤姆很容易对天使杰瑞造成伤害。',
      },
      {
        target: character('追风汤姆'),
        description:
          '天使杰瑞1级被动和3级被动让追汤无法快速拿刀，雷云减伤可以放大追汤缺伤害的缺点，打团也很强。祝福可以一定程度上反制追汤飞行强上火箭；同时追汤缺伤害，不易处理复活体。',
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description: '',
      },
      {
        target: character('如玉'),
        description:
          '天使杰瑞1级被动对如玉无效；如玉前刺回马枪能直接击倒使用2级主动的天使杰瑞；如玉可借助天使杰瑞武器技能造成的伤害进行反击但3级被动禁用技能可以反制如玉的甩花枪反击',
      },
    ],
    collaborators: [
      {
        target: character('罗宾汉泰菲'),
        description: '罗菲能为天使杰瑞提供恢复，帮助其多次触发被动。',
        isMinor: true,
      },
      {
        target: character('仙女鼠'),
        description:
          '天使杰瑞的Lv.2被动可以夺取猫身上的星星，供仙女鼠使用；雷云还能降低对方伤害，提高二者的容错率。但这一组合中的仙女鼠压力极大，很怕空技能和猛攻，相对来说操作和收益并不完全对等，慎用。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('我生气了！', 'cat'),
        description: '天使杰瑞1级被动能封锁爪刀。',
      },
    ],
  },
  天使泰菲: {
    counters: [
      {
        target: character('斯飞'),
        description:
          '天使泰菲的主动技能能够转移斯飞的伤害与控制，同时能够减慢火箭燃烧时间，并且天使泰菲能够通过武器技能获得霸体',
        isMinor: true,
      },
      {
        target: character('牛仔汤姆'),
        description:
          '当天使泰菲点出3级武器技能时可以无视甚至利用牛来对牛仔汤姆造成干扰，同时利用主动技能能使队友不受牛的控制效果。',
      },
      {
        target: character('剑客汤姆'),
        description:
          '天菲前期开启任意一个技能就能极大幅削减（无“穷追猛打”情况下的）剑客连斩的伤害，后期霸体让控制多伤害偏低的剑汤十分棘手，庇护还可以保队友，转移控制的效果还能让范围内的队友通过卡内刀/使用控制道具/直接脱离的方式中断剑汤连招。并且剑汤较惧怕“后期”定位的角色，墙缝期剑汤怕碎片怕满地道具怕高伤怕有自保和保队友能力的老鼠。并且剑汤前期一旦虚弱会导致乘胜层数减半，对局面影响很大，而天菲的翅膀反伤是个很好压血线的工具——哪怕把天菲刮死了，剑汤本身血条不多，容错也很低。不过天菲技能较为被动，确实有被高熟练度剑汤通过操作弥补克制关系的可能，还是要小心。',
        isMinor: true,
      },
      {
        target: character('米特'),
        description: '天菲技能提供的减伤能大幅降低甚至免疫胡椒粉的伤害，还能反伤。',
      },
    ],
    counterEachOther: [
      {
        target: character('如玉'),
        description:
          '如玉自身的高额伤害在一定程度上克制天菲的减伤，但如玉无法用拍子直接抓起老鼠，因此后期难以处理天菲。',
        isMinor: true,
      },
      {
        target: character('牛仔汤姆'),
        description:
          '牛汤难处理后期几乎无敌的天菲，但鞭子加强后前期直接抓取好打天菲，后期三被也容易打没免死状态的天菲，但弹弓伤害刮，后期天菲免死免控牛汤不好处理',
      },
    ],
    collaborators: [
      {
        target: character('米雪儿'),
        description: '米雪儿和天使泰菲的技能搭配能大幅提高生存能力。',
        isMinor: true,
      },
      {
        target: character('魔术师'),
        description: '天使泰菲后期强力。魔术师二武器能提供大量经验，帮助到达后期。',
      },
      {
        target: character('佩克斯'),
        description: '天使泰菲后期强力。佩克斯能提供大量经验，帮助到达后期。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('蓄力重击', 'cat'),
        description:
          '蓄力重击可以直接击倒天菲；不过天菲后期的三级庇护的免死效果持续期间能抗下蓄力重击。',
        isMinor: true,
      },
      {
        target: specialSkill('全垒打', 'cat'),
        description: '前期一刀秒，后期不怕',
        isMinor: true,
      },
    ],
    advantageMaps: [
      {
        target: map('经典之家II'),
        description: '典型的拉扯图容易苟到后期',
      },
      {
        target: map('雪夜古堡III'),
        description: '<拉扯图',
      },
      {
        target: map('天宫'),
        description: '易拉扯',
      },
      {
        target: map('森林牧场'),
        description: '中期易拉扯',
      },
      {
        target: map('游乐场'),
        description: '好拉扯，猫死追一边必定亏奶酪',
      },
    ],
    advantageModes: [
      {
        target: mode('疯狂奶酪赛'),
        description: '前期一起推两块天菲等级就起来了，不怕10级猫咪',
      },
      {
        target: mode('5V5经典奶酪赛'),
        description: '只要节奏不大崩就死不掉，不过玩起来挺无聊的',
      },
    ],
  },
  天使汤姆: {
    counters: [
      {
        target: character('朵朵'),
        description: '伤害高，被动霸体。',
        isMinor: true,
      },
      {
        target: character('恶魔杰瑞'),
        description:
          '天使汤姆飞行的高机动性克制恶魔杰瑞的拉扯，武器技能的道具（瓶子除外）可以无视恶魔杰瑞3级被动，直接造成伤害。',
        isMinor: true,
      },
      {
        target: character('罗宾汉杰瑞'),
        description: '天汤的高机动性和眩晕可以反制罗宾汉杰瑞。',
      },
      {
        target: character('佩克斯'),
        description: '高伤、高回复和强机动性非常克制佩克斯。',
      },
      {
        target: character('剑客莉莉'),
        description:
          '天汤飞行，导致投掷物不容易而命中获得2级被动无敌，同时武器技能投掷也会影响莉莉救援。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('不屈', 'mouse'),
        description: '加的血量会导致很多情况差一点伤害，加移速也会导致不好抓人。',
      },
      {
        target: knowledgeCard('夹不住我', 'mouse'),
        description: '天汤多细心布夹子，夹不住我破夹子。',
        isMinor: true,
      },
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '被禁爪刀会导致飞行不好接蓄力重击以及其他情况补伤害。',
      },
      {
        target: knowledgeCard('铁血', 'mouse'),
        description: '铁血强救，同时还能消耗天汤飞行时间导致不好吸火箭。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('冰冻保鲜', 'mouse'),
        description: '容易被卡蓄力重击。',
      },
      {
        target: specialSkill('魔术漂浮', 'mouse'),
        description: '飞行可以打漂浮，且漂浮中很容易被武器道具瞄准。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '会打断一级飞行。',
      },
    ],
  },
  图茨: {
    counters: [
      {
        target: character('恶魔杰瑞'),
        description: '恶魔杰瑞的护盾会被喵喵叫快速击破，因此缺乏自保手段。',
        isMinor: true,
      },
      {
        target: character('国王杰瑞'),
        description: '图茨的喵喵叫能快速破盾，使国王杰瑞很难单独救人。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('冰冻保鲜', 'mouse'),
        description: '冰冻保鲜能暂时躲过喵喵叫的攻击。',
        isMinor: true,
      },
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '干扰投掷能中断喵喵叫，此外图茨缺乏霸体能力。',
      },
    ],
  },
  图多盖洛: {
    counters: [
      {
        target: character('泰菲'),
        description:
          '泰菲可以用圆滚滚抵挡图多的吻和指甲油外刀，但图多伤害较高，技能冷却快，后期攻击手段多，三级吻可以禁用技能，让泰菲疲于应对；图多的三级指甲油赋予长时间霸体，克制泰菲的炮和地雷打控制；图多的三级香水可以禁用技能，图多在三级香水中伤害十分高，爪刀冷却快，克制泰菲被动推奶酪',
      },
      {
        target: character('鲍姆'),
        description: '霸体免疫鲍姆爆炸控制。',
      },
      {
        target: character('朝圣者泰菲'),
        description: '图多盖洛指甲油免死可有效削减朝圣者泰菲高伤对其的影响。',
      },
      {
        target: character('朵朵'),
        description: '三级指甲油长时间霸体，3级被动流血。',
      },
      {
        target: character('佩克斯'),
        description: '一直霸体和回复很克制，但武器技能可以突破防守，琴可以弹开香水。',
        isMinor: true,
      },
      {
        target: character('天使泰菲'),
        description: '天菲既被香水死克，又被猛攻指甲油克制。',
        isMinor: true,
      },
      {
        target: character('航海士杰瑞'),
        description: '图多六级后霸体无视海盗控制；海盗缺乏有效自保手段。',
      },
      {
        target: character('蒙金奇'),
        description: '大后期点出三级吻，克制蒙金奇。',
        isMinor: true,
      },
      {
        target: character('米可'),
        description:
          '图多盖洛甲油3级后的霸体可以让米可打不出干扰效果；即使没有猛攻，后期图多捏好拍子，把3级被动点出来，也相对并不缺少处理后期米可的常态高坦度的手段；大后期3级魅惑之吻也是可以直接废掉米可。',
      },
      {
        target: character('恶魔泰菲'),
        description: '图多三级甲油免疫优先级极高，可以无视蓝恶魔的沉默和绿恶魔的高伤。',
      },
    ],
  },
  兔八哥: {
    counters: [
      {
        target: character('泰菲'),
        description:
          '兔八哥伤害高，克制血量少的泰菲，兔八哥二级被动可以闪避泰菲的炮，兔八哥的巨型胡萝卜克制泰菲霸体减伤推奶酪，兔八哥的打洞可以躲避泰菲的地雷锁定',
        isMinor: true,
      },
      {
        target: character('朵朵'),
        description: '兔八哥二被可以躲掉充能道具，地洞给的减伤也可以防止被秒。',
      },
      {
        target: character('航海士杰瑞'),
        description: '航海士杰瑞道具少时守不住火箭，且金币被兔八哥二被克制。',
      },
      {
        target: character('剑客莉莉'),
        description:
          '兔八哥二被和钻洞可以躲避莉莉的道具，使她无法触发二被导致难以救援；钻洞还可以从莉莉的一/二级风墙中逃出。',
      },
      {
        target: character('莱恩'),
        description: '莱恩Hp较低，且因技能可宣战容错较低。',
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('逃窜', 'mouse'),
        description: '恢复和加速效果可以躲避一波追击。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('冰冻保鲜', 'mouse'),
        description: '冰冻保鲜可躲一波胡萝卜飞镖。',
      },
      {
        target: specialSkill('急速翻滚', 'mouse'),
        description: '翻滚给的加速可以有效的躲追踪萝卜。',
      },
    ],
  },
  托普斯: {
    counters: [
      {
        target: character('天使泰菲'),
        description:
          '托普斯的捕虫网能无视天使泰菲两个技能；即便开启三级友情庇护，也可能被托普斯结合击晕、“我生气了！”和一级元气满满连续控制。',
      },
      {
        target: character('表演者•杰瑞'),
        description:
          '托普斯的捕虫网可以直接抓取梦幻舞步状态下的表演者•杰瑞。托普斯一级被动也能更多的拦截柠檬的强换。',
      },
      {
        target: character('恶魔杰瑞'),
        description: '托普斯配合分身和技能打断恶魔杰瑞的技能，托普斯三级被动消除增益。',
        isMinor: true,
      },
      {
        target: character('杰瑞'),
        description: '杰瑞自保能力较差，托普斯三级分身眩晕转移也让鸟哨的干扰能力大打折扣。',
        isMinor: true,
      },
      {
        target: character('马索尔'),
        description:
          '托普斯的网可以网发怒的马索尔，同时马索尔传送救援时，可能会被托普斯和分身拦截，有护盾的情况下也可能被爪刀+网+道具拦截，有隐身的情况下也会被分身透视导致隐身效果大打折扣。',
      },
      {
        target: character('蒙金奇'),
        description:
          '主流托普斯携带皮糙让蒙金奇的战车长矛打不出来较高的伤害，托普斯的三级分身还能减少控制的影响。',
        isMinor: true,
      },
      {
        target: character('米可'),
        description:
          '托普斯的网可以直接网住采访的米可，3级分身转移眩晕，主流托普斯携带皮糙还能减少采访的伤害，前期穷追也能提供更强的击倒能力。',
      },
      {
        target: character('尼宝'),
        description:
          '托普斯的捕虫网可以直接抓取灵活跳跃后霸体的尼宝，使尼宝很难救人。同时分身换位也会让泥宝钩子的效果大打折扣。',
      },
      {
        target: character('霜月'),
        description: '托普斯三级分身霸体免疫滑铲，网可直接网住。',
        isMinor: true,
      },
    ],
    countersKnowledgeCards: [
      {
        target: knowledgeCard('铁血', 'mouse'),
        description: '托普斯的一级被动和网能有效拦截铁血强换。',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('缴械', 'mouse'),
        description: '缴械禁用爪刀，可能导致有的情况下托普斯不好衔接。',
      },
      {
        target: knowledgeCard('救救我', 'mouse'),
        description:
          '在猫不会卡救援接爪刀的情况下，携带救救我可以强换下来，但没有的情况下是不可以的。同时救救我也能为救援提高更多容错。',
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '干扰投掷能提高一定的救援能力，但较吃投掷。',
        isMinor: true,
      },
    ],
  },
  仙女鼠: {
    counters: [
      {
        target: character('库博'),
        description: '仙女鼠的强制变身能在天堂干扰库博。',
        isMinor: true,
      },
      {
        target: character('图多盖洛'),
        description: '仙女鼠武器技能无视霸体，后期拥有高强度干扰能力。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('兔八哥'),
        description:
          '仙女鼠被宣战后比较难受，但仙女鼠Lv.1被动克制胡萝卜飞镖，以及兔八哥Lv2被动不免疫星星。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('莱恩'),
        description:
          '莱恩容易死，仙女鼠变六星提高下限，并且在遇到汤姆无敌强上火箭时，可强制造成伤害变线条，线条猫与八星一块干扰猫，使对面露出破绽。',
      },
      {
        target: character('梦游杰瑞'),
        description: '梦游在拉毛线时，仙女鼠给梦游丢六星不会让毛线消失，可以强行破局。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description: '仙女鼠八星变身无视霸体效果。',
      },
    ],
  },
  雪梨: {
    counters: [
      {
        target: character('斯飞'),
        description:
          '雪梨给予的回复使斯飞难以短时间击倒老鼠，同时雪梨能够回复火箭上老鼠的血量，使斯飞追击难度上升',
        isMinor: true,
      },
      {
        target: character('莱特宁'),
        description: '雪梨的治疗可消除莱特宁Lv.1被动的标记，且莱特宁本身攻击手段不多。',
      },
      {
        target: character('牛仔汤姆'),
        description: '雪梨能快速解除老鼠的受伤状态和恢复血量。',
        isMinor: true,
      },
      {
        target: character('汤姆'),
        description: '雪梨花洒配合干扰投掷浇灭火箭。',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('米可'),
        description:
          '雪梨可以帮米可回血，提高续航，配合米可三级被动很难被打死，也有了防止拍抓的能力。',
      },
      {
        target: character('拿坡里鼠'),
        description: '骑乘披萨饼期间可通过花束快速位移，连带披萨饼一同移动，出其不意。',
        isMinor: true,
      },
      {
        target: character('佩克斯'),
        description: '可以为佩克斯提供续航。',
      },
      {
        target: character('天使泰菲'),
        description: '雪梨帮天使泰菲免于拍抓，天使泰菲帮雪梨提高生存能力。',
      },
    ],
  },
  音乐家杰瑞: {
    counters: [
      {
        target: character('牛仔汤姆'),
        description:
          '音乐家杰瑞的武器技能搭配被动会对牛仔汤姆的防守与抓住老鼠时造成干扰，同时墙缝期给予的增益与破墙速度不容小觑。',
        isMinor: true,
      },
      {
        target: character('莱特宁'),
        description:
          '音乐家可以利用礼服撞开{垃圾桶}，避免莱特宁抓起老鼠后用垃圾桶鞭尸，而且由于莱特宁缺少控制手段，音乐家可以安全的使用礼服拆火箭。但由于莱特宁的高机动性还是得注意闪现爪刀和交互闪，防止被打死',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('斯飞'),
        description:
          '音乐家杰瑞的音波能够造成短暂控制以及快速破坏火箭，并且墙缝期的辅助能力与音波破墙我威胁使斯飞难以防守，但斯飞疾冲状态的感电或者强化技能能够打断音乐家杰瑞武器技能状态',
        isMinor: true,
      },
    ],
    collaborators: [
      {
        target: character('米可'),
        description: '主动技能协奏曲可以在米可采访时给米可回血和加速，提高续航。',
      },
      {
        target: character('霜月'),
        description: '音乐家杰瑞可拆掉火箭，便于霜月守火箭。',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('皮糙肉厚', 'cat'),
        description: '皮糙肉厚减伤导致音乐家的多段伤害大幅减少。',
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('绝地反击', 'cat'),
        description:
          '音乐家能快速拆火箭，阻止猫咪霸体绑火箭。不过绝地反击能免疫共鸣眩晕，还是要小心。',
        isMinor: true,
      },
    ],
    advantageMaps: [
      {
        target: map('游乐场'),
        description: '游乐场存在多处滑坡可以利用，变相提高了音乐家的自保能力和转点能力',
      },
    ],
  },
  侦探杰瑞: {
    counters: [
      {
        target: character('斯飞'),
        description:
          '侦探杰瑞推速很快，能缩短奶酪期；同时烟雾弹带来的减速与沉默也会让斯飞难以有效进攻。',
        isMinor: true,
      },
      {
        target: character('布奇'),
        description: '侦探杰瑞推奶酪和自保能力强，烟雾弹还能反制布奇的防守奶酪能力。',
      },
      {
        target: character('恶魔汤姆'),
        description: '速推克制恶魔汤姆死守，三级烟雾弹禁用技能。',
      },
      {
        target: character('库博'),
        description:
          '侦探杰瑞的推奶酪能力十分强大，能让库博的天堂火箭来不及放飞。另外侦探杰瑞的自保强，难以被针对。',
      },
      {
        target: character('莱特宁'),
        description:
          '侦探杰瑞的隐身克制莱特宁的闪现，不过隐身过长的前摇与全图可见的音效也容易被闪现抓住机会。',
        isMinor: true,
      },
      {
        target: character('如玉'),
        description:
          '侦探杰瑞推奶酪速度快，且自保和破局能力强，能在避免与如玉正面交锋的情况下推入奶酪。',
        isMinor: true,
      },
      {
        target: character('汤姆'),
        description:
          '自保能力较强，同时兼具一定的救援能力，较快的推速也可以加快游戏节奏，烟雾弹强推也在一定程度上克制汤姆。',
      },
      {
        target: character('图多盖洛'),
        description: '侦探杰瑞的烟雾弹克制一切防守猫。',
      },
      {
        target: character('托普斯'),
        description: '强推能力较强，与队友配合能较好的处理最后一个奶酪。',
        isMinor: true,
      },
    ],
    counterEachOther: [
      {
        target: character('牛仔汤姆'),
        description:
          '侦探杰瑞的三级烟雾弹使牛仔汤姆无法正常释放技能，但牛仔汤姆能在烟雾外对内进行干扰。',
      },
      {
        target: character('兔八哥'),
        description: '侦探三级烟雾弹可强推，但兔子也可用洞反制。',
      },
    ],
    collaborators: [
      {
        target: character('天使泰菲'),
        description: '侦探杰瑞的推奶酪和破局能力很强，推奶酪提供的经验能帮助天使泰菲到达后期。',
        isMinor: true,
      },
    ],
  },
  侦探泰菲: {
    counters: [
      {
        target: character('莱特宁'),
        description: '侦探泰菲的隐身克制莱特宁的闪现。',
      },
      {
        target: character('如玉'),
        description: '侦探泰菲推奶酪速度快，且自保极强，能在避免与如玉正面交锋的情况下推入奶酪。',
        isMinor: true,
      },
      {
        target: character('兔八哥'),
        description: '侦菲主动技能无前摇隐身和三级后的换位提供很强自保，兔八哥很难抓。',
        isMinor: true,
      },
      {
        target: character('斯飞'),
        description: '奔跑状态斯飞下会受到分身带来的失明效果，影响追击',
      },
    ],
  },
  追风汤姆: {
    counters: [
      {
        target: character('朵朵'),
        description: '飞行时难以命中。',
        isMinor: true,
      },
      {
        target: character('罗宾汉杰瑞'),
        description: '追风的高机动性和眩晕可以反制罗宾汉杰瑞。',
      },
      {
        target: character('表演者•杰瑞'),
        description:
          '飓风能让触发1级被动和铁血的表演者无法换下火箭上的队友，且追风伤害手段多，能很快破掉表演者的跳舞，从而强杀。表演者的柠檬旋风释放较笨重，很难命中飞行追风，实战难以打出理论效果。',
      },
      {
        target: character('剑客泰菲'),
        description:
          '追汤飞行时有碰撞箱，可以顶住前来救援的头盔剑菲，从而拖到头盔时间结束。守高点火箭时效果更佳',
        isMinor: true,
      },
    ],
    counteredByKnowledgeCards: [
      {
        target: knowledgeCard('不屈', 'mouse'),
        description:
          '不屈增加的额外血量和移速增大了追汤打倒老鼠的难度，加的推速使老鼠发育更快并更易来到后期。',
      },
      {
        target: knowledgeCard('祝愿', 'mouse'),
        description: '祝愿提供经验可以使老鼠快速发育到后期，放大追汤成长性差的缺点。',
        isMinor: true,
      },
    ],
    countersSpecialSkills: [
      {
        target: specialSkill('干扰投掷', 'mouse'),
        description: '追风汤姆飞行期间免疫眩晕。',
        isMinor: true,
      },
      {
        target: specialSkill('魔术漂浮', 'mouse'),
        description: '追风汤姆机动性很强，漂浮无法拉开距离。',
        isMinor: true,
      },
    ],
    counteredBySpecialSkills: [
      {
        target: specialSkill('绝处逢生', 'mouse'),
        description: '追风汤姆技能伤害低，若没能击倒老鼠则容易让其快速恢复状态。',
        isMinor: true,
      },
      {
        target: specialSkill('应急治疗', 'mouse'),
        description: '追风汤姆技能伤害低，若没能击倒老鼠则容易让其快速恢复状态。',
        isMinor: true,
      },
    ],
  },
} as const satisfies Readonly<Record<string, CharacterRelationDefinitions>>;

function processCharacterRelations(
  definitions: Readonly<Record<string, CharacterRelationDefinitions>>
): Record<string, Trait> {
  const traits: Record<string, Trait> = {};

  Object.entries(definitions).forEach(([subjectName, relationDefinitions]) => {
    const subject = character(subjectName);

    (
      Object.entries(relationDefinitions) as Array<
        [SourceCharacterRelationKind, readonly CharacterRelationDefinition[] | undefined]
      >
    ).forEach(([kind, entries]) => {
      if (!entries || entries.length === 0) return;

      entries.forEach(({ target, description, isMinor = false }) => {
        traits[`${kind}-${subjectName}-${target.name}`] = {
          description,
          group: [subject, target],
          relation: {
            kind,
            subject,
            target,
            isMinor,
          },
        };
      });
    });
  });

  return traits;
}

export default processCharacterRelations(characterRelationDefinitions);
