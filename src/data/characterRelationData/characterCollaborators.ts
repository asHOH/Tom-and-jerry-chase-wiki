import type { Trait } from '@/data/types';

export const characterRelationCharacterCollaboratorTraits: Trait[] = [
  {
    description:
      '鲍姆救援后自保差不好走，可以通过剑客莉莉风墙掩护其撤退；莉莉救援时鲍姆也可提供干扰效果。',
    group: [
      { name: '鲍姆', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '鲍姆', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '鲍姆救援后可通过米可拍照撤退。',
    group: [
      { name: '鲍姆', type: 'character' },
      { name: '米可', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '鲍姆', type: 'character' },
      target: { name: '米可', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '可以在表演者•杰瑞铁血的时候将其变为大老鼠，防止被抓。',
    group: [
      { name: '表演者•杰瑞', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '表演者•杰瑞', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '国王杰瑞战旗与朝圣者泰菲配合可打出极高伤害。',
    group: [
      { name: '朝圣者泰菲', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '朝圣者泰菲', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '进一步增强输出。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '金币与火炮衔接控制。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '圆球衔接控制，藤蔓提供续航。',
    group: [
      { name: '朵朵', type: 'character' },
      { name: '罗宾汉泰菲', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '朵朵', type: 'character' },
      target: { name: '罗宾汉泰菲', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '天使杰瑞和恶魔杰瑞都属于后期角色，恶魔杰瑞被复活后的存活能力较强，恶魔为天使提供增益，天使为恶魔提供复活和雷云。',
    group: [
      { name: '恶魔杰瑞', type: 'character' },
      { name: '天使杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '恶魔杰瑞', type: 'character' },
      target: { name: '天使杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '恶魔泰菲的蓝色小淘气可以显著降低剑客莉莉利用二级被动的救援难度。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '恶魔泰菲的红色小淘气可以将猫咪打进流放门强行流放，但实战实现难度偏高。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '恶魔杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '恶魔杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '防止尼宝被猫方对策角色托普斯克制，蓝恶魔让尼宝在托普斯没有护盾时放不出捕虫网，从而按照正常节奏救援。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '尼宝', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '尼宝', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '米雪儿可以变身成红色小淘气，被恶菲向上掷出进行快速跨楼层支援；也可以变身成捕鼠夹与恶菲进行主动布夹，拦截没有带细心的猫咪。',
    group: [
      { name: '恶魔泰菲', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '恶魔泰菲', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '国王杰瑞的强化救援战旗配合表演者•杰瑞的梦幻舞步可以实现稳救。',
    group: [
      { name: '国王杰瑞', type: 'character' },
      { name: '表演者•杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '国王杰瑞', type: 'character' },
      target: { name: '表演者•杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '国王杰瑞的强化救援战旗可以大幅降低尼宝使用灵活跳跃的救援难度。',
    group: [
      { name: '国王杰瑞', type: 'character' },
      { name: '尼宝', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '国王杰瑞', type: 'character' },
      target: { name: '尼宝', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '国王杰瑞的进攻战旗可以为音乐家杰瑞提供高额增伤。',
    group: [
      { name: '国王杰瑞', type: 'character' },
      { name: '音乐家杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '国王杰瑞', type: 'character' },
      target: { name: '音乐家杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '航海士杰瑞和拿坡里鼠能相互补充控制，火药桶和斜塔还能一起守火箭。',
    group: [
      { name: '航海士杰瑞', type: 'character' },
      { name: '拿坡里鼠', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '航海士杰瑞', type: 'character' },
      target: { name: '拿坡里鼠', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '战旗的增益能使剑杰的输出能力进一步提升。',
    group: [
      { name: '剑客杰瑞', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '剑客杰瑞', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '爱心之吻，提高容错与基础数值',
    group: [
      { name: '剑客杰瑞', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '剑客杰瑞', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '剑客莉莉的低成本拦截可以帮助头盔撤离和协作长枪打连控。',
    group: [
      { name: '剑客泰菲', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '剑客泰菲', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '仅限长枪剑菲。长枪上的音乐家杰瑞释放礼服可让长枪强制位移，对猫造成极高爆发伤害。',
    group: [
      { name: '剑客泰菲', type: 'character' },
      { name: '音乐家杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '剑客泰菲', type: 'character' },
      target: { name: '音乐家杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '附身状态下的米雪儿可以抓住剑客泰菲的长枪，使剑客太妃能带着拥有长枪的米雪儿通过来回接触猫咪反复触发长枪伤害',
    group: [
      { name: '剑客泰菲', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '剑客泰菲', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '莱恩容易死，仙女鼠变六星提高下限，并且在遇到汤姆无敌强上火箭时，可强制造成伤害变线条，线条猫与八星一块干扰猫，使对面露出破绽。',
    group: [
      { name: '莱恩', type: 'character' },
      { name: '仙女鼠', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '莱恩', type: 'character' },
      target: { name: '仙女鼠', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '剑客泰菲', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '剑客泰菲', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '马索尔', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '马索尔', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗宾汉杰瑞的全图二段跳支援可以辅助救人位逃跑。',
    group: [
      { name: '罗宾汉杰瑞', type: 'character' },
      { name: '尼宝', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉杰瑞', type: 'character' },
      target: { name: '尼宝', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '航海士杰瑞与罗菲的控制能互相弥补CD。罗菲还能提供航海士杰瑞急需的恢复能力。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '剑客杰瑞的伤害和罗菲的控制能互相弥补短板。罗菲还能提供恢复，发挥剑客杰瑞的Hp上限优势。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '剑客杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '剑客杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '剑客莉莉与罗菲的控制能互相弥补CD。罗菲还能提供恢复，发挥剑客莉莉的Hp上限优势，并触发她的Lv.1被动。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '米可与罗菲的控制能互相弥补CD。罗菲还能提供米可相对匮乏的恢复能力。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '米可', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '米可', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '牛仔杰瑞与罗菲的控制能互相弥补CD。罗菲还能提供恢复，发挥牛仔杰瑞的Hp上限优势。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '牛仔杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '牛仔杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗菲能为天使杰瑞提供恢复，帮助其多次触发被动。',
    group: [
      { name: '罗宾汉泰菲', type: 'character' },
      { name: '天使杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '罗宾汉泰菲', type: 'character' },
      target: { name: '天使杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '国王杰瑞的救援战旗能为马索尔提供救援速度，守护战旗或国王权杖能提供护盾，辅助其稳定救援。',
    group: [
      { name: '马索尔', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '马索尔', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '剑客莉莉的剑气能为马索尔提供回溯能力，帮助其救援后返回。',
    group: [
      { name: '马索尔', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '马索尔', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '米可的相机能为马索尔提供回溯能力，帮助其救援后返回。',
    group: [
      { name: '马索尔', type: 'character' },
      { name: '米可', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '马索尔', type: 'character' },
      target: { name: '米可', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '莉莉的风墙可困住或阻挡猫，方便梦游安全地拉取毛线球。',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '梦游在拉毛线时，仙女鼠给梦游丢六星不会让毛线消失，可以强行破局。',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '仙女鼠', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '仙女鼠', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '梦游在拉毛线时，米雪儿使用小情绪，梦游杰瑞安抚后变大不会让毛线消失，可以强行破局。',
    group: [
      { name: '梦游杰瑞', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '梦游杰瑞', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '二级鼓舞可以在米可采访时帮米可回血和加速，提高续航。',
    group: [
      { name: '米可', type: 'character' },
      { name: '杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '米可', type: 'character' },
      target: { name: '杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '二段跳和鼓舞可以增加杰瑞的移速和逃跑能力，等级越高效果越显著。',
    group: [
      { name: '杰瑞', type: 'character' },
      { name: '罗宾汉杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '杰瑞', type: 'character' },
      target: { name: '罗宾汉杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '雪梨可以帮米可回血，提高续航，配合米可三级被动很难被打死，也有了防止拍抓的能力。',
    group: [
      { name: '米可', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '米可', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '主动技能协奏曲可以在米可采访时给米可回血和加速，提高续航。',
    group: [
      { name: '米可', type: 'character' },
      { name: '音乐家杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '米可', type: 'character' },
      target: { name: '音乐家杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '米可技能自带霸体与减伤，可与米雪儿的回复和变大极好衔接（不要小瞧兄妹之间的羁绊啊！）',
    group: [
      { name: '米雪儿', type: 'character' },
      { name: '米可', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '米雪儿', type: 'character' },
      target: { name: '米可', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '米雪儿2武附身音乐家后可以提高音乐家杰瑞的自保能力，同时由于附身后仍然可以触发共鸣，所以能卡好距离仅用一段礼服拆掉火箭',
    group: [
      { name: '音乐家杰瑞', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '音乐家杰瑞', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '魔术师的卡牌和航海士杰瑞的金币可以相互弥补控制真空期，提高干扰能力。魔术师在干扰的同时还能推奶酪。',
    group: [
      { name: '魔术师', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '魔术师', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '罗宾汉泰菲与拿坡里鼠的高频控制能互相弥补CD，提高容错。罗菲还能利用圆球与斜塔的碰撞，快速碰撞破墙。',
    group: [
      { name: '拿坡里鼠', type: 'character' },
      { name: '罗宾汉泰菲', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '拿坡里鼠', type: 'character' },
      target: { name: '罗宾汉泰菲', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '骑乘披萨饼期间可通过花束快速位移，连带披萨饼一同移动，出其不意。',
    group: [
      { name: '拿坡里鼠', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '拿坡里鼠', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '可以配合泥巴救援后传送',
    group: [
      { name: '尼宝', type: 'character' },
      { name: '剑客莉莉', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '尼宝', type: 'character' },
      target: { name: '剑客莉莉', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '牛仔软控配合海盗硬控',
    group: [
      { name: '牛仔杰瑞', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '牛仔杰瑞', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '牛仔控住可接弹琴，1级被动提供的经验可以助他活到后期。',
    group: [
      { name: '佩克斯', type: 'character' },
      { name: '牛仔杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '佩克斯', type: 'character' },
      target: { name: '牛仔杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '可以为佩克斯提供续航。',
    group: [
      { name: '佩克斯', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '佩克斯', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '航海士杰瑞可拆掉火箭，便于霜月守火箭。',
    group: [
      { name: '霜月', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '霜月', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '马索尔的升龙拳可以使霸体中的猫咪修不了火箭，提高拦截几率。',
    group: [
      { name: '航海士杰瑞', type: 'character' },
      { name: '马索尔', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '航海士杰瑞', type: 'character' },
      target: { name: '马索尔', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '音乐家杰瑞可拆掉火箭，便于霜月守火箭。',
    group: [
      { name: '霜月', type: 'character' },
      { name: '音乐家杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '霜月', type: 'character' },
      target: { name: '音乐家杰瑞', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '感应雷可以中断交互动作，和火药桶可以相互配合，让猫难以绑上火箭，硬拖时间给队友机会。',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '航海士杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '航海士杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '雪梨的回血配合泰菲被动霸体和减伤，没有强制位移和高伤的情况下可以强行推奶酪',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '泰菲蹭国王的强化救援战旗，利用圆滚滚的无敌位移可以实现稳救',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '国王杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '国王杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '泰菲可以利用罗菲的树快速回血，弥补健康值低的缺点，有利于强行推奶酪',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '罗宾汉泰菲', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '罗宾汉泰菲', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '玛丽的扇子可以加快泰菲推速，帮助泰菲回血，有利于在残血前尽可能多推进奶酪',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '玛丽', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '玛丽', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '米雪儿的漂浮气球配合泰菲圆滚滚解控，可大大提高泰菲的续航和容错率，使其不易被击倒',
    group: [
      { name: '泰菲', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '泰菲', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '天使杰瑞的Lv.2被动可以夺取猫身上的星星，供仙女鼠使用；雷云还能降低对方伤害，提高二者的容错率。但这一组合中的仙女鼠压力极大，很怕空技能和猛攻，相对来说操作和收益并不完全对等，慎用。',
    group: [
      { name: '天使杰瑞', type: 'character' },
      { name: '仙女鼠', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使杰瑞', type: 'character' },
      target: { name: '仙女鼠', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '仙女鼠1星命中朵朵可使其电量条立即充满。',
    group: [
      { name: '仙女鼠', type: 'character' },
      { name: '朵朵', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '仙女鼠', type: 'character' },
      target: { name: '朵朵', type: 'character' },
      isMinor: true,
    },
  },
  {
    description: '雪梨帮天使泰菲提高生存能力，可以远程辅助其救援。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '雪梨', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '雪梨', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '带有{漂浮气球}的米雪儿和天使泰菲的技能搭配能极大提高生存能力，两者组合后几乎无法被击倒。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '米雪儿', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '米雪儿', type: 'character' },
      isMinor: false,
    },
  },
  {
    description:
      '二段跳的辅助非常强力，且天菲自身跳跃能力较弱，很大程度上解决了舍己救人不好跑的问题。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '罗宾汉杰瑞', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '罗宾汉杰瑞', type: 'character' },
      isMinor: false,
    },
  },
  {
    description: '罗菲的藤曼可以回复Hp，提高天菲的生存能力和技能续航能力。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '罗宾汉泰菲', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '罗宾汉泰菲', type: 'character' },
      isMinor: true,
    },
  },
  {
    description:
      '两者可以叠加火箭燃烧的减缓速度，组合守火箭非常强势。并且天菲的庇护可以避免猫打断莱恩释放技能。',
    group: [
      { name: '天使泰菲', type: 'character' },
      { name: '莱恩', type: 'character' },
    ],
    relation: {
      kind: 'collaborators',
      subject: { name: '天使泰菲', type: 'character' },
      target: { name: '莱恩', type: 'character' },
      isMinor: true,
    },
  },
];
