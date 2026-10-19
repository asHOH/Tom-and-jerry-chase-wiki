'use client';

import { getFactionButtonColors } from '@/lib/design';
import { useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalAchievement } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import { FACTION_FULL_NAMES, FACTION_NAMES } from '@/constants/factions';
import { Achievement } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AliasEditor from '@/features/shared/detail-view/AliasEditor';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

export default function AchievementAttributesCard({ achievement }: { achievement: Achievement }) {
  const { isEditMode } = useEditMode();
  const { achievementName, factionId } = useLocalAchievement();
  const ed = editable('achievements');
  const [effectiveAchievement, updateAchievement] = useEditableEntity(
    {
      entityType: 'achievements',
      entityId: achievementName,
      factionId: factionId === 'cat' || factionId === 'mouse' ? factionId : achievement.factionId!,
    },
    achievement
  ) as unknown as readonly [Achievement, (mutate: (value: Achievement) => void) => void];

  return (
    <AttributesCardLayout
      imageUrl={achievement.imageUrl}
      alt={achievement.name}
      title={achievement.name}
      subtitle={`(对局成就·${FACTION_NAMES[effectiveAchievement.factionId]})`}
      aliases={isEditMode ? undefined : achievement.aliases}
      aliasesContent={
        isEditMode ? (
          <AliasEditor
            aliases={effectiveAchievement.aliases ?? achievement.aliases}
            field={ed.span}
            update={updateAchievement}
          />
        ) : undefined
      }
      attributes={
        <>
          <div className='text-sm font-normal'>
            成就分:{' '}
            <span className='text-indigo-700 dark:text-indigo-400'>
              <ed.span
                path='score'
                initialValue={effectiveAchievement.score}
                valueType='number'
                isSingleLine
              />
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>阵营: </span>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getFactionButtonColors(effectiveAchievement.factionId)}
            >
              {FACTION_FULL_NAMES[effectiveAchievement.factionId]}
            </Tag>
          </div>
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons
            currentId={achievement.name}
            specifyType='achievement'
            factionId={achievement.factionId}
          />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay
          singleItem={{
            name: achievement.name,
            type: 'achievement',
            factionId: achievement.factionId,
          }}
        />
      }
    />
  );
}
