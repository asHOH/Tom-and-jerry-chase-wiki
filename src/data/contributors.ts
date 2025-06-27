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
  ArtProvider = '美术素材提供',
  DataTester = '数据测试',
  ContentWriter = '文案撰写',
  ContentProofreader = '文案校对',
  Developer = '代码开发',
  VideoCreator = '教学视频制作',
}

// The list of all contributors
export const contributors: Contributor[] = [
  {
    id: 'asHOH',
    name: '小曙光',
    url: 'https://github.com/asHOH',
    roles: [
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
        characters: ['侦探杰瑞', '蒙金奇'],
      },
    ],
  },
  {
    id: 'musicianJerry',
    name: '音乐家杰瑞',
    roles: [{ type: RoleType.ContentWriter, characters: ['罗宾汉泰菲'] }],
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
