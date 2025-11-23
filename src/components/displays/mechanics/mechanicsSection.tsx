'use client';

import PageDescription from '@/components/ui/PageDescription';

import { mechanicsSectionsList } from './sections';
import TraitCollsion from './sections/TraitCollection';
import MechanicsNavigation from './shared/Navigation';

interface MechanicsSectionProps {
  sectionName?: string;
  description?: string;
}

export default function MechanicsSection({ sectionName, description }: MechanicsSectionProps) {
  const effectiveSection = mechanicsSectionsList.some((Name) => Name === sectionName);
  return (
    <MechanicsNavigation description={description || ''}>
      {!effectiveSection && (
        <header className={'space-y-2 p-2 text-center'}>
          <PageDescription>（点击上方列表按钮，选择界面进行查看）</PageDescription>
        </header>
      )}
      {sectionName === 'traitCollection' && <TraitCollsion></TraitCollsion>}
    </MechanicsNavigation>
  );
}
