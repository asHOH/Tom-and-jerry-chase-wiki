'use client';

import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useLocalAchievement } from '@/hooks/useLocalEditEntity';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { Achievement } from '@/data/types';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';

import AchievementAttributesCard from './AchievementAttributesCard';

export default function AchievementDetailClient({ achievement }: { achievement: Achievement }) {
  const { isEditMode } = useEditMode();
  const { achievementName, factionId } = useLocalAchievement();
  const ed = editable('achievements');
  const editRuntime = useActiveEditRuntime();

  const rawLocalAchievement =
    factionId === 'cat'
      ? editRuntime?.stores.achievements.cat[achievementName]
      : factionId === 'mouse'
        ? editRuntime?.stores.achievements.mouse[achievementName]
        : undefined;
  const localAchievementSnapshot = useOptionalEditSnapshot(rawLocalAchievement, achievement);
  const effectiveAchievement =
    isEditMode && rawLocalAchievement ? (localAchievementSnapshot as Achievement) : achievement;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(
    effectiveAchievement.name,
    'achievement',
    effectiveAchievement.factionId === 'mouse'
  );

  const { isDetailedView } = useAppContext();
  if (!effectiveAchievement) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      content: (
        <DetailTextSection
          title='成就描述'
          value={effectiveAchievement.description}
          detailedValue={effectiveAchievement.detailedDescription}
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
              singleItem={{
                name: effectiveAchievement.name,
                type: 'achievement',
                factionId: effectiveAchievement.factionId,
              }}
            />
            <DetailReverseCard
              singleItem={{
                name: effectiveAchievement.name,
                type: 'achievement',
                factionId: effectiveAchievement.factionId,
              }}
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
