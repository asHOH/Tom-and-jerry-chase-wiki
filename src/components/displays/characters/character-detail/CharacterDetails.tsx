import React from 'react';
import Image from 'next/image';
import { CharacterDetailsProps } from '@/lib/types';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import PositioningTagsSection from './PositioningTagsSection';
import CharacterAttributesSection from './CharacterAttributesSection';
import SkillCard from './SkillCard';
import Tooltip from '@/components/ui/Tooltip';

export default function CharacterDetails({
  character,
  isDetailedView: propIsDetailedView,
}: CharacterDetailsProps) {
  const isDetailedView = propIsDetailedView || false;
  const factionId = character.faction.id as 'cat' | 'mouse';

  const positioningTags =
    factionId === 'cat' ? character.catPositioningTags || [] : character.mousePositioningTags || [];

  const renderKnowledgeCardGroup = (group: string[], index: number) => {
    if (group.length === 0) {
      return null;
    }

    const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

    return (
      <div key={index} className='flex items-center space-x-4'>
        <div className='flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 text-gray-700 flex items-center justify-center text-lg font-bold'>
          {index + 1}
        </div>
        <div className='flex flex-wrap gap-2'>
          {group.map((cardId) => (
            <Tooltip key={cardId} content={cardId.split('-')[1]}>
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

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='md:w-1/3'>
          <div className='card h-full'>
            <div className='w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4'>
              <div className='flex items-center justify-center h-full'>
                <Image
                  src={character.imageUrl}
                  alt={character.id}
                  width={200}
                  height={200}
                  unoptimized
                  style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>
            <h1 className='text-3xl font-bold py-2'>
              {character.id}{' '}
              <span className='text-xl font-normal text-gray-400'>({character.faction.name})</span>
            </h1>

            <p className='text-gray-700 mt-2 py-1'>{character.description}</p>

            <div className='mt-6 space-y-3'>
              <CharacterAttributesSection
                character={character}
                factionId={factionId}
                isDetailed={isDetailedView}
              />

              <PositioningTagsSection
                tags={positioningTags}
                factionId={factionId}
                isDetailed={isDetailedView}
              />
            </div>
          </div>
        </div>

        <div className='md:w-2/3'>
          {character.skillAllocations && character.skillAllocations.length > 0 && (
            <div className='mb-8'>
              <h3 className='text-2xl font-bold px-2 py-3 mb-4'>推荐加点</h3>
              <div className='space-y-3'>
                {character.skillAllocations.map((allocation) => (
                  <div key={allocation.id} className='card p-4'>
                    <SkillAllocationDisplay
                      allocation={allocation}
                      characterName={character.id}
                      factionId={factionId}
                      characterSkills={character.skills}
                      isDetailed={isDetailedView}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {character.knowledgeCardGroups && character.knowledgeCardGroups.length > 0 && (
            <div className='mb-8'>
              <h3 className='text-2xl font-bold mb-4'>推荐知识卡组</h3>
              <div className='card p-4 space-y-3'>
                {character.knowledgeCardGroups.map((group, index) =>
                  renderKnowledgeCardGroup(group, index)
                )}
              </div>
            </div>
          )}

          <div className='mb-6'>
            <h3 className='text-2xl font-bold px-2 py-3'>技能描述</h3>
          </div>

          <div className='space-y-6'>
            {character.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} isDetailed={isDetailedView} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
