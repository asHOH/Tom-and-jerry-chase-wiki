// Defining the structure for a contributor
export interface Contributor {
  id: string; // Unique identifier
  name: string; // Display name
  url?: string; // Link to their personal homepage
  roles: Role[]; // Array of roles they have fulfilled
}

// Defining the structure for roles
export interface Role {
  type: RoleType;
  characters?: string[]; // Optional: characters they have worked on
  isMinor?: boolean; // Optional: to quantify the contribution, defaults to major (false)
}

// Enum for the different types of roles
export enum RoleType {
  ProjectMaintainer = '项目维护者', // Special role for project maintainers - excluded from acknowledgments
  ArtProvider = '分享图片素材',
  DataTester = '提供测试数据',
  ContentWriter = '撰写角色文案',
  ContentProofreader = '进行文案校对',
  Developer = '进行项目开发',
  VideoCreator = '制作教学视频',
}

// The list of all contributors
export const contributors: Contributor[] = [
  {
    id: 'asHOH',
    name: '小曙光',
    url: 'https://github.com/asHOH',
    roles: [
      { type: RoleType.ProjectMaintainer },
      {
        type: RoleType.ContentWriter,
        characters: ['杰瑞', '泰菲', '尼宝', '汤姆', '布奇', '托普斯'],
      },
      { type: RoleType.ContentProofreader },
      { type: RoleType.Developer },
    ],
  },
  {
    id: '3swordman',
    name: '海阔天空',
    url: 'https://github.com/3swordman',
    roles: [
      { type: RoleType.Developer },
      {
        type: RoleType.ContentWriter,
        characters: ['侦探杰瑞', '航海士杰瑞', '苏蕊'],
      },
    ],
  },
  {
    id: 'chaserTom',
    name: '追风汤姆',
    url: 'https://space.bilibili.com/3493135485241940',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['侦探杰瑞', '蒙金奇', '国王杰瑞', '剑客杰瑞'],
      },
    ],
  },
  {
    id: 'gebilaomiLM',
    name: '隔壁老米LM',
    url: 'https://space.bilibili.com/3493090618771682',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['莱特宁', '剑客莉莉', '侦探泰菲', '佩克斯', '米雪儿', '剑客汤姆', '剑客泰菲'],
      },
    ],
  },
  {
    id: 'musicianJerry',
    name: '音乐家杰瑞',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['罗宾汉泰菲', '魔术师'],
      },
    ],
  },
  {
    id: 'yulangaoao',
    name: '雨狼嗷嗷',
    url: 'https://space.bilibili.com/3546721078479411',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['图茨'],
      },
    ],
  },
  {
    id: 'zhuifengtangmuofficial',
    name: '追风汤姆official',
    url: 'https://space.bilibili.com/1060009579',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['追风汤姆'],
      },
    ],
  },
  {
    id: 'wujinchiyu',
    name: '-无尽炽羽-',
    url: 'https://space.bilibili.com/3493104889891012',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['米可'],
      },
    ],
  },
  {
    id: 'yigeqiujun',
    name: '一个气球君',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['表演者•杰瑞'],
      },
    ],
  },
  {
    id: 'nixiaoruidadi',
    name: '你小睿大帝',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['玛丽'],
      },
    ],
  },
  {
    id: 'bingmeishi',
    name: '冰美式',
    url: 'https://space.bilibili.com/439320147',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['米特'],
      },
    ],
  },
  {
    id: 'yinshuisiyuan',
    name: '饮泉思源',
    url: 'https://zh.moegirl.org.cn/User:Yqsychzs',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['剑客泰菲'],
        isMinor: true, // knowledge card & skill allocation, brief skill descriptions
      },
    ],
  },
  {
    id: 'shuiyixia',
    name: '睡亿夏',
    url: 'https://space.bilibili.com/1350743315',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['仙女鼠'],
        isMinor: true, // knowledge card & skill allocation + brief skill descriptions
      },
    ],
  },
  {
    id: 'gangge',
    name: '港鸽',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['米特'],
      },
    ],
  },
  {
    id: 'ruomeng',
    name: '若梦',
    url: 'https://space.bilibili.com/3537122405386648',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['音乐家杰瑞'],
      },
    ],
  },
  {
    id: 'shengjianbao',
    name: '生煎包勇闯猫鼠',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['恶魔泰菲'],
      },
    ],
  },
  {
    id: '1322',
    name: '_1322_',
    url: 'https://space.bilibili.com/508985250',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['侍卫汤姆'],
      },
    ],
  },
  {
    id: 'dream',
    name: 'dream',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['侍卫汤姆'],
      },
    ],
  },
  {
    id: 'leshanhaoshi',
    name: '乐善好施陈阿姨',
    url: 'https://space.bilibili.com/418408689',
    roles: [
      {
        type: RoleType.ContentWriter,
        characters: ['音乐家杰瑞'],
        isMinor: true, // knowledge card & skill allocation only
      },
    ],
  },
  {
    id: 'dreamback',
    name: '梦回_淦德蒸蚌',
    url: 'https://space.bilibili.com/1193776217',
    roles: [{ type: RoleType.DataTester }],
  },
  {
    id: 'momo',
    name: '是莫莫喵',
    url: 'https://space.bilibili.com/443541296',
    roles: [
      {
        type: RoleType.DataTester,
        characters: ['杰瑞'],
      },
    ],
  },
  {
    id: 'fanshuwa',
    name: '凡叔哇',
    url: 'https://space.bilibili.com/273122087',
    roles: [{ type: RoleType.ArtProvider }],
  },
];
