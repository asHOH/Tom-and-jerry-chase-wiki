'use client';

import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { useLocalMode } from '@/hooks/useLocalEditEntity';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { Mode } from '@/data/types';
import DetailOwnbuffsCard from '@/features/shared/detail-view/DetailOwnbuffsCard';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';

//import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import ModeAttributesCard from './ModeAttributesCard';

export default function ModeDetailClient({
  mode,
  mapsData,
}: {
  mode: Mode;
  mapsData?: PublishedGameDataByType['maps'];
}) {
  const { isEditMode } = useEditMode();
  const { modeName } = useLocalMode();
  const ed = editable('modes');

  const editRuntime = useActiveEditRuntime();
  const rawLocalMode = editRuntime?.stores.modes[modeName];
  const localModeSnapshot = useOptionalEditSnapshot(rawLocalMode, mode);
  const effectiveMode = isEditMode && rawLocalMode ? (localModeSnapshot as Mode) : mode;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveMode.name, 'mode');

  const { isDetailedView } = useAppContext();
  if (!effectiveMode) return null;

  const sections: DetailSection[] = [
    ...(effectiveMode.description !== undefined
      ? [
          {
            key: 'description',
            content: (
              <DetailTextSection
                title='模式背景'
                value={effectiveMode.description}
                detailedValue={effectiveMode.detailedDescription}
                isDetailedView={isDetailedView}
                renderValue={
                  isEditMode ? (
                    <ed.span
                      path={isDetailedView ? 'detailedDescription' : 'description'}
                      initialValue={
                        isDetailedView
                          ? (effectiveMode.detailedDescription ?? effectiveMode.description ?? '')
                          : (effectiveMode.description ?? '')
                      }
                    />
                  ) : undefined
                }
              ></DetailTextSection>
            ),
          },
        ]
      : []),
    {
      key: 'rules',
      content: (
        <DetailTextSection
          title='模式规则'
          value={effectiveMode.rules}
          detailedValue={effectiveMode.detailedRules}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedRules' : 'rules'}
                initialValue={
                  isDetailedView
                    ? (effectiveMode.detailedRules ?? effectiveMode.rules ?? '')
                    : (effectiveMode.rules ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard singleItem={{ name: effectiveMode.name, type: 'mode' }} />
            <DetailReverseCard singleItem={{ name: effectiveMode.name, type: 'mode' }} />
            <DetailOwnbuffsCard singleItem={{ name: effectiveMode.name, type: 'mode' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={
        <ModeAttributesCard
          mode={effectiveMode}
          {...(mapsData === undefined ? {} : { mapsData })}
        />
      }
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
