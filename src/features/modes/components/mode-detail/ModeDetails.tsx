'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalMode } from '@/context/EditModeContext';
import { Mode } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';
import { modesEdit } from '@/data';

//import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';

import ModeAttributesCard from './ModeAttributesCard';

export default function ModeDetailClient({ mode }: { mode: Mode }) {
  const { isEditMode } = useEditMode();
  const { modeName } = useLocalMode();
  const ed = editable('modes');

  const rawLocalMode = modesEdit[modeName];
  const localModeSnapshot = useSnapshot(rawLocalMode ?? ({} as Mode));
  const effectiveMode = rawLocalMode ? (localModeSnapshot as Mode) : mode;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveMode.name, 'mode');

  const { isDetailedView } = useAppContext();
  if (!effectiveMode) return null;

  const sections: DetailSection[] = [
    ...(effectiveMode.description !== undefined
      ? [
          {
            key: 'description',
            render: () => (
              <DetailTextSection
                title='模式背景'
                value={effectiveMode.description ?? null}
                detailedValue={effectiveMode.detailedDescription ?? null}
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
      render: () => (
        <DetailTextSection
          title='模式规则'
          value={effectiveMode.rules ?? null}
          detailedValue={effectiveMode.detailedRules ?? null}
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
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: effectiveMode.name, type: 'mode' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<ModeAttributesCard mode={effectiveMode} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
