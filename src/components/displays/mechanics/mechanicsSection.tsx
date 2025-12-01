'use client';

import PageDescription from '@/components/ui/PageDescription';

import { mechanicsSections, mechanicsSectionsList } from './sections';
import MechanicsNavigation from './shared/MechanicsNavigation';

interface MechanicsSectionProps {
  sectionName?: keyof typeof mechanicsSections;
  description?: string;
}

export default function MechanicsSection({ sectionName, description }: MechanicsSectionProps) {
  // 检查是否为有效的模块名称
  const isEffectiveSection = sectionName && mechanicsSectionsList.includes(sectionName);

  // 根据 sectionName 获取对应的组件
  const SectionComponent = sectionName && mechanicsSections[sectionName];

  return (
    <MechanicsNavigation description={description || ''}>
      {!isEffectiveSection && (
        <header className={'space-y-2 p-2 text-center'}>
          <PageDescription>（点击上方列表按钮，选择界面进行查看）</PageDescription>
        </header>
      )}
      {SectionComponent && <SectionComponent />}
    </MechanicsNavigation>
  );
}
