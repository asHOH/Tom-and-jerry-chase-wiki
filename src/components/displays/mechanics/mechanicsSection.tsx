'use client';

import MechanicsNavigation from './shared/Navigation';
import TraitCollsion from './sections/TraitCollection';
import { mechanicsSectionsList } from './sections';
import PageDescription from '@/components/ui/PageDescription';

interface MechanicsSectionProps {
  sectionName?: string;
  description?: string;
}

export default function MechanicsSection({ sectionName, description }: MechanicsSectionProps) {
  const effectiveSection = mechanicsSectionsList.some((Name) => Name === sectionName);
  return (
    <MechanicsNavigation description={description || ''}>
      {!effectiveSection && (
        <header className={'text-center space-y-2 p-2'}>
          <PageDescription>（点击上方列表按钮，选择界面进行查看）</PageDescription>
        </header>
      )}
      {sectionName === 'traitCollection' && <TraitCollsion></TraitCollsion>}
    </MechanicsNavigation>
  );
}
