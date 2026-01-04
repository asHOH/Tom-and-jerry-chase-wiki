'use client';

import { useEditMode, useLocalSpecialSkill } from '@/context/EditModeContext';
import { SpecialSkill } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { specialSkillsEdit } from '@/data';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillAttributesCard({ skill }: SpecialSkillDetailClientProps) {
  const { isEditMode } = useEditMode();
  const { factionId, skillId } = useLocalSpecialSkill();
  const ed = editable('specialSkills');
  if (!skill) return null;

  const rawSkill =
    factionId === 'cat'
      ? specialSkillsEdit.cat[skillId]
      : factionId === 'mouse'
        ? specialSkillsEdit.mouse[skillId]
        : undefined;

  return (
    <AttributesCardLayout
      imageUrl={skill.imageUrl}
      alt={skill.name}
      title={skill.name}
      subtitle={`(特技${skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={isEditMode ? undefined : skill.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(rawSkill?.aliases ?? skill.aliases ?? []).length > 0 ? (
              (rawSkill?.aliases ?? skill.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawSkill) return;
                      if (!rawSkill.aliases) rawSkill.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawSkill.aliases = rawSkill.aliases.filter((_, i) => i !== index);
                      } else {
                        rawSkill.aliases[index] = trimmed;
                      }
                    }}
                  />
                  {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                </span>
              ))
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <button
              type='button'
              aria-label='添加别名'
              onClick={() => {
                if (!rawSkill) return;
                if (!rawSkill.aliases) rawSkill.aliases = [];
                if (!rawSkill.aliases.includes('新别名')) {
                  rawSkill.aliases.push('新别名');
                }
              }}
              className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
            >
              <PlusIcon className='h-3 w-3' aria-hidden='true' />
            </button>
          </div>
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
            under={skill.factionId == 'cat' ? false : true}
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
