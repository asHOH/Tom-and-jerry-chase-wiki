'use client';

import { useSnapshot } from 'valtio';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalSpecialSkill } from '@/context/EditModeContext';
import { SpecialSkill } from '@/data/types';
import CharacterList from '@/features/knowledge-cards/components/knowledge-card-detail/CharacterList';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';
import { characters, specialSkillsEdit } from '@/data';

import SpecialSkillAttributesCard from './SpecialSkillAttributesCard';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillDetailClient({ skill }: SpecialSkillDetailClientProps) {
  const { isEditMode } = useEditMode();
  const { factionId, skillId } = useLocalSpecialSkill();
  const ed = editable('specialSkills');

  const rawLocalSkill =
    factionId === 'cat'
      ? specialSkillsEdit.cat[skillId]
      : factionId === 'mouse'
        ? specialSkillsEdit.mouse[skillId]
        : undefined;
  const localSkillSnapshot = useSnapshot(rawLocalSkill ?? ({} as SpecialSkill));
  const effectiveSkill = rawLocalSkill ? (localSkillSnapshot as SpecialSkill) : skill;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(
    effectiveSkill.name,
    'specialSkill',
    effectiveSkill.factionId == 'cat' ? false : true
  );

  const { isDetailedView } = useAppContext();
  if (!effectiveSkill) return null;

  const usedCharacters = Object.values(characters).filter(
    (character) =>
      character.specialSkills?.some((s) => s.name === effectiveSkill.name) &&
      character.factionId === effectiveSkill.factionId
  );

  const unusedCharacters = Object.values(characters).filter(
    (character) =>
      !character.specialSkills?.some((s) => s.name === effectiveSkill.name) &&
      character.factionId === effectiveSkill.factionId
  );

  const displayUsedCharacters = usedCharacters.length <= unusedCharacters.length;

  // Generate faction-specific title
  const factionName = effectiveSkill.factionId === 'cat' ? '猫方' : '鼠方';

  const getCharacterSectionTitle = () => {
    if (usedCharacters.length === 0) {
      return `没有${factionName}角色使用该特技`;
    } else if (unusedCharacters.length === 0) {
      return `所有${factionName}角色均使用该特技`;
    } else {
      return displayUsedCharacters
        ? `使用该特技的${factionName}角色`
        : `未使用该特技的${factionName}角色`;
    }
  };

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='技能描述'
          value={effectiveSkill.description ?? null}
          detailedValue={effectiveSkill.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveSkill.detailedDescription ?? effectiveSkill.description ?? '')
                    : (effectiveSkill.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4'>
            <DetailTraitsCard
              singleItem={{
                name: effectiveSkill.name,
                type: 'specialSkill',
                factionId: effectiveSkill.factionId,
              }}
            />
          </div>
        </DetailTextSection>
      ),
    },
    {
      title: getCharacterSectionTitle(),
      cardOptions: { variant: 'none' },
      content: (
        <CharacterList
          characters={displayUsedCharacters ? usedCharacters : unusedCharacters}
          showList={usedCharacters.length > 0 && unusedCharacters.length > 0}
        />
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<SpecialSkillAttributesCard skill={effectiveSkill} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
