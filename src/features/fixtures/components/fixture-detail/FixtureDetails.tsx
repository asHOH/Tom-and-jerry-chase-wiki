'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalFixture } from '@/context/EditModeContext';
import { Fixture } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import { editable } from '@/components/ui/editable';
import { fixturesEdit } from '@/data';

//import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import FixtureAttributesCard from './FixtureAttributesCard';

export default function FixtureDetailClient({ fixture }: { fixture: Fixture }) {
  const { isEditMode } = useEditMode();
  const { fixtureName } = useLocalFixture();
  const ed = editable('fixtures');

  const rawLocalFixture = fixturesEdit[fixtureName];
  const localFixtureSnapshot = useSnapshot(rawLocalFixture ?? ({} as Fixture));
  const effectiveFixture = rawLocalFixture ? (localFixtureSnapshot as Fixture) : fixture;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveFixture.name, 'fixture');

  const { isDetailedView } = useAppContext();
  if (!effectiveFixture) return null;
  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='物件描述'
          value={effectiveFixture.description ?? null}
          detailedValue={effectiveFixture.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveFixture.detailedDescription ?? effectiveFixture.description ?? '')
                    : (effectiveFixture.description ?? '')
                }
              />
            ) : undefined
          }
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
      leftColumn={<FixtureAttributesCard fixture={effectiveFixture} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
