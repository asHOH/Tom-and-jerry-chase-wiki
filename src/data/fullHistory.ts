import { GameHistory, ChangeType } from './types';

export const historyData: GameHistory = [
  {
    year: 2015,
    events: [
      {
        date: '5.13',
        description: '网易获得《猫和老鼠》IP代理权，并通过玩家投票决定将其开发为手游。',
        details: {
          milestone: 'IP代理权确认',
        },
      },
      {
        date: '5.20',
        description: '网易正式宣布将推出跑酷类手游《猫和老鼠官方手游》，并定于6月1日开启公测。',
        details: {
          milestone: '跑酷手游公布',
        },
      },
      {
        date: '6.1',
        description: '《猫和老鼠官方手游》跑酷版正式开启公测，首日下载量突破60万。',
        details: {
          testPhaseInfo: '公测',
          milestone: '跑酷手游上线',
        },
      },
      {
        date: '6.8',
        description: '游戏上线首周下载量突破300万，登顶App Store双榜（免费榜和总榜）第一。',
        details: {
          milestone: '登顶App Store双榜',
        },
      },
      {
        date: '6.15',
        description: '游戏上线双周，累计下载量突破500万。',
        details: {
          milestone: '下载量破500万',
        },
      },
      {
        date: '7.1',
        description: '公测满月，游戏累计下载量突破1000万。',
        details: {
          milestone: '下载量破1000万',
        },
      },
    ],
  },
  {
    year: 2018,
    events: [
      {
        date: '2.8-4.18',
        description:
          '游戏开启第一次测试，标志着1v4非对称竞技玩法的《猫和老鼠》手游正式诞生。初期玩法近似于现今的黄金钥匙赛，角色技能主要以独特的被动形式呈现。',
        details: {
          testPhaseInfo: '第一次测试',
          content: {
            newCharacters: ['汤姆', '杰瑞', '侦探杰瑞', '罗宾汉杰瑞', '海盗杰瑞'],
          },
        },
      },
      {
        date: '4.26-5.7',
        description: '游戏开启第二次测试，对操作系统和游戏机制进行了更新。',
        details: {
          testPhaseInfo: '第二次测试',
        },
      },
      {
        date: '5.12-5.19',
        description: '游戏开启第三次测试，引入了新角色布奇、国王杰瑞和剑客杰瑞。',
        details: {
          testPhaseInfo: '第三次测试',
          content: {
            newCharacters: ['布奇', '国王杰瑞', '剑客杰瑞'],
          },
        },
      },
      {
        date: '6.20-7.2',
        description:
          '共研服2.0开启，游戏核心玩法迭代为经典的奶酪赛模式。新增了NPC斯派克和女主人，并加入了道具遥控器。此次测试诞生了全服首位猫皇“虎牙北城的故事”。',
        details: {
          testPhaseInfo: '共研服2.0',
          content: {
            newItems: ['遥控器'],
          },
        },
      },
      {
        date: '7.18-8.2',
        description: '游戏开启暑假内测，引入了技能系统（知识卡前身）和角色等级系统（熟练度前身）。',
        details: {
          testPhaseInfo: '暑假内测',
        },
      },
      {
        date: '12.21-12.23',
        description: 'iOS端进行了一次小范围测试，新增了角色托普斯和泰菲，并更新了角色技能系统。',
        details: {
          testPhaseInfo: 'iOS端小测',
          content: {
            newCharacters: ['托普斯', '泰菲'],
          },
        },
      },
    ],
  },
  {
    year: 2019,
    events: [
      {
        date: '2.22-3.3',
        description:
          '共研服3.0开启，新增地图经典之家II、III和雪夜古堡。加入了拳头盒子、高尔夫球等多种新道具，并实装了局内技能点升级系统。',
        details: {
          testPhaseInfo: '共研服3.0',
          content: {
            newItems: ['拳头盒子', '高尔夫球', '锤子', '泡泡机', '炸药堆'],
          },
        },
      },
      {
        date: '3.29-4.14',
        description: '安卓端进行了一次小范围测试，新增地图夏日邮轮和道具狗骨头，并上线了学业系统。',
        details: {
          testPhaseInfo: '安卓端小测',
          content: {
            newItems: ['狗骨头'],
          },
        },
      },
      {
        date: '5.13-5.15',
        description:
          '游戏进行灰度测试，新增地图雪夜古堡II、III和NPC金丝雀。现代的熟练度系统和知识卡系统正式更新。',
        details: {
          testPhaseInfo: '灰度测试',
        },
      },
      {
        date: '5.31',
        description: '《猫和老鼠》手游安卓端于上午8:00正式开启公测，标志着游戏正式诞生。',
        details: {
          milestone: '安卓端公测开启',
          testPhaseInfo: '公测',
          content: {
            newCharacters: [
              '汤姆',
              '布奇',
              '托普斯',
              '杰瑞',
              '侦探杰瑞',
              '罗宾汉杰瑞',
              '海盗杰瑞',
              '国王杰瑞',
              '剑客杰瑞',
              '泰菲',
            ],
            newKnowledgeCards: [
              '击晕',
              '暴怒',
              '猛攻',
              '威压',
              '长爪',
              '斗志昂扬',
              '寻踪',
              '恐吓',
              '狡诈',
              '巡逻戒备',
              '震慑',
              '无畏',
              '护佑',
              '舍己',
              '祝愿',
              '破墙',
              '追风',
              '飞跃',
              '逃之夭夭',
              '速推',
              '相助',
              '不屈',
              '门卫',
              '脱身',
            ],
          },
        },
      },
      {
        date: '6.1',
        description: 'iOS端公测开启，游戏正式实现全平台上线。',
        details: {
          milestone: '全平台上线',
        },
      },
      {
        date: '6.3',
        description: '游戏联合CC、斗鱼、虎牙、触手、西瓜五大直播平台，同步开启主播招募活动。',
        details: {
          milestone: '五大平台主播招募',
        },
      },
      {
        date: '6.6',
        description: '新角色“莱特宁”登场。同时对汤姆、托普斯进行加强，并调整了侦探杰瑞和国王杰瑞。',
        details: {
          content: {
            newCharacters: ['莱特宁'],
          },
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '侦探杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '国王杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '6.13',
        description:
          '新角色“剑客泰菲”登场。托普斯得到加强，机器鼠和国王杰瑞被调整。每次点燃火箭所减少的救援时间被调整。',
        details: {
          content: {
            newCharacters: ['剑客泰菲'],
            newKnowledgeCards: ['猫是液体', '气势如牛', '幸运', '救救我', '强健'],
          },
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '国王杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '暴怒', changeType: ChangeType.BUFF },
              { name: '猛攻', changeType: ChangeType.BUFF },
              { name: '震慑', changeType: ChangeType.BUFF },
              { name: '逃窜', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '6.17',
        description:
          '对机器鼠和道具狗骨头（泰克）进行了调整。角色方面，汤姆和托普斯被加强，布奇被削弱，剑客泰菲被调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.NERF },
              { name: '剑客泰菲', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '6.20',
        description: '对猫方角色莱特宁进行了削弱。',
        details: {
          balance: {
            characterChanges: [{ name: '莱特宁', changeType: ChangeType.NERF }],
          },
        },
      },
      {
        date: '6.27',
        description: '新角色“牛仔杰瑞”登场，同时侦探杰瑞获得加强。',
        details: {
          content: {
            newCharacters: ['牛仔杰瑞'],
          },
          balance: {
            characterChanges: [{ name: '侦探杰瑞', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '7.4',
        description: '新角色“牛仔汤姆”登场。牛仔杰瑞和剑客杰瑞被加强，侦探杰瑞和海盗杰瑞被调整。',
        details: {
          content: {
            newCharacters: ['牛仔汤姆'],
          },
          balance: {
            characterChanges: [
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '侦探杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '海盗杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.11',
        description:
          '上线新玩法“疯狂奶酪赛”和自定义按键系统。汤姆、托普斯、布奇、牛仔杰瑞等角色受到玩法调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '托普斯', changeType: ChangeType.ADJUSTMENT },
              { name: '布奇', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.18',
        description: '新角色“恶魔杰瑞”登场。夏日邮轮地图进行了修改，并上线了贴纸系统。',
        details: {
          content: {
            newCharacters: ['恶魔杰瑞'],
          },
        },
      },
      {
        date: '7.19',
        description: 'S1赛季正式开始。',
        details: {
          milestone: 'S1赛季开始',
          content: {
            newKnowledgeCards: ['铜墙', '反侦察', '细心', '舍己', '吃货', '加大火力', '求生欲'],
          },
        },
      },
      {
        date: '7.25',
        description: '牛仔汤姆和恶魔杰瑞获得加强，牛仔杰瑞被调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '8.1',
        description:
          '更新地图夏日邮轮II和雪夜古堡的大炮机制。托普斯被加强，剑客泰菲被削弱，另有多名鼠角色被调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '剑客泰菲', changeType: ChangeType.NERF },
              { name: '剑客杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '罗宾汉杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '海盗杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '巡逻戒备', changeType: ChangeType.BUFF },
              { name: '细心', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '8.8',
        description:
          '新角色“雪梨”登场。汤姆的第二武器“平底锅”上线。同时更新了成就系统和角色教学系统。',
        details: {
          content: {
            newCharacters: ['雪梨'],
            newSecondWeapons: ['汤姆-平底锅'],
          },
        },
      },
      {
        date: '8.15',
        description:
          '更新地图夏日邮轮III并修改了邮轮系列地图。上线新玩法“烟花大作战”和金币福利系统。',
        details: {
          balance: {
            characterChanges: [
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '侦探杰瑞', changeType: ChangeType.BUFF },
            ],
            knowledgeCardChanges: [
              { name: '狡诈', changeType: ChangeType.BUFF },
              { name: '铜墙', changeType: ChangeType.BUFF },
              { name: '恐吓', changeType: ChangeType.BUFF },
              { name: '救救我', changeType: ChangeType.BUFF },
              { name: '脱身', changeType: ChangeType.BUFF },
              { name: '不屈', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '8.22',
        description: '新角色“图多盖洛”和新地图“太空堡垒”上线。同时更新了战队系统。',
        details: {
          content: {
            newCharacters: ['图多盖洛'],
          },
          balance: {
            characterChanges: [
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '8.29',
        description: '杰瑞的第二武器“鸟哨”上线。新增天梯22:00-24:00时间段。',
        details: {
          content: {
            newSecondWeapons: ['杰瑞-鸟哨'],
            newKnowledgeCards: ['回家', '投手', '捕鼠夹', '严防死守', '春风得意'],
          },
          balance: {
            characterChanges: [
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '侦探杰瑞', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
            ],
            knowledgeCardChanges: [{ name: '舍己', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '9.5',
        description: '对太空堡垒地图进行了优化，增加了货仓传送带的货物并降低了太空环境的扣血速度。',
        details: {
          balance: {
            characterChanges: [
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '9.12',
        description: '新角色“恶魔泰菲”登场。上线新玩法“沙滩排球”和夏日邮轮地图的彩蛋房。',
        details: {
          content: {
            newCharacters: ['恶魔泰菲'],
          },
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.NERF },
              { name: '杰瑞', changeType: ChangeType.NERF },
              { name: '莱特宁', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '9.19',
        description: '雪夜古堡场景中增加了盔甲人互动元素。多名角色获得加强。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '恶魔泰菲', changeType: ChangeType.BUFF },
              { name: '海盗杰瑞', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '9.26',
        description:
          '新角色“天使杰瑞”和托普斯的第二武器“捕虫网”上线。新增玩法“奔跑吧老鼠”以及亲密关系、观战等多个社交系统。',
        details: {
          content: {
            newCharacters: ['天使杰瑞'],
            newSecondWeapons: ['托普斯-捕虫网'],
          },
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '9.27',
        description: 'S2赛季开始，赛季货架皮肤为图多盖洛·绝代佳人。',
        details: {
          milestone: 'S2赛季开始',
          content: {
            newKnowledgeCards: ['铁血', '皮糙肉厚'],
          },
        },
      },
      {
        date: '10.10',
        description: '对道具鞭炮束和拳头盒子进行了平衡性调整。',
        details: {
          balance: {
            itemChanges: [
              { name: '鞭炮束', changeType: ChangeType.ADJUSTMENT },
              { name: '拳头盒子', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '10.17',
        description:
          '新增机制：老鼠在虚弱状态下会掉落手中持有的道具。同时上线了亲密关系中的CP关系。',
        details: {
          content: {
            newKnowledgeCards: ['屈打成招', '熊熊燃烧', '闭门羹', '美食家'],
          },
          balance: {
            characterChanges: [
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '恶魔泰菲', changeType: ChangeType.BUFF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '10.24',
        description: '太空堡垒地图新增彩蛋房和弹射器。多张知识卡获得加强。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '铜墙', changeType: ChangeType.BUFF },
              { name: '恐吓', changeType: ChangeType.BUFF },
              { name: '回家', changeType: ChangeType.BUFF },
              { name: '求生欲', changeType: ChangeType.BUFF },
              { name: '相助', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '10.31',
        description:
          '新角色“侍卫汤姆”登场。雪夜古堡地图推出万圣节主题换色（此后成为年度活动）。上线新玩法“特工行动”和称号系统。',
        details: {
          content: {
            newCharacters: ['侍卫汤姆'],
          },
          balance: {
            characterChanges: [
              { name: '天使杰瑞', changeType: ChangeType.NERF },
              { name: '恶魔杰瑞', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '11.7',
        description: '剑客杰瑞的第二武器“格挡之剑”上线。恶魔杰瑞和牛仔杰瑞被调整。',
        details: {
          content: {
            newSecondWeapons: ['剑客杰瑞-格挡之剑'],
          },
          balance: {
            characterChanges: [
              { name: '恶魔杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '11.14',
        description: '多名角色获得加强，包括汤姆、托普斯、泰菲、恶魔泰菲和剑客泰菲。',
        details: {
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '泰菲', changeType: ChangeType.BUFF },
              { name: '恶魔泰菲', changeType: ChangeType.BUFF },
              { name: '剑客泰菲', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '11.21',
        description: '新地图“游乐场”上线。同时更新了知识卡图鉴系统。',
        details: {
          content: {
            newKnowledgeCards: ['守株待鼠', '越挫越勇', '绝地反击', '应激反应'],
          },
        },
      },
      {
        date: '11.28',
        description: '新角色“天使泰菲”登场。多张知识卡被加强，知识卡“回家”被重做。',
        details: {
          content: {
            newCharacters: ['天使泰菲'],
          },
          balance: {
            knowledgeCardChanges: [
              { name: '寻踪', changeType: ChangeType.BUFF },
              { name: '皮糙肉厚', changeType: ChangeType.BUFF },
              { name: '狡诈', changeType: ChangeType.BUFF },
              { name: '求生欲', changeType: ChangeType.BUFF },
              { name: '闭门羹', changeType: ChangeType.BUFF },
              { name: '回家', changeType: ChangeType.REWORK },
            ],
          },
        },
      },
      {
        date: '12.5',
        description: '上线人气小屋系统和休闲玩法每日轮换系统，并调整了天梯玩法的得分机制。',
        details: {
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '泰菲', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '12.12',
        description: '布奇的第二武器“旋转桶盖”上线，同时布奇的角色平衡性被调整。',
        details: {
          content: {
            newSecondWeapons: ['布奇-旋转桶盖'],
          },
          balance: {
            characterChanges: [{ name: '布奇', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '12.19',
        description:
          '新角色“图茨”登场。经典之家地图推出圣诞主题换色（此后成为年度活动）。上线新玩法“圣诞大作战”和彩饰系统。',
        details: {
          content: {
            newCharacters: ['图茨'],
          },
        },
      },
      {
        date: '12.26',
        description:
          '对图茨和恶魔泰菲进行调整。同时调整了地图中的钟、盔甲人、望远镜等场景互动元素。游戏内实名认证系统上线。',
        details: {
          balance: {
            characterChanges: [
              { name: '图茨', changeType: ChangeType.ADJUSTMENT },
              { name: '恶魔泰菲', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '12.27-次年1.1',
        description: '共研服开启，主要测试角色调整、新系统和自定义头像功能。',
        details: {
          testPhaseInfo: '共研服',
        },
      },
    ],
  },
  {
    year: 2020,
    events: [
      {
        date: '1.2',
        description: '更新天梯巅峰对决系统。',
        details: {},
      },
      {
        date: '1.3-1.8',
        description: '共研服，测试角色调整、新角色、新知识卡、留言板系统、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、新角色、新知识卡、留言板系统、自定义头像。',
        },
      },
      {
        date: '1.4-1.22',
        description: '虎牙冬季嘉年华，宝鸽鸽、眼睛锅担任解说，总奖金10万元。',
        details: {},
      },
      {
        date: '1.9',
        description: '更新魔镜皮萌系女仆。调整魔法魔镜系统。调整监听器、熨衣板。',
        details: {
          balance: {
            itemChanges: [
              { name: '监听器', changeType: ChangeType.ADJUSTMENT },
              { name: '熨衣板', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '1.10',
        description: 'S3赛季开始，货架皮龙腾天下。更新知识卡蓄势一击、精准投射。',
        details: {
          content: {
            newKnowledgeCards: ['蓄势一击', '精准投射'],
          },
          milestone: 'S3赛季开始',
        },
      },
      {
        date: '1.10-1.15',
        description: '共研服，测试战队赛系统、新角色、新知识卡、留言板、自定义头像。',
        details: {
          testPhaseInfo: '测试战队赛系统、新角色、新知识卡、留言板、自定义头像。',
        },
      },
      {
        date: '1.10-1.19',
        description: '第一届火箭杯，总奖金5万元。',
        details: {},
      },
      {
        date: '1.15',
        description: '下午17:00左右，累计注册用户突破一亿。',
        details: {
          milestone: '累计注册用户突破一亿',
        },
      },
      {
        date: '1.16',
        description: '更新限定角色魔术师。更新地图森林牧场。更新战队赛系统，调整战队系统。',
        details: {
          content: {
            newCharacters: ['魔术师'],
          },
        },
      },
      {
        date: '1.17-1.21',
        description: '共研服，测试知识卡调整、留言板系统、自定义头像。',
        details: {
          testPhaseInfo: '测试知识卡调整、留言板系统、自定义头像。',
        },
      },
      {
        date: '2.4',
        description: '延长春节活动。',
        details: {},
      },
      {
        date: '2.20',
        description: '更新知识卡泡泡浴、夹不住我、乘胜追击、狗的朋友。',
        details: {
          content: {
            newKnowledgeCards: ['泡泡浴', '夹不住我', '乘胜追击', '狗的朋友'],
          },
        },
      },
      {
        date: '2.21-2.26',
        description: '共研服，测试角色调整、知识卡调整、新知识卡、留言板系统、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、新知识卡、留言板系统、自定义头像。',
        },
      },
      {
        date: '2.21-3.1',
        description: '第二届奶酪杯，总奖金3万元。',
        details: {},
      },
      {
        date: '2.27',
        description:
          '更新npc小黄鸭。调整泰菲、布奇、恶魔杰瑞。加强反侦察、加大火力。调整沙滩排球玩法。',
        details: {
          content: {
            newItems: ['小黄鸭'],
          },
          balance: {
            characterChanges: [
              { name: '泰菲', changeType: ChangeType.ADJUSTMENT },
              { name: '布奇', changeType: ChangeType.ADJUSTMENT },
              { name: '恶魔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '反侦察', changeType: ChangeType.BUFF },
              { name: '加大火力', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '2.28-3.4',
        description: '共研服，测试知识卡调整、留言板、自定义头像。',
        details: {
          testPhaseInfo: '测试知识卡调整、留言板、自定义头像。',
        },
      },
      {
        date: '3.5',
        description: '更新森林牧场活板门、壁炉。调整小黄鸭。更新神奇魔豆。',
        details: {
          content: {
            newItems: ['神奇魔豆'],
          },
          balance: {
            itemChanges: [{ name: '小黄鸭', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '3.6-3.11',
        description: '共研服，测试新玩法、新角色、留言板、自定义头像。',
        details: {
          testPhaseInfo: '测试新玩法、新角色、留言板、自定义头像。',
        },
      },
      {
        date: '3.8',
        description: '全明星邀请赛。',
        details: {},
      },
      {
        date: '3.12',
        description: '更新克隆大作战玩法。加强魔术师。调整拳头盒子。更新在线时长奖励系统。',
        details: {
          balance: {
            characterChanges: [{ name: '魔术师', changeType: ChangeType.BUFF }],
            itemChanges: [{ name: '拳头盒子', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '3.13-3.18',
        description: '共研服，测试新角色、新二武、留言板。',
        details: {
          testPhaseInfo: '测试新角色、新二武、留言板。',
        },
      },
      {
        date: '3.19',
        description:
          '更新角色佩克斯。调整汤姆、天使杰瑞。更新森林牧场树枝，更新游乐场固定点位火箭。',
        details: {
          content: {
            newCharacters: ['佩克斯'],
          },
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '天使杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '3.20-3.25',
        description:
          '共研服，测试角色调整、知识卡调整、战队系统调整、新二武、新知识卡、留言板、自定义头像。',
        details: {
          testPhaseInfo:
            '测试角色调整、知识卡调整、战队系统调整、新二武、新知识卡、留言板、自定义头像。',
        },
      },
      {
        date: '3.26',
        description:
          '更新侦探杰瑞第二武器视觉干扰器。加强托普斯。更新果树。更新局内战斗播报系统。更新留言板系统、每日自选buff福利系统，调整战队系统。更新防沉迷系统。',
        details: {
          content: {
            newSecondWeapons: ['侦探杰瑞-视觉干扰器'],
            newItems: ['果树'],
          },
          balance: {
            characterChanges: [{ name: '托普斯', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '3.27-4.1',
        description: '共研服，测试角色调整、知识卡调整、新知识卡、新道具、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、新知识卡、新道具、自定义头像。',
        },
      },
      {
        date: '4.2',
        description: '调整泰菲。更新道具鞭炮桶。更新森林牧场船锚。',
        details: {
          content: {
            newItems: ['鞭炮桶'],
          },
          balance: {
            characterChanges: [{ name: '泰菲', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '4.3',
        description: 'S4赛季开始，货架皮花的嫁衣。更新知识卡知识渊博、食物力量。',
        details: {
          content: {
            newKnowledgeCards: ['知识渊博', '食物力量'],
          },
          milestone: 'S4赛季开始',
        },
      },
      {
        date: '4.3-4.8',
        description: '共研服，测试角色调整、知识卡调整、新角色、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、新角色、自定义头像。',
        },
      },
      {
        date: '4.4',
        description: '全游停服一天（全国哀悼日）。',
        details: {},
      },
      {
        date: '4.9',
        description: '调整图茨。调整铜墙。调整小黄鸭。',
        details: {
          balance: {
            characterChanges: [{ name: '图茨', changeType: ChangeType.ADJUSTMENT }],
            knowledgeCardChanges: [{ name: '铜墙', changeType: ChangeType.ADJUSTMENT }],
            itemChanges: [{ name: '小黄鸭', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '4.10-4.15',
        description: '共研服，测试角色调整、知识卡调整、玩法调整、新角色、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、玩法调整、新角色、自定义头像。',
        },
      },
      {
        date: '4.16',
        description:
          '更新角色米特。加强天使泰菲、牛仔汤姆，调整托普斯、天使杰瑞。调整森林牧场章鱼、剑鱼、牛、三脚架。',
        details: {
          content: {
            newCharacters: ['米特'],
          },
          balance: {
            characterChanges: [
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.ADJUSTMENT },
              { name: '天使杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '4.17-4.22',
        description: '共研服，测试角色调整、知识卡调整、地图调整、玩法调整、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、地图调整、玩法调整、自定义头像。',
        },
      },
      {
        date: '4.17-7.10',
        description: '虎牙HMA赛事，总奖金11万元。',
        details: {},
      },
      {
        date: '4.18',
        description: 'NeXT春季精英邀请赛，总奖金15万元。',
        details: {},
      },
      {
        date: '4.23',
        description:
          '调整泰菲。加强祝愿、逃窜、门卫，调整威压、蓄势一击。调整科研仓药水，调整拳头盒子。调整装饰树大作战玩法。更新每日福利系统。',
        details: {
          balance: {
            characterChanges: [{ name: '泰菲', changeType: ChangeType.ADJUSTMENT }],
            knowledgeCardChanges: [
              { name: '祝愿', changeType: ChangeType.BUFF },
              { name: '逃窜', changeType: ChangeType.BUFF },
              { name: '门卫', changeType: ChangeType.BUFF },
              { name: '威压', changeType: ChangeType.ADJUSTMENT },
              { name: '蓄势一击', changeType: ChangeType.ADJUSTMENT },
            ],
            itemChanges: [{ name: '拳头盒子', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '4.24-4.28',
        description: '共研服，测试角色调整、系统调整、地图调整、新知识卡、新系统、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、系统调整、地图调整、新知识卡、新系统、自定义头像。',
        },
      },
      {
        date: '4.25-4.26',
        description: '第一周城市挑战赛。',
        details: {},
      },
      {
        date: '4.30',
        description:
          '调整恶魔杰瑞。调整冰桶、鞭炮桶。调整伤害结算机制。更新月签到系统、时尚值系统。',
        details: {
          balance: {
            characterChanges: [{ name: '恶魔杰瑞', changeType: ChangeType.ADJUSTMENT }],
            itemChanges: [
              { name: '冰桶', changeType: ChangeType.ADJUSTMENT },
              { name: '鞭炮桶', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '4.20-5.6',
        description: '共研服，测试地图调整、角色调整、新二武、自定义头像。',
        details: {
          testPhaseInfo: '测试地图调整、角色调整、新二武、自定义头像。',
        },
      },
      {
        date: '5.2-5.3',
        description: '第二周城市挑战赛。',
        details: {},
      },
      {
        date: '5.6',
        description: '官方发布处罚公示，永久封停玩家“xg潜水冰镇西瓜”（视野挂），禁赛两年。',
        details: {},
      },
      {
        date: '5.7',
        description: '加强泰菲，调整莱特宁。',
        details: {
          balance: {
            characterChanges: [
              { name: '泰菲', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '5.8-5.13',
        description: '共研服，测试知识卡调整、新角色、新二武、新玩法、自定义头像。',
        details: {
          testPhaseInfo: '测试知识卡调整、新角色、新二武、新玩法、自定义头像。',
        },
      },
      {
        date: '5.9-5.10',
        description: '第三周城市挑战赛。',
        details: {},
      },
      {
        date: '5.14',
        description: '更新莱特宁第二武器咸鱼。加强护佑、速推、强健、猛攻、越挫越勇、皮糙肉厚。',
        details: {
          content: {
            newSecondWeapons: ['莱特宁-咸鱼'],
          },
          balance: {
            knowledgeCardChanges: [
              { name: '护佑', changeType: ChangeType.BUFF },
              { name: '速推', changeType: ChangeType.BUFF },
              { name: '强健', changeType: ChangeType.BUFF },
              { name: '猛攻', changeType: ChangeType.BUFF },
              { name: '越挫越勇', changeType: ChangeType.BUFF },
              { name: '皮糙肉厚', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '5.15-5.20',
        description: '共研服，测试地图调整、角色调整、道具调整、角色彩蛋调整、新角色、自定义头像。',
        details: {
          testPhaseInfo: '测试地图调整、角色调整、道具调整、角色彩蛋调整、新角色、自定义头像。',
        },
      },
      {
        date: '5.16-5.17',
        description: '第四周城市挑战赛。',
        details: {},
      },
      {
        date: '5.18-5.30',
        description: '第二届火箭杯，总奖金5万元。',
        details: {},
      },
      {
        date: '5.21',
        description:
          '更新角色拿坡里鼠。加强杰瑞、剑客杰瑞、泰菲、佩克斯、托普斯、牛仔汤姆、图茨、天使泰菲。调整小黄鸭、果盘、香水瓶、胡椒瓶。更新游乐场管道，调整古堡彩蛋房道具。',
        details: {
          content: {
            newCharacters: ['拿坡里鼠'],
          },
          balance: {
            characterChanges: [
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '泰菲', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
            ],
            itemChanges: [
              { name: '小黄鸭', changeType: ChangeType.ADJUSTMENT },
              { name: '果盘', changeType: ChangeType.ADJUSTMENT },
              { name: '香水瓶', changeType: ChangeType.ADJUSTMENT },
              { name: '胡椒瓶', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '5.22-5.27',
        description:
          '共研服，测试角色调整、知识卡调整、新角色、新二武、新地图、新玩法、新道具、新知识卡、新系统、自定义头像。',
        details: {
          testPhaseInfo:
            '测试角色调整、知识卡调整、新角色、新二武、新地图、新玩法、新道具、新知识卡、新系统、自定义头像。',
        },
      },
      {
        date: '5.23-5.30',
        description: '城市挑战赛全国总决赛。',
        details: {},
      },
      {
        date: '5.28',
        description:
          '更新泰菲第二武器隐形感应雷。更新玩法5v5团队奶酪赛。更新道具面粉袋。更新地图大都会。加强侍卫汤姆。加强无畏、逃之夭夭、逃窜、祝愿、气势如牛、恐吓、春风得意。更新收藏图鉴系统。',
        details: {
          content: {
            newSecondWeapons: ['泰菲-隐形感应雷'],
            newItems: ['面粉袋'],
          },
          balance: {
            characterChanges: [{ name: '侍卫汤姆', changeType: ChangeType.BUFF }],
            knowledgeCardChanges: [
              { name: '无畏', changeType: ChangeType.BUFF },
              { name: '逃之夭夭', changeType: ChangeType.BUFF },
              { name: '逃窜', changeType: ChangeType.BUFF },
              { name: '祝愿', changeType: ChangeType.BUFF },
              { name: '气势如牛', changeType: ChangeType.BUFF },
              { name: '恐吓', changeType: ChangeType.BUFF },
              { name: '春风得意', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '5.29-6.3',
        description: '共研服，测试角色调整、知识卡调整、新角色、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、新角色、自定义头像。',
        },
      },
      {
        date: '5.30-6.28',
        description: '全明星邀请赛。',
        details: {},
      },
      {
        date: '6.4',
        description: '更新角色侦探泰菲。调整侦探杰瑞。加强寻踪。',
        details: {
          content: {
            newCharacters: ['侦探泰菲'],
          },
          balance: {
            characterChanges: [{ name: '侦探杰瑞', changeType: ChangeType.ADJUSTMENT }],
            knowledgeCardChanges: [{ name: '寻踪', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '6.5-6.10',
        description: '共研服，测试角色、知识卡调整。',
        details: {
          testPhaseInfo: '测试角色、知识卡调整。',
        },
      },
      {
        date: '6.8-6.27',
        description: '第三届奶酪杯，总奖金3万元。',
        details: {},
      },
      {
        date: '6.11',
        description:
          '加强图多盖洛、莱特宁、天使泰菲。加强暴怒、狗的朋友、减速警告、回家、护佑、飞跃。调整大都会口香糖。更新新人福利七日迎新好礼系统。',
        details: {
          balance: {
            characterChanges: [
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
            ],
            knowledgeCardChanges: [
              { name: '暴怒', changeType: ChangeType.BUFF },
              { name: '狗的朋友', changeType: ChangeType.BUFF },
              { name: '减速警告', changeType: ChangeType.BUFF },
              { name: '回家', changeType: ChangeType.BUFF },
              { name: '护佑', changeType: ChangeType.BUFF },
              { name: '飞跃', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '6.12-6.17',
        description: '共研服，测试角色调整、机制调整、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、机制调整、自定义头像。',
        },
      },
      {
        date: '6.18',
        description: '加强莱特宁、图茨、牛仔汤姆、天使泰菲。调整经典奶酪赛墙缝期机制。',
        details: {
          balance: {
            characterChanges: [
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '6.19-6.24',
        description: '共研服，测试角色调整、自定义头像。',
        details: {
          testPhaseInfo: '测试角色调整、自定义头像。',
        },
      },
      {
        date: '6.25',
        description: '加强牛仔汤姆。更新知识卡团队领袖、减速警告、孤军奋战、观察员。',
        details: {
          content: {
            newKnowledgeCards: ['团队领袖', '减速警告', '孤军奋战', '观察员'],
          },
          balance: {
            characterChanges: [{ name: '牛仔汤姆', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '6.26',
        description: 'S5赛季开始，货架皮海洋领主。',
        details: {
          milestone: 'S5赛季开始',
        },
      },
      {
        date: '6.26-7.1',
        description: '共研服，测试新二武、自定义头像。',
        details: {
          testPhaseInfo: '测试新二武、自定义头像。',
        },
      },
      {
        date: '7.2',
        description: '更新天梯巅峰对决常用角色查看系统、禁选建议系统。',
        details: {},
      },
      {
        date: '7.3-8.21',
        description: '第一届全民赛，总奖金30万元。',
        details: {},
      },
      {
        date: '7.3-7.8',
        description: '共研服，测试角色调整、新角色、新二武。',
        details: {
          testPhaseInfo: '测试角色调整、新角色、新二武。',
        },
      },
      {
        date: '7.9',
        description:
          '更新牛仔汤姆第二武器仙人掌弹弓。加强佩克斯，削弱天使泰菲。更新自定义头像系统。',
        details: {
          content: {
            newSecondWeapons: ['牛仔汤姆-仙人掌弹弓'],
          },
          balance: {
            characterChanges: [
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '7.10-7.15',
        description: '共研服，测试角色调整、新角色。',
        details: {
          testPhaseInfo: '测试角色调整、新角色。',
        },
      },
      {
        date: '7.16',
        description: '更新角色塔拉。加强天使泰菲，调整图茨。',
        details: {
          content: {
            newCharacters: ['塔拉'],
          },
          balance: {
            characterChanges: [
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.17-7.22',
        description: '共研服，测试角色调整、系统调整。',
        details: {
          testPhaseInfo: '测试角色调整、系统调整。',
        },
      },
      {
        date: '7.23',
        description: '更新A+级典藏皮肤档位。削弱牛仔汤姆。',
        details: {
          balance: {
            characterChanges: [{ name: '牛仔汤姆', changeType: ChangeType.NERF }],
          },
        },
      },
      {
        date: '7.24-7.29',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '测试角色调整。',
        },
      },
      {
        date: '7.30',
        description: '加强拿坡里鼠。更新取消跳救吸夹机制。',
        details: {
          balance: {
            characterChanges: [{ name: '拿坡里鼠', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '7.31-8.5',
        description: '共研服，测试新系统（伙伴系统）。',
        details: {
          testPhaseInfo: '测试新系统（伙伴系统）。',
        },
      },
      {
        date: '8.6',
        description: '更新魔镜皮精灵王。',
        details: {},
      },
      {
        date: '8.7-8.12',
        description: '共研服，测试新二武。',
        details: {
          testPhaseInfo: '测试新二武。',
        },
      },
      {
        date: '8.8-8.9',
        description: '第一周夏季城市挑战赛。',
        details: {},
      },
      {
        date: '8.12-8.18',
        description: '第三届火箭杯。',
        details: {},
      },
      {
        date: '8.13',
        description: '调整大都会管道、礼帽、口香糖、露天餐厅桌面，修改部分地形。',
        details: {},
      },
      {
        date: '8.14-8.19',
        description: '共研服，测试角色调整、知识卡调整、新角色、新二武。',
        details: {
          testPhaseInfo: '测试角色调整、知识卡调整、新角色、新二武。',
        },
      },
      {
        date: '8.15-8.16',
        description: '第二周夏季城市挑战赛。',
        details: {},
      },
      {
        date: '8.20',
        description: '更新海盗杰瑞第二武器海盗火炮。调整牛仔汤姆。调整防沉迷系统。',
        details: {
          content: {
            newSecondWeapons: ['海盗杰瑞-海盗火炮'],
          },
          balance: {
            characterChanges: [{ name: '牛仔汤姆', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '8.21-8.26',
        description: '测试玩法调整、知识卡调整、新系统、新角色。',
        details: {
          testPhaseInfo: '测试玩法调整、知识卡调整、新系统、新角色。',
        },
      },
      {
        date: '8.22-8.23',
        description: '第三周夏季城市挑战赛。',
        details: {},
      },
      {
        date: '8.27',
        description:
          '更新角色剑客莉莉。更新知识卡新手专属卡池系统、知识卡碎片抽取系统。调整拳头盒子。调整5v5团队奶酪赛玩法。',
        details: {
          content: {
            newCharacters: ['剑客莉莉'],
          },
          balance: {
            itemChanges: [{ name: '拳头盒子', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '8.28-9.2',
        description: '共研服，测试玩法调整、知识卡调整、道具调整、新系统。',
        details: {
          testPhaseInfo: '测试玩法调整、知识卡调整、道具调整、新系统。',
        },
      },
      {
        date: '8.29-8.30',
        description: '夏季城市挑战赛全国总决赛，总奖金2万元。',
        details: {},
      },
      {
        date: '9.3',
        description:
          '调整5v5团队奶酪赛玩法。更新知识卡分解系统。调整面粉袋、高尔夫球、叉子。加强不屈、猛攻、加大火力、斗志昂扬，调整铁血、蓄势一击、乘胜追击。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '不屈', changeType: ChangeType.BUFF },
              { name: '猛攻', changeType: ChangeType.BUFF },
              { name: '加大火力', changeType: ChangeType.BUFF },
              { name: '斗志昂扬', changeType: ChangeType.BUFF },
              { name: '铁血', changeType: ChangeType.ADJUSTMENT },
              { name: '蓄势一击', changeType: ChangeType.ADJUSTMENT },
              { name: '乘胜追击', changeType: ChangeType.ADJUSTMENT },
            ],
            itemChanges: [
              { name: '面粉袋', changeType: ChangeType.ADJUSTMENT },
              { name: '高尔夫球', changeType: ChangeType.ADJUSTMENT },
              { name: '叉子', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '9.4-9.9',
        description: '共研服，测试新地图、新系统。',
        details: {
          testPhaseInfo: '测试新地图、新系统。',
        },
      },
      {
        date: '9.10',
        description: '更新局内投降系统。',
        details: {},
      },
      {
        date: '9.11-9.16',
        description: '共研服，测试新地图、新知识卡。',
        details: {
          testPhaseInfo: '测试新地图、新知识卡。',
        },
      },
      {
        date: '9.17',
        description: '调整5v5团队奶酪赛玩法。',
        details: {},
      },
      {
        date: '9.18-9.23',
        description: '共研服，测试角色调整、新二武、新知识卡、新系统。',
        details: {
          testPhaseInfo: '测试角色调整、新二武、新知识卡、新系统。',
        },
      },
      {
        date: '9.24',
        description:
          '更新地图熊猫谷。调整佩克斯。更新教学系统、角色专精系统，调整等级系统、知识量系统。',
        details: {
          balance: {
            characterChanges: [{ name: '佩克斯', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '9.25',
        description: 'S6赛季开始，货架皮闪电车王。',
        details: {
          milestone: 'S6赛季开始',
        },
      },
      {
        date: '9.25-9.30',
        description: '共研服，测试玩法调整、新知识卡、新二武。',
        details: {
          testPhaseInfo: '测试玩法调整、新知识卡、新二武。',
        },
      },
      {
        date: '9.30',
        description: '更新罗宾汉杰瑞第二武器登山飞镐。调整天梯玩法匹配机制。更新猫鼠聊吧系统。',
        details: {
          content: {
            newSecondWeapons: ['罗宾汉杰瑞-登山飞镐'],
          },
        },
      },
      {
        date: '9.30-10.7',
        description: '共研服，测试玩法调整、新知识卡。',
        details: {
          testPhaseInfo: '测试玩法调整、新知识卡。',
        },
      },
      {
        date: '10.1-10.7',
        description: '第四届奶酪杯。',
        details: {},
      },
      {
        date: '10.5-10.6',
        description: '全明星邀请赛。',
        details: {},
      },
      {
        date: '10.8',
        description: '更新知识卡缴械、冲冠一怒、心灵手巧、攻其不备。',
        details: {
          content: {
            newKnowledgeCards: ['缴械', '冲冠一怒', '心灵手巧', '攻其不备'],
          },
        },
      },
      {
        date: '10.10-10.14',
        description: '共研服，测试玩法调整、新系统。',
        details: {
          testPhaseInfo: '测试玩法调整、新系统。',
        },
      },
      {
        date: '10.10-10.25',
        description: '虎牙熊猫杯，总奖金5万元。',
        details: {},
      },
      {
        date: '10.15',
        description: '调整5v5团队奶酪赛玩法。第一次开放先锋共研服。',
        details: {
          testPhaseInfo: '第一次开放先锋共研服',
        },
      },
      {
        date: '10.16-10.21',
        description: '共研服，测试角色调整、新角色。',
        details: {
          testPhaseInfo: '测试角色调整、新角色。',
        },
      },
      {
        date: '10.22',
        description:
          '加强拿坡里鼠、佩克斯、汤姆。更新npc小熊猫。调整信誉分系统。调整5v5团队奶酪赛玩法。',
        details: {
          content: {
            newItems: ['小熊猫'],
          },
          balance: {
            characterChanges: [
              { name: '拿坡里鼠', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '10.23-10.28',
        description: '共研服，测试地图调整、新角色、新系统。',
        details: {
          testPhaseInfo: '测试地图调整、新角色、新系统。',
        },
      },
      {
        date: '10.29',
        description: '更新角色剑客汤姆。调整雪夜古堡II彩蛋房。更新个人相册系统。',
        details: {
          content: {
            newCharacters: ['剑客汤姆'],
          },
        },
      },
      {
        date: '10.30-11.04',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '测试角色调整。',
        },
      },
      {
        date: '11.5',
        description: '加强剑客汤姆。',
        details: {
          balance: {
            characterChanges: [{ name: '剑客汤姆', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '11.6-11.11',
        description: '共研服，测试系统调整、新二武。',
        details: {
          testPhaseInfo: '测试系统调整、新二武。',
        },
      },
      {
        date: '11.12',
        description: '更新火箭/机器鼠装扮系统。调整学业系统。',
        details: {},
      },
      {
        date: '11.13-11.18',
        description: '共研服，测试新二武。',
        details: {
          testPhaseInfo: '测试新二武。',
        },
      },
      {
        date: '11.19',
        description: '更新图多盖洛第二武器魅力甲油。',
        details: {
          content: {
            newSecondWeapons: ['图多盖洛-魅力甲油'],
          },
        },
      },
      {
        date: '11.26',
        description: '更新魔镜皮蔷薇女爵。',
        details: {},
      },
      {
        date: '11.27-12.2',
        description: '共研服，测试新地图、新角色。',
        details: {
          testPhaseInfo: '测试新地图、新角色。',
        },
      },
      {
        date: '12.3',
        description: '调整太空堡垒道具刷新。',
        details: {},
      },
      {
        date: '12.4-12.9',
        description: '共研服，测试角色调整、新角色。',
        details: {
          testPhaseInfo: '测试角色调整、新角色。',
        },
      },
      {
        date: '12.5-次年1.2',
        description: 'NeXT冬季精英邀请赛，总奖金15万元。',
        details: {},
      },
      {
        date: '12.10',
        description: '更新角色罗宾汉泰菲。',
        details: {
          content: {
            newCharacters: ['罗宾汉泰菲'],
          },
        },
      },
      {
        date: '12.11-12.16',
        description: '共研服，测试玩法调整、角色调整。',
        details: {
          testPhaseInfo: '测试玩法调整、角色调整。',
        },
      },
      {
        date: '12.17',
        description: '更新地图太空堡垒II、太空堡垒III。加强佩克斯、米特、罗宾汉泰菲。',
        details: {
          balance: {
            characterChanges: [
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '罗宾汉泰菲', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '12.18-12.23',
        description: '共研服，测试知识卡调整、玩法调整、新二武。',
        details: {
          testPhaseInfo: '测试知识卡调整、玩法调整、新二武。',
        },
      },
      {
        date: '12.26-12.27',
        description: '冬季城市挑战赛第一周。',
        details: {},
      },
      {
        date: '12.24',
        description: '调整局内战斗UI。调整装饰树大作战玩法。',
        details: {},
      },
      {
        date: '12.25-12.30',
        description: '共研服，测试知识卡调整、机制调整、新二武。',
        details: {
          testPhaseInfo: '测试知识卡调整、机制调整、新二武。',
        },
      },
      {
        date: '12.31',
        description: '调整经典奶酪赛侦查期、奶酪期机制。',
        details: {},
      },
      {
        date: '12.31-次年1.6',
        description: '共研服，测试新二武。',
        details: {
          testPhaseInfo: '测试新二武。',
        },
      },
    ],
  },
];
