'use client';

import SectionNavigationShell from '@/components/ui/SectionNavigationShell';

import { MECHANICS_NAV_ITEMS } from '../sections';

interface MechanicsNavigationProps {
  children?: React.ReactNode;
  description?: string;
}

export default function MechanicsNavigation({ children, description }: MechanicsNavigationProps) {
  return (
    <SectionNavigationShell
      title='局内机制'
      description={description}
      items={MECHANICS_NAV_ITEMS}
      bottomNavigation='when-active'
    >
      {children}
    </SectionNavigationShell>
  );
}
