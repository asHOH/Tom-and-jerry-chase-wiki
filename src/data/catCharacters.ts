import { Character } from './types';

// Generate image URL based on character ID
const getCatImageUrl = (characterId: string): string => {
  // Check if the image exists, otherwise use a placeholder
  const existingImages = ['汤姆', '布奇', '托普斯'];

  if (existingImages.includes(characterId)) {
    return `/images/cats/${characterId}.png`;
  } else {
    return `/images/cats/placeholder-cat.png`;
  }
};

export const catCharacters: Record<string, Character> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  '汤姆': {
    id: '汤姆',
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家',

    maxHp: 255,
    hpRecovery: 3.5,
    moveSpeed: 755,
    jumpHeight: 420,

    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.3,
    clawKnifeRange: 300,

    positioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '主动技能的无敌有很强的上火箭能力。',
        detailedDescription: '主动技能的无敌有很强的上火箭能力，二被+锅 或者 枪+蓄力重击 也能对守火箭的老鼠产生极大威胁。'
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '无敌提供解控，一被提供续航。',
        detailedDescription: '无敌提供解控，一被提供续航，对打架阵容有反制能力。'
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '武器技能的直接抓取提供了一定的翻盘能力',
        detailedDescription: '武器技能的直接抓取提供了一定的翻盘能力。'
      },
    ],

    skills: [
      {
        id: 'tom-active',
        name: '发怒冲刺',
        type: 'ACTIVE',
        description: '解控并进入一段时间的无敌。',
        detailedDescription: '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌期间获得12.5%加速，仍会受到真实伤害（如仙女鼠的一星；但不会因此被击倒）和位移效果的影响（如尼宝的钩子）。无敌结束后会有2秒的10%减速（可以被护盾抵消）。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断，但不返还CD',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '无敌持续3.8秒。',
            cooldown: 20,
            videoUrl: '/videos/tom-active-1.mp4'
          },
          {
            level: 2,
            description: '无敌持续6.8秒。',
            cooldown: 20,
            videoUrl: '/videos/tom-active-2.mp4'
          },
          {
            level: 3,
            description: '无敌期间减少爪刀CD。',
            detailedDescription: '无敌期间减少25%爪刀CD。',
            cooldown: 20,
            videoUrl: '/videos/tom-active-3.mp4'
          },
        ]
      },
      {
        id: 'tom-weapon1',
        name: '手型枪',
        type: 'WEAPON1',
        description: '汤姆最爱的捕鼠神器。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '可被跳跃键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '手型枪水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
            detailedDescription: '手型枪水平飞出、原路飞回，对命中的老鼠造成15点伤害、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，额外给予65点伤害。眩晕对比例鼠和虚弱的老鼠也生效。',
            cooldown: 12, videoUrl: '/videos/tom-weapon1-1.mp4'
          },
          {
            level: 2,
            description: '手型枪飞行速度增加。',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon1-2.mp4'
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon1-3.mp4'
          },
        ]
      },
      {
        id: 'tom-weapon2',
        name: '平底锅',
        type: 'WEAPON2',
        description: '挥锅攻击老鼠并打出煎蛋。',
        // detailedDescription: '挥锅攻击老鼠并打出煎蛋。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '打晕并致盲附近老鼠、降低其救援速度；也能击飞道具。',
            detailedDescription: '挥锅对命中的老鼠造成15点伤害、5秒失明和55%救援减速；煎蛋也会对命中的老鼠造成15点伤害、5秒失明和55%救援减速；被锅命中的老鼠落地后受到25点伤害，并眩晕1秒。',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '失明延长至7.5秒；锅命中老鼠刷新爪刀CD。',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被平底锅命中、落地后眩晕的老鼠。',
            cooldown: 18,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'tom-passive',
        name: '捕鼠专家',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成伤害时回复Hp并加速。',
            detailedDescription: '对老鼠造成伤害时，回复25Hp并获得2.6秒的9.5%加速；若伤害来自爪刀，额外回复25Hp。',
            videoUrl: null
          },
          {
            level: 2,
            description: '手握老鼠时依然可以攻击',
            detailedDescription: '手握老鼠时依然可以攻击，并可触发蓄势、击晕、三被等效果，但不会改变惯性（即不能用二被进行楼梯刀加速）',
            videoUrl: null
          },
          {
            level: 3,
            description: '对老鼠造成伤害时，给予3秒沉默。',
            // detailedDescription: '对老鼠造成伤害时，给予3秒沉默。',
            videoUrl: null
          },
        ]
      }
    ]
  },

  /* ----------------------------------- 布奇 ----------------------------------- */
  '布奇': {
    id: '布奇',
    description: '"流浪猫铁三角"中的老大，从街头流浪逆袭为亿万富豪',

    maxHp: 220,
    attackBoost: 25,
    hpRecovery: 2,
    moveSpeed: 745,
    jumpHeight: 420,

    clawKnifeCdHit: 6,
    clawKnifeCdUnhit: 4.8,
    clawKnifeRange: 280,

    positioningTags: [
      {
        tagName: '防守',
        isMinor: false,
        description: '主动技能可以将奶酪推离洞口；旋转桶盖可以有效守火箭或奶酪。',
        detailedDescription: '主动技能可以将奶酪推离洞口；旋转桶盖可以有效守火箭或奶酪。'
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '一被快速起身和三级旋转桶盖的霸体提供了较强的打架能力。',
        detailedDescription: '一被快速起身和三级旋转桶盖的霸体提供了较强的打架能力。某种程度上，血量低反而成为了优点。'
      }
    ],

    skills: [
      {
        id: 'butch-active',
        name: '横冲直撞',
        type: 'ACTIVE',
        description: '猛冲一段距离，击飞道具并对老鼠造成伤害和晕眩。冲刺中可通过方向键改变方向。',
        // detailedDescription: '猛冲一段距离，击飞道具并对老鼠造成伤害和晕眩。冲刺中可通过方向键改变方向。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '不可打断',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成25点伤害和短暂眩晕。',
            cooldown: 20,
            videoUrl: '/videos/butch-active-1.mp4'
          },
          {
            level: 2,
            description: '略微减少前摇、冲刺更迅速。',
            cooldown: 20,
            videoUrl: '/videos/butch-active-2.mp4'
          },
          {
            level: 3,
            description: '冲刺更迅速、大幅提高造成的眩晕时间；命中时提升移速。',
            cooldown: 20,
            videoUrl: '/videos/butch-active-3.mp4'
          },
        ]
      },
      {
        id: 'butch-weapon1',
        name: '垃圾盖',
        type: 'WEAPON1',
        description: '小范围AOE。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键取消',
        cancelableAftercast: '不可取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕附近老鼠。',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-1.mp4'
          },
          {
            level: 2,
            description: '增加眩晕时间、被命中的老鼠攻击力短暂降低；震碎附近的易碎道具。',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-2.mp4'
          },
          {
            level: 3,
            description: '被命中的老鼠救援速度短暂降低。',
            cooldown: 18,
            videoUrl: '/videos/butch-weapon1-3.mp4'
          },
        ]
      },
      {
        id: 'butch-weapon2',
        name: '旋转桶盖',
        type: 'WEAPON2',
        description: '原地释放或扔出几何桶盖。',
        detailedDescription: '原地释放或扔出几何桶盖，轨迹十分独特。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃/道具键打断',
        cancelableAftercast: '可被跳跃/道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '伤害并眩晕命中的老鼠；自己捡到桶盖会获得6秒减伤。',
            cooldown: 20,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '增加桶盖飞行速度；自己捡到桶盖会额外获得强霸体。',
            cooldown: 12,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'butch-passive',
        name: '力大无穷',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '虚弱后更快起身、无敌时间更长。',
            videoUrl: null
          },
          {
            level: 2,
            description: '投掷道具造成额外伤害。',
            videoUrl: null
          },
          {
            level: 3,
            description: '爪刀有30%概率直接造成虚弱；技能和道具造成的控制时间增加1秒。',
            videoUrl: null
          },
        ]
      }
    ]
  },

  /* ----------------------------------- 托普斯 ---------------------------------- */
  '托普斯': {
    id: '托普斯',
    description: '"流浪猫铁三角"的一员，呆萌小灰猫，爱和小老鼠交朋友',

    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 780,
    jumpHeight: 420,

    clawKnifeCdHit: 5,
    clawKnifeCdUnhit: 3.6,
    clawKnifeRange: 220,

    positioningTags: [
      {
        tagName: '追击',
        isMinor: false,
        description: '分身提供额外的视野和极强的机动性。',
        detailedDescription: '分身提供额外的视野和极强的机动性。'
      },
      {
        tagName: '进攻',
        isMinor: true,
        description: '一被和捕虫网分别提供快速的击倒老鼠的能力。',
        detailedDescription: '一被和捕虫网分别提供快速的击倒老鼠的能力，后者同时拥有上火箭能力。'
      },
      {
        tagName: '防守',
        isMinor: true,
        description: '分身提供反隐和霸体，配合一被和击晕，可以高效守火箭或奶酪。',
        detailedDescription: '分身提供反隐和霸体，配合一被和击晕，可以高效守火箭或奶酪。'
      },
      {
        tagName: '打架',
        isMinor: true,
        description: '通过换位和分身提供的霸体反制老鼠的控制。',
        detailedDescription: '通过换位和分身提供的霸体反制老鼠的控制，但难以应对爆发输出。'
      },
      {
        tagName: '翻盘',
        isMinor: true,
        description: '捕虫网的直接抓取提供了一定的翻盘手段。',
        detailedDescription: '捕虫网的直接抓取提供了一定的翻盘手段。'
      },
    ],

    skills: [
      {
        id: 'topsy-active',
        name: '双重猫格',
        type: 'ACTIVE',
        description: '释放分身。分身继承知识卡、免疫碎片和捕鼠夹、提供小地图视野，但被攻击时受到固定额外伤害。额外技能按钮可指挥分身出击或跟随。再次使用技能可与分身换位。',
        detailedDescription: '释放分身。分身继承知识卡、免疫碎片和捕鼠夹、爪刀CD减少、提供小地图视野（包括隐身的老鼠），但被攻击时受到固定额外伤害。额外技能按钮可指挥分身出击或跟随（CD为5秒）。再次使用技能可与分身换位。本体获得部分增益时，分身也会获得。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可取消',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '换位CD为15秒；分身在一段时间或被击倒后消失。',
            cooldown: 36,
            videoUrl: '/videos/topsy-active-1.mp4'
          },
          {
            level: 2,
            description: '减少CD；换位CD缩短至10秒；换位时回复Hp并获得短暂加速和交互速度提升。',
            cooldown: 24,
            videoUrl: '/videos/topsy-active-2.mp4'
          },
          {
            level: 3,
            description: '减少CD；换位CD缩短至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分控制和受到的一半伤害会转移给分身。',
            detailedDescription: '减少CD；换位CD缩短至5秒；分身不会自行消失；如果分身在本体附近，本体受到的大部分控制（不包括狗哥抓取、捕鼠夹、虚弱、仙女鼠8星、尼宝钩子等）和受到的一半伤害会转移给分身。',
            cooldown: 20,
            videoUrl: '/videos/topsy-active-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-weapon1',
        name: '泡泡棒',
        type: 'WEAPON1',
        description: '吹出泡泡来困住老鼠。',
        detailedDescription: '吹出泡泡来困住老鼠。泡泡可以被道具砸破，也会因困住的老鼠挣扎而破裂。泡泡破裂时会伤害和眩晕周围老鼠；20秒后自然消失。',
        canMoveWhileUsing: false,
        canUseInAir: false,
        cancelableSkill: '不可打断',
        cancelableAftercast: '无后摇',
        skillLevels: [
          {
            level: 1,
            description: '吹出一个泡泡。',
            detailedDescription: '吹出一个泡泡，直接释放则泡泡会留在原地，拖动释放则泡泡会缓慢向该方向漂移。',
            cooldown: 20,
            videoUrl: '/videos/topsy-weapon1-1.mp4'
          },
          {
            level: 2,
            description: '减少CD。',
            cooldown: 12,
            videoUrl: '/videos/topsy-weapon1-2.mp4'
          },
          {
            level: 3,
            description: '每次吹出两个泡泡。',
            cooldown: 12,
            videoUrl: '/videos/topsy-weapon1-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-weapon2',
        name: '捕虫网',
        type: 'WEAPON2',
        description: '将面前的一只老鼠抓到网中；再次使用技能将老鼠扔出，造成伤害和眩晕。扔出的老鼠会被直接绑上途经的火箭。',
        detailedDescription: '将面前的一只老鼠抓到网中，期间老鼠可挣扎挣脱（若有多个老鼠在网的范围内，则会网住编号最小的）；再次使用技能将老鼠扔出，扔出的老鼠落地后眩晕并再次受到伤害，同时伤害周围的老鼠。扔出的老鼠会被直接绑上途经的火箭。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摇',
        skillLevels: [
          {
            level: 1,
            description: '网住一只老鼠。',
            // detailedDescription: '网住一只老鼠。',
            cooldown: 15,
            videoUrl: '/videos/tom-weapon2-1.mp4'
          },
          {
            level: 2,
            description: '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大。',
            detailedDescription: '扔出老鼠时也会对其造成伤害，并且老鼠在网中的持续时间越长，该伤害越大。',
            cooldown: 15,
            videoUrl: '/videos/tom-weapon2-2.mp4'
          },
          {
            level: 3,
            description: '减少CD。',
            cooldown: 10,
            videoUrl: '/videos/tom-weapon2-3.mp4'
          },
        ]
      },
      {
        id: 'topsy-passive',
        name: '元气满满',
        type: 'PASSIVE',
        skillLevels: [
          {
            level: 1,
            description: '大幅减少爪刀命中时的爪刀CD。',
            videoUrl: null
          },
          {
            level: 2,
            description: '手中的老鼠挣扎速度降低30%。',
            videoUrl: null
          },
          {
            level: 3,
            description: '击中老鼠时，移除其大部分增益。',
            videoUrl: null
          },
        ]
      }
    ]
  },
};

// Generate characters with faction ID and image URLs applied in bulk
export const catCharactersWithImages = Object.fromEntries(
  Object.entries(catCharacters).map(([characterId, character]) => [
    characterId,
    {
      ...character,
      factionId: 'cat' as const,
      imageUrl: getCatImageUrl(characterId)
    }
  ])
);
