type ExternalLinkItem = {
  title: string;
  description: string;
  ariaLabel: string;
  href?: string;
  iconType?: 'fandom' | 'netease' | 'weibo' | 'bilibili' | 'site';
};

export type ExternalLinkGroup = {
  title: string;
  hideDescriptions?: boolean;
  items: ExternalLinkItem[];
};

export const EXTERNAL_LINK_GROUPS: ExternalLinkGroup[] = [
  {
    title: '友情链接',
    items: [
      {
        title: 'Fandom',
        description: '英文社区资料站',
        ariaLabel: '打开 Tom and Jerry: Chase Fandom Wiki',
        href: 'https://tom-and-jerry-chase.fandom.com/wiki/Tom_and_Jerry:_Chase_Wiki',
        iconType: 'fandom',
      },
      {
        title: 'トムチェ攻略',
        description: '日文资料站',
        ariaLabel: '打开 トムチェ攻略wiki',
        href: 'https://tjwiki.net/',
        iconType: 'site',
      },
    ],
  },
  {
    title: '网易官方资源',
    hideDescriptions: true,
    items: [
      {
        title: '官方网站',
        description: '游戏官网与公告',
        ariaLabel: '打开猫和老鼠手游官方网站',
        href: 'https://tom.163.com/',
        iconType: 'netease',
      },
      {
        title: '网易大神',
        description: '官方号动态与活动',
        ariaLabel: '打开猫和老鼠手游网易大神官方号',
        href: 'https://ds.163.com/user/9c1c00448e28455781e8fde62830160d/',
        iconType: 'netease',
      },
      {
        title: '微博',
        description: '官方资讯与公告',
        ariaLabel: '打开猫和老鼠官方手游微博',
        href: 'https://weibo.com/tnj163',
        iconType: 'weibo',
      },
      {
        title: '哔哩哔哩',
        description: '官方视频与栏目',
        ariaLabel: '打开猫和老鼠官方手游哔哩哔哩主页',
        href: 'https://space.bilibili.com/298683153',
        iconType: 'bilibili',
      },
    ],
  },
];
