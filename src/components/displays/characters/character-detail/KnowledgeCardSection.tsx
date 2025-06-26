import React from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/Tooltip';
import type { KnowledgeCardGroup } from '@/data/types';
import { useAppContext } from '../../../../context/AppContext';

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

  const renderKnowledgeCardGroup = (group: string[], index: number, description?: string) => {
    if (group.length === 0) {
      return null;
    }

    return (
      <div key={index} className='flex flex-col space-y-2'>
        <div className='flex items-center space-x-4'>
          <div className='flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 text-gray-700 flex items-center justify-center text-lg font-bold'>
            {index + 1}
          </div>
          <div className='flex flex-wrap gap-2'>
            {group.map((cardId) => (
              <Tooltip key={cardId} content={cardId.split('-')[1]!} className='border-none'>
                <div
                  className='relative w-24 h-24 flex-shrink-0 cursor-pointer'
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
          <div className='bg-gray-50 p-3 rounded-lg ml-14'>
            {' '}
            {/* ml-14 to align with cards, 10 (index width) + 4 (space-x-4) */}
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
      <h3 className='text-2xl font-bold mb-4'>推荐知识卡组</h3>
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
    </div>
  );
}
