'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react'; // smaller bundle size than framer-motion

import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import { CharacterDetailsProps } from '@/lib/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { EditModeContext, useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { Skill } from '@/data/types';
import SingleItemTraitsText from '@/features/shared/components/SingleItemTraitsText';
import { filterTraitsBySingleItem } from '@/features/shared/traits/filterTraitsBySingleItem';
import CharacterNavigationButtons from '@/components/ui/CharacterNavigationButtons';
import CollapseCard from '@/components/ui/CollapseCard';
import EditableField from '@/components/ui/EditableField';
import { CloseIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { characters } from '@/data';

import CharacterAttributesSection from './CharacterAttributesSection';
import CharacterHistoryDisplay from './CharacterHistoryDisplay';
import CharacterRelationDisplay from './CharacterRelationDisplay';
import CharacterSection from './CharacterSection';
import CharacterSectionIndex from './CharacterSectionIndex';
import ContentWriterDisplay from './ContentWriterDisplay';
import CreateDateDisplay from './CreateDateDisplay';
import KnowledgeCardManager from './KnowledgeCardManager';
import PositioningTagsSection from './PositioningTagsSection';
import SkillAllocationSection from './SkillAllocationSection';
import SkillCard from './SkillCard';
import SpecialSkillsSection from './SpecialSkillsSection';
import { useCharacterActions } from './useCharacterActions';

interface CharacterDetailsWithTutorialProps extends CharacterDetailsProps {
  onTutorialTrigger?: () => void;
}

export default function CharacterDetails({
  character,
  onTutorialTrigger,
  children,
}: CharacterDetailsWithTutorialProps) {
  const { isEditMode } = useEditMode();
  const isMobile = useMobile();
  const [isLocalEditMode, setIsLocalEditMode] = useState(true);
  const { addSecondWeapon, exportCharacter } = useCharacterActions();
  const [copyMessage, setCopyMessage] = useState('');
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const factionId = localCharacter.factionId!;

  // Go to Top button state
  const [showGoTop, setShowGoTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowGoTop(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const positioningTags =
    factionId === 'cat'
      ? localCharacter.catPositioningTags || []
      : localCharacter.mousePositioningTags || [];

  return (
    <EditModeContext
      value={{
        isEditMode: isEditMode && isLocalEditMode,
        isLoading: false,
        toggleEditMode: () => {},
      }}
    >
      <div className='space-y-8'>
        <div className='flex flex-col gap-8 md:flex-row'>
          <div className='md:w-1/3'>
            <div className='card h-full overflow-hidden dark:border-slate-700 dark:bg-slate-800'>
              {(isEditMode || !isMobile) && (
                <>
                  <div className='image-container relative -mx-4 -mt-4 mb-4 h-64 rounded-t-lg bg-gray-200 dark:bg-slate-700'>
                    <div className='flex h-full items-center justify-center p-3'>
                      <Image
                        src={localCharacter.imageUrl}
                        alt={character.id}
                        width={200}
                        height={200}
                        style={{
                          objectFit: 'contain',
                          // maxHeight: '100%',
                          // maxWidth: '100%',
                          // width: 'auto',
                          // height: 'auto',
                        }}
                      />
                    </div>
                  </div>
                  <h1 className='flex items-center justify-between py-2 text-3xl font-bold dark:text-white'>
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
                      <div className='flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-600'>
                        <button
                          type='button'
                          aria-label='教程'
                          onClick={onTutorialTrigger}
                          className='focus:ring-opacity-50 flex h-8 w-8 items-center justify-center bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-400'
                          data-tutorial-id='character-tutorial'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='h-5 w-5'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' d='M12 6v6l4 2' />
                            <circle
                              cx='12'
                              cy='12'
                              r='9'
                              stroke='currentColor'
                              strokeWidth='1.5'
                              fill='none'
                            />
                          </svg>
                        </button>
                        <button
                          type='button'
                          aria-label='预览'
                          onClick={() => setIsLocalEditMode(!isLocalEditMode)}
                          className='focus:ring-opacity-50 flex h-8 w-8 items-center justify-center border-l border-gray-300 bg-purple-500 text-white hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:border-gray-600 dark:bg-purple-700 dark:hover:bg-purple-800 dark:focus:ring-purple-400'
                          data-tutorial-id='character-preview'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='size-5'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25'
                            />
                          </svg>
                        </button>
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
                          className='focus:ring-opacity-50 flex h-8 w-8 items-center justify-center rounded-r-md bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-400'
                          data-tutorial-id='character-export'
                        >
                          {copyMessage === 'saving' && (
                            // Save icon
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5 animate-spin'
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
                              className='h-5 w-5 text-green-400'
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
                            <CloseIcon className='h-5 w-5 text-red-500' strokeWidth={3} />
                          )}
                          {!copyMessage && (
                            // Download icon
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                              strokeWidth={1.5}
                              stroke='currentColor'
                              className='h-4 w-4'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3'
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </h1>
                  <ContentWriterDisplay characterId={localCharacter.id} />
                  <CreateDateDisplay createDate={localCharacter.createDate} />
                  <CharacterHistoryDisplay
                    name={localCharacter.id}
                    aliases={localCharacter.aliases || []}
                  />
                </>
              )}
              {!isEditMode && isMobile && (
                <div>
                  <div
                    className={`auto-fit-grid grid-container grid`}
                    style={{
                      gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
                    }}
                  >
                    <div className='image-container relative -mt-4 -ml-4 rounded-tl-lg bg-gray-200 dark:bg-slate-700'>
                      <div className='flex h-full items-center justify-center'>
                        <Image
                          src={localCharacter.imageUrl}
                          alt={character.id}
                          width={200}
                          height={200}
                          style={{
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </div>
                    <div className='-mt-2'>
                      <h1 className='text-2xl font-bold dark:text-white'>{character.id} </h1>
                      <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                        (
                        {character.factionId === 'cat'
                          ? '猫阵营'
                          : character.factionId === 'mouse'
                            ? '鼠阵营'
                            : ''}
                        )
                      </h1>
                      <ContentWriterDisplay characterId={localCharacter.id} type='isMobile' />
                      <CreateDateDisplay createDate={localCharacter.createDate} />
                      <CharacterHistoryDisplay
                        name={localCharacter.id}
                        aliases={localCharacter.aliases || []}
                      />
                    </div>
                  </div>
                </div>
              )}
              <EditableField
                tag='p'
                path='description'
                initialValue={localCharacter.description}
                className='mt-2 py-1 whitespace-pre-wrap text-gray-700 dark:text-gray-300'
              />

              <div className='mt-6 space-y-3'>
                <CharacterAttributesSection factionId={factionId} />

                <PositioningTagsSection tags={positioningTags} factionId={factionId} />

                <SpecialSkillsSection />

                <div className='hidden'>
                  <CharacterSectionIndex />
                </div>

                {/* Character Navigation */}
                <div className='border-t border-gray-200 pt-4 dark:border-gray-700'>
                  <CharacterNavigationButtons currentCharacterId={localCharacter.id} />
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
                      isSingleWeapon && isLocalEditMode && isEditMode ? (
                        <button
                          type='button'
                          aria-label='添加第二武器'
                          onClick={addSecondWeapon}
                          className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                          key='new-weapon-button'
                        >
                          <PlusIcon className='h-4 w-4' aria-hidden='true' />
                        </button>
                      ) : null
                    );
                })()}
                <div>
                  <CollapseCard
                    title={`${character.id}角色自身的相关互动特性(${filterTraitsBySingleItem({ name: character.id, type: 'character' }).length})`}
                    size='xs'
                    className='rounded-md border-x-1 border-b-1 border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
                    titleClassName='pl-3'
                  >
                    <SingleItemTraitsText singleItem={{ name: character.id, type: 'character' }} />
                  </CollapseCard>
                </div>
              </div>
            </CharacterSection>
            <CharacterSection title={character.factionId == 'cat' ? '克制关系' : '克制/协作关系'}>
              <CharacterRelationDisplay id={localCharacter.id} factionId={factionId} />
            </CharacterSection>
            {children}
          </div>
        </div>
      </div>
      {/* Go to Top Button */}
      <AnimatePresence>
        {showGoTop && (
          <motion.button
            aria-label='返回顶部'
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className='fixed right-6 bottom-6 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none'
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7' />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </EditModeContext>
  );
}
