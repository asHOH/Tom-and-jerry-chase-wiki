'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react'; // smaller bundle size than framer-motion

import { createPortal } from 'react-dom';
import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import singleItemRreverse from '@/lib/singleItemReverse';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useMobile } from '@/hooks/useMediaQuery';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { Skill } from '@/data/types';
import SingleItemReverseCard from '@/features/shared/components/SingleItemReverseCard';
import SingleItemTraitsText from '@/features/shared/components/SingleItemTraitsText';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import { filterTraitsBySingleItem } from '@/features/shared/traits/filterTraitsBySingleItem';
import Card from '@/components/ui/Card';
import CharacterNavigationButtons from '@/components/ui/CharacterNavigationButtons';
import CollapseCard from '@/components/ui/CollapseCard';
import { editable } from '@/components/ui/editable';
import EditButton from '@/components/ui/EditButton';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { characters } from '@/data';

import CharacterAttributesSection from './character-attributes/CharacterAttributesSection';
import CharacterRelationDisplay from './character-relations/CharacterRelationDisplay';
import CharacterHistoryDisplay from './info-displays/CharacterHistoryDisplay';
import ContentWriterDisplay from './info-displays/ContentWriterDisplay';
import CreateDateDisplay from './info-displays/CreateDateDisplay';
import WinRatesDisplay from './info-displays/WinRatesDisplay';
import KnowledgeCardManager from './knowledge-cards/KnowledgeCardManager';
import PositioningTagsSection from './positioning-tags/PositioningTagsSection';
import CharacterSection from './sections/CharacterSection';
import CharacterSectionIndex from './sections/CharacterSectionIndex';
import SkillAllocationSection from './skills/SkillAllocationSection';
import SkillCard from './skills/SkillCard';
import SpecialSkillsSection from './skills/SpecialSkillsSection';
import { useCharacterActions } from './useCharacterActions';

const e = editable('characters');

interface CharacterDetailsWithTutorialProps {
  children?: React.ReactNode;
}

function generateSpecialImageUrl(characterId: string): string {
  return `/images/specialCharacters/${characterId}.png`;
}

function CharacterImage({ characterId, imageUrl }: { characterId: string; imageUrl: string }) {
  const [useSpecialImage, setUseSpecialImage] = useState(false);
  const [specialImageExists, setSpecialImageExists] = useState(true);
  return (
    <Image
      src={useSpecialImage && specialImageExists ? generateSpecialImageUrl(characterId) : imageUrl}
      alt={characterId}
      width={200}
      height={200}
      className='object-contain'
      onClick={() => setUseSpecialImage((prev) => !prev)}
      onError={() => setSpecialImageExists(false)}
    />
  );
}

