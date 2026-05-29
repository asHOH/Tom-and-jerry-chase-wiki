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
    url: 'https://tjwiki.rickroll.cc',
    label: '分站1',
    description: '访问快',
  },
  // move to 分站2 for it's currently inaccessible, but keep it in case it comes back
  {
    url: 'https://tjwiki.stario.top',
    label: '分站2',
    description: '暂时无法访问',
  },
  {
    url: 'https://dev.tjwiki.com',
    label: '开发站',
    description: '访问慢，功能全，不稳定',
  },
];
