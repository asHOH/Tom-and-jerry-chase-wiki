'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Mode } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

//import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import ModeAttributesCard from './ModeAttributesCard';

export default function ModeDetailClient({ mode }: { mode: Mode }) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(mode.name, 'mode');

  const { isDetailedView } = useAppContext();
  if (!mode) return null;

  const sections: DetailSection[] = [
    ...(mode.description !== undefined
      ? [
          {
            key: 'description',
            render: () => (
              <DetailTextSection
                title='模式背景'
                value={mode.description ?? null}
                detailedValue={mode.detailedDescription ?? null}
                isDetailedView={isDetailedView}
              ></DetailTextSection>
            ),
          },
        ]
      : []),
    {
      key: 'rules',
      render: () => (
        <DetailTextSection
          title='模式规则'
          value={mode.rules ?? null}
          detailedValue={mode.detailedRules ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: mode.name, type: 'mode' }} />
          </div>
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
