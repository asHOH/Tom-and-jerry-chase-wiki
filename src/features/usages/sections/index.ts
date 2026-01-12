import EditPage from './EditPage';
import UsePage from './UsePage';

//与navigation.ts的格式相同，日后有需要可以合并
type NavItem = {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
};

// 定义所有可用的模块组件
export const usagesSections = {
  use: UsePage,
  edit: EditPage,
  // 在此处添加新的模块
  // newSection: NewSectionComponent,
} as const;

export type SectionName = keyof typeof usagesSections;

// 导航项的静态配置（需要手动维护的部分）
interface NavItemConfig extends Omit<NavItem, 'id' | 'href'> {
  id: SectionName;
  // label, iconSrc, iconAlt 等需要手动配置
}

export const NAV_ITEM_CONFIGS: readonly NavItemConfig[] = [
  {
    id: 'use',
    label: '网站使用指南',
    iconSrc: '/images/mouseSkills/%E8%8E%B1%E6%81%A91-%E8%93%9D%E5%9B%BE.png',
    iconAlt: '使用指南图标',
  },
  {
    id: 'edit',
    label: '网站编辑指南',
    iconSrc: '/images/mouseSkills/%E8%8E%B1%E6%81%A92-%E8%98%B8%E6%B0%B4%E7%AC%94.png',
    iconAlt: '编辑指南图标',
  },
] as const;

// 自动生成完整的导航项（href 自动生成）
export const USAGES_NAV_ITEMS: readonly NavItem[] = NAV_ITEM_CONFIGS.map((config) => ({
  ...config,
  href: `/usages/${config.id}`,
}));

// 自动生成模块名称列表（从配置中提取，确保一致性）
export const usagesSectionsList = NAV_ITEM_CONFIGS.map((config) => config.id) as SectionName[];
