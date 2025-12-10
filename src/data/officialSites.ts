export interface OfficialSite {
  url: string;
  label: string;
  description: string;
  isMain?: boolean;
}

export const OFFICIAL_SITES: OfficialSite[] = [
  {
    url: 'https://www.tjwiki.com',
    label: '主站',
    description: '功能齐全，访问速度一般，偶尔会维护',
    isMain: true,
  },
  {
    url: 'https://tjwiki.huahaiyc.fun',
    label: '分站',
    description: '访问速度快，但文章功能受限',
  },
  {
    url: 'https://dev.tjwiki.com',
    label: '开发站',
    description: '开发测试用的分站，功能齐全，访问速度慢，不稳定',
  },
];
