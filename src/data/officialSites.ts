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
    url: 'https://tjwiki.stario.top',
    label: '分站1',
    description: '访问快，但文章功能受限',
  },
  {
    url: 'https://tjwiki.rickroll.cc',
    label: '分站2',
    description: '访问快',
  },
  // move to 分站3 for it's currently inacessible, but keep it in case it comes back
  {
    url: 'https://tjwiki.net1.work',
    label: '分站3',
    // description: '访问快，但文章功能不可用',
    description: '暂时无法访问',
  },
  {
    url: 'https://dev.tjwiki.com',
    label: '开发站',
    description: '访问慢，功能全，不稳定',
  },
];
