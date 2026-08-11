'use client';

import SectionNavigationShell from '@/components/ui/SectionNavigationShell';

import { USAGES_NAV_ITEMS } from '../sections';

interface UsagesNavigationProps {
  children?: React.ReactNode;
  description?: string;
}

export default function UsagesNavigation({ children, description }: UsagesNavigationProps) {
  return (
    <SectionNavigationShell
      title='网站说明'
      description={description}
      items={USAGES_NAV_ITEMS}
      bottomNavigation='always'
    >
      {children}
    </SectionNavigationShell>
  );
}
