'use client';

import { useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalSpecialSkill } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import { SpecialSkill } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AliasEditor from '@/features/shared/detail-view/AliasEditor';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillAttributesCard({ skill }: SpecialSkillDetailClientProps) {
  const { isEditMode } = useEditMode();
  const { factionId, skillId } = useLocalSpecialSkill();
  const ed = editable('specialSkills');
  const [effectiveSkill, updateSkill] = useEditableEntity(
    {
      entityType: 'specialSkills',
      entityId: skillId,
      factionId: factionId === 'cat' || factionId === 'mouse' ? factionId : skill.factionId!,
    },
    skill
  ) as unknown as readonly [SpecialSkill, (mutate: (value: SpecialSkill) => void) => void];

  return (
    <AttributesCardLayout
      imageUrl={skill.imageUrl}
      alt={skill.name}
      title={skill.name}
      subtitle={`(特技${skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={isEditMode ? undefined : skill.aliases}
      aliasesContent={
        isEditMode ? (
          <AliasEditor
            aliases={effectiveSkill.aliases ?? skill.aliases}
            field={ed.span}
            update={updateSkill}
          />
        ) : undefined
      }
      attributes={
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className='text-sm whitespace-pre'>
            {'CD：'}
            <span className='text-indigo-700 dark:text-indigo-400'>
              <ed.span
                path='cooldown'
                initialValue={skill.cooldown ?? '<无内容>'}
                valueType='number'
                isSingleLine
              />
            </span>
            {' 秒'}
          </span>
        </div>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons
            currentId={skill.name}
            specifyType='specialSkill'
            factionId={skill.factionId}
          />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay
          singleItem={{ name: skill.name, type: 'specialSkill', factionId: skill.factionId }}
        />
      }
    />
  );
}
