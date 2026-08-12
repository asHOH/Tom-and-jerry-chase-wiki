'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react'; // smaller bundle size than framer-motion

import { createPortal } from 'react-dom';

import type { DeepReadonly } from '@/types/deep-readonly';
import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import singleItemRreverse from '@/lib/singleItemReverse';
import type { CharacterWithFaction, ContentEditor } from '@/lib/types';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useMobile } from '@/hooks/useMediaQuery';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { useTraitsData } from '@/context/TraitsContext';
import { Skill } from '@/data/types';
import ActorAttributesSection from '@/features/actor-profiles/components/ActorAttributesSection';
import SingleItemReverseCard from '@/features/shared/components/SingleItemReverseCard';
import SingleItemTraitsText from '@/features/shared/components/SingleItemTraitsText';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import { filterTraitsBySingleItem } from '@/features/shared/traits/filterTraitsBySingleItem';
import Card from '@/components/ui/Card';
import CollapseCard from '@/components/ui/CollapseCard';
import DiscussEditButtons from '@/components/ui/DiscussEditButtons';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import MotionButton from '@/components/ui/MotionButton';
import PageTitle from '@/components/ui/PageTitle';
import { ChevronUpIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import CharacterRelationDisplay from './character-relations/CharacterRelationDisplay';
import CharacterNavigationButtons from './CharacterNavigationButtons';
import CharacterHistoryDisplay from './info-displays/CharacterHistoryDisplay';
import ContentWriterDisplay from './info-displays/ContentWriterDisplay';
import CreateDateDisplay from './info-displays/CreateDateDisplay';
import WinRatesDisplay from './info-displays/WinRatesDisplay';
import KnowledgeCardManager from './knowledge-cards/KnowledgeCardManager';
import PositioningTagsSection from './positioning-tags/PositioningTagsSection';
import { PublishedCharacterProvider } from './PublishedCharacterContext';
import CharacterSection from './sections/CharacterSection';
import CharacterSectionIndex from './sections/CharacterSectionIndex';
import SkillAllocationSection from './skills/SkillAllocationSection';
import SkillCard from './skills/SkillCard';
import SpecialSkillsSection from './skills/SpecialSkillsSection';
import { useCharacterActions } from './useCharacterActions';

const e = editable('characters');

interface CharacterDetailsWithTutorialProps {
  character: DeepReadonly<CharacterWithFaction>;
  contentWriters?: readonly string[];
  contentEditors?: readonly ContentEditor[];
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
      className='max-h-200 max-w-200 object-contain'
      onClick={() => setUseSpecialImage((prev) => !prev)}
      onError={() => setSpecialImageExists(false)}
    />
  );
}

export default function CharacterDetails({
  character,
  contentWriters,
  contentEditors,
  children,
}: CharacterDetailsWithTutorialProps) {
  const editMode = useEditMode();
  const traits = useTraitsData();
  const { isEditMode, isEditModeRequested, runtimeStatus } = editMode;
  const isMobile = useMobile();
  const { addSecondWeapon } = useCharacterActions();
  const { characterId } = useLocalCharacter();
  const editRuntime = useDraftDataRuntime();
  const rawEditCharacter =
    editRuntime?.stores.characters[characterId] ?? editRuntime?.stores.characters[character.id];
  const editCharacter = useOptionalEditSnapshot(rawEditCharacter, character);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const localCharacter = usesDraftData && rawEditCharacter ? editCharacter : character;
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
  const characterTraitCount = filterTraitsBySingleItem(
    characterSingleItem,
    'default',
    true,
    traits
  ).length;
  const characterReverseCount = singleItemRreverse(characterSingleItem).length;

  return (
    <EditModeContext
      value={{
        ...editMode,
        isEditMode,
        isPreviewMode: false,
      }}
    >
      <PublishedCharacterProvider character={character}>
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
                      <PageTitle className='py-0 text-3xl md:text-3xl'>
                        <e.span
                          path='id'
                          initialValue={localCharacter.id}
                          className='inline'
                          data-tutorial-id='character-name-edit'
                        />{' '}
                        <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                          ({localCharacter.factionId == 'cat' ? '猫' : '鼠'}阵营)
                        </span>
                      </PageTitle>
                      <DiscussEditButtons compact isEditMode={isEditMode} className='ml-2' />
                    </div>
                    <ContentWriterDisplay
                      characterId={localCharacter.id}
                      {...(contentWriters === undefined ? {} : { contentWriters })}
                      {...(contentEditors === undefined ? {} : { contentEditors })}
                    />
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
                          <CharacterImage
                            characterId={localCharacter.id}
                            imageUrl={localCharacter.imageUrl}
                          />
                        </div>
                      </div>
                      <div className='-mt-2'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <PageTitle className='py-0 text-2xl md:text-2xl'>
                              {localCharacter.id}{' '}
                            </PageTitle>
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
                          <DiscussEditButtons compact isEditMode={false} />
                        </div>
                        <ContentWriterDisplay
                          characterId={localCharacter.id}
                          {...(contentWriters === undefined ? {} : { contentWriters })}
                          {...(contentEditors === undefined ? {} : { contentEditors })}
                          type='isMobile'
                        />
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
                  {localCharacter.EnglishName !== undefined ? (
                    <ActorAttributesSection
                      name={localCharacter.id}
                      EnglishName={localCharacter.EnglishName}
                      context='character'
                      factionId={factionId}
                      {...(localCharacter.specialClawKnifeCdHit === undefined
                        ? {}
                        : { specialClawKnifeCdHit: localCharacter.specialClawKnifeCdHit })}
                      {...(localCharacter.specialClawKnifeCdUnhit === undefined
                        ? {}
                        : { specialClawKnifeCdUnhit: localCharacter.specialClawKnifeCdUnhit })}
                    />
                  ) : (
                    <ActorAttributesSection
                      name={localCharacter.id}
                      context='character'
                      factionId={factionId}
                      {...(localCharacter.specialClawKnifeCdHit === undefined
                        ? {}
                        : { specialClawKnifeCdHit: localCharacter.specialClawKnifeCdHit })}
                      {...(localCharacter.specialClawKnifeCdUnhit === undefined
                        ? {}
                        : { specialClawKnifeCdUnhit: localCharacter.specialClawKnifeCdUnhit })}
                    />
                  )}

                  <PositioningTagsSection tags={positioningTags} factionId={factionId} />

                  <SpecialSkillsSection />

                  <div className='hidden'>
                    <CharacterSectionIndex />
                  </div>

                  {/* Character Navigation */}
                  <div className='border-border border-t pt-4'>
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
                          <IconButton
                            type='button'
                            aria-label='添加第二武器'
                            onClick={addSecondWeapon}
                            variant='add'
                            size='md'
                            key='new-weapon-button'
                          >
                            <PlusIcon
                              className={getIconButtonIconClassName('md')}
                              aria-hidden='true'
                            />
                          </IconButton>
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
                  <MotionButton
                    variant='unstyled'
                    aria-label='返回顶部'
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className='fixed right-6 bottom-6 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none'
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronUpIcon className='h-6 w-6' />
                  </MotionButton>
                )}
              </AnimatePresence>,
              portalElement
            )
          : null}
      </PublishedCharacterProvider>
    </EditModeContext>
  );
}
