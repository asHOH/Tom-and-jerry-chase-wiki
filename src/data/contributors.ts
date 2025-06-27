export interface Contributor {
  id: string; // Unique identifier
  name: string; // Display name
  url?: string; // Link to their personal homepage
  roles: Role[]; // Array of roles they have fulfilled
  isMinor: boolean; // To quantify the contribution
}

// Defining the structure for roles
export interface Role {
  type: RoleType;
  characters?: string[]; // Optional: characters they have worked on
}

// Enum for the different types of roles
export enum RoleType {
  ArtProvider = '提供美术素材',
  DataTester = '数据测试',
  Copywriter = '文案编辑',
  CopyEditor = '文案审核',
  Developer = '项目开发',
  VideoCreator = '教学视频',
}

// The list of all contributors
export const contributors: Contributor[] = [
  {
    id: 'asHOH',
    name: 'asHOH',
    url: 'https://github.com/asHOH',
    roles: [
      { type: RoleType.Copywriter },
      { type: RoleType.CopyEditor },
      { type: RoleType.Developer },
    ],
    isMinor: false,
  },
  {
    id: 'dreamback',
    name: '梦回_淦德蒸蚌',
    url: 'https://space.bilibili.com/1193776217',
    roles: [{ type: RoleType.DataTester }],
    isMinor: false,
  },
  {
    id: 'momo',
    name: '是莫莫喵',
    url: 'https://space.bilibili.com/443541296',
    roles: [{ type: RoleType.DataTester }],
    isMinor: false,
  },
  {
    id: 'fanshuwa',
    name: '凡叔哇',
    url: 'https://space.bilibili.com/273122087',
    roles: [{ type: RoleType.ArtProvider }],
    isMinor: false,
  },
];
