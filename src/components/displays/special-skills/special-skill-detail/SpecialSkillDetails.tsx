'use client';

import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import { useAppContext } from '@/context/AppContext';
import { characters } from '@/data';
import { SpecialSkill } from '@/data/types';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import CharacterList from '../../../displays/knowledge-cards/knowledge-card-detail/CharacterList';
import DetailTraitsCard from '../../shared/DetailTraitsCard';
import SpecialSkillAttributesCard from './SpecialSkillAttributesCard';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillDetailClient({ skill }: SpecialSkillDetailClientProps) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(
    skill.name,
    'specialSkill',
    skill.factionId == 'cat' ? false : true
  );

  const { isDetailedView } = useAppContext();
  // use useSnapshot if edit mode for special skill is supported
  const usedCharacters = Object.values(characters).filter(
    (character) =>
      character.specialSkills?.some((s) => s.name === skill.name) &&
      character.factionId === skill.factionId
  );

  const unusedCharacters = Object.values(characters).filter(
    (character) =>
      !character.specialSkills?.some((s) => s.name === skill.name) &&
      character.factionId === skill.factionId
  );

  const displayUsedCharacters = usedCharacters.length <= unusedCharacters.length;

  // Generate faction-specific title
  const factionName = skill.factionId === 'cat' ? '猫方' : '鼠方';

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

  if (!skill) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='技能描述'
          value={skill.description ?? null}
          detailedValue={skill.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <DetailTraitsCard
              singleItem={{ name: skill.name, type: 'specialSkill', factionId: skill.factionId }}
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
      leftColumn={<SpecialSkillAttributesCard skill={skill} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
