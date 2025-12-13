'use client';

import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { characters } from '@/data'; // Import characters data
import type { KnowledgeCardGroup, KnowledgeCardGroupSet } from '@/data/types';

import { flattenCardGroup } from '@/lib/knowledgeCardSectionUtils';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import DetailShell, { DetailSection } from '@/components/displays/shared/DetailShell';
import DetailTextSection from '@/components/displays/shared/DetailTextSection';
import Image from '@/components/Image';

import DetailTraitsCard from '../../shared/DetailTraitsCard';
import CharacterList from './CharacterList';
import KnowledgeCardAttributesCard from './KnowledgeCardAttributesCard';

export default function KnowledgeCardDetails({ card }: KnowledgeCardDetailsProps) {
  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(card.id, 'knowledgeCard');

  const { isDetailedView } = useAppContext();
  const searchParams = useSearchParams();
  const fromCharacterId = searchParams ? searchParams.get('from') : null; // Add null check
  const { handleSelectCharacter } = useAppContext();

  const fromCharacter = fromCharacterId ? characters[fromCharacterId] : null;

  // Find characters that use this knowledge card
  // Helper to check if a group or group set contains the card
  function groupContainsCard(group: KnowledgeCardGroup | KnowledgeCardGroupSet): boolean {
    if ('cards' in group && Array.isArray(group.cards)) {
      // Flatten the CardGroup[] to get all possible card combinations
      const allCombinations = flattenCardGroup(group.cards);
      const cardId = `${card.rank}-${card.id}`;
      // Check if any combination contains this card
      return allCombinations.some((combo) => combo.includes(cardId));
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

  const sections: DetailSection[] = [
    {
      key: 'effect',
      render: () => (
        <DetailTextSection
          title='知识卡效果'
          value={card.description ?? null}
          detailedValue={card.detailedDescription ?? null}
          isDetailedView={isDetailedView}
          headerContent={
            fromCharacter ? (
              <button
                type='button'
                aria-label={`返回 ${fromCharacter.id}`}
                onClick={() => handleSelectCharacter(fromCharacterId!)}
                className='text-md flex items-center gap-2 rounded-full rounded-r-lg border border-blue-200 bg-blue-50 py-1.5 pr-2 pl-4 font-bold text-blue-700 shadow-sm transition-all duration-200 hover:translate-x-[-5px] hover:border-blue-500 hover:bg-blue-500 hover:text-white dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white'
              >
                ← 返回 {fromCharacter.id}
                {fromCharacter.imageUrl && (
                  <Image
                    src={fromCharacter.imageUrl}
                    alt={fromCharacter.id}
                    width={40}
                    height={40}
                    className='h-10 w-auto rounded-full object-cover'
                  />
                )}
              </button>
            ) : undefined
          }
        >
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {card.levels.map((level) => (
              <div
                key={`${card.id}-${level.level}`}
                className='rounded bg-gray-100 p-4 dark:bg-slate-700'
              >
                <p className='px-2 py-1 text-black dark:text-gray-200'>
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
          <div className='mt-4'>
            <DetailTraitsCard singleItem={{ name: card.id, type: 'knowledgeCard' }} />
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
      leftColumn={<KnowledgeCardAttributesCard card={card} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
