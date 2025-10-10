'use client';

import React from 'react';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import { useAppContext } from '@/context/AppContext';
import { SpecialSkill } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import { characters } from '@/data';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import CharacterList from '../../../displays/knowledge-cards/knowledge-card-detail/CharacterList';
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
  const spacing = designTokens.spacing;
  const baseTextStyle: React.CSSProperties = {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  };
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
      title: '技能描述',
      content: (
        <p className='text-black dark:text-gray-200 text-lg' style={baseTextStyle}>
          {isDetailedView && skill.detailedDescription
            ? skill.detailedDescription
            : skill.description}
        </p>
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
