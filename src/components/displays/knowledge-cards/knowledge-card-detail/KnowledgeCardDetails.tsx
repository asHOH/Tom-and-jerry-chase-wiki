'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Image from '@/components/Image';
import { getCardRankColors, getCardCostColors, designTokens } from '@/lib/design-tokens';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useAppContext } from '@/context/AppContext';
import { characters } from '@/data'; // Import characters data
import { useDarkMode } from '@/context/DarkModeContext';
import { useSpecifyTypeKeyboardNavigation } from '@/lib/hooks/useSpecifyTypeKeyboardNavigation';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import SectionHeader from '@/components/ui/SectionHeader';
import CharacterList from './CharacterList';

// Local types for group checking
type KnowledgeCardGroup = { cards: string[]; description?: string };
type KnowledgeCardGroupSet = {
  groups: (KnowledgeCardGroup | KnowledgeCardGroupSet)[];
  id?: string;
  detailedDescription?: string;
  defaultFolded?: boolean;
};

export default function KnowledgeCardDetails({ card }: KnowledgeCardDetailsProps) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(card.id, 'knowledgeCard');

  const { isDetailedView } = useAppContext();
  const searchParams = useSearchParams();
  const fromCharacterId = searchParams ? searchParams.get('from') : null; // Add null check
  const { handleSelectCharacter } = useAppContext();
  const [isDarkMode] = useDarkMode();

  const rankColors = getCardRankColors(card.rank, true, isDarkMode);
  const costColors = getCardCostColors(card.cost, true, isDarkMode);

  const fromCharacter = fromCharacterId ? characters[fromCharacterId] : null;

  // Find characters that use this knowledge card
  // Helper to check if a group or group set contains the card
  function groupContainsCard(group: KnowledgeCardGroup | KnowledgeCardGroupSet): boolean {
    if ('cards' in group && Array.isArray(group.cards)) {
      return group.cards.includes(`${card.rank}-${card.id}`);
    }
    if ('groups' in group && Array.isArray(group.groups)) {
      return group.groups.some(groupContainsCard);
    }
    return false;
  }

  const usedCharacters = Object.values(characters).filter(
    (character) =>
      character.factionId === card.factionId &&
      character.knowledgeCardGroups?.some(groupContainsCard)
  );

  const unusedCharacters = Object.values(characters).filter(
    (character) =>
      character.factionId === card.factionId &&
      !character.knowledgeCardGroups?.some(groupContainsCard)
  );

  const displayUsedCharacters = usedCharacters.length <= unusedCharacters.length;

  // Generate faction-specific title
  const factionName = card.factionId === 'cat' ? '猫方' : '鼠方';

  const getCharacterSectionTitle = () => {
    if (usedCharacters.length === 0) {
      return `没有${factionName}角色使用该知识卡`;
    } else if (unusedCharacters.length === 0) {
      return `所有${factionName}角色均使用该知识卡`;
    } else {
      return displayUsedCharacters
        ? `使用该知识卡的${factionName}角色`
        : `未使用该知识卡的${factionName}角色`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: designTokens.spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <GameImage src={card.imageUrl} alt={card.id} size='CARD_DETAILS' />
            <div style={{ padding: designTokens.spacing.md }}>
              <h1
                className='text-3xl font-bold dark:text-white'
                style={{ paddingBottom: designTokens.spacing.sm }}
              >
                {card.id}{' '}
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({card.factionId === 'cat' ? '猫方知识卡' : '鼠方知识卡'})
                </span>
              </h1>

              {/* Card attributes section */}
              <div
                style={{
                  marginTop: designTokens.spacing.lg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: designTokens.spacing.sm,
                }}
              >
                <div className='grid grid-cols-2'>
                  <p className='text-base text-gray-700 dark:text-gray-300'>
                    <Tag colorStyles={rankColors} size='md'>
                      等级: {card.rank}
                    </Tag>
                  </p>
                  <p className='text-base text-gray-700 dark:text-gray-300'>
                    <Tag colorStyles={costColors} size='md'>
                      费用: {card.cost}
                    </Tag>
                  </p>
                </div>

                {/* Navigation */}
                <SpecifyTypeNavigationButtons currentId={card.id} specifyType='knowledgeCard' />
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3 space-y-3'>
          {/* Card description title */}
          <SectionHeader title='知识卡效果'>
            {fromCharacter && (
              <button
                type='button'
                aria-label={`返回 ${fromCharacter.id}`}
                onClick={() => handleSelectCharacter(fromCharacterId!)}
                className='flex items-center gap-2 font-bold py-1.5 pl-4 pr-2 rounded-full rounded-r-lg text-md border shadow-sm transition-all duration-200
                           bg-blue-50 text-blue-700 border-blue-200
                           hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:translate-x-[-5px]
                           dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700
                           dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600'
              >
                ← 返回 {fromCharacter.id}
                {fromCharacter.imageUrl && (
                  <Image
                    src={fromCharacter.imageUrl}
                    alt={fromCharacter.id}
                    width={0}
                    height={0}
                    className='rounded-full object-cover'
                    style={{ height: '40px', width: 'auto' }}
                  />
                )}
              </button>
            )}
          </SectionHeader>

          {/* Card description content */}
          <div className='card dark:bg-slate-800 dark:border-slate-700 p-6 mb-8'>
            <div className='mb-6'>
              <p className='text-black dark:text-gray-200 text-lg py-2'>
                <TextWithHoverTooltips
                  text={
                    isDetailedView && card.detailedDescription
                      ? card.detailedDescription
                      : card.description
                  }
                />
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {card.levels.map((level) => (
                <div
                  key={`${card.id}-${level.level}`}
                  className='bg-gray-100 dark:bg-slate-700 rounded p-4'
                >
                  <p className='text-black dark:text-gray-200 px-2 py-1'>
                    <span className='font-bold'>Lv.{level.level}:</span>{' '}
                    {renderTextWithHighlights(
                      isDetailedView && level.detailedDescription
                        ? level.detailedDescription
                        : level.description
                    )}
                  </p>
                </div>
              ))}
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
