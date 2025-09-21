export type NavItem = {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'cat',
    label: '猫阵营',
    href: '/factions/cat',
    iconSrc: '/images/icons/cat faction.png',
    iconAlt: '猫阵营图标',
  },
  {
    id: 'mouse',
    label: '鼠阵营',
    href: '/factions/mouse',
    iconSrc: '/images/icons/mouse faction.png',
    iconAlt: '鼠阵营图标',
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
    id: 'articles',
    label: '文章',
    href: '/articles',
    iconSrc: '/images/icons/cat faction.png',
    iconAlt: '文章图标',
  },
  {
    id: 'buffs',
    label: '状态',
    href: '/buffs',
    iconSrc: '/images/icons/buff.png',
    iconAlt: '状态图标',
  },
];
