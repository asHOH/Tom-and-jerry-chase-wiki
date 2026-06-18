interface OfficialSite {
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
    url: 'https://dev.tjwiki.com',
    label: '开发站',
    description: '访问慢，功能全，不稳定',
  },
];