export default function CharacterDetails({ children }: CharacterDetailsWithTutorialProps) {
  const { isEditMode } = useEditMode();
  const isMobile = useMobile();
  const { addSecondWeapon } = useCharacterActions();
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const factionId = localCharacter.factionId!;

  // Go to Top button state
  const [showGoTop, setShowGoTop] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

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
  const characterSingleItem = { name: localCharacter.id, type: 'character' as const };
  const characterTraitCount = filterTraitsBySingleItem(characterSingleItem).length;
  const characterReverseCount = singleItemRreverse(characterSingleItem).length;

  return (
    <EditModeContext
      value={{
        isEditMode,
        isLoading: false,
      }}
    >
      <div className='space-y-8'>
        <div className='flex flex-col gap-8 md:flex-row'>
          <div className='md:w-1/3'>
            <Card className='h-full overflow-hidden'>
              {(isEditMode || !isMobile) && (
                <>
                  <div className='image-container relative -mx-4 -mt-4 mb-4 h-64 rounded-t-lg bg-gray-200 dark:bg-slate-700'>
                    <div className='flex h-full items-center justify-center p-3'>
                      <CharacterImage
                        characterId={localCharacter.id}
                        imageUrl={localCharacter.imageUrl}
                      />
                    </div>
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <h1 className='text-3xl font-bold dark:text-white'>
                      <e.span
                        path='id'
                        initialValue={localCharacter.id}
                        className='inline'
                        data-tutorial-id='character-name-edit'
                      />{' '}
                      <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                        ({localCharacter.factionId == 'cat' ? '猫' : '鼠'}阵营)
                      </span>
                    </h1>
                    {!isEditMode && <EditButton compact className='ml-2' />}
                  </div>
                  <ContentWriterDisplay characterId={localCharacter.id} />
                  <CreateDateDisplay createDate={localCharacter.createDate} />
                  <CharacterHistoryDisplay
                    name={localCharacter.id}
                    aliases={localCharacter.aliases || []}
                  />
                  <WinRatesDisplay characterName={localCharacter.id} />
                  <SingleItemWikiHistoryDisplay
                    singleItem={{ name: localCharacter.id, type: 'character' }}
                  />
                </>
              )}
              {!isEditMode && isMobile && (
                <div>
                  <div
                    className='auto-fit-grid grid-container grid'
                    style={{
                      gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
                    }}
                  >
                    <div className='image-container relative -mt-4 -ml-4 rounded-tl-lg bg-gray-200 dark:bg-slate-700'>
                      <div className='flex h-full items-center justify-center'>
                        <Image
                          src={localCharacter.imageUrl}
                          alt={localCharacter.id}
                          width={200}
                          height={200}
                          style={{
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </div>
                    <div className='-mt-2'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h1 className='text-2xl font-bold dark:text-white'>
                            {localCharacter.id}{' '}
                          </h1>
                          <p className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                            (
                            {localCharacter.factionId === 'cat'
                              ? '猫阵营'
                              : localCharacter.factionId === 'mouse'
                                ? '鼠阵营'
                                : ''}
                            )
                          </p>
                        </div>
                        <EditButton compact />
                      </div>
                      <ContentWriterDisplay characterId={localCharacter.id} type='isMobile' />
                      <CreateDateDisplay createDate={localCharacter.createDate} />
                      <CharacterHistoryDisplay
                        name={localCharacter.id}
                        aliases={localCharacter.aliases || []}
                      />
                      <WinRatesDisplay characterName={localCharacter.id} />
                      <SingleItemWikiHistoryDisplay
                        singleItem={{ name: localCharacter.id, type: 'character' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <e.p
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
            </Card>
          </div>

          <div className='overflow-y-hidden md:w-2/3'>
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
                          className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                          key='new-weapon-button'
                        >
                          <PlusIcon className='h-4 w-4' aria-hidden='true' />
                        </button>
                      ) : null
                    );
                })()}
                {characterTraitCount > 0 || characterReverseCount > 0 ? (
                  <div className='space-y-2'>
                    {characterTraitCount > 0 ? (
                      <CollapseCard
                        title={`${localCharacter.id}自身的互动特性(${characterTraitCount})`}
                        size='xs'
                        className='rounded-md border-x border-b border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
                        titleClassName='pl-3'
                      >
                        <SingleItemTraitsText singleItem={characterSingleItem} />
                      </CollapseCard>
                    ) : null}
                    {characterReverseCount > 0 ? (
                      <CollapseCard
                        title={`${localCharacter.id}自身的引用项(${characterReverseCount})`}
                        size='xs'
                        className='rounded-md border-x border-b border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
                        titleClassName='pl-3'
                      >
                        <SingleItemReverseCard singleItem={characterSingleItem} />
                      </CollapseCard>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CharacterSection>
            <CharacterSection
              title={localCharacter.factionId == 'cat' ? '克制关系' : '克制/协作关系'}
            >
              <CharacterRelationDisplay id={localCharacter.id} factionId={factionId} />
            </CharacterSection>
            {children}
          </div>
        </div>
      </div>
      {/* Go to Top Button */}
      {portalElement
        ? createPortal(
            <AnimatePresence>
              {showGoTop && (
                <m.button
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
                </m.button>
              )}
            </AnimatePresence>,
            portalElement
          )
        : null}
    </EditModeContext>
  );
}
