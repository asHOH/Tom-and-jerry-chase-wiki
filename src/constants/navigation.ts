export type NavItem = {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'mouse',
    label: '鼠阵营',
    href: '/factions/mouse',
    iconSrc: '/images/icons/mouse faction.png',
    iconAlt: '鼠阵营图标',
  },
  {
    id: 'cat',
    label: '猫阵营',
    href: '/factions/cat',
    iconSrc: '/images/icons/cat faction.png',
    iconAlt: '猫阵营图标',
  },
  {
    id: 'cards',
    label: '知识卡',
    href: '/cards',
    iconSrc: '/images/icons/cat knowledge card.png',
    iconAlt: '知识卡图标',
  },
  {
    id: 'special-skills',
    label: '特技',
    href: '/special-skills',
    iconSrc: '/images/mouseSpecialSkills/%E5%BA%94%E6%80%A5%E6%B2%BB%E7%96%97.png',
    iconAlt: '特技图标',
  },
  {
    id: 'items',
    label: '道具',
    href: '/items',
    iconSrc: '/images/icons/item.png',
    iconAlt: '道具图标',
  },
  {
    id: 'entities',
    label: '衍生物',
    href: '/entities',
    iconSrc: '/images/icons/entity.png',
    iconAlt: '衍生物图标',
  },
  {
    id: 'buffs',
    label: '状态',
    href: '/buffs',
    iconSrc: '/images/icons/buff.png',
    iconAlt: '状态图标',
  },
  {
    id: 'articles',
    label: '文章',
    href: '/articles',
    iconSrc: '/images/icons/article.png',
    iconAlt: '文章图标',
  },
  {
    id: 'mechanics',
    label: '机制',
    href: '/mechanics',
    iconSrc: '/images/mouseEntities/线条火箭.png',
    iconAlt: '机制图标',
  },
  {
    id: 'tools',
    label: '工具',
    href: '/tools',
    iconSrc: '/images/entitySkills/空置道具键.png',
    iconAlt: '工具图标',
  },
];

export const TOOL_NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'ranks',
    label: '属性排行',
    href: '/ranks',
    iconSrc: '/images/items/奶酪.png',
    iconAlt: '属性排行图标',
  },
  {
    id: 'special-skill-advices',
    label: '特技推荐',
    href: '/special-skills/advice',
    iconSrc: '/images//catSpecialSkills/绝地反击.png',
    iconAlt: '特技推荐图标',
  },
  //以下为编辑模式专用工具，正常情况不显示
  {
    id: 'item-maker',
    label: '道具编辑器',
    href: '/item-maker.html',
    iconSrc: '/images/icons/item.png',
    iconAlt: '道具编辑器图标',
  },
  {
    id: 'entity-maker',
    label: '衍生物编辑器',
    href: '/entity-maker.html',
    iconSrc: '/images/icons/entity.png',
    iconAlt: '衍生物编辑器图标',
  },
];

export const MECHANICS_NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'ranks',
    label: '属性排行',
    href: '/mechanics',
    iconSrc: '/images/items/奶酪.png',
    iconAlt: '属性排行图标',
  },
  {
    id: 'traitCollection',
    label: '特性大全',
    href: '/mechanics/traitCollection',
    iconSrc: '/images//mouseSkills/莱恩2-蘸水笔.png',
    iconAlt: '特性大全图标',
  },
];
