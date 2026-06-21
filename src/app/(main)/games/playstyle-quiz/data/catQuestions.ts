import type { CatPositioningTagName, MousePositioningTagName } from '@/data/types';

export type TagOption = {
  tagName: CatPositioningTagName | MousePositioningTagName;
  weight: number;
};

export type QuizOption = {
  text: string;
  tags: TagOption[];
};

export type QuizQuestion = {
  id: string;
  text: string;
  answers: QuizOption[];
};

/**
 * Cat faction personality quiz — 10 situational questions.
 * Each answer maps to 1-2 positioning tags with weights.
 *
 * Cat positioning tags:
 *   进攻 (offense), 防守 (defense), 追击 (chase), 打架 (brawl),
 *   速通 (speedrun), 翻盘 (comeback), 后期 (late-game)
 */
const catQuestions: QuizQuestion[] = [
  {
    id: 'cat-q1',
    text: '游戏开始后，你的第一个行动通常是？',
    answers: [
      { text: '直奔老鼠洞口，趁老鼠还没推进就抓一只', tags: [{ tagName: '进攻', weight: 2 }] },
      { text: '先在地图关键位置布置陷阱和夹子', tags: [{ tagName: '防守', weight: 2 }] },
      { text: '快速打掉机械鼠获取经验，尽快升到高等级', tags: [{ tagName: '速通', weight: 2 }] },
      { text: '观察老鼠的动向，判断谁是突破口', tags: [{ tagName: '追击', weight: 2 }] },
    ],
  },
  {
    id: 'cat-q2',
    text: '当你抓住一只老鼠后，接下来你会怎么做？',
    answers: [
      {
        text: '立刻绑上最近的火箭，然后继续追下一只',
        tags: [
          { tagName: '进攻', weight: 1 },
          { tagName: '速通', weight: 1 },
        ],
      },
      {
        text: '观察周围有没有来救援的老鼠，准备拦截',
        tags: [{ tagName: '防守', weight: 2 }],
      },
      { text: '故意等老鼠队友来救，趁机再抓一个', tags: [{ tagName: '打架', weight: 2 }] },
      {
        text: '抱到远离奶酪区的地方绑，拖延老鼠推奶酪的节奏',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'cat-q3',
    text: '当多只老鼠同时在场且都很难抓时，你的策略是？',
    answers: [
      {
        text: '集中火力追最弱的那只，逐个击破',
        tags: [
          { tagName: '追击', weight: 1 },
          { tagName: '进攻', weight: 1 },
        ],
      },
      {
        text: '用技能和道具不断干扰，消耗老鼠的道具和血量',
        tags: [
          { tagName: '打架', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
      {
        text: '守住奶酪区附近的火箭，等老鼠来送',
        tags: [{ tagName: '防守', weight: 2 }],
      },
      {
        text: '放弃追击，转去防守奶酪区，拖到后期再说',
        tags: [{ tagName: '后期', weight: 2 }],
      },
    ],
  },
  {
    id: 'cat-q4',
    text: '墙缝期即将到来，你目前只放飞了1-2只老鼠，你会？',
    answers: [
      {
        text: '全力抓一只老鼠，争取在墙缝出来前再放飞一只',
        tags: [{ tagName: '进攻', weight: 2 }],
      },
      {
        text: '提前在墙缝位置布置好道具和陷阱，做好墙缝期准备',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
      {
        text: '无所谓，我的角色墙缝期很强，后期翻盘是我的节奏',
        tags: [{ tagName: '翻盘', weight: 2 }],
      },
      {
        text: '继续压制老鼠，不让它们安心推墙缝',
        tags: [
          { tagName: '打架', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'cat-q5',
    text: '面对一只操作很好的老鼠，你始终抓不到它，你会怎么调整？',
    answers: [
      {
        text: '换一个目标，去抓它的队友',
        tags: [
          { tagName: '进攻', weight: 1 },
          { tagName: '速通', weight: 1 },
        ],
      },
      {
        text: '用道具和远程技能消耗它的血量，等它失误',
        tags: [
          { tagName: '打架', weight: 1 },
          { tagName: '追击', weight: 1 },
        ],
      },
      { text: '不管它，去守奶酪防止它推奶酪', tags: [{ tagName: '防守', weight: 2 }] },
      {
        text: '利用地形和视野死角，等它进入狭窄区域再出手',
        tags: [{ tagName: '追击', weight: 2 }],
      },
    ],
  },
  {
    id: 'cat-q6',
    text: '关于知识卡搭配，你更倾向于哪种风格？',
    answers: [
      {
        text: '带满输出卡，追求最强的击杀能力',
        tags: [
          { tagName: '进攻', weight: 1 },
          { tagName: '打架', weight: 1 },
        ],
      },
      {
        text: '带防守和控制卡，延长火箭时间、削弱老鼠救援',
        tags: [{ tagName: '防守', weight: 2 }],
      },
      {
        text: '带机动性卡，提高移速和跳跃，方便追击',
        tags: [{ tagName: '追击', weight: 2 }],
      },
      {
        text: '带通用增益卡，提高后期作战能力',
        tags: [
          { tagName: '后期', weight: 1 },
          { tagName: '翻盘', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'cat-q7',
    text: '老鼠踩中了你放的夹子，你离它有段距离，你会？',
    answers: [
      {
        text: '全速冲过去，一定不能让它跑了',
        tags: [
          { tagName: '追击', weight: 1 },
          { tagName: '进攻', weight: 1 },
        ],
      },
      {
        text: '如果太远就放弃，继续守原来的位置',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '速通', weight: 1 },
        ],
      },
      {
        text: '用远程技能或道具补伤害',
        tags: [{ tagName: '打架', weight: 2 }],
      },
      {
        text: '等它的队友来救援，一网打尽',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'cat-q8',
    text: '在55（5v5）模式中，作为猫方你的打法是？',
    answers: [
      {
        text: '积极游走抓人，保持高强度施压',
        tags: [
          { tagName: '进攻', weight: 1 },
          { tagName: '追击', weight: 1 },
        ],
      },
      {
        text: '和另一个猫配合，一人守奶酪一人抓人',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '速通', weight: 1 },
        ],
      },
      {
        text: '多打架消耗，利用技能连招打出优势',
        tags: [{ tagName: '打架', weight: 2 }],
      },
      {
        text: '前期稳住，后期靠装备和等级碾压',
        tags: [{ tagName: '后期', weight: 2 }],
      },
    ],
  },
  {
    id: 'cat-q9',
    text: '你觉得一个优秀的猫玩家最重要的品质是？',
    answers: [
      {
        text: '果断出击，不给老鼠喘息的机会',
        tags: [{ tagName: '进攻', weight: 2 }],
      },
      {
        text: '耐心等待，把握最佳出手时机',
        tags: [
          { tagName: '防守', weight: 1 },
          { tagName: '追击', weight: 1 },
        ],
      },
      {
        text: '操作细腻，技能释放精准',
        tags: [
          { tagName: '打架', weight: 1 },
          { tagName: '翻盘', weight: 1 },
        ],
      },
      {
        text: '大局观强，知道什么时候该做什么',
        tags: [
          { tagName: '后期', weight: 1 },
          { tagName: '速通', weight: 1 },
        ],
      },
    ],
  },
];

export default catQuestions;
