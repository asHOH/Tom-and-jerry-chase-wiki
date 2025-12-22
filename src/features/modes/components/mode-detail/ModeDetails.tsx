'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Mode } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';

//import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import ModeAttributesCard from './ModeAttributesCard';

export default function ModeDetailClient({ mode }: { mode: Mode }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(mode.name, 'mode');

  const { isDetailedView } = useAppContext();
  if (!mode) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='模式描述'
          value={mode.description ?? null}
          detailedValue={mode.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          {/*<div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: mode.name, type: 'mode' }} />
          </div>*/}
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<ModeAttributesCard mode={mode} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
