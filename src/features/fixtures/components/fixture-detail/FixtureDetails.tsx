'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalFixture } from '@/context/EditModeContext';
import { Fixture, SingleItem } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';
import SingleItemButton from '@/components/ui/SingleItemButton';
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
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard singleItem={{ name: effectiveFixture.name, type: 'fixture' }} />
            <DetailReverseCard singleItem={{ name: effectiveFixture.name, type: 'fixture' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];
  if (effectiveFixture.supportedMaps !== undefined && effectiveFixture.supportedMaps.length > 0) {
    sections.push({
      key: 'maps',
      render: () => (
        <DetailTextSection
          title='相关地图'
          value={`共收录 $${effectiveFixture.supportedMaps?.length}$text-indigo-700 dark:text-indigo-400# 个出现 $${effectiveFixture.name}$text-fuchsia-600 dark:text-fuchsia-400# 的地图，点击下方按钮即可跳转。`}
          isDetailedView={isDetailedView}
        >
          <ul
            className='mx-2 mt-2 gap-2'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            }}
          >
            {effectiveFixture.supportedMaps?.map((mapName, key) => {
              return (
                <SingleItemButton
                  key={key}
                  singleItem={{ name: mapName, type: 'map' } as SingleItem}
                />
              );
            })}
          </ul>
        </DetailTextSection>
      ),
    });
  }

  return (
    <DetailShell
      leftColumn={<FixtureAttributesCard fixture={effectiveFixture} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
