'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Map } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import MapAttributesCard from './MapAttributesCard';

export default function MapDetailClient({ map }: { map: Map }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(map.name, 'map');

  const { isDetailedView } = useAppContext();
  if (!map) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='地图描述'
          value={map.description ?? null}
          detailedValue={map.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: map.name, type: 'map' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<MapAttributesCard map={map} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
