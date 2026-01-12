'use client';

import PageDescription from '@/components/ui/PageDescription';

import { usagesSections, usagesSectionsList, type SectionName } from './sections';
import UsagesNavigation from './shared/UsagesNavigation';

interface UsagesSectionProps {
  sectionName?: SectionName;
  description?: string;
}

export default function UsagesSection({ sectionName, description }: UsagesSectionProps) {
  // 检查是否为有效的模块名称
  const isEffectiveSection = sectionName && usagesSectionsList.includes(sectionName);

  // 根据 sectionName 获取对应的组件
  const SectionComponent = sectionName && usagesSections[sectionName];

  return (
    <UsagesNavigation description={description || ''}>
      {!isEffectiveSection && (
        <header className={'space-y-2 p-2 text-center'}>
          <PageDescription>（点击上方列表按钮，选择界面进行查看）</PageDescription>
        </header>
      )}
      {SectionComponent && <SectionComponent />}
    </UsagesNavigation>
  );
}
