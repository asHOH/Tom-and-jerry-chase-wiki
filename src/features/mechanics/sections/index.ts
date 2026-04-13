import { Character, Damage, Exp, Hp, Item, Map, Move, Object, Prepare } from './ArticlesIndex';
import TraitCollection from './TraitCollection';

//维护说明：添加新模块时，先修改ArticlesIndex，随后在本文件添加新的导入，并修改mechanicsSections和NAV_ITEM_CONFIGS

//与navigation.ts的格式相同，日后有需要可以合并
type NavItem = {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
};

// 定义所有可用的模块组件
export const mechanicsSections = {
  object: Object,
  traitCollection: TraitCollection,
  exp: Exp,
  hp: Hp,
  move: Move,
  damage: Damage,
  character: Character,
  item: Item,
  prepare: Prepare,
  map: Map,
  // 在此处添加新的模块
  // newSection: NewSectionComponent,
} as const;

export type SectionName = keyof typeof mechanicsSections;

// 导航项的静态配置（需要手动维护的部分）
interface NavItemConfig extends Omit<NavItem, 'id' | 'href'> {
  id: SectionName;
  // label, iconSrc, iconAlt 等需要手动配置
}

export const NAV_ITEM_CONFIGS: readonly NavItemConfig[] = [
  {
    id: 'object',
    label: '物体',
    iconSrc: '/images/entities/方块.png',
    iconAlt: '物体图标',
  },
  {
    id: 'character',
    label: '角色',
    iconSrc: '/images/icons/mouse-faction.png',
    iconAlt: '角色图标',
  },
  {
    id: 'move',
    label: '移动',
    iconSrc: '/images/fixtures/侦查金丝雀.png',
    iconAlt: '移动图标',
  },
  {
    id: 'exp',
    label: '经验',
    iconSrc: '/images/items/经验蛋糕.png',
    iconAlt: '经验图标',
  },
  {
    id: 'hp',
    label: '血量',
    iconSrc: '/images/catSpecialSkills/应急治疗.png',
    iconAlt: '血量图标',
  },
  {
    id: 'damage',
    label: '伤害',
    iconSrc: '/images/catSpecialSkills/蓄力重击.png',
    iconAlt: '伤害图标',
  },
  {
    id: 'item',
    label: '道具',
    iconSrc: '/images/icons/item.png',
    iconAlt: '道具图标',
  },
  {
    id: 'map',
    label: '地图',
    iconSrc: '/images/icons/map.png',
    iconAlt: '地图图标',
  },
  {
    id: 'prepare',
    label: '备战',
    iconSrc: '/images/icons/prepare.png',
    iconAlt: '备战图标',
  },
  {
    id: 'traitCollection',
    label: '特性大全',
    iconSrc: '/images/mouseSkills/莱恩2-蘸水笔.png',
    iconAlt: '特性图标',
  },
] as const;

// 自动生成完整的导航项（href 自动生成）
export const MECHANICS_NAV_ITEMS: readonly NavItem[] = NAV_ITEM_CONFIGS.map((config) => ({
  ...config,
  href: `/mechanics/${config.id}`,
}));

// 自动生成模块名称列表（从配置中提取，确保一致性）
export const mechanicsSectionsList = NAV_ITEM_CONFIGS.map((config) => config.id) as SectionName[];

/*
// 验证配置：确保所有配置的id都对应有效的组件
export function validateSectionsConfig() {
  const configIds = new Set(NAV_ITEM_CONFIGS.map((item) => item.id));
  const componentKeys = new Set(Object.keys(mechanicsSections));

  const missingConfigs = Array.from(componentKeys).filter(
    (key) => !configIds.has(key as SectionName)
  );
  const missingComponents = Array.from(configIds).filter((id) => !componentKeys.has(id));

  if (missingConfigs.length > 0) {
    console.warn(`以下组件缺少导航配置: ${missingConfigs.join(', ')}`);
  }

  if (missingComponents.length > 0) {
    console.warn(`以下导航配置缺少对应的组件: ${missingComponents.join(', ')}`);
  }

  return missingConfigs.length === 0 && missingComponents.length === 0;
}

// 可选：在开发环境中自动验证
if (process.env.NODE_ENV === 'development') {
  validateSectionsConfig();
}
*/
