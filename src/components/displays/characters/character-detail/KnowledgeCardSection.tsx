import React from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/Tooltip';

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: string[][];
  factionId: 'cat' | 'mouse';
}

export default function KnowledgeCardSection({
  knowledgeCardGroups,
  factionId,
}: KnowledgeCardSectionProps) {
  const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

  const renderKnowledgeCardGroup = (group: string[], index: number) => {
    if (group.length === 0) {
      return null;
    }

    return (
      <div key={index} className='flex items-center space-x-4'>
        <div className='flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 text-gray-700 flex items-center justify-center text-lg font-bold'>
          {index + 1}
        </div>
        <div className='flex flex-wrap gap-2'>
          {group.map((cardId) => (
            <Tooltip key={cardId} content={cardId.split('-')[1]!} className='border-none'>
              <div className='relative w-24 h-24 flex-shrink-0'>
                {/* TODO: add link to knowledge card */}
                <Image
                  src={`${imageBasePath}${cardId}.png`}
                  alt={cardId}
                  layout='fill'
                  objectFit='contain'
                  unoptimized
                />
              </div>
            </Tooltip>
          ))}
        </div>
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
        {knowledgeCardGroups.map((group, index) => renderKnowledgeCardGroup(group, index))}
      </div>
    </div>
  );
}
