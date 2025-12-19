'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Fixture } from '@/data/types';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';

//import DetailTraitsCard from '@/components/displays/shared/DetailTraitsCard';

import FixtureAttributesCard from './FixtureAttributesCard';

export default function FixtureDetailClient({ fixture }: { fixture: Fixture }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(fixture.name, 'fixture');

  const { isDetailedView } = useAppContext();
  if (!fixture) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='物件描述'
          value={fixture.description ?? null}
          detailedValue={fixture.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          {/*<div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: fixture.name, type: 'fixture' }} />
          </div>*/}
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<FixtureAttributesCard fixture={fixture} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
