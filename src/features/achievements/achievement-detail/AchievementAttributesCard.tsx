'use client';

import { useSnapshot } from 'valtio';

import { getFactionButtonColors } from '@/lib/design';
import { useLocalAchievement } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { achievementsEdit } from '@/data/store';
import { Achievement } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

export default function AchievementAttributesCard({ achievement }: { achievement: Achievement }) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode } = useEditMode();
  const { achievementName } = useLocalAchievement();
  const ed = editable('achievements');

  const achievementsSnapshot = useSnapshot(achievementsEdit);
  if (!achievement) return null;

  const rawAchievement = achievementsEdit[achievementName];
  const effectiveAchievement = (
    isEditMode ? (achievementsSnapshot[achievementName] ?? achievement) : achievement
  ) as Achievement;

  return (
    <AttributesCardLayout
      imageUrl={achievement.imageUrl}
      alt={achievement.name}
      title={achievement.name}
      subtitle={`(对局成就·${effectiveAchievement.factionId === 'cat' ? '猫' : '鼠'})`}
      aliases={isEditMode ? undefined : achievement.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(effectiveAchievement.aliases ?? achievement.aliases ?? []).length > 0 ? (
              (effectiveAchievement.aliases ?? achievement.aliases ?? []).map(
                (alias, index, arr) => (
                  <span key={`${alias}-${index}`} className='inline-flex items-center'>
                    <ed.span
                      initialValue={alias || '<无内容>'}
                      path={`aliases.${index}`}
                      isSingleLine
                      onSave={(newValue) => {
                        if (!rawAchievement) return;
                        if (!rawAchievement.aliases) rawAchievement.aliases = [];
                        const trimmed = newValue.trim();
                        if (trimmed === '') {
                          rawAchievement.aliases = rawAchievement.aliases.filter(
                            (_, i) => i !== index
                          );
                        } else {
                          rawAchievement.aliases[index] = trimmed;
                        }
                      }}
                    />
                    {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                  </span>
                )
              )
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <AddAliasButton
              onAdd={() => {
                if (!rawAchievement) return;
                if (!rawAchievement.aliases) rawAchievement.aliases = [];
                if (!rawAchievement.aliases.includes('新别名')) {
                  rawAchievement.aliases.push('新别名');
                }
              }}
            />
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>阵营: </span>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getFactionButtonColors(effectiveAchievement.factionId, isDarkMode)}
            >
              {effectiveAchievement.factionId === 'cat' ? '猫阵营' : '鼠阵营'}
            </Tag>
          </div>
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={achievement.name} specifyType='achievement' />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay
          singleItem={{ name: achievement.name, type: 'achievement' }}
        />
      }
    />
  );
}
