import type { CatPositioningTagName, MousePositioningTagName } from '@/data/types';

export type MouseQuizOption = {
  text: string;
  tags: { tagName: CatPositioningTagName | MousePositioningTagName; weight: number }[];
};

export type MouseQuizQuestion = {
  id: string;
  text: string;
  answers: MouseQuizOption[];
};

/**
 * Mouse faction personality quiz — 10 situational questions.
 * Each answer maps to 1-2 positioning tags with weights.
 *
 * Mouse positioning tags:
 *   奶酪 (cheese), 干扰 (disrupt), 辅助 (support), 救援 (rescue),
 *   破局 (breakthrough), 砸墙 (wall-break), 后期 (late-game)
 */
const mouseQuestions: MouseQuizQuestion[] = [
  {
    id: 'mouse-q1',
    text: '游戏开始后，你的第一个目标通常是？',
    answers: [
      { text: '立刻去推奶酪，争取最快速度推入第一块', tags: [{ tagName: '奶酪', weight: 2 }] },
      { text: '去找猫的位置，准备骚扰它拖延时间', tags: [{ tagName: '干扰', weight: 2 }] },
      {
        text: '先去搜集道具和药水，为接下来的战斗做准备',
        tags: [{ tagName: '辅助', weight: 2 }],
      },
      {
        text: '观察队友的分工，补位做他们没做的事情',
        tags: [
          { tagName: '辅助', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'mouse-q2',
    text: '队友被猫抓住猫正在赶往火箭，你会？',
    answers: [
      {
        text: '继续推奶酪，相信其他队友会去救',
        tags: [
          { tagName: '奶酪', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
      {
        text: '立刻赶到火箭附近准备拦截猫或救援',
        tags: [{ tagName: '救援', weight: 2 }],
      },
      {
        text: '用道具或技能拖延猫的行动，使队友能够挣扎下来',
        tags: [
          { tagName: '干扰', weight: 1 },
          { tagName: '辅助', weight: 1 },
        ],
      },
      {
        text: '在猫绑火箭的过程中用控制技能打断',
        tags: [{ tagName: '干扰', weight: 2 }],
      },
    ],
  },
  {
    id: 'mouse-q3',
    text: '墙缝出现了，你通常会怎么做？',
    answers: [
      { text: '全力砸墙，我的破坏力很高', tags: [{ tagName: '砸墙', weight: 2 }] },
      {
        text: '继续干扰猫，拖住它为队友争取砸墙时间',
        tags: [
          { tagName: '干扰', weight: 1 },
          { tagName: '辅助', weight: 1 },
        ],
      },
      {
        text: '偷锤子，拿药水，开彩蛋',
        tags: [{ tagName: '后期', weight: 2 }],
      },
      {
        text: '去救被绑在火箭上的队友，然后一起砸墙',
        tags: [
          { tagName: '救援', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'mouse-q4',
    text: '队友在推奶酪时猫来了，你通常会怎么做？',
    answers: [
      { text: '牺牲自己引开猫，让队友继续推', tags: [{ tagName: '干扰', weight: 2 }] },
      {
        text: '用控制技能帮队友争取逃跑到安全位置的时间',
        tags: [{ tagName: '辅助', weight: 2 }],
      },
      {
        text: '和队友一起跑，等猫走了再回来推',
        tags: [
          { tagName: '奶酪', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
      {
        text: '尝试反打，把猫打残让它不敢再来',
        tags: [
          { tagName: '干扰', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'mouse-q5',
    text: '关于知识卡搭配，你更倾向于哪种风格？',
    answers: [
      {
        text: '带幸运流（幸运、{脱身}），确保队友不轻易被放飞',
        tags: [{ tagName: '破局', weight: 2 }],
      },
      {
        text: '带干扰和控制卡（如缴械、投手、绝地反击），最大化对猫的骚扰能力',
        tags: [{ tagName: '干扰', weight: 2 }],
      },
      {
        text: '带后期知识卡（如回家、不屈、祝愿），保证自己在后期的生存能力',
        tags: [{ tagName: '后期', weight: 2 }],
      },
      {
        text: '带生存和破局卡（如护佑、逃窜），确保自己在关键时刻能站得住',
        tags: [
          { tagName: '破局', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'mouse-q6',
    text: '如果你发现某个队友总是被抓，你会？',
    answers: [
      { text: '专门去保护它，帮它摆脱猫的追击', tags: [{ tagName: '辅助', weight: 2 }] },
      {
        text: '它被抓了就去救，不抱怨但做好救援准备',
        tags: [{ tagName: '救援', weight: 2 }],
      },
      {
        text: '趁机多推奶酪，用奶酪进度弥补劣势',
        tags: [
          { tagName: '奶酪', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
      {
        text: '放弃队友，专注于自己的任务和生存',
        tags: [{ tagName: '破局', weight: 2 }],
      },
    ],
  },
  {
    id: 'mouse-q7',
    text: '在55（5v5）模式中，你更喜欢打什么位置？',
    answers: [
      { text: '主推奶酪，保证任务进度', tags: [{ tagName: '奶酪', weight: 2 }] },
      { text: '负责救人，确保队友不被放飞', tags: [{ tagName: '救援', weight: 2 }] },
      { text: '干扰猫，让它没空管其他人', tags: [{ tagName: '干扰', weight: 2 }] },
      {
        text: '补位，哪里需要就去哪里',
        tags: [
          { tagName: '辅助', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'mouse-q8',
    text: '你觉得一个优秀的老鼠玩家最重要的品质是？',
    answers: [
      {
        text: '团队意识强，懂得配合和牺牲',
        tags: [
          { tagName: '辅助', weight: 1 },
          { tagName: '救援', weight: 1 },
        ],
      },
      {
        text: '操作灵活，猫永远追不到我',
        tags: [
          { tagName: '干扰', weight: 1 },
          { tagName: '破局', weight: 1 },
        ],
      },
      {
        text: '任务优先，保证奶酪进度',
        tags: [{ tagName: '奶酪', weight: 2 }],
      },
      {
        text: '临危不乱，越是劣势越能发挥',
        tags: [
          { tagName: '破局', weight: 1 },
          { tagName: '后期', weight: 1 },
        ],
      },
    ],
  },
];

export default mouseQuestions;
