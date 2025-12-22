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
    description: '访问较快，功能全',
    isMain: true,
  },
  {
    url: 'https://tjwiki.huahaiyc.fun',
    label: '分站1',
    description: '访问快，但文章功能受限',
  },
  {
    url: 'https://tjwiki.net1.work',
    label: '分站2',
    description: '访问快，但文章功能不可用',
  },
  {
    url: 'https://dev.tjwiki.com',
    label: '开发站',
    description: '访问慢，功能全，不稳定',
  },
];
