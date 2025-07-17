'use client';

import React from 'react';
import Image from 'next/image';
import { CharacterDetailsProps } from '@/lib/types';
import { Skill } from '@/data/types';
import PositioningTagsSection from './PositioningTagsSection';
import CharacterAttributesSection from './CharacterAttributesSection';
import SkillCard from './SkillCard';
import KnowledgeCardManager from './KnowledgeCardManager';
import { useState } from 'react';
import EditableField from '@/components/ui/EditableField';
import CharacterSection from './CharacterSection';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import SkillAllocationSection from './SkillAllocationSection';
import { useCharacterActions } from './useCharacterActions';
import ContentWriterDisplay from './ContentWriterDisplay';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import CharacterRelationDisplay from './CharacterRelationDisplay';
import CharacterSectionIndex from './CharacterSectionIndex';
import { useSnapshot } from 'valtio';
import { characters } from '@/data';
import { useLocalCharacter } from '@/context/EditModeContext';

export default function CharacterDetails({ character }: CharacterDetailsProps) {
  const { isEditMode } = useEditMode();
  const { addSecondWeapon, exportCharacter } = useCharacterActions();
  const [copyMessage, setCopyMessage] = useState('');
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const factionId = localCharacter.factionId!;

  const positioningTags =
    factionId === 'cat'
      ? localCharacter.catPositioningTags || []
      : localCharacter.mousePositioningTags || [];

  return (
    <EditModeContext value={{ isEditMode, isLoading: false, toggleEditMode: () => {} }}>
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
                    data-tutorial-id='character-name-edit'
                  />{' '}
                  <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                    ({localCharacter.factionId == 'cat' ? '猫' : '鼠'}阵营)
                  </span>
                </div>
                {isEditMode && (
                  <button
                    type='button'
                    aria-label='导出角色数据'
                    onClick={async () => {
                      setCopyMessage('saving');
                      try {
                        await exportCharacter();
                        setCopyMessage('success');
                        setTimeout(() => setCopyMessage(''), 2000);
                      } catch (err) {
                        console.error('Failed to copy: ', err);
                        setCopyMessage('error');
                        setTimeout(() => setCopyMessage(''), 2000);
                      }
                    }}
                    className='ml-4 w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-400 flex items-center justify-center'
                    data-tutorial-id='character-export'
                  >
                    {copyMessage === 'saving' && (
                      // Save icon
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='w-4 h-4 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8v8z'
                        ></path>
                      </svg>
                    )}
                    {copyMessage === 'success' && (
                      // Success icon
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='w-4 h-4 text-green-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='3'
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    )}
                    {copyMessage === 'error' && (
                      // Error icon
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='w-4 h-4 text-red-500'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='3'
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    )}
                    {!copyMessage && (
                      // Download icon
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='w-4 h-4'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3'
                        />
                      </svg>
                    )}
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
                <CharacterAttributesSection factionId={factionId} />

                <PositioningTagsSection tags={positioningTags} factionId={factionId} />

                <div className='hidden'>
                  <CharacterSectionIndex />
                </div>
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
                    .map<React.ReactNode>((skill: DeepReadonly<Skill>, index) => (
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
                          className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
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
            <CharacterSection title={factionId == 'cat' ? '角色克制关系' : '角色关系'}>
              <CharacterRelationDisplay id={localCharacter.id} factionId={factionId} />
            </CharacterSection>
          </div>
        </div>
      </div>
    </EditModeContext>
  );
}
