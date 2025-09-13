'use client';

import React from 'react';
import GameImage from '@/components/ui/GameImage';
import { useAppContext } from '@/context/AppContext';
import { SpecialSkill } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { designTokens } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import { characters } from '@/data';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import SectionHeader from '@/components/ui/SectionHeader';
import CharacterList from '../../../displays/knowledge-cards/knowledge-card-detail/CharacterList';

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
  const [isDarkMode] = useDarkMode();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: designTokens.spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <GameImage src={skill.imageUrl} alt={skill.name} size='CARD_DETAILS' />
            <div style={{ padding: designTokens.spacing.md }}>
              <h1
                className='text-3xl font-bold dark:text-white'
                style={{ paddingBottom: designTokens.spacing.sm }}
              >
                {skill.name}
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{
                  marginTop: designTokens.spacing.sm,
                  gap: designTokens.spacing.sm,
                }}
              >
                <Tag
                  colorStyles={
                    isDarkMode
                      ? { background: '#334155', color: '#e0e7ef' }
                      : { background: '#e0e7ef', color: '#1e293b' }
                  }
                  size='md'
                >
                  冷却时间: {skill.cooldown}s
                </Tag>
                <Tag
                  colorStyles={
                    isDarkMode
                      ? { background: '#334155', color: '#e0e7ef' }
                      : { background: '#e0e7ef', color: '#1e293b' }
                  }
                  size='md'
                >
                  阵营: {skill.factionId === 'cat' ? '猫' : '鼠'}
                </Tag>

                {/*Navigation */}
                <SpecifyTypeNavigationButtons
                  currentId={skill.name}
                  specifyType='specialSkill'
                  under={skill.factionId == 'cat' ? false : true}
                />
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3 space-y-3'>
          <SectionHeader title='技能描述' />
          <div
            className='mb-8'
            style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.lg }}
          >
            <div
              className='card dark:bg-slate-800 dark:border-slate-700'
              style={{ padding: designTokens.spacing.lg }}
            >
              <div>
                <p
                  className='text-black dark:text-gray-200 text-lg'
                  style={{
                    paddingTop: designTokens.spacing.sm,
                    paddingBottom: designTokens.spacing.sm,
                  }}
                >
                  {isDetailedView && skill.detailedDescription
                    ? skill.detailedDescription
                    : skill.description}
                </p>
              </div>
            </div>
          </div>
          <div>
            <SectionHeader title={getCharacterSectionTitle()} />
            <CharacterList
              characters={displayUsedCharacters ? usedCharacters : unusedCharacters}
              showList={usedCharacters.length > 0 && unusedCharacters.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
