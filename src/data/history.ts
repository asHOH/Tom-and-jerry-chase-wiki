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
          testPhaseInfo: '第一次测试开始',
          content: {
            newCharacters: ['汤姆', '杰瑞', '侦探杰瑞', '罗宾汉杰瑞', '海盗杰瑞'],
          },
        },
      },
      {
        date: '4.26-5.7',
        description: '游戏开启第二次测试，对操作系统和游戏机制进行了更新。',
        details: {
          testPhaseInfo: '第二次测试开始',
        },
      },
      {
        date: '5.12-5.19',
        description: '游戏开启第三次测试，引入了新角色布奇、国王杰瑞和剑客杰瑞。',
        details: {
          testPhaseInfo: '第三次测试开始',
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
          testPhaseInfo: '共研服2.0开始',
          content: {
            newItems: ['遥控器'],
          },
        },
      },
      {
        date: '7.18-8.2',
        description: '游戏开启暑假内测，引入了技能系统（知识卡前身）和角色等级系统（熟练度前身）。',
        details: {
          testPhaseInfo: '暑假内测开始',
        },
      },
      {
        date: '12.21-12.23',
        description: 'iOS端进行了一次小范围测试，新增了角色托普斯和泰菲，并更新了角色技能系统。',
        details: {
          testPhaseInfo: 'iOS端小测开始',
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
          testPhaseInfo: '共研服3.0开始',
          content: {
            newItems: ['拳头盒子', '高尔夫球', '锤子', '泡泡机', '炸药堆'],
          },
        },
      },
      {
        date: '3.29-4.14',
        description: '安卓端进行了一次小范围测试，新增地图夏日邮轮和道具狗骨头，并上线了学业系统。',
        details: {
          testPhaseInfo: '安卓端小测开始',
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
          testPhaseInfo: '灰度测试开始',
        },
      },
      {
        date: '5.31',
        description: '《猫和老鼠》手游安卓端于上午8:00正式开启公测，标志着游戏正式诞生。',
        details: {
          milestone: '庆典季开始',
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
          milestone: 'iOS端公测开始',
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
  {
    year: 2021,
    events: [
      {
        date: '1.1',
        description: 'S7赛季开始，货架皮独孤剑尊。',
        details: {
          milestone: 'S7赛季开始',
        },
      },
      {
        date: '1.2-1.3',
        description:
          '冬季城市挑战赛第二周。\n武汉赛区冠军“重在参与”\n合肥赛区冠军“乡村爱情”\n济南赛区冠军“小丑竟是我自己”\n石家庄赛区冠军“小丑竟在我身边”',
        details: {
          milestone: '冬季城市挑战赛第二周',
        },
      },
      {
        date: '1.7',
        description: '更新雪梨第二武器爱心花束。',
        details: {
          content: {
            newSecondWeapons: ['雪梨-爱心花束'],
          },
        },
      },
      {
        date: '1.8-1.13',
        description: '共研服，测试新系统、新角色。',
        details: {
          testPhaseInfo: '共研服，测试新系统、新角色。',
        },
      },
      {
        date: '1.9-1.10',
        description:
          '冬季城市挑战赛第三周。\n郑州赛区冠军“坦克游击队”\n哈尔滨赛区冠军“日落日”\n太原赛区冠军“全员彩笔”\n福州赛区冠军“Rockets”',
        details: {
          milestone: '冬季城市挑战赛第三周',
        },
      },
      {
        date: '1.14',
        description: '更新魔镜皮暗夜玫瑰。\n更新师徒系统。',
        details: {},
      },
      {
        date: '1.15-1.20',
        description: '共研服，测试玩法调整、新角色、新玩法。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、新角色、新玩法。',
        },
      },
      {
        date: '1.16-1.17',
        description:
          '冬季城市挑战赛第四周。\n成都赛区冠军“路人哥哥带上皇”\n深圳赛区冠军“新月集”\n上海赛区冠军“米啵超可爱”\n西安赛区冠军“超神战队”',
        details: {
          milestone: '冬季城市挑战赛第四周',
        },
      },
      {
        date: '1.20-2.8',
        description:
          '虎牙冬季嘉年华，总奖金10万元，宝鸽鸽担任解说。\n冠军：坦克游击队\n亚军：独醉笑清风\n季军：取什么名好\n殿军：米啵超可爱',
        details: {
          milestone: '虎牙冬季嘉年华',
        },
      },
      {
        date: '1.21',
        description: '调整学业系统、投降系统。',
        details: {},
      },
      {
        date: '1.22-1.27',
        description: '共研服，测试地图调整、新角色、新玩法。',
        details: {
          testPhaseInfo: '共研服，测试地图调整、新角色、新玩法。',
        },
      },
      {
        date: '1.28',
        description:
          '更新谁是外星人玩法、春节大作战（年兽竞速）限时玩法。\n调整经典奶酪赛侦查期机制。',
        details: {},
      },
      {
        date: '1.29-2.3',
        description: '共研服，测试角色调整、新玩法、新地图、新角色。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、新玩法、新地图、新角色。',
        },
      },
      {
        date: '1.30-1.31',
        description:
          '冬季城市挑战赛总决赛，总奖金10万元，宝鸽鸽、龙煞担任解说。\n冠军“坦克游击队”\n亚军“米啵超可爱”\n四强“与世无争”、“乡村爱情”',
        details: {
          milestone: '冬季城市挑战赛总决赛',
        },
      },
      {
        date: '2.4',
        description:
          '更新羽毛皮电音女神。\n加强恶魔泰菲、图多盖洛、天使泰菲、恶魔杰瑞、拿坡里鼠，削弱塔拉、牛仔汤姆，调整罗宾汉杰瑞。\n更新经典之家春节主题换色，此后每年春节前后返场换色图。\n更新森林牧场紫色花、银色花。\n更新红包系统。',
        details: {
          balance: {
            characterChanges: [
              { name: '恶魔泰菲', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '恶魔杰瑞', changeType: ChangeType.BUFF },
              { name: '拿坡里鼠', changeType: ChangeType.BUFF },
              { name: '塔拉', changeType: ChangeType.NERF },
              { name: '牛仔汤姆', changeType: ChangeType.NERF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '2.5-2.8',
        description: '共研服，测试玩法调整、道具调整、新玩法、新地图、新角色。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、道具调整、新玩法、新地图、新角色。',
        },
      },
      {
        date: '2.5-2.7',
        description: 'CC冬季娱乐赛，总奖金9000元。',
        details: {
          milestone: 'CC冬季娱乐赛',
        },
      },
      {
        date: '2.11',
        description:
          '更新限定角色马索尔。\n更新角色库博，伴生皮大法官。\n更新羽毛皮机械战神，魔镜皮鱼戏莲（猫）、鱼戏莲（鼠）。\n更新A+皮一见钟情（国王）。\n更新玩法春节大作战。',
        details: {
          content: {
            newCharacters: ['马索尔', '库博'],
          },
        },
      },
      {
        date: '2.18',
        description: '更新A+皮小恶魔。',
        details: {},
      },
      {
        date: '2.18-2.26',
        description:
          '第四届火箭杯，总奖金6200元，大宝哥、老班长、黑猫、猫梦、啊悠哥、杠精、八块腹鸡、江小荣、路弟担任解说。\n冠军：坦克游击队\n亚军：Rockets\n季军：奶酪小分队\n殿军：伞兵大队',
        details: {
          milestone: '第四届火箭杯',
        },
      },
      {
        date: '2.21-2.24',
        description: '共研服，测试道具调整、新地图、新角色。',
        details: {
          testPhaseInfo: '共研服，测试道具调整、新地图、新角色。',
        },
      },
      {
        date: '2.25',
        description: '更新角色玛丽，伴生皮王室明珠。\n更新地图御门酒店。',
        details: {
          content: {
            newCharacters: ['玛丽'],
          },
        },
      },
      {
        date: '2.26-3.3',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容。',
        },
      },
      {
        date: '3.4',
        description: '更新A+皮时光梦想师。\n调整谁是外星人玩法。',
        details: {},
      },
      {
        date: '3.5-3.10',
        description: '共研服，调整玩法、调整道具。',
        details: {
          testPhaseInfo: '共研服，调整玩法、调整道具。',
        },
      },
      {
        date: '3.11',
        description: '更新A+皮一见钟情（玛丽）。\n调整远视药水。',
        details: {
          balance: {
            itemChanges: [{ name: '远视药水', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '3.12-3.17',
        description: '共研服，测试新玩法、新角色。',
        details: {
          testPhaseInfo: '共研服，测试新玩法、新角色。',
        },
      },
      {
        date: '3.18',
        description: '更新魔镜皮夜影忍者。\n更新婚礼大作战限时玩法。',
        details: {},
      },
      {
        date: '3.19-3.24',
        description: '共研服，测试知识卡调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试知识卡调整、新角色。',
        },
      },
      {
        date: '3.25',
        description: '更新角色米雪儿，伴生皮花精灵。\n日韩服开服，当日登顶ios下载榜第一。',
        details: {
          content: {
            newCharacters: ['米雪儿'],
          },
          milestone: '日韩服开服',
        },
      },
      {
        date: '3.26-3.31',
        description: '共研服，测试地图调整、角色调整、新系统。',
        details: {
          testPhaseInfo: '共研服，测试地图调整、角色调整、新系统。',
        },
      },
      {
        date: '4.1',
        description: '更新局内战斗播报系统。\n调整天梯巅峰对决BP系统。',
        details: {},
      },
      {
        date: '4.2-4.7',
        description: '共研服，测试角色调整、知识卡调整、地图调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、知识卡调整、地图调整。',
        },
      },
      {
        date: '4.3-6.13',
        description:
          '第一届精英联赛，总奖金15万元。\n冠军：坦氪游击队（痕白、烟灵、玖猫、坦氪老六、库兹马、溪鸟、訫）\n亚军：扶摇直上（阿坤、风痕、倾心、库啵、伦敦雾、奈何、阿峰）\n季军：奶酪小分队（玉样、花颜、跑跑、老粗心、若海、守护、知秋）',
        details: {
          milestone: '第一届精英联赛',
        },
      },
      {
        date: '4.8',
        description:
          '更新A+皮花童（天使泰菲）、花童（米雪儿）。\n调整机器鼠。\n加强托普斯、玛丽、天使杰瑞、天使泰菲、佩克斯，调整塔拉、牛仔汤姆、牛仔杰瑞。\n加强应激反应、攻其不备、捕鼠夹，调整闭门羹。\n更新太空堡垒III管道，调整经典之家管道，调整斯派克、炸药堆、熨衣板、挡板、钟、船舵、监视器、公牛、鸟巢、鸭爸爸、鸭妈妈、上升气流。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '玛丽', changeType: ChangeType.BUFF },
              { name: '天使杰瑞', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '塔拉', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '应激反应', changeType: ChangeType.BUFF },
              { name: '攻其不备', changeType: ChangeType.BUFF },
              { name: '捕鼠夹', changeType: ChangeType.BUFF },
              { name: '闭门羹', changeType: ChangeType.ADJUSTMENT },
            ],
            itemChanges: [{ name: '机器鼠', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '4.9',
        description: 'S8赛季开始，货架皮骑士精神。',
        details: {
          milestone: 'S8赛季开始',
        },
      },
      {
        date: '4.9-4.14',
        description: '共研服，测试角色调整、新角色、新系统。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、新角色、新系统。',
        },
      },
      {
        date: '4.10-5.16',
        description: '线下活动春日游乐园，路线苏州-成都-沈阳-武汉-宁波。',
        details: {
          milestone: '线下活动春日游乐园',
        },
      },
      {
        date: '4.15',
        description: '更新魔镜皮红桃皇后。\n更新头像框收藏系统。\n加强罗宾汉泰菲，调整米雪儿。',
        details: {
          balance: {
            characterChanges: [
              { name: '罗宾汉泰菲', changeType: ChangeType.BUFF },
              { name: '米雪儿', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '4.16-4.21',
        description: '共研服，测试角色调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、新角色。',
        },
      },
      {
        date: '4.22',
        description: '更新角色凯特，伴生皮高级教员。\n调整学业系统。',
        details: {
          content: {
            newCharacters: ['凯特'],
          },
        },
      },
      {
        date: '4.23-4.28',
        description: '共研服，测试玩法调整、角色调整。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、角色调整。',
        },
      },
      {
        date: '4.29',
        description: '加强米雪儿，削弱凯特。\n更新国王的宝库系统、个性签名系统。\n调整银色花。',
        details: {
          balance: {
            characterChanges: [
              { name: '米雪儿', changeType: ChangeType.BUFF },
              { name: '凯特', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '4.30-5.5',
        description: '共研服，测试角色调整、玩法调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、玩法调整。',
        },
      },
      {
        date: '5.6',
        description: '更新A+皮五星主厨、厨神。',
        details: {},
      },
      {
        date: '5.8',
        description:
          '调整特工行动玩法、5v5团队奶酪赛玩法。\n调整小黄鸭、斯派克、钟、弹射器。\n更新托普斯小助手。',
        details: {},
      },
      {
        date: '5.8-5.12',
        description: '共研服，测试战斗调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试战斗调整、新角色。',
        },
      },
      {
        date: '5.13',
        description:
          '更新魔镜皮大学士。\nA+级皮肤更名AP级皮肤。\n调整库博。\n调整谁是外星人玩法。\n调整局内战斗UI。\n调整天梯保护卡。',
        details: {
          balance: {
            characterChanges: [{ name: '库博', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '5.14-5.19',
        description: '共研服，测试角色调整、知识卡调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、知识卡调整。',
        },
      },
      {
        date: '5.15',
        description: '恶魔汤姆、天使汤姆爆料。',
        details: {},
      },
      {
        date: '5.20',
        description:
          '更新新角色音乐家杰瑞。\n更新AP皮奶牛嘟嘟、恐龙派对。\n加强杰瑞、图茨、玛丽、牛仔汤姆、拿坡里鼠、布奇，削弱马索尔、塔拉、凯特，调整剑客莉莉。\n加强击晕、逃窜、祝愿、春风得意、冲冠一怒、应激反应、不屈、震慑，削弱细心、破墙、救救我。\n更新汤姆的梦想之国系统。',
        details: {
          content: {
            newCharacters: ['音乐家杰瑞'],
          },
          balance: {
            characterChanges: [
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.BUFF },
              { name: '玛丽', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '拿坡里鼠', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '马索尔', changeType: ChangeType.NERF },
              { name: '塔拉', changeType: ChangeType.NERF },
              { name: '凯特', changeType: ChangeType.NERF },
              { name: '剑客莉莉', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '击晕', changeType: ChangeType.BUFF },
              { name: '逃窜', changeType: ChangeType.BUFF },
              { name: '祝愿', changeType: ChangeType.BUFF },
              { name: '春风得意', changeType: ChangeType.BUFF },
              { name: '冲冠一怒', changeType: ChangeType.BUFF },
              { name: '应激反应', changeType: ChangeType.BUFF },
              { name: '不屈', changeType: ChangeType.BUFF },
              { name: '震慑', changeType: ChangeType.BUFF },
              { name: '细心', changeType: ChangeType.NERF },
              { name: '破墙', changeType: ChangeType.NERF },
              { name: '救救我', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '5.21-5.26',
        description: '共研服，测试战斗调整、新地图。',
        details: {
          testPhaseInfo: '共研服，测试战斗调整、新地图。',
        },
      },
      {
        date: '5.27',
        description:
          '更新太空堡垒换色星海堡垒。\n更新活动皮星海乐章、星海之梦，魔镜皮星海幻影、星海环游，机器鼠玩具神兵。\n调整局内战斗UI。',
        details: {},
      },
      {
        date: '5.27-6.13',
        description: '虎牙全明星狂欢赛，宝鸽鸽担任解说。',
        details: {
          milestone: '虎牙全明星狂欢赛',
        },
      },
      {
        date: '5.28-6.2',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容。',
        },
      },
      {
        date: '6.3',
        description: '更新AP皮发条木偶。\n调整投降系统。',
        details: {},
      },
      {
        date: '6.7-6.9',
        description: '共研服，测试新二武。',
        details: {
          testPhaseInfo: '共研服，测试新二武。',
        },
      },
      {
        date: '6.10',
        description: '更新国王的荣耀宝库系统。',
        details: {},
      },
      {
        date: '6.11-6.16',
        description: '共研服，测试角色调整、新二武。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、新二武。',
        },
      },
      {
        date: '6.17',
        description:
          '更新国王杰瑞第二武器国王战旗。\n更新AP皮异域王子。\n调整泰菲系列角色变身模型。\n调整扫货通行证系统。',
        details: {
          content: {
            newSecondWeapons: ['国王杰瑞-国王战旗'],
          },
        },
      },
      {
        date: '6.18',
        description: 'S9赛季开始，货架皮星际统帅。',
        details: {
          milestone: 'S9赛季开始',
        },
      },
      {
        date: '6.18-6.23',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整。',
        },
      },
      {
        date: '6.24',
        description: '更新魔镜皮宝藏之王。\n调整米特。',
        details: {
          balance: {
            characterChanges: [{ name: '米特', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '6.25-6.30',
        description: '共研服，测试新玩法、新角色。',
        details: {
          testPhaseInfo: '共研服，测试新玩法、新角色。',
        },
      },
      {
        date: '7.1',
        description: '无战斗相关更新。',
        details: {},
      },
      {
        date: '7.2-7.7',
        description: '共研服，测试角色调整、知识卡调整、新玩法。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、知识卡调整、新玩法。',
        },
      },
      {
        date: '7.3-8.21',
        description:
          '第二届全民赛，总奖金30万元。\n冠军：扶摇直上（痕白、库啵、奈何、倾心、溯）\n亚军：坦氪游击队（玖猫、坦氪老六、库兹马、溪鸟、訫）\n四强：永不言弃（猫K、服气、柯基、艺术、狂白、灯火不休）\n四强：Ts1（洪铖、戏命师、花永不败、若海、橘猫）',
        details: {
          milestone: '第二届全民赛',
        },
      },
      {
        date: '7.8',
        description:
          '更新AP皮治安官、治安队长。\n加强凯特、米特、天使泰菲、佩克斯、侦探泰菲、牛仔杰瑞，削弱库博、魔术师。\n加强食物力量、越挫越勇、猛攻、舍己，削弱蓄势一击，调整应激反应。',
        details: {
          balance: {
            characterChanges: [
              { name: '凯特', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '侦探泰菲', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.NERF },
              { name: '魔术师', changeType: ChangeType.NERF },
            ],
            knowledgeCardChanges: [
              { name: '食物力量', changeType: ChangeType.BUFF },
              { name: '越挫越勇', changeType: ChangeType.BUFF },
              { name: '猛攻', changeType: ChangeType.BUFF },
              { name: '舍己', changeType: ChangeType.BUFF },
              { name: '蓄势一击', changeType: ChangeType.NERF },
              { name: '应激反应', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.9-7.14',
        description: '共研服，测试角色调整、系统调整、新系统。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、系统调整、新系统。',
        },
      },
      {
        date: '7.15',
        description:
          '更新角色蒙金奇，伴生皮宫廷卫兵。\n加强国王杰瑞。\n调整太空堡垒II洞口位置，调整太空堡垒II、III管道。\n更新猫鼠玩吧玩法。\n调整知识卡系统。',
        details: {
          content: {
            newCharacters: ['蒙金奇'],
          },
          balance: {
            characterChanges: [{ name: '国王杰瑞', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '7.16-7.21',
        description: '共研服，测试新系统。',
        details: {
          testPhaseInfo: '共研服，测试新系统。',
        },
      },
      {
        date: '7.17-7.18',
        description:
          '夏季城市挑战赛第一周。\n四川赛区冠军“解忧不言弃”\n河北赛区冠军“李鱼跳龙门”\n湖南赛区冠军“诗情画意”\n安徽赛区冠军“笨比甜兮兮”',
        details: {
          milestone: '夏季城市挑战赛第一周',
        },
      },
      {
        date: '7.22',
        description: '更新魔镜皮精灵公主。\n调整铁砧。\n更新高光时刻系统。',
        details: {
          balance: {
            itemChanges: [{ name: '铁砧', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '7.23-7.28',
        description: '共研服，测试角色调整、玩法调整、新系统。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、玩法调整、新系统。',
        },
      },
      {
        date: '7.24-7.25',
        description:
          '夏季城市挑战赛第二周。\n湖北赛区冠军“糖喵小镇”\n广西赛区冠军“义薄云天”\n云南赛区冠军“周周大将军”\n浙江赛区冠军“dd的好朋友”',
        details: {
          milestone: '夏季城市挑战赛第二周',
        },
      },
      {
        date: '7.24-8.8',
        description: '线下活动图书漂流，路线西安-嘉兴-成都。',
        details: {
          milestone: '线下活动图书漂流',
        },
      },
      {
        date: '7.29',
        description: '无战斗相关更新。',
        details: {},
      },
      {
        date: '7.30-8.4',
        description: '共研服，测试角色调整、知识卡调整、玩法调整、新系统。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、知识卡调整、玩法调整、新系统。',
        },
      },
      {
        date: '7.31-8.1',
        description:
          '夏季城市挑战赛第三周。\n江西赛区冠军“晚遗”\n辽宁赛区冠军“秋风萧瑟”\n福建赛区冠军“米啵超可爱”\n陕西赛区冠军“高质量战队”',
        details: {
          milestone: '夏季城市挑战赛第三周',
        },
      },
      {
        date: '8.5',
        description: '削弱蒙金奇。\n调整冲冠一怒、攻其不备。\n调整沙滩排球玩法。',
        details: {
          balance: {
            characterChanges: [{ name: '蒙金奇', changeType: ChangeType.NERF }],
            knowledgeCardChanges: [
              { name: '冲冠一怒', changeType: ChangeType.ADJUSTMENT },
              { name: '攻其不备', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '8.6-8.11',
        description: '共研服，测试新角色、角色调整。',
        details: {
          testPhaseInfo: '共研服，测试新角色、角色调整。',
        },
      },
      {
        date: '8.7-8.8',
        description:
          '夏季城市挑战赛第四周。\n广东赛区冠军“有手就行”\n山东赛区冠军“野鸡车队”\n河南赛区冠军“干得真棒呀”\n江苏赛区冠军“祸兮福所倚”',
        details: {
          milestone: '夏季城市挑战赛第四周',
        },
      },
      {
        date: '8.12',
        description: '更新AP皮鹊桥仙（剑杰）、鹊桥仙（莉莉）。\n更新猫鼠广场系统。',
        details: {},
      },
      {
        date: '8.13-8.18',
        description: '共研服，测试新角色、新系统。',
        details: {
          testPhaseInfo: '共研服，测试新角色、新系统。',
        },
      },
      {
        date: '8.14-8.15',
        description: '夏季城市挑战赛八强淘汰赛。',
        details: {
          milestone: '夏季城市挑战赛八强淘汰赛',
        },
      },
      {
        date: '8.19',
        description: '更新角色尼宝，伴生皮尊贵绅士。\n更新魔镜皮爱与守护。',
        details: {
          content: {
            newCharacters: ['尼宝'],
          },
        },
      },
      {
        date: '8.20-8.25',
        description: '共研服，测试系统调整、角色调整、新系统、新二武。',
        details: {
          testPhaseInfo: '共研服，测试系统调整、角色调整、新系统、新二武。',
        },
      },
      {
        date: '8.21-8.22',
        description:
          '夏季城市挑战赛全国总决赛，总奖金30万元。\n冠军“米啵超可爱”\n亚军“义薄云天”\n季军“晚遗”\n殿军“诗情画意”',
        details: {
          milestone: '夏季城市挑战赛全国总决赛',
        },
      },
      {
        date: '8.26',
        description:
          '更新局内快捷轮盘系统，调整局内战斗UI。\n更新魔瓶精灵的愿望契约系统。\n更新萌新胜利挑战系统、限时等级冲刺系统，调整新手7日签到系统。\n更新新品兑换皮肤角色系统。',
        details: {},
      },
      {
        date: '8.27-9.1',
        description: '共研服，测试新二武、新系统。',
        details: {
          testPhaseInfo: '共研服，测试新二武、新系统。',
        },
      },
      {
        date: '8.31',
        description: '调整防沉迷系统。',
        details: {},
      },
      {
        date: '9.2',
        description:
          '更新AP皮联赛冠军。\n更新剑客泰菲第二武器剑客长枪。\n削弱恶魔泰菲。\n更新局内商店系统。\n更新积分商城系统。',
        details: {
          content: {
            newSecondWeapons: ['剑客泰菲-剑客长枪'],
          },
          balance: {
            characterChanges: [{ name: '恶魔泰菲', changeType: ChangeType.NERF }],
          },
        },
      },
      {
        date: '9.3-9.8',
        description: '共研服，测试新玩法。',
        details: {
          testPhaseInfo: '共研服，测试新玩法。',
        },
      },
      {
        date: '9.9',
        description: '更新魔镜皮炽焰忍者。\n更新锦标赛特技玩法。',
        details: {},
      },
      {
        date: '9.10-9.15',
        description: '共研服，测试角色调整、系统调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、系统调整。',
        },
      },
      {
        date: '9.16',
        description:
          '更新AP皮后羿、嫦娥、月兔。\n加强米特。\n调整局内商店系统。\n更新幸运转盘系统、背包里的宝藏系统。',
        details: {
          balance: {
            characterChanges: [{ name: '米特', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '9.17-9.22',
        description: '共研服，调整系统。',
        details: {
          testPhaseInfo: '共研服，调整系统。',
        },
      },
      {
        date: '9.17-10.7',
        description:
          '第五届奶酪杯，总奖金3万元。\n冠军：扶摇直上（诺言、离念、紫菜脑公、倾心、伦敦雾、库啵）\n亚军：一切随缘（Grantly Bell、饭冰冰、风清寒幕、敲敲、千韩）\n季军：出入皆人物（小劳、老表、亦风、老粗心、莫辞、直播君、狗狗）',
        details: {
          milestone: '第五届奶酪杯',
        },
      },
      {
        date: '9.23',
        description: '调整局内商店系统。',
        details: {},
      },
      {
        date: '9.24-9.29',
        description: '共研服，测试知识卡调整、系统调整。',
        details: {
          testPhaseInfo: '共研服，测试知识卡调整、系统调整。',
        },
      },
      {
        date: '9.30',
        description:
          '更新羽毛皮小红帽，转盘皮银河舰长，染色皮天王巨星星耀、萌系女仆金粉，AP皮星空盛宴，机器鼠星海驰骋、火箭星海远航。\n更新黄金转盘系统。\n加强攻其不备、冲冠一怒、无畏、舍己、知识渊博、暴怒、护佑、蓄势一击、铜墙、长爪、加大火力、细心、心灵手巧、破墙、救救我、猫是液体。\n调整局内商店系统。\n调整锦标赛玩法。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '攻其不备', changeType: ChangeType.BUFF },
              { name: '冲冠一怒', changeType: ChangeType.BUFF },
              { name: '无畏', changeType: ChangeType.BUFF },
              { name: '舍己', changeType: ChangeType.BUFF },
              { name: '知识渊博', changeType: ChangeType.BUFF },
              { name: '暴怒', changeType: ChangeType.BUFF },
              { name: '护佑', changeType: ChangeType.BUFF },
              { name: '蓄势一击', changeType: ChangeType.BUFF },
              { name: '铜墙', changeType: ChangeType.BUFF },
              { name: '长爪', changeType: ChangeType.BUFF },
              { name: '加大火力', changeType: ChangeType.BUFF },
              { name: '细心', changeType: ChangeType.BUFF },
              { name: '心灵手巧', changeType: ChangeType.BUFF },
              { name: '破墙', changeType: ChangeType.BUFF },
              { name: '救救我', changeType: ChangeType.BUFF },
              { name: '猫是液体', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '9.30-10.13',
        description: '共研服，测试系统调整、新二武。',
        details: {
          testPhaseInfo: '共研服，测试系统调整、新二武。',
        },
      },
      {
        date: '10.7',
        description: '无战斗相关更新。',
        details: {},
      },
      {
        date: '10.8',
        description: 'S10赛季开始，货架皮城市猎人。',
        details: {
          milestone: 'S10赛季开始',
        },
      },
      {
        date: '10.14',
        description: '更新AP皮舞动滑轮。\n更新图茨第二武器汽水罐。\n调整锦标赛玩法。',
        details: {
          content: {
            newSecondWeapons: ['图茨-汽水罐'],
          },
        },
      },
      {
        date: '10.15-10.20',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容。',
        },
      },
      {
        date: '10.21',
        description: '无战斗相关更新。',
        details: {},
      },
      {
        date: '10.22-10.27',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容。',
        },
      },
      {
        date: '10.28',
        description: '更新魔镜皮烈焰伯爵，AP皮南瓜魔女。',
        details: {},
      },
      {
        date: '10.29-11.3',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整。',
        },
      },
      {
        date: '11.4',
        description: '调整图茨。\n调整成就系统。',
        details: {
          balance: {
            characterChanges: [{ name: '图茨', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '11.5-11.10',
        description: '共研服，测试玩法调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、新角色。',
        },
      },
      {
        date: '11.11',
        description: '更新染色皮夜礼服伯爵月夜。\n调整猫鼠玩吧玩法。',
        details: {},
      },
      {
        date: '11.12-11.17',
        description: '共研服，测试新玩法、新角色。',
        details: {
          testPhaseInfo: '共研服，测试新玩法、新角色。',
        },
      },
      {
        date: '11.13-11.21',
        description:
          'NeXT冬季精英邀请赛，总奖金5万元。\n冠军：扶摇直上（Carry、离念、库啵、奈何、倾心）\n亚军：坦氪游击队（阿灰、溪鸟、约翰、库兹马、亦风）\n季军：义薄云天（橙留香、super54、龙宝、老表）\n殿军：奶酪小分队（小劳、老粗心、花颜、莫辞、猫梦）',
        details: {
          milestone: 'NeXT冬季精英邀请赛',
        },
      },
      {
        date: '11.18',
        description: '更新角色苏蕊，伴生皮贵族少女。\n更新锦标赛暴走奶酪赛玩法。',
        details: {
          content: {
            newCharacters: ['苏蕊'],
          },
        },
      },
      {
        date: '11.19-11.24',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整。',
        },
      },
      {
        date: '11.25',
        description:
          '更新魔镜皮橄榄球机甲，AP皮英明君主。\n加强苏蕊、音乐家杰瑞、牛仔杰瑞、莱特宁，削弱剑客汤姆、库博、马索尔。\n调整暴走奶酪赛玩法。',
        details: {
          balance: {
            characterChanges: [
              { name: '苏蕊', changeType: ChangeType.BUFF },
              { name: '音乐家杰瑞', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '剑客汤姆', changeType: ChangeType.NERF },
              { name: '库博', changeType: ChangeType.NERF },
              { name: '马索尔', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '11.26-12.1',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容。',
        },
      },
      {
        date: '12.2',
        description: '更新AP皮异域剑侠、异域舞姬。\n更新玫瑰绅士的赠礼系统。',
        details: {},
      },
      {
        date: '12.3-12.8',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整。',
        },
      },
      {
        date: '12.9',
        description: '调整暴走奶酪赛玩法。\n调整玫瑰绅士的赠礼系统。',
        details: {},
      },
      {
        date: '12.10-12.15',
        description: '共研服，测试系统调整。',
        details: {
          testPhaseInfo: '共研服，测试系统调整。',
        },
      },
      {
        date: '12.16',
        description: '更新魔镜皮无冕战神。\n加强剑客泰菲。\n调整局内商店系统。',
        details: {
          balance: {
            characterChanges: [{ name: '剑客泰菲', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '12.17-12.22',
        description: '共研服，测试新角色。',
        details: {
          testPhaseInfo: '共研服，测试新角色。',
        },
      },
      {
        date: '12.23',
        description:
          '更新角色朵朵，伴生皮电音歌姬。\n更新AP皮冬雪乐曲、冬雪心愿。\n调整魔法魔镜系统。',
        details: {
          content: {
            newCharacters: ['朵朵'],
          },
        },
      },
      {
        date: '12.24-12.29',
        description: '共研服，测试系统调整。',
        details: {
          testPhaseInfo: '共研服，测试系统调整。',
        },
      },
      {
        date: '12.30',
        description: '更新AP皮治安警长。\n更新皮肤梦工厂系统，调整玫瑰绅士的赠礼系统。',
        details: {},
      },
      {
        date: '12.31-次年1.5',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整。',
        },
      },
    ],
  },
  {
    year: 2022,
    events: [
      {
        date: '1.6',
        description: '更新AP皮精英女士。加强朵朵。',
        details: {
          balance: {
            characterChanges: [{ name: '朵朵', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '1.7',
        description: 'S11赛季开始，货架皮爱丽丝。',
        details: {
          milestone: 'S11赛季开始',
        },
      },
      {
        date: '1.7-1.12',
        description: '共研服，测试玩法调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、新角色',
        },
      },
      {
        date: '1.13',
        description: '更新魔镜皮绝影霓虹。',
        details: {},
      },
      {
        date: '1.14-1.19',
        description: '共研服，测试玩法调整、新角色。',
        details: {
          testPhaseInfo: '共研服，测试玩法调整、新角色',
        },
      },
      {
        date: '1.20',
        description: '更新限定角色仙女鼠，伴生皮奇幻雪夜。更新AP皮小书生。调整谁是外星人玩法。',
        details: {
          content: {
            newCharacters: ['仙女鼠'],
          },
        },
      },
      {
        date: '1.21-1.26',
        description: '共研服，测试新系统。',
        details: {
          testPhaseInfo: '共研服，测试新系统',
        },
      },
      {
        date: '1.27',
        description:
          '更新活动皮冰冠女王，染色皮龙腾天下传奇，机器鼠鲸灵王子，火箭唤灵水晶。更新猫鼠特技系统。更新卡牌大师的神秘商店系统。',
        details: {},
      },
      {
        date: '1.28-2.9',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容',
        },
      },
      {
        date: '1.31',
        description: '更新魔镜皮至高王座、雪国公主，转盘皮剑道大师。调整黄金转盘系统。',
        details: {},
      },
      {
        date: '2.10',
        description: '更新AP皮红梅花开。调整局内商店玩法。调整谁是外星人玩法。',
        details: {},
      },
      {
        date: '2.10-2.16',
        description: '共研服，无测试内容。',
        details: {
          testPhaseInfo: '共研服，无测试内容',
        },
      },
      {
        date: '2.17',
        description: '更新AP皮修理达人。',
        details: {},
      },
      {
        date: '2.18-2.23',
        description: '共研服，测试角色调整、道具调整、新玩法。',
        details: {
          testPhaseInfo: '共研服，测试角色调整、道具调整、新玩法',
        },
      },
      {
        date: '2.24',
        description:
          '更新AP皮驯兽师。加强托普斯、牛仔汤姆、图多盖洛、佩克斯、朵朵、雪梨。调整手枪。更新锦标赛知识卡商店玩法。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '朵朵', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
            ],
            itemChanges: [{ name: '手枪', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '2.25-3.2',
        description: '共研服，测试系统调整、道具调整。',
        details: {
          testPhaseInfo: '共研服，测试系统调整、道具调整',
        },
      },
      {
        date: '3.3',
        description:
          '更新魔镜皮樱之歌姬。加强极速翻滚（猫）、极速翻滚（鼠），削弱冰冻保鲜、全垒打。调整拳头盒子。',
        details: {
          balance: {
            itemChanges: [{ name: '拳头盒子', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '3.4-3.9',
        description: '共研服，测试角色调整。',
        details: {
          testPhaseInfo: '共研服，测试角色调整',
        },
      },
      {
        date: '3.10',
        description: '更新AP皮小小侍从。',
        details: {},
      },
      {
        date: '3.17',
        description:
          '更新AP皮林中猎手。更新天使杰瑞第二武器“止戈雷云”。更新魔法魔镜经典S皮魔镜系统。',
        details: {
          content: {
            newSecondWeapons: ['天使杰瑞-止戈雷云'],
          },
        },
      },
      {
        date: '3.24',
        description: '加强仙女鼠，削弱天使杰瑞。',
        details: {
          balance: {
            characterChanges: [
              { name: '仙女鼠', changeType: ChangeType.BUFF },
              { name: '天使杰瑞', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '3.31',
        description: '更新魔镜皮超能神探。',
        details: {},
      },
      {
        date: '4.7',
        description: '更新知识卡穷追猛打、乾坤一掷、翩若惊鸿、有难同当。',
        details: {
          content: {
            newKnowledgeCards: ['穷追猛打', '乾坤一掷', '翩若惊鸿', '有难同当'],
          },
        },
      },
      {
        date: '4.8',
        description: 'S12赛季开始，货架皮魔法甜品师。',
        details: {
          milestone: 'S12赛季开始',
        },
      },
      {
        date: '4.21',
        description: '更新AP皮黑武士。',
        details: {},
      },
      {
        date: '4.28',
        description:
          '更新魔镜皮电音吉他手，转盘皮远航舰长，机器鼠西域神灯，火箭西域之神。加强仙女鼠。',
        details: {
          balance: {
            characterChanges: [{ name: '仙女鼠', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '5.12',
        description: '调整泡泡机。',
        details: {
          balance: {
            itemChanges: [{ name: '泡泡机', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '5.19',
        description: '更新AP皮小画家。加强乾坤一掷、有难同当。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '乾坤一掷', changeType: ChangeType.BUFF },
              { name: '有难同当', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '5.26',
        description:
          '更新角色天使汤姆，伴生皮光明使者。更新魔镜皮游园奇幻夜。调整5v5团队奶酪赛玩法。',
        details: {
          content: {
            newCharacters: ['天使汤姆'],
          },
        },
      },
      {
        date: '6.2',
        description: '加强托普斯、雪梨，调整天使汤姆。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '天使汤姆', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '6.9',
        description: '更新活动皮遇见龙女，火箭银河战神。',
        details: {},
      },
      {
        date: '6.16',
        description:
          '更新羽毛皮瑶池仙子。更新地图天宫。加强音乐家杰瑞，削弱尼宝，调整苏蕊。调整疯狂奶酪赛玩法。',
        details: {
          balance: {
            characterChanges: [
              { name: '音乐家杰瑞', changeType: ChangeType.BUFF },
              { name: '尼宝', changeType: ChangeType.NERF },
              { name: '苏蕊', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '6.23',
        description: '更新魔镜皮自然之灵。加强天使汤姆。',
        details: {
          balance: {
            characterChanges: [{ name: '天使汤姆', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '6.30',
        description:
          '加强天使泰菲、玛丽、图多盖洛，削弱天使汤姆。调整雪夜古堡、太空堡垒、熊猫谷地图细节。',
        details: {
          balance: {
            characterChanges: [
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '玛丽', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '天使汤姆', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '7.7',
        description: '调整部分角色、皮肤名字。调整护盾药水、修理锤。',
        details: {
          balance: {
            itemChanges: [
              { name: '护盾药水', changeType: ChangeType.ADJUSTMENT },
              { name: '修理锤', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.8',
        description: 'S13赛季开始，货架皮太阳神女。',
        details: {
          milestone: 'S13赛季开始',
        },
      },
      {
        date: '7.21',
        description: '更新魔镜皮云端钢琴师。',
        details: {},
      },
      {
        date: '7.28',
        description: '更新角色米可，伴生皮星际主编。调整太空堡垒管道位置。',
        details: {
          content: {
            newCharacters: ['米可'],
          },
        },
      },
      {
        date: '8.4',
        description: '更新AP皮月光奏鸣曲、真爱之冠。',
        details: {},
      },
      {
        date: '8.11',
        description: '加强米可。',
        details: {
          balance: {
            characterChanges: [{ name: '米可', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '8.18',
        description: '更新魔镜皮乘风破浪。',
        details: {},
      },
      {
        date: '8.25',
        description:
          '更新AP皮玫瑰甜心。加强剑客汤姆。更新特技我生气了、勇气爪击、绝地反击、魔术漂浮、勇气投掷、绝处逢生。',
        details: {
          balance: {
            characterChanges: [{ name: '剑客汤姆', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '9.8',
        description:
          '加强米可。削弱绝地反击，调整绝处逢生。调整窗帘、消防栓、机油罐、旋转木马、小熊猫。',
        details: {
          balance: {
            characterChanges: [{ name: '米可', changeType: ChangeType.BUFF }],
            itemChanges: [
              { name: '窗帘', changeType: ChangeType.ADJUSTMENT },
              { name: '消防栓', changeType: ChangeType.ADJUSTMENT },
              { name: '机油罐', changeType: ChangeType.ADJUSTMENT },
              { name: '旋转木马', changeType: ChangeType.ADJUSTMENT },
              { name: '小熊猫', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '9.15',
        description:
          '更新魔镜皮月神。加强汤姆、布奇、杰瑞、牛仔杰瑞、米可，调整库博。削弱铜墙，调整暴怒。更新道具黄金修理锤。',
        details: {
          content: {
            newItems: ['黄金修理锤'],
          },
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '米可', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '铜墙', changeType: ChangeType.NERF },
              { name: '暴怒', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '9.22',
        description:
          '加强汤姆、杰瑞，削弱库博、苏蕊、尼宝、仙女鼠、马索尔，调整布奇、牛仔杰瑞。加强乾坤一掷、翩若惊鸿。',
        details: {
          balance: {
            characterChanges: [
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.NERF },
              { name: '苏蕊', changeType: ChangeType.NERF },
              { name: '尼宝', changeType: ChangeType.NERF },
              { name: '仙女鼠', changeType: ChangeType.NERF },
              { name: '马索尔', changeType: ChangeType.NERF },
              { name: '布奇', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '乾坤一掷', changeType: ChangeType.BUFF },
              { name: '翩若惊鸿', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '9.29',
        description:
          '更新角色斯飞，伴生皮暗影狩猎者。加强牛仔汤姆、布奇、罗宾汉杰瑞、汤姆，削弱牛仔杰瑞、图茨。',
        details: {
          content: {
            newCharacters: ['斯飞'],
          },
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.NERF },
              { name: '图茨', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '10.7',
        description: 'S14赛季开始，货架皮幻术师。',
        details: {
          milestone: 'S14赛季开始',
        },
      },
      {
        date: '10.13',
        description: '更新魔镜皮水墨江南。',
        details: {},
      },
      {
        date: '11.10',
        description: '更新魔镜皮诸神赞歌。',
        details: {},
      },
      {
        date: '11.17',
        description:
          '加强海盗杰瑞、天使泰菲、米可、牛仔杰瑞、佩克斯、莱特宁、斯飞，削弱国王杰瑞、玛丽、布奇。加强威压、长爪、守株待鼠、投手、精准投射、逃窜。',
        details: {
          balance: {
            characterChanges: [
              { name: '海盗杰瑞', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '米可', changeType: ChangeType.BUFF },
              { name: '牛仔杰瑞', changeType: ChangeType.BUFF },
              { name: '佩克斯', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '斯飞', changeType: ChangeType.BUFF },
              { name: '国王杰瑞', changeType: ChangeType.NERF },
              { name: '玛丽', changeType: ChangeType.NERF },
              { name: '布奇', changeType: ChangeType.NERF },
            ],
            knowledgeCardChanges: [
              { name: '威压', changeType: ChangeType.BUFF },
              { name: '长爪', changeType: ChangeType.BUFF },
              { name: '守株待鼠', changeType: ChangeType.BUFF },
              { name: '投手', changeType: ChangeType.BUFF },
              { name: '精准投射', changeType: ChangeType.BUFF },
              { name: '逃窜', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '11.24',
        description: '调整女主人、斯派克、小鸭子、盔甲人（玩家）、七色花（御门酒店）。',
        details: {
          balance: {
            itemChanges: [
              { name: '女主人', changeType: ChangeType.ADJUSTMENT },
              { name: '斯派克', changeType: ChangeType.ADJUSTMENT },
              { name: '小鸭子', changeType: ChangeType.ADJUSTMENT },
              { name: '盔甲人', changeType: ChangeType.ADJUSTMENT },
              { name: '七色花', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '12.1',
        description: '加强斯飞、布奇。加强逃窜。',
        details: {
          balance: {
            characterChanges: [
              { name: '斯飞', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
            ],
            knowledgeCardChanges: [{ name: '逃窜', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '12.6',
        description: '停服维护一天。',
        details: {},
      },
      {
        date: '12.8',
        description: '更新魔镜皮神虎令。',
        details: {},
      },
      {
        date: '12.22',
        description: '更新AP皮鹿角叮当。',
        details: {},
      },
      {
        date: '12.29',
        description:
          '更新转盘皮幽灵星探，AP皮羽之剑者。加强天使杰瑞、罗宾汉杰瑞、牛仔汤姆、侍卫汤姆、剑客汤姆，削弱音乐家杰瑞、莱特宁。',
        details: {
          balance: {
            characterChanges: [
              { name: '天使杰瑞', changeType: ChangeType.BUFF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '侍卫汤姆', changeType: ChangeType.BUFF },
              { name: '剑客汤姆', changeType: ChangeType.BUFF },
              { name: '音乐家杰瑞', changeType: ChangeType.NERF },
              { name: '莱特宁', changeType: ChangeType.NERF },
            ],
          },
        },
      },
    ],
  },
  {
    year: 2023,
    events: [
      {
        date: '1.5',
        description: '更新魔镜皮魔法少女。削弱牛仔汤姆、牛仔杰瑞。',
        details: {
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.NERF },
              { name: '牛仔杰瑞', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '1.12',
        description: '更新角色霜月，伴生皮冬夜仙灵。更新道具番茄、电风扇。更新感电机制。',
        details: {
          content: {
            newCharacters: ['霜月'],
            newItems: ['番茄', '电风扇'],
          },
        },
      },
      {
        date: '1.13',
        description: 'S15赛季开始，货架皮福星高照。',
        details: {
          milestone: 'S15赛季开始',
        },
      },
      {
        date: '1.19',
        description: '更新活动皮大圣，羽毛皮二郎神。调整霜月。',
        details: {
          balance: {
            characterChanges: [{ name: '霜月', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '2.2',
        description: '更新魔镜皮刀马旦，AP皮素雪含香。',
        details: {},
      },
      {
        date: '2.9',
        description: '更新AP皮真爱至上、心灵伴侣。',
        details: {},
      },
      {
        date: '2.23',
        description: '更新AP皮问天。',
        details: {},
      },
      {
        date: '3.2',
        description: '更新魔镜皮科学怪医。',
        details: {},
      },
      {
        date: '3.9',
        description: '更新AP皮首席大臣。更新拿坡里鼠第二武器“世界波”。',
        details: {
          content: {
            newSecondWeapons: ['拿坡里鼠-世界波'],
          },
        },
      },
      {
        date: '3.30',
        description:
          '更新魔镜皮无限星光。加强斯飞、米雪儿、剑客杰瑞，削弱侍卫汤姆、牛仔杰瑞、天使杰瑞。加强乾坤一掷、乘胜追击、加大火力、有难同当、夹不住我、闭门羹。削弱魔术漂浮、绝地反击。调整感电机制。',
        details: {
          balance: {
            characterChanges: [
              { name: '斯飞', changeType: ChangeType.BUFF },
              { name: '米雪儿', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '侍卫汤姆', changeType: ChangeType.NERF },
              { name: '牛仔杰瑞', changeType: ChangeType.NERF },
              { name: '天使杰瑞', changeType: ChangeType.NERF },
            ],
            knowledgeCardChanges: [
              { name: '乾坤一掷', changeType: ChangeType.BUFF },
              { name: '乘胜追击', changeType: ChangeType.BUFF },
              { name: '加大火力', changeType: ChangeType.BUFF },
              { name: '有难同当', changeType: ChangeType.BUFF },
              { name: '夹不住我', changeType: ChangeType.BUFF },
              { name: '闭门羹', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '3.30-6.8',
        description: '首届皮肤设计大赛，设计对象天使汤姆，冠军作品“酒仙”。',
        details: {
          milestone: '首届皮肤设计大赛',
        },
      },
      {
        date: '4.6',
        description: '更新AP皮中华鼠当家。',
        details: {},
      },
      {
        date: '4.14',
        description: 'S16赛季开始，货架皮暗夜精灵。',
        details: {
          milestone: 'S16赛季开始',
        },
      },
      {
        date: '4.27',
        description:
          '更新魔镜皮飞天。加强托普斯、罗宾汉泰菲，削弱斯飞。加强捕鼠夹、皮糙肉厚、观察员、脱身、食物力量、飞跃。',
        details: {
          balance: {
            characterChanges: [
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '罗宾汉泰菲', changeType: ChangeType.BUFF },
              { name: '斯飞', changeType: ChangeType.NERF },
            ],
            knowledgeCardChanges: [
              { name: '皮糙肉厚', changeType: ChangeType.BUFF },
              { name: '观察员', changeType: ChangeType.BUFF },
              { name: '脱身', changeType: ChangeType.BUFF },
              { name: '食物力量', changeType: ChangeType.BUFF },
              { name: '飞跃', changeType: ChangeType.BUFF },
            ],
            itemChanges: [{ name: '捕鼠夹', changeType: ChangeType.BUFF }],
          },
        },
      },
      {
        date: '5.25',
        description: '更新角色恶魔汤姆，伴生皮深渊使者。更新魔镜皮永望之月。',
        details: {
          content: {
            newCharacters: ['恶魔汤姆'],
          },
        },
      },
      {
        date: '6.8',
        description: '更新羽毛皮驭龙骑士。',
        details: {},
      },
      {
        date: '6.15',
        description: '更新AP皮箬叶纳福。',
        details: {},
      },
      {
        date: '6.16',
        description: '斗鱼、虎牙、西瓜、快手平台主播招募活动开启。',
        details: {
          milestone: '主播招募活动开启',
        },
      },
      {
        date: '6.22',
        description: '更新魔镜皮锦衣卫。',
        details: {},
      },
      {
        date: '6.29',
        description: '更新转盘皮大发明家。调整纯净之花（原纯白之花）。',
        details: {
          balance: {
            itemChanges: [{ name: '纯净之花', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '7.13',
        description: '更新魔镜皮无尽炽羽、朔光晨曦。删除铁砧。',
        details: {
          balance: {
            itemChanges: [{ name: '铁砧', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '7.14',
        description: 'S17赛季开始，货架皮花之精灵。',
        details: {
          milestone: 'S17赛季开始',
        },
      },
      {
        date: '7.20',
        description: '更新活动皮同心筑梦。更新多元乱斗玩法。',
        details: {},
      },
      {
        date: '8.3',
        description: '更新AP皮夏日缤纷曲。',
        details: {},
      },
      {
        date: '8.10',
        description: '更新AP皮鹊桥相会、比翼连枝。',
        details: {},
      },
      {
        date: '8.17',
        description: '更新魔镜皮狂欢派对。',
        details: {},
      },
      {
        date: '8.24',
        description:
          '加强魔术师、雪梨、海盗杰瑞、霜月、剑客杰瑞、库博、图茨、米特、塔拉，削弱仙女鼠、天使杰瑞、马索尔、玛丽、剑客泰菲、斯飞、天使汤姆，调整恶魔汤姆、图多盖洛。加强巡逻戒备、震慑、狡诈、不屈、绝地反击、翩若惊鸿、祝愿、蓄势一击、都是朋友、无谓、幸运，削弱乘胜追击。',
        details: {
          balance: {
            characterChanges: [
              { name: '魔术师', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '海盗杰瑞', changeType: ChangeType.BUFF },
              { name: '霜月', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '塔拉', changeType: ChangeType.BUFF },
              { name: '仙女鼠', changeType: ChangeType.NERF },
              { name: '天使杰瑞', changeType: ChangeType.NERF },
              { name: '马索尔', changeType: ChangeType.NERF },
              { name: '玛丽', changeType: ChangeType.NERF },
              { name: '剑客泰菲', changeType: ChangeType.NERF },
              { name: '斯飞', changeType: ChangeType.NERF },
              { name: '天使汤姆', changeType: ChangeType.NERF },
              { name: '恶魔汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '图多盖洛', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '巡逻戒备', changeType: ChangeType.BUFF },
              { name: '震慑', changeType: ChangeType.BUFF },
              { name: '狡诈', changeType: ChangeType.BUFF },
              { name: '不屈', changeType: ChangeType.BUFF },
              { name: '绝地反击', changeType: ChangeType.BUFF },
              { name: '翩若惊鸿', changeType: ChangeType.BUFF },
              { name: '祝愿', changeType: ChangeType.BUFF },
              { name: '蓄势一击', changeType: ChangeType.BUFF },
              { name: '都是朋友', changeType: ChangeType.BUFF },
              { name: '无谓', changeType: ChangeType.BUFF },
              { name: '幸运', changeType: ChangeType.BUFF },
              { name: '乘胜追击', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '9.7',
        description: '调整净化萝卜（原纯净之花）。',
        details: {
          balance: {
            itemChanges: [{ name: '净化萝卜', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '9.14',
        description: '更新魔镜皮方块主宰。调整图多盖洛。加强都是朋友，削弱祝愿、绝地反击。',
        details: {
          balance: {
            characterChanges: [{ name: '图多盖洛', changeType: ChangeType.ADJUSTMENT }],
            knowledgeCardChanges: [
              { name: '都是朋友', changeType: ChangeType.BUFF },
              { name: '祝愿', changeType: ChangeType.NERF },
              { name: '绝地反击', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '9.21',
        description: '更新AP皮金桂飘香、皓月当空。',
        details: {},
      },
      {
        date: '9.28',
        description: '更新角色兔八哥，伴生皮文质彬彬。',
        details: {
          content: {
            newCharacters: ['兔八哥'],
          },
        },
      },
      {
        date: '10.5',
        description: '更新足迹魔镜之星。调整国王杰瑞、布奇购买方式。',
        details: {},
      },
      {
        date: '10.6',
        description: 'S18赛季开始，货架皮无限传说。',
        details: {
          milestone: 'S18赛季开始',
        },
      },
      {
        date: '10.12',
        description: '更新魔镜皮奇幻之森。',
        details: {},
      },
      {
        date: '10.26',
        description: '更新AP皮跳跳使者。',
        details: {},
      },
      {
        date: '11.2',
        description:
          '加强罗宾汉杰瑞、仙女鼠、杰瑞、霜月、侦探泰菲、天使泰菲、米特、托普斯、汤姆、兔八哥、凯特，调整牛仔汤姆。加强有难同当、孤军奋战、夹不住我、寻踪、屈打成招，削弱穷追猛打。调整叉子、捕鼠夹。',
        details: {
          balance: {
            characterChanges: [
              { name: '罗宾汉杰瑞', changeType: ChangeType.BUFF },
              { name: '仙女鼠', changeType: ChangeType.BUFF },
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '霜月', changeType: ChangeType.BUFF },
              { name: '侦探泰菲', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '兔八哥', changeType: ChangeType.BUFF },
              { name: '凯特', changeType: ChangeType.BUFF },
              { name: '牛仔汤姆', changeType: ChangeType.ADJUSTMENT },
            ],
            knowledgeCardChanges: [
              { name: '有难同当', changeType: ChangeType.BUFF },
              { name: '孤军奋战', changeType: ChangeType.BUFF },
              { name: '夹不住我', changeType: ChangeType.BUFF },
              { name: '寻踪', changeType: ChangeType.BUFF },
              { name: '屈打成招', changeType: ChangeType.BUFF },
              { name: '穷追猛打', changeType: ChangeType.NERF },
            ],
            itemChanges: [
              { name: '叉子', changeType: ChangeType.ADJUSTMENT },
              { name: '捕鼠夹', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '11.9',
        description: '更新魔镜皮逍遥剑仙。加强牛仔汤姆，削弱兔八哥。',
        details: {
          balance: {
            characterChanges: [
              { name: '牛仔汤姆', changeType: ChangeType.BUFF },
              { name: '兔八哥', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '11.9-次年1.24',
        description: '首届角色设计大赛，冠军作品“粉笔鼠”。',
        details: {
          milestone: '首届角色设计大赛',
        },
      },
      {
        date: '11.23',
        description:
          '调整地图物件：盔甲人、国王、钟、女主人、轮胎、牛、剑鱼、铃铛、鸭爸爸、鸭妈妈、嫦娥、机油罐、油罐头、小黄鸭。',
        details: {
          balance: {
            itemChanges: [
              { name: '盔甲人', changeType: ChangeType.ADJUSTMENT },
              { name: '国王', changeType: ChangeType.ADJUSTMENT },
              { name: '钟', changeType: ChangeType.ADJUSTMENT },
              { name: '女主人', changeType: ChangeType.ADJUSTMENT },
              { name: '轮胎', changeType: ChangeType.ADJUSTMENT },
              { name: '牛', changeType: ChangeType.ADJUSTMENT },
              { name: '剑鱼', changeType: ChangeType.ADJUSTMENT },
              { name: '铃铛', changeType: ChangeType.ADJUSTMENT },
              { name: '鸭爸爸', changeType: ChangeType.ADJUSTMENT },
              { name: '鸭妈妈', changeType: ChangeType.ADJUSTMENT },
              { name: '嫦娥', changeType: ChangeType.ADJUSTMENT },
              { name: '机油罐', changeType: ChangeType.ADJUSTMENT },
              { name: '油罐头', changeType: ChangeType.ADJUSTMENT },
              { name: '小黄鸭', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '12.7',
        description: '更新魔镜皮朱雀令。',
        details: {},
      },
      {
        date: '12.28',
        description: '更新转盘皮发条魔女。',
        details: {},
      },
    ],
  },
  {
    year: 2024,
    events: [
      {
        date: '1.4',
        description: '更新魔镜皮肤“捉妖师”。',
        details: {},
      },
      {
        date: '1.11',
        description: '角色与知识卡平衡性调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '杰瑞', changeType: ChangeType.BUFF },
              { name: '剑客莉莉', changeType: ChangeType.BUFF },
              { name: '米雪儿', changeType: ChangeType.BUFF },
              { name: '泰菲', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '剑客泰菲', changeType: ChangeType.NERF },
              { name: '侦探杰瑞', changeType: ChangeType.NERF },
              { name: '侍卫汤姆', changeType: ChangeType.NERF },
            ],
            knowledgeCardChanges: [
              { name: '翩若惊鸿', changeType: ChangeType.BUFF },
              { name: '脱身', changeType: ChangeType.BUFF },
              { name: '恐吓', changeType: ChangeType.BUFF },
              { name: '斗志昂扬', changeType: ChangeType.BUFF },
              { name: '反侦察', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '1.12',
        description: 'S19赛季开启，新赛季货架皮肤“火锅大侠”上架。',
        details: {
          milestone: 'S19赛季开始',
        },
      },
      {
        date: '1.18',
        description: '更新AP级皮肤“兔子先生”。',
        details: {},
      },
      {
        date: '1.25',
        description:
          '新角色“表演者·杰瑞”上线，并推出其伴生皮肤“小花脸”。\n更新AP级皮肤“花开富贵”。\n调整多元乱斗玩法。',
        details: {
          content: {
            newCharacters: ['表演者·杰瑞'],
          },
        },
      },
      {
        date: '1.25',
        description: '游戏累计注册用户突破两亿。',
        details: {
          milestone: '累计注册用户突破两亿',
        },
      },
      {
        date: '2.1',
        description: '更新魔镜皮肤“雉尾生”与足迹“香甜奶酪”。\n调整成就与个人空间系统。',
        details: {},
      },
      {
        date: '2.1-3.29',
        description:
          '举办第一届皮肤染色活动，设计对象为“小花脸”与“暖心守岁”，冠军作品为“橘韵”和“莹彩”。',
        details: {},
      },
      {
        date: '2.8',
        description:
          '春节更新：上线活动皮肤“狻猊龙威”，羽毛皮肤“狴犴正气”，机器鼠皮肤“腾云驾雾”，火箭皮肤“鹤鸣九霄”。\n限时玩法“混沌大作战”开启。\n猫鼠广场新增地图“梨苑”。',
        details: {},
      },
      {
        date: '2.15',
        description: '更新AP级皮肤“冰雪圆子”。',
        details: {},
      },
      {
        date: '2.29',
        description: '更新魔镜皮肤“柳岸微雨”。',
        details: {},
      },
      {
        date: '3.7-4.29',
        description: '举办第二届皮肤设计大赛，冠军作品为“獬月梦探”。',
        details: {},
      },
      {
        date: '3.14',
        description: '更新AP级皮肤“牡丹仙子”。\n“时光造影”系统上线。',
        details: {},
      },
      {
        date: '3.21',
        description: '调整“多元乱斗”玩法。',
        details: {},
      },
      {
        date: '3.28',
        description:
          '更新魔镜皮肤“锡兵女王”与转盘皮肤“时空旅人”。\n地图“森林牧场”换色为“玩具王国”主题。',
        details: {},
      },
      {
        date: '4.4',
        description: '“剑客汤姆”的第二武器“旋刃剑舞”上线。\n调整局内快捷消息系统。',
        details: {
          content: {
            newSecondWeapons: ['剑客汤姆-旋刃剑舞'],
          },
        },
      },
      {
        date: '4.12',
        description: 'S20赛季开启，新赛季货架皮肤“游戏之王”上架。',
        details: {
          milestone: 'S20赛季开始',
        },
      },
      {
        date: '4.25',
        description: '更新魔镜皮肤“绮梦飞影”，AP皮肤“旋转木马”，以及多款饰品皮肤。',
        details: {},
      },
      {
        date: '5.23',
        description: '新角色“追风汤姆”上线，并推出其伴生皮肤“飞行先驱”。\n更新魔镜皮肤“无限星辉”。',
        details: {
          content: {
            newCharacters: ['追风汤姆'],
          },
        },
      },
      {
        date: '5.30',
        description: '更新祈愿皮肤“爱神之吻”。\n猫鼠广场新增“劈树”玩法。\n“梦想祈愿”系统上线。',
        details: {},
      },
      {
        date: '6.13',
        description: '更新“黑桃国王”的染色皮肤“摩登”。\n“锦标赛”玩法上线。',
        details: {},
      },
      {
        date: '6.20',
        description: '更新魔镜皮肤“波涛极速”。\n调整“锦标赛”玩法。',
        details: {},
      },
      {
        date: '6.27',
        description: '更新转盘皮肤“萦香似梦”。',
        details: {},
      },
      {
        date: '7.11',
        description:
          '游戏机制与系统大规模调整。\n经典奶酪赛移除侦查期；天梯赛移除皇级以下晋级与保级赛；调整机器鼠与蛋糕机制。\nUI、角色专精、成就、扫货通行证等多个系统更新或调整。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '越挫越勇', changeType: ChangeType.BUFF },
              { name: '穷追猛打', changeType: ChangeType.NERF },
              { name: '不屈', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.12',
        description: 'S21赛季开启，新赛季货架皮肤“神秘博士”与染色皮肤“蔚蓝”上架。',
        details: {
          milestone: 'S21赛季开始',
        },
      },
      {
        date: '7.16',
        description: '经典奶酪赛机制调整，移除经验蛋糕，并调整机器鼠和道具刷新。',
        details: {},
      },
      {
        date: '7.18',
        description: '更新魔镜皮肤“秘境仙后”。\n继续对经典奶酪赛机制、机器鼠及战斗UI进行调整。',
        details: {},
      },
      {
        date: '7.25',
        description:
          '角色平衡性调整。\n更新“噩梦船长”系列皮肤与饰品。\n猫鼠广场新增地图“梦境之船”。',
        details: {
          balance: {
            characterChanges: [
              { name: '米雪儿', changeType: ChangeType.BUFF },
              { name: '霜月', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '罗宾汉泰菲', changeType: ChangeType.BUFF },
              { name: '剑客泰菲', changeType: ChangeType.BUFF },
              { name: '剑客杰瑞', changeType: ChangeType.BUFF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '托普斯', changeType: ChangeType.BUFF },
              { name: '恶魔汤姆', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '8.1',
        description:
          '游戏机制与玩法调整。\n调整经典奶酪赛与墙缝期机制，调整克隆大作战与特工行动玩法。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '反侦察', changeType: ChangeType.ADJUSTMENT },
              { name: '观察员', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '8.8',
        description: '更新AP皮肤“鹊桥仙”的染色皮肤“青鸾”。',
        details: {},
      },
      {
        date: '8.15',
        description: '更新魔镜皮肤“雀翎传说”。',
        details: {},
      },
      {
        date: '8.22',
        description: '更新AP皮肤“宫廷预言师”。\n调整部分地图的奶酪与道具刷新位置。',
        details: {},
      },
      {
        date: '8.29',
        description: '地图场景与中立生物调整。\n重启共研服。',
        details: {
          testPhaseInfo: '共研服重启',
        },
      },
      {
        date: '9.5',
        description: '对多个地图中的场景交互物进行调整。',
        details: {},
      },
      {
        date: '9.12',
        description: '更新魔镜皮肤“假面掠影”。\n调整中立生物“斯派克”及投降系统。',
        details: {},
      },
      {
        date: '9.26',
        description:
          '新角色“莱恩”上线，并推出其伴生皮肤“艺术创想”。\n更新“醒狮”主题系列皮肤与饰品。\n调整道具刷新机制与“幸运”知识卡（移除星星棒机制）。\n猫鼠广场新增地图“醒狮登高”。',
        details: {
          content: {
            newCharacters: ['莱恩'],
          },
          balance: {
            knowledgeCardChanges: [{ name: '幸运', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '10.3',
        description: '角色平衡性调整。\n染色与新品兑换系统调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '兔八哥', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '魔术师', changeType: ChangeType.BUFF },
              { name: '玛丽', changeType: ChangeType.BUFF },
              { name: '汤姆', changeType: ChangeType.NERF },
              { name: '马索尔', changeType: ChangeType.NERF },
              { name: '剑客泰菲', changeType: ChangeType.NERF },
              { name: '恶魔杰瑞', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '10.4',
        description: 'S22赛季开启，新赛季货架皮肤“朋克音浪”与染色皮肤“秘银”上架。',
        details: {
          milestone: 'S22赛季开始',
        },
      },
      {
        date: '10.10',
        description: '更新魔镜皮肤“獬月梦探”（第二届皮肤设计大赛冠军作品）。',
        details: {},
      },
      {
        date: '10.17',
        description: '角色平衡性调整。\n调整个人胜利系统。',
        details: {
          balance: {
            characterChanges: [
              { name: '兔八哥', changeType: ChangeType.NERF },
              { name: '莱特宁', changeType: ChangeType.NERF },
              { name: '莱恩', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '10.24',
        description: '更新“烈焰伯爵”的染色皮肤“冰蓝”。',
        details: {},
      },
      {
        date: '11.7',
        description:
          '知识卡与地图场景调整。\n天梯巅峰对决新增快速禁选系统。\n新增道具精准拾取系统。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '长爪', changeType: ChangeType.ADJUSTMENT },
              { name: '脱身', changeType: ChangeType.ADJUSTMENT },
              { name: '暴怒', changeType: ChangeType.ADJUSTMENT },
              { name: '美食家', changeType: ChangeType.ADJUSTMENT },
              { name: '寻踪', changeType: ChangeType.ADJUSTMENT },
              { name: '有难同当', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '11.14',
        description: '知识卡平衡性调整。\n更新“天鹅湖”的染色皮肤“黛羽”。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '皮糙肉厚', changeType: ChangeType.ADJUSTMENT },
              { name: '祝愿', changeType: ChangeType.ADJUSTMENT },
              { name: '求生欲', changeType: ChangeType.ADJUSTMENT },
              { name: '严防死守', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '11.14-11.30',
        description: '举办“猫鼠逆风起航奖”评选活动，冠军为“凯特”。',
        details: {},
      },
      {
        date: '11.21',
        description: '知识卡“皮糙肉厚”平衡性调整。',
        details: {
          balance: {
            knowledgeCardChanges: [{ name: '皮糙肉厚', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '11.28',
        description: '更新AP级皮肤“竹报平安”。',
        details: {},
      },
      {
        date: '12.5',
        description: '更新魔镜皮肤“凡尔赛之歌”。',
        details: {},
      },
      {
        date: '12.19',
        description: '更新“雪国公主”的染色皮肤“复苏”。\n猫鼠广场新增地图“圣诞打雪仗”。',
        details: {},
      },
      {
        date: '12.26',
        description: '更新转盘皮肤“凡尔赛之锁”。\n调整会员商城系统。',
        details: {},
      },
    ],
  },
  {
    year: 2025,
    events: [
      {
        date: '1.2',
        description: '更新魔镜皮肤“喜乐颂”与AP皮肤“糖描盛景”。',
        details: {},
      },
      {
        date: '1.9',
        description: '大规模角色平衡性调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '凯特', changeType: ChangeType.BUFF },
              { name: '塔拉', changeType: ChangeType.BUFF },
              { name: '莱特宁', changeType: ChangeType.BUFF },
              { name: '天使汤姆', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '图茨', changeType: ChangeType.BUFF },
              { name: '天使泰菲', changeType: ChangeType.BUFF },
              { name: '侦探泰菲', changeType: ChangeType.BUFF },
              { name: '玛丽', changeType: ChangeType.BUFF },
              { name: '蒙金奇', changeType: ChangeType.BUFF },
              { name: '恶魔泰菲', changeType: ChangeType.BUFF },
              { name: '莱恩', changeType: ChangeType.NERF },
              { name: '牛仔汤姆', changeType: ChangeType.NERF },
              { name: '杰瑞', changeType: ChangeType.NERF },
              { name: '海盗杰瑞', changeType: ChangeType.NERF },
              { name: '库博', changeType: ChangeType.ADJUSTMENT },
              { name: '图多盖洛', changeType: ChangeType.ADJUSTMENT },
              { name: '兔八哥', changeType: ChangeType.ADJUSTMENT },
              { name: '追风汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '霜月', changeType: ChangeType.ADJUSTMENT },
              { name: '雪梨', changeType: ChangeType.ADJUSTMENT },
              { name: '米雪儿', changeType: ChangeType.ADJUSTMENT },
              { name: '朵朵', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '1.10',
        description: 'S23赛季开启，新赛季货架皮肤“光阴滴答”与染色皮肤“靛蓝”上架。',
        details: {
          milestone: 'S23赛季开始',
        },
      },
      {
        date: '1.16',
        description: '新角色“梦游杰瑞”上线，并推出其伴生皮肤“半醒好梦”。',
        details: {
          content: {
            newCharacters: ['梦游杰瑞'],
          },
        },
      },
      {
        date: '1.23',
        description:
          '角色平衡性调整。\n春节更新：上线“剪春风”、“书新禧”等多款皮肤与饰品。\n猫鼠广场新增地图“唐人街”。',
        details: {
          balance: {
            characterChanges: [
              { name: '梦游杰瑞', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.BUFF },
            ],
          },
        },
      },
      {
        date: '2.6',
        description: '更新AP级皮肤“月宵上”。\n调整黄金与幸运转盘，调整金币角色购买方式。',
        details: {},
      },
      {
        date: '2.20',
        description:
          '更新“精灵王爷”的染色皮肤“鎏金”。\n对局内战斗UI、快捷轮盘、播报与消息系统进行调整。',
        details: {},
      },
      {
        date: '2.27',
        description: '更新魔镜皮肤“野餐日”。\n角色平衡性调整。\n移除银币与知识结晶货币。',
        details: {
          balance: {
            characterChanges: [
              { name: '梦游杰瑞', changeType: ChangeType.BUFF },
              { name: '兔八哥', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '3.6',
        description: '对角色、成就、魔镜等多个系统进行调整。\n皮肤“富翁先生”调整至AP档位。',
        details: {},
      },
      {
        date: '3.13',
        description: '更新AP皮肤“牡丹仙子”的染色皮肤“魏紫”。\n调整“泰菲淘淘集市”系统。',
        details: {},
      },
      {
        date: '3.20',
        description: '调整机器鼠、天梯巅峰对决BP系统以及多个游戏内系统。',
        details: {},
      },
      {
        date: '3.27',
        description: '更新魔镜皮肤“奶酪伯爵”与转盘皮肤“王牌特工”。\n调整局内商店、角色与房间系统。',
        details: {},
      },
      {
        date: '4.3',
        description:
          '知识卡平衡性调整。\n更新AP皮肤“机械女郎”。\n天梯巅峰对决新增匿名系统，并限制模拟器超宽屏。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '暴怒', changeType: ChangeType.BUFF },
              { name: '知识渊博', changeType: ChangeType.BUFF },
              { name: '猫是液体', changeType: ChangeType.BUFF },
              { name: '无畏', changeType: ChangeType.BUFF },
              { name: '有难同当', changeType: ChangeType.BUFF },
            ],
            itemChanges: [{ name: '隐身药水', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '4.10',
        description: '知识卡平衡性调整。\n调整天梯玩法加分机制与积分补偿卡。',
        details: {
          balance: {
            knowledgeCardChanges: [
              { name: '皮糙肉厚', changeType: ChangeType.NERF },
              { name: '幸运', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '4.11',
        description: 'S24赛季开启，新赛季货架皮肤“丛林探险家”与染色皮肤“原野”上架。',
        details: {
          milestone: 'S24赛季开始',
        },
      },
      {
        date: '4.24',
        description:
          '“恶魔泰菲”的第二武器“小淘气”上线，并对其进行平衡性调整。\n更新“星海队长”系列皮肤与饰品。',
        details: {
          content: {
            newSecondWeapons: ['恶魔泰菲-小淘气'],
          },
          balance: {
            characterChanges: [{ name: '恶魔泰菲', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '5.1',
        description: '大规模角色平衡性调整。',
        details: {
          balance: {
            characterChanges: [
              { name: '梦游杰瑞', changeType: ChangeType.BUFF },
              { name: '雪梨', changeType: ChangeType.BUFF },
              { name: '米可', changeType: ChangeType.BUFF },
              { name: '音乐家杰瑞', changeType: ChangeType.BUFF },
              { name: '凯特', changeType: ChangeType.BUFF },
              { name: '图多盖洛', changeType: ChangeType.BUFF },
              { name: '塔拉', changeType: ChangeType.BUFF },
              { name: '斯飞', changeType: ChangeType.BUFF },
              { name: '表演者·杰瑞', changeType: ChangeType.NERF },
              { name: '天使汤姆', changeType: ChangeType.NERF },
              { name: '托普斯', changeType: ChangeType.NERF },
              { name: '泰菲', changeType: ChangeType.ADJUSTMENT },
              { name: '牛仔杰瑞', changeType: ChangeType.ADJUSTMENT },
              { name: '拿坡里鼠', changeType: ChangeType.ADJUSTMENT },
              { name: '恶魔汤姆', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '5.8',
        description: '对天梯匹配机制及多个游戏内系统（染色、收藏、成就等）进行调整。',
        details: {},
      },
      {
        date: '5.15',
        description: '继续调整天梯玩法匹配机制。',
        details: {},
      },
      {
        date: '5.22',
        description: '更新魔镜皮肤“梅花教母”。',
        details: {},
      },
      {
        date: '5.29',
        description: '更新祈愿皮肤“神圣辉光”。',
        details: {},
      },
      {
        date: '6.5',
        description: '角色与知识卡平衡性调整。',
        details: {
          balance: {
            characterChanges: [{ name: '剑客泰菲', changeType: ChangeType.ADJUSTMENT }],
            knowledgeCardChanges: [
              { name: '皮糙肉厚', changeType: ChangeType.NERF },
              { name: '幸运', changeType: ChangeType.NERF },
            ],
          },
        },
      },
      {
        date: '6.12',
        description:
          '更新羽毛皮肤《窈窕淑女》与染色皮肤“乘风破浪-日落”。\n天梯巅峰对决新增角色帮抢系统。',
        details: {},
      },
      {
        date: '6.19',
        description: '更新魔镜皮肤“假期烦恼”。',
        details: {},
      },
      {
        date: '6.26',
        description: '“魔术师”的第二武器“兔子大表哥”上线。\n更新AP皮肤“碧蓝水手”的染色皮肤“鲨滩”。',
        details: {
          content: {
            newSecondWeapons: ['魔术师-兔子大表哥'],
          },
        },
      },
      {
        date: '7.10',
        description:
          '大规模角色、道具与场景交互物平衡性调整。\n新增推奶酪减伤与救援时火箭保护机制。\n知识卡系统更新。',
        details: {
          balance: {
            characterChanges: [
              { name: '米可', changeType: ChangeType.BUFF },
              { name: '天使杰瑞', changeType: ChangeType.BUFF },
              { name: '侦探泰菲', changeType: ChangeType.BUFF },
              { name: '魔术师', changeType: ChangeType.BUFF },
              { name: '罗宾汉杰瑞', changeType: ChangeType.BUFF },
              { name: '布奇', changeType: ChangeType.BUFF },
              { name: '米特', changeType: ChangeType.BUFF },
              { name: '剑客汤姆', changeType: ChangeType.BUFF },
              { name: '库博', changeType: ChangeType.BUFF },
              { name: '罗宾汉泰菲', changeType: ChangeType.NERF },
              { name: '凯特', changeType: ChangeType.NERF },
              { name: '剑客泰菲', changeType: ChangeType.ADJUSTMENT },
              { name: '恶魔泰菲', changeType: ChangeType.ADJUSTMENT },
              { name: '仙女鼠', changeType: ChangeType.ADJUSTMENT },
              { name: '剑客莉莉', changeType: ChangeType.ADJUSTMENT },
              { name: '追风汤姆', changeType: ChangeType.ADJUSTMENT },
              { name: '莱特宁', changeType: ChangeType.ADJUSTMENT },
              { name: '兔八哥', changeType: ChangeType.ADJUSTMENT },
              { name: '天使汤姆', changeType: ChangeType.ADJUSTMENT },
            ],
            itemChanges: [
              { name: '灰色花瓶', changeType: ChangeType.ADJUSTMENT },
              { name: '蓝色花瓶', changeType: ChangeType.ADJUSTMENT },
              { name: '冰块', changeType: ChangeType.ADJUSTMENT },
              { name: '鞭炮', changeType: ChangeType.ADJUSTMENT },
              { name: '泡泡机', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '7.11',
        description: 'S25赛季开启，新赛季货架皮肤“天文学家”与染色皮肤“日冕”上架。',
        details: {
          milestone: 'S25赛季开始',
        },
      },
      {
        date: '7.17',
        description:
          '更新魔镜皮肤“乞丐王子”。\n猫鼠广场新增地图“猫鼠乐园”，跑酷玩法新增地图“女巫糖果屋”。',
        details: {},
      },
      {
        date: '7.24',
        description:
          '更新活动皮肤“贞德”及配套饰品。\n“妙妙罐头”系统上线，并移除月签到、在线时长奖励等多个旧系统。',
        details: {},
      },
      {
        date: '7.31',
        description: '更新“小红帽”的染色皮肤“紫丁香”。\n调整新品兑换系统。',
        details: {},
      },
      {
        date: '8.7',
        description: '新角色“如玉”上线，并推出其伴生皮肤“花衫”。\n角色“罗宾汉泰菲”平衡性调整。',
        details: {
          content: {
            newCharacters: ['如玉'],
          },
          balance: {
            characterChanges: [{ name: '罗宾汉泰菲', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '8.14',
        description: '更新魔镜皮肤“堂吉诃德”。\n角色“如玉”平衡性调整。\n跑酷玩法新增Boss与地图。',
        details: {
          balance: {
            characterChanges: [{ name: '如玉', changeType: ChangeType.ADJUSTMENT }],
          },
        },
      },
      {
        date: '8.21',
        description: '调整道具“叉子”与穿墙相关问题。',
        details: {
          balance: { itemChanges: [{ name: '叉子', changeType: ChangeType.ADJUSTMENT }] },
        },
      },
      {
        date: '8.28',
        description: '调整道具“果盘”、“冰块”与穿墙相关问题。',
        details: {
          balance: {
            itemChanges: [
              { name: '果盘', changeType: ChangeType.ADJUSTMENT },
              { name: '冰块', changeType: ChangeType.ADJUSTMENT },
            ],
          },
        },
      },
      {
        date: '9.4',
        description: '调整会员商城系统与穿墙相关问题。',
        details: {},
      },
      {
        date: '9.11',
        description: '更新魔镜皮肤“神秘探员”。\n继续调整穿墙相关问题。',
        details: {},
      },
      {
        date: '9.25',
        description: '更新转盘皮肤“小小龙骑”，活动皮肤“宇宙超鼠”及配套饰品。',
        details: {},
      },
    ],
  },
];
