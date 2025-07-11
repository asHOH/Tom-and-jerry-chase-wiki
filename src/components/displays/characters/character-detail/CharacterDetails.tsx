'use client';

import React from 'react';
import Image from 'next/image';
import { CharacterDetailsProps, CharacterWithFaction } from '@/lib/types';
import { Skill } from '@/data/types';
import PositioningTagsSection from './PositioningTagsSection';
import CharacterAttributesSection from './CharacterAttributesSection';
import SkillCard from './SkillCard';
import KnowledgeCardManager from './KnowledgeCardManager';
import { useState } from 'react';
import EditableField from '@/components/ui/EditableField';
import CharacterSection from './CharacterSection';
import { LocalCharacterProvider, useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import SkillAllocationSection from './SkillAllocationSection';
import { generateTypescriptCodeFromCharacter, saveFactionsAndCharacters } from '@/lib/editUtils';
import { characters } from '@/data';
import { getSkillImageUrl } from '@/lib/skillUtils';
import { produce } from 'immer';
import ContentWriterDisplay from './ContentWriterDisplay';

function CharacterDetailsImplementation({ character }: CharacterDetailsProps) {
  const { isEditMode } = useEditMode();
  const [copyMessage, setCopyMessage] = useState('');
  const { localCharacter, setLocalCharacter } = useLocalCharacter();
  const factionId = localCharacter.faction.id as 'cat' | 'mouse';

  function addSecondWeapon() {
    const firstWeapon = character.skills.find((char: Skill) => char.type == 'weapon1')!;
    const secondWeapon = {
      ...firstWeapon,
      type: 'weapon2' as const,
      imageUrl: getSkillImageUrl(localCharacter.id, firstWeapon, factionId),
      id: firstWeapon.id.slice(0, -1) + '2',
    };
    function modifySkillObject(character: CharacterWithFaction) {
      const index = character.skills.findIndex(({ type }) => type == 'weapon1');
      character.skills.splice(index + 1, 0, secondWeapon);
    }
    modifySkillObject(characters[localCharacter.id]!);
    setLocalCharacter(
      produce(localCharacter, (localCharacter) => {
        modifySkillObject(localCharacter);
      })
    );
    saveFactionsAndCharacters();
  }

  const positioningTags =
    factionId === 'cat'
      ? localCharacter.catPositioningTags || []
      : localCharacter.mousePositioningTags || [];

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='md:w-1/3'>
          <div className='card h-full dark:bg-slate-800 dark:border-slate-700'>
            <div className='w-full h-64 bg-gray-200 dark:bg-slate-700 rounded-lg relative overflow-hidden mb-4 image-container'>
              <div className='flex items-center justify-center h-full p-3'>
                <Image
                  src={localCharacter.imageUrl}
                  alt={character.id}
                  width={200}
                  height={200}
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
            <h1 className='text-3xl font-bold py-2 flex items-center justify-between dark:text-white'>
              <div>
                <EditableField
                  tag='span'
                  path='id'
                  initialValue={localCharacter.id}
                  className='inline'
                />{' '}
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({localCharacter.faction.name})
                </span>
              </div>
              {isEditMode && (
                <button
                  type='button'
                  aria-label='导出角色数据'
                  onClick={async () => {
                    try {
                      const code = generateTypescriptCodeFromCharacter(localCharacter);
                      await navigator.clipboard.writeText(code);
                      const element = document.createElement('a');
                      const fileName = `${localCharacter.id}.txt`;
                      const url = URL.createObjectURL(new File([code], fileName));
                      element.href = url;
                      element.download = fileName;
                      element.style.cssText = 'visibility: hidden;';
                      document.body.appendChild(element);
                      element.click();
                      setTimeout(() => {
                        URL.revokeObjectURL(url);
                        element.remove();
                      }, 0);
                      setCopyMessage('已复制！');
                      setTimeout(() => setCopyMessage(''), 2000);
                    } catch (err) {
                      console.error('Failed to copy: ', err);
                      setCopyMessage('复制失败');
                      setTimeout(() => setCopyMessage(''), 2000);
                    }
                  }}
                  className='ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-400'
                >
                  {copyMessage || '导出数据'}
                </button>
              )}
            </h1>

            <ContentWriterDisplay characterId={localCharacter.id} />

            <EditableField
              tag='p'
              path='description'
              initialValue={localCharacter.description}
              className='text-gray-700 dark:text-gray-300 mt-2 py-1 whitespace-pre-wrap'
            />

            <div className='mt-6 space-y-3'>
              <CharacterAttributesSection character={localCharacter} factionId={factionId} />

              <PositioningTagsSection tags={positioningTags} factionId={factionId} />
            </div>
          </div>
        </div>

        <div className='md:w-2/3'>
          <SkillAllocationSection factionId={factionId} />

          <KnowledgeCardManager factionId={factionId} />

          <CharacterSection title='技能描述'>
            <div className='space-y-6'>
              {(() => {
                const weaponSkills = localCharacter.skills.filter(
                  (skill) => skill.type === 'weapon1' || skill.type === 'weapon2'
                );
                const isSingleWeapon = weaponSkills.length === 1;

                return localCharacter.skills
                  .map<React.ReactNode>((skill: Skill, index) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      isSingleWeapon={isSingleWeapon && skill.type === 'weapon1'}
                      characterId={localCharacter.id}
                      skillIndex={index}
                    />
                  ))
                  .concat(
                    isSingleWeapon && isEditMode ? (
                      <button
                        type='button'
                        aria-label='添加第二武器'
                        onClick={addSecondWeapon}
                        className='w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                        key='new-weapon-button'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='2'
                          stroke='currentColor'
                          className='w-4 h-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M12 4.5v15m7.5-7.5h-15'
                          />
                        </svg>
                      </button>
                    ) : null
                  );
              })()}
            </div>
          </CharacterSection>
        </div>
      </div>
    </div>
  );
}

export default function CharacterDetails({ character }: CharacterDetailsProps) {
  return (
    <LocalCharacterProvider character={character}>
      <CharacterDetailsImplementation character={character} />
    </LocalCharacterProvider>
  );
}
