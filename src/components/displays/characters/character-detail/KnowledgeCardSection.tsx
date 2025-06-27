import React from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/Tooltip';
import CharacterSection from './CharacterSection';
import type { KnowledgeCardGroup } from '@/data/types';
import { useAppContext } from '../../../../context/AppContext';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: KnowledgeCardGroup[];
  factionId: 'cat' | 'mouse';
  characterId: string;
}

export default function KnowledgeCardSection({
  knowledgeCardGroups,
  factionId,
  characterId,
}: KnowledgeCardSectionProps) {
  const { handleSelectCard, handleTabChange } = useAppContext();
  const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

  const getCardCost = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return 0;

    const cardData =
      factionId === 'cat' ? catKnowledgeCards[cardName] : mouseKnowledgeCards[cardName];
    return cardData?.cost ?? 0;
  };

  const getCostStyles = (totalCost: number) => {
    if (totalCost >= 22) {
      // 22+ is not allowed - error state
      return {
        containerClass: 'border-red-500 bg-red-100 text-red-700',
        tooltipContent: `知识量：${totalCost}点 (超出游戏限制)`,
      };
    } else if (totalCost === 21) {
      // 21 requires special enablement - warning state
      return {
        containerClass: 'border-amber-500 bg-amber-100 text-amber-700',
        tooltipContent: `知识量：${totalCost}点 (需开启+1知识量上限)`,
      };
    } else {
      // 20 and below - normal state
      return {
        containerClass: 'border-blue-400 bg-blue-50 text-blue-700',
        tooltipContent: `知识量：${totalCost}点`,
      };
    }
  };

  const renderKnowledgeCardGroup = (group: string[], index: number, description?: string) => {
    if (group.length === 0) {
      return null;
    }

    const totalCost = group.reduce((sum, cardId) => sum + getCardCost(cardId), 0);
    const { containerClass, tooltipContent } = getCostStyles(totalCost);

    return (
      <div key={index} className='flex flex-col space-y-2'>
        <div className='flex items-start gap-0.5 sm:gap-1 md:gap-2 lg:gap-4'>
          <Tooltip content={tooltipContent} className='border-none'>
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${containerClass} flex items-center justify-center text-sm font-bold`}
            >
              {totalCost}
            </div>
          </Tooltip>
          <div className='flex flex-wrap gap-0 sm:gap-0.5 md:gap-1 lg:gap-2 flex-1 min-w-0'>
            {group.map((cardId) => (
              <Tooltip key={cardId} content={cardId.split('-')[1]!} className='border-none'>
                <div
                  className='relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer'
                  onClick={() => {
                    handleTabChange(factionId === 'cat' ? 'catCards' : 'mouseCards');
                    handleSelectCard(cardId.split('-')[1]!, characterId);
                    console.log(cardId.split('-')[1]!);
                  }}
                >
                  <Image
                    src={`${imageBasePath}${cardId}.png`}
                    alt={cardId}
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        {description && (
          <div className='bg-gray-50 p-2 sm:p-3 rounded-lg ml-10 sm:ml-11 md:ml-12 lg:ml-14'>
            <p className='text-sm text-gray-700'>{description}</p>
          </div>
        )}
      </div>
    );
  };

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    return null;
  }

  return (
    <div className='mb-8'>
      <CharacterSection title='推荐知识卡组'>
        <div className='card p-4 space-y-3'>
          {knowledgeCardGroups.map((group, index) => (
            <React.Fragment key={index}>
              {Array.isArray(group)
                ? renderKnowledgeCardGroup(group, index)
                : renderKnowledgeCardGroup(group.cards, index, group.description)}
              {index < knowledgeCardGroups.length - 1 && (
                <div className='border-t border-gray-200 my-4'></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CharacterSection>
    </div>
  );
}
