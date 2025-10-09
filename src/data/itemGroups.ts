import { ItemGroup, ItemGroupDefinition } from './types';

const ItemGroupDefinitions: Record<string, ItemGroupDefinition> = {
  //------------------------------------角色，技能，知识卡，特技----------------------------------------------/
  泰菲类角色: {
    aliases: ['泰菲家族'],
    description:
      '指的是游戏内存在的6种“泰菲”角色。他们的碰撞体积比正常鼠方小一些，并且拥有特殊比利鼠外观及角色彩蛋。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '剑客泰菲', type: 'character' },
      { name: '恶魔泰菲', type: 'character' },
      { name: '天使泰菲', type: 'character' },
      { name: '侦探泰菲', type: 'character' },
      { name: '罗宾汉泰菲', type: 'character' },
    ],
  },
  投掷命中效果: {
    description:
      '指的是以投掷命中为触发条件的效果，这类效果[可以](少部分"投掷道具"无法触发其中的某几种效果，已单独注明)由{投掷道具}触发。包括知识卡、特技、角色技能。',
    group: [
      { name: '缴械', type: 'knowledgeCard' },
      { name: '精准投射', type: 'knowledgeCard' },
      { name: '投手', type: 'knowledgeCard' },
      { name: '追风', type: 'knowledgeCard' },
      { name: '乾坤一掷', type: 'knowledgeCard' },
      { name: '守株待鼠', type: 'knowledgeCard' },
      { name: '干扰投掷', type: 'specialSkill' },
      { name: '勇气投掷', type: 'specialSkill' },
      { name: '力大无穷', type: 'skill' },
    ],
  },
  //------------------------------------道具-------------------------------------------/
  非控制易碎道具: {
    description:
      '指的是能产生{碎片}但不产生{眩晕}的4种道具，也就是除{灰花瓶}和{蓝花瓶}以外的{易碎道具}。',
    group: [
      { name: '盘子', type: 'item' },
      { name: '扁盘', type: 'item' },
      { name: '玻璃杯', type: 'item' },
      { name: '碗', type: 'item' },
    ],
  },
  花瓶: {
    description: '包括灰花瓶和蓝花瓶，命中敌方造成眩晕和伤害，命中其他目标破碎并产生{碎片}。',
    group: [
      { name: '灰花瓶', type: 'item' },
      { name: '蓝花瓶', type: 'item' },
    ],
  },
  易碎道具: {
    description:
      '指的是能产生{碎片}的全部6种道具，也就是{非控制易碎道具}和{花瓶}。如需查询所有投掷命中后破碎并产生效果的道具，请见{可破碎道具}。',
    group: [
      { name: '盘子', type: 'item' },
      { name: '扁盘', type: 'item' },
      { name: '玻璃杯', type: 'item' },
      { name: '碗', type: 'item' },
      { name: '灰花瓶', type: 'item' },
      { name: '蓝花瓶', type: 'item' },
    ],
  },
  可破碎道具: {
    description:
      '指的是投掷命中后破碎并产生效果的10种道具。如仅需查询能产生{碎片}的道具，请见{易碎道具}。',
    group: [
      { name: '盘子', type: 'item' },
      { name: '扁盘', type: 'item' },
      { name: '玻璃杯', type: 'item' },
      { name: '碗', type: 'item' },
      { name: '灰花瓶', type: 'item' },
      { name: '蓝花瓶', type: 'item' },
      { name: '香水瓶', type: 'item' },
      { name: '胡椒瓶', type: 'item' },
      { name: '番茄', type: 'item' },
      { name: '冰块', type: 'item' },
    ],
  },
  鞭炮: {
    description: '包括小鞭炮和鞭炮束，引爆后造成不分敌我的爆炸和伤害。',
    group: [
      { name: '小鞭炮', type: 'item' },
      { name: '鞭炮束', type: 'item' },
    ],
  },
  投掷道具: {
    description:
      '包括能触发{投掷命中效果}的[所有](注：部分衍生物无法触发全部投掷命中类效果，已在各自界面注明。此处只要能触发任意一种效果就会进行收录)道具/衍生物。',
    group: [
      { name: '盘子', type: 'item' },
      { name: '扁盘', type: 'item' },
      { name: '玻璃杯', type: 'item' },
      { name: '碗', type: 'item' },
      { name: '灰花瓶', type: 'item' },
      { name: '蓝花瓶', type: 'item' },
      { name: '香水瓶', type: 'item' },
      { name: '胡椒瓶', type: 'item' },
      { name: '番茄', type: 'item' },
      { name: '冰块', type: 'item' },
      { name: '叉子', type: 'item' },
      { name: '高尔夫球', type: 'item' },
      { name: '果子', type: 'item' },
      { name: '子弹', type: 'item' },
      { name: '狗骨头', type: 'item' },
      { name: '鸟哨鞭炮', type: 'entity' },
      { name: '金币', type: 'entity' },
      { name: '火箭筒', type: 'entity' },
      { name: '蓝色小淘气', type: 'entity' },
      { name: '红色小淘气', type: 'entity' },
      { name: '绿色小淘气', type: 'entity' },
      { name: '红色卡牌', type: 'entity' },
      { name: '黄色卡牌', type: 'entity' },
      { name: '蓝色卡牌', type: 'entity' },
      { name: '闪耀足球', type: 'entity' },
      { name: '战矛', type: 'entity' },
      { name: '小电球', type: 'entity' },
      { name: '大电球', type: 'entity' },
      { name: '电池', type: 'entity' },
      { name: '金币符', type: 'entity' },
      { name: '定身符', type: 'entity' },
      { name: '乾坤袋(投射物)', type: 'entity' },
      { name: '柠檬', type: 'entity' },
      { name: '蓝图(投射物)', type: 'entity' },
      { name: '毛线球', type: 'entity' },
    ],
  },
  食物: {
    description: '[此处](有时候其他地方也会将饮料归类为食物)只包括牛奶和蛋糕。',
    group: [
      { name: '牛奶', type: 'item' },
      { name: '蛋糕', type: 'item' },
    ],
  },
  饮料: {
    description: '包括全部6种饮料。拾取后会储存在饮料栏，饮用后产生对应效果。',
    group: [
      { name: '远视饮料', type: 'item' },
      { name: '隐身饮料', type: 'item' },
      { name: '护盾饮料', type: 'item' },
      { name: '兴奋饮料', type: 'item' },
      { name: '变身饮料', type: 'item' },
      { name: '神秘饮料', type: 'item' },
    ],
  },
  熊猫食物: {
    description: '包括竹笋、窝窝头和萝卜墩，可被大熊猫或小熊猫拾取并吃掉。',
    group: [
      { name: '竹笋', type: 'item' },
      { name: '窝窝头', type: 'item' },
      { name: '萝卜墩', type: 'item' },
    ],
  },
  纸盒: {
    description: '[此处](有时候其他地方也会将空投包裹和礼品盒归类为纸盒)只包括小纸盒和大纸盒。',
    group: [
      { name: '小纸盒', type: 'item' },
      { name: '大纸盒', type: 'item' },
      { name: '藤蔓纸盒', type: 'entity' },
    ],
  },
  //--------------------------------------衍生物--------------------------------------------/
  仙人掌球: {
    description:
      '包括{仙人掌弹弓}发射的大小仙人掌球。如需查阅由{仙人掌}召唤的衍生物，请见{仙人掌(道具组)}。',
    group: [
      { name: '小仙人掌球', type: 'entity' },
      { name: '大仙人掌球', type: 'entity' },
    ],
  },
  战旗: {
    description: '包括由{国王战旗}召唤的5种战旗。',
    group: [
      { name: '攻击战旗', type: 'entity' },
      { name: '救援战旗', type: 'entity' },
      { name: '守护战旗', type: 'entity' },
      { name: '感知战旗', type: 'entity' },
      { name: '灵巧战旗', type: 'entity' },
    ],
  },
  电球: {
    description: '包括大小两种电球，由{3级强能灌注}召唤。',
    group: [
      { name: '小电球', type: 'entity' },
      { name: '大电球', type: 'entity' },
    ],
  },
  仙人掌: {
    description:
      '包括{仙人掌}召唤的大小仙人掌。如需查阅由{仙人掌弹弓}发射的衍生物，请见{仙人掌球}。',
    group: [
      { name: '大仙人掌', type: 'entity' },
      { name: '小仙人掌', type: 'entity' },
    ],
  },
  弓箭: {
    description: '包括{丘比特之箭}召唤的弓箭及蓄力箭。',
    group: [
      { name: '弓箭', type: 'entity' },
      { name: '蓄力箭', type: 'entity' },
    ],
  },
  小淘气: {
    aliases: ['小恶魔'],
    description: '包括{小淘气}召唤的3种不同颜色的小淘气。',
    group: [
      { name: '蓝色小淘气', type: 'entity' },
      { name: '红色小淘气', type: 'entity' },
      { name: '绿色小淘气', type: 'entity' },
    ],
  },
  卡牌: {
    aliases: ['纸牌', '牌'],
    description: '包括{奇思妙想}召唤的3种不同颜色的卡牌。',
    group: [
      { name: '红色卡牌', type: 'entity' },
      { name: '黄色卡牌', type: 'entity' },
      { name: '蓝色卡牌', type: 'entity' },
    ],
  },
  兔子: {
    description:
      '通常指的是由{魔术师}召唤的兔子先生或兔子大表哥。如需查阅被称为“兔子”的猫方角色，请见{兔八哥}。',
    group: [
      { name: '兔子先生', type: 'entity' },
      { name: '兔子大表哥', type: 'entity' },
    ],
  },
  分身: {
    description:
      '通常指的是由{侦探泰菲}召唤的2种分身。如需查阅同样拥有“分身”的猫方角色，请见{托普斯}。',
    group: [
      { name: '侦探泰菲分身', type: 'entity' },
      { name: '饮料分身', type: 'entity' },
    ],
  },
  图形: {
    aliases: ['形状'],
    description: '包括由{蘸水笔}召唤的3种图形及它们各自的强化形态。',
    group: [
      { name: '圆形', type: 'entity' },
      { name: '强化圆形', type: 'entity' },
      { name: '三角', type: 'entity' },
      { name: '强化三角', type: 'entity' },
      { name: '方块', type: 'entity' },
      { name: '强化方块', type: 'entity' },
    ],
  },
  //-------------------------------------状态---------------------------------------------/
  常规眩晕: {
    description:
      '指部分会在角色头顶显示为“眩晕”的状态，但不包括被{夹住}。此外{鱼钩眩晕}虽然有类似效果，但与常规眩晕仍有显著不同。',
    group: [
      { name: '眩晕', type: 'buff' },
      { name: '硬直', type: 'buff' },
      { name: '冰冻', type: 'buff' },
      { name: '爆炸', type: 'buff' },
      { name: '电击', type: 'buff' },
      { name: '拍扁', type: 'buff' },
    ],
  },
  软控制: {
    aliases: ['软控', '非硬性控制'],
    description: '指不会限制角色行动，但会限制/影响角色行为的一类控制效果。',
    group: [
      { name: '减速', type: 'buff' },
      { name: '降低跳跃高度', type: 'buff' },
      { name: '反向', type: 'buff' },
      { name: '失明', type: 'buff' },
      { name: '视野范围降低', type: 'buff' },
      { name: '禁用效果', type: 'buff' },
    ],
  },
  虚弱: {
    description:
      '包括猫虚弱与鼠虚弱。虚弱期间{禁用技能}且{禁用道具}，鼠虚弱期间获得高额{减速}及{跳跃高度降低}，且可被{抓起}，持续10秒；猫虚弱期间{无法移动、跳跃}，且额外获得50Hp/秒的{恢复}效果。该效果结束时获得1秒{无敌}。',
    group: [
      { name: '猫虚弱', type: 'buff' },
      { name: '鼠虚弱', type: 'buff' },
    ],
  },
};

const ItemsWithoutImages: Record<string, ItemGroup> = Object.fromEntries(
  Object.entries(ItemGroupDefinitions).map(([itemGroupName, itemGroup]) => [
    itemGroupName,
    {
      ...itemGroup,
      name: itemGroupName,
    },
  ])
);

export default ItemsWithoutImages;
