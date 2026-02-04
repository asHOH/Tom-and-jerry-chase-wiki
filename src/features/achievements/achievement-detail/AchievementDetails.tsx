'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalAchievement } from '@/context/EditModeContext';
import { achievementsEdit } from '@/data/store';
import { Achievement } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';

import AchievementAttributesCard from './AchievementAttributesCard';

export default function AchievementDetailClient({ achievement }: { achievement: Achievement }) {
  const { isEditMode } = useEditMode();
  const { achievementName } = useLocalAchievement();
  const ed = editable('achievements');

  const rawLocalAchievement = achievementsEdit[achievementName];
  const localAchievementSnapshot = useSnapshot(rawLocalAchievement ?? ({} as Achievement));
  const effectiveAchievement = rawLocalAchievement
    ? (localAchievementSnapshot as Achievement)
    : achievement;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(effectiveAchievement.name, 'achievement');

  const { isDetailedView } = useAppContext();
  if (!effectiveAchievement) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='成就描述'
          value={effectiveAchievement.description ?? null}
          detailedValue={effectiveAchievement.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveAchievement.detailedDescription ??
                      effectiveAchievement.description ??
                      '')
                    : (effectiveAchievement.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard
              singleItem={{ name: effectiveAchievement.name, type: 'achievement' }}
            />
            <DetailReverseCard
              singleItem={{ name: effectiveAchievement.name, type: 'achievement' }}
            />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<AchievementAttributesCard achievement={effectiveAchievement} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
