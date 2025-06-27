import React from 'react';
import Image from 'next/image';
import { CharacterDetailsProps } from '@/lib/types';
import { Skill } from '@/data/types';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import PositioningTagsSection from './PositioningTagsSection';
import CharacterAttributesSection from './CharacterAttributesSection';
import SkillCard from './SkillCard';
import KnowledgeCardSection from './KnowledgeCardSection';
import EditableField from '@/components/ui/EditableField';
import CharacterSection from './CharacterSection';

export default function CharacterDetails({
  character,
  isDetailedView: propIsDetailedView,
}: CharacterDetailsProps) {
  const isDetailedView = propIsDetailedView || false;
  const factionId = character.faction.id as 'cat' | 'mouse';

  const positioningTags =
    factionId === 'cat' ? character.catPositioningTags || [] : character.mousePositioningTags || [];

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='md:w-1/3'>
          <div className='card h-full'>
            <div className='w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4 image-container'>
              <div className='flex items-center justify-center h-full p-3'>
                <Image
                  src={character.imageUrl}
                  alt={character.id}
                  width={200}
                  height={200}
                  unoptimized
                  style={{
                    objectFit: 'contain',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
            <h1 className='text-3xl font-bold py-2'>
              <EditableField
                tag='span'
                path={`${character.id}.id`}
                initialValue={character.id}
                className='inline'
              />{' '}
              <span className='text-xl font-normal text-gray-400'>({character.faction.name})</span>
            </h1>

            <EditableField
              tag='p'
              path={`${character.id}.description`}
              initialValue={character.description}
              className='text-gray-700 mt-2 py-1'
            />

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
              <CharacterSection title='推荐加点'>
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
              </CharacterSection>
            </div>
          )}

          <KnowledgeCardSection
            knowledgeCardGroups={character.knowledgeCardGroups}
            factionId={factionId}
            characterId={character.id}
          />

          <CharacterSection title='技能描述'>
            <div className='space-y-6'>
              {(() => {
                const weaponSkills = character.skills.filter(
                  (skill) => skill.type === 'weapon1' || skill.type === 'weapon2'
                );
                const isSingleWeapon = weaponSkills.length === 1;

                return character.skills.map((skill, index) => (
                  <SkillCard
                    key={(skill as Skill).id}
                    skill={skill as Skill}
                    isDetailed={isDetailedView}
                    isSingleWeapon={isSingleWeapon && skill.type === 'weapon1'}
                    characterId={character.id}
                    skillIndex={index}
                  />
                ));
              })()}
            </div>
          </CharacterSection>
        </div>
      </div>
    </div>
  );
}
