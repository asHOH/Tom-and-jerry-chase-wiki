import TraitCollection from './TraitCollection';

// 定义所有可用的模块组件
export const mechanicsSections = {
  traitCollection: TraitCollection,
  // 在此处添加新的模块
  // newSection: NewSectionComponent,
} as const;

// 自动生成模块名称列表
export const mechanicsSectionsList = Object.keys(
  mechanicsSections
) as (keyof typeof mechanicsSections)[];
