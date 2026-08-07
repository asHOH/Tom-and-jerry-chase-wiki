import type { CharacterRelationTrait } from '@/data/types';

export const characterRelationModeTraits: CharacterRelationTrait[] = [
  {
    description: '三级毛线球在该模式拉奶酪进洞口直接推入',
    relation: {
      kind: 'advantageModes',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '烟花大作战的鞭炮容易触发如玉的反击。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '如玉', type: 'character' },
      target: { name: '烟花大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '杰瑞推速较快，二级被动增加搬奶酪速度；鸟哨可破除部分猫的防守',
    relation: {
      kind: 'advantageModes',
      subject: { name: '杰瑞', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉机动性强，有无敌，在此模式受益极大。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '奔跑吧老鼠团体赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '烟花模式地图小，猫开局5级，苏蕊可以利用跳舞和烟花带来的眩晕一波杀穿。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '苏蕊', type: 'character' },
      target: { name: '烟花大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '三级被动对猫的斩杀线很高，但是怕控制和猛攻',
    relation: {
      kind: 'advantageModes',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '5V5经典奶酪赛', type: 'mode' },
      isMinor: true,
    },
  },
  {
    description:
      '侦探汤姆的放大镜可以无视护盾和无敌造成沉默效果，配合猛攻可以让对面猫一整局放不出技能。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '侦探汤姆', type: 'character' },
      target: { name: '装饰树大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '开局十级给予斯飞极大优势',
    relation: {
      kind: 'advantageModes',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description:
      '疾冲的感电能够干扰敌方老鼠捡挂件，同时强化主动技能与武器技能容易命中敌方猫，三级被动给予的续航也能持续作战',
    relation: {
      kind: 'advantageModes',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '装饰树大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '没有知识渊博的加持，斯飞无法正常开局',
    relation: {
      kind: 'disadvantageModes',
      subject: { name: '斯飞', type: 'character' },
      target: { name: '黄金钥匙赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '只在部分地图占优势（见上文牛仔汤姆的优势地图/模式）',
    relation: {
      kind: 'disadvantageModes',
      subject: { name: '牛仔汤姆', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '火炮可以强势守家，但需注意该技能可被敌方老鼠使用',
    relation: {
      kind: 'advantageModes',
      subject: { name: '航海士杰瑞', type: 'character' },
      target: { name: '装饰树大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '前期一起推几块天菲等级就起来了，几乎不怕猫咪。并且可以救援一些刁钻的火箭。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '抢到钥匙后可以强开洞，但前期容易被针对',
    relation: {
      kind: 'advantageModes',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '黄金钥匙赛', type: 'mode' },
      isMinor: true,
    },
  },
  {
    description: '侦菲后期自保极强，借助3级被动能苟在角落持续隐身从而不被抓到',
    relation: {
      kind: 'advantageModes',
      subject: { name: '侦探泰菲', type: 'character' },
      target: { name: '5V5经典奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '侦菲后期自保极强，配合3级被动与3级分身可实现全程拉扯猫咪',
    relation: {
      kind: 'advantageModes',
      subject: { name: '侦探泰菲', type: 'character' },
      target: { name: '黄金钥匙赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '侦菲技能在本模式起不到任何作用，且自身会被一下炸死',
    relation: {
      kind: 'disadvantageModes',
      subject: { name: '侦探泰菲', type: 'character' },
      target: { name: '烟花大作战', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '恶菲跑得快、跳得高、后期三被伤害高。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '奔跑吧老鼠团体赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description:
      '5v5模式中，好的队伍可以快速升级到近六级成型，且5v5模式中道具刷新量大，恶菲可以造出满屋子绿恶魔，对敌方猫和鼠压力都非常大。',
    relation: {
      kind: 'advantageModes',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '5V5经典奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '该模式老鼠血量极高，道具多，追汤无法发挥独属前期的优势',
    relation: {
      kind: 'disadvantageModes',
      subject: { name: '追风汤姆', type: 'character' },
      target: { name: '疯狂奶酪赛', type: 'mode' },
      isMinor: false,
    },
  },
  {
    description: '无敌无视烟花伤害',
    relation: {
      kind: 'disadvantageModes',
      subject: { name: '汤姆', type: 'character' },
      target: { name: '烟花大作战', type: 'mode' },
      isMinor: false,
    },
  },
];
