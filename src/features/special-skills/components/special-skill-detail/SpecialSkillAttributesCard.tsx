'use client';

import { SpecialSkill } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillAttributesCard({ skill }: SpecialSkillDetailClientProps) {
  if (!skill) return null;

  return (
    <AttributesCardLayout
      imageUrl={skill.imageUrl}
      alt={skill.name}
      title={skill.name}
      subtitle={`(特技${skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={skill.aliases}
      attributes={
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className='text-sm whitespace-pre'>
            {'CD：'}
            <span className='text-indigo-700 dark:text-indigo-400'>{skill.cooldown}</span>
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
    />
  );
}
