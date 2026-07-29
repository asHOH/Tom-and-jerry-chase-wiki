'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { hasUserSeenTutorial } from '@/lib/tutorialUtils';
import { CharacterDetailsProps } from '@/lib/types';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';
import { PublishedEntityHistoryProvider } from '@/context/PublishedEntityHistoryContext';
import { useToast } from '@/context/ToastContext';
import { CharacterDetails } from '@/features/characters/components/character-detail';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import PageShell from '@/components/ui/PageShell';
import OnboardingTutorial from '@/components/OnboardingTutorial';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const editMode = useEditMode();
  const { isEditMode, isPreviewMode, registerPublishedRevision } = editMode;
  const { characterId } = useLocalCharacter();
  const { exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
  const currentCharacterId = characterId || props.character.id;

  // Page-level edit mode management
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    advancedSubmit,
    discardChanges,
    publishChanges,
    getActionCount,
  } = usePageEditMode({
    entityType: 'characters',
    entityId: currentCharacterId,
    showToast: info,
  });
  const [showCharacterTutorial, setShowCharacterTutorial] = useState(false);
  const [isToolbarTutorialEnabled, setIsToolbarTutorialEnabled] = useState(false);

  // Keyboard navigation
  useKeyboardNavigation(currentCharacterId, isEditMode);

  useEffect(() => {
    if (!props.publishedRevision) return undefined;
    return registerPublishedRevision(props.publishedRevision);
  }, [props.publishedRevision, registerPublishedRevision]);

  useEffect(() => {
    if (!isEditMode) {
      setShowCharacterTutorial(false);
      setIsToolbarTutorialEnabled(false);
      return;
    }

    const shouldShowCharacterTutorial = !hasUserSeenTutorial('character-edit');
    setShowCharacterTutorial(shouldShowCharacterTutorial);
    setIsToolbarTutorialEnabled(!shouldShowCharacterTutorial);
  }, [isEditMode]);

  const handleTutorialClose = useCallback(() => {
    setShowCharacterTutorial(false);
    setIsToolbarTutorialEnabled(true);
  }, []);

  const handlePublish = useCallback(
    (
      message?: string,
      options?: {
        submitMode?: GameDataSubmitMode;
      }
    ) => publishChanges(message, options),
    [publishChanges]
  );
  const editModeContextValue = useMemo(
    () => ({
      ...editMode,
      isEditMode: isEditMode && !isPreviewMode,
      ...(props.publishedRevision === undefined
        ? {}
        : { publishedRevision: props.publishedRevision }),
    }),
    [editMode, isEditMode, isPreviewMode, props.publishedRevision]
  );

  return (
    <>
      <PageShell width='maximum' className='min-h-screen'>
        <EditModeContext value={editModeContextValue}>
          {props.publishedHistory ? (
            <PublishedEntityHistoryProvider history={props.publishedHistory}>
              <CharacterDetails
                character={props.character}
                {...(props.contentWriters === undefined
                  ? {}
                  : { contentWriters: props.contentWriters })}
                {...(props.contentEditors === undefined
                  ? {}
                  : { contentEditors: props.contentEditors })}
              >
                {props.children}
              </CharacterDetails>
            </PublishedEntityHistoryProvider>
          ) : (
            <CharacterDetails
              character={props.character}
              {...(props.contentWriters === undefined
                ? {}
                : { contentWriters: props.contentWriters })}
              {...(props.contentEditors === undefined
                ? {}
                : { contentEditors: props.contentEditors })}
            >
              {props.children}
            </CharacterDetails>
          )}
        </EditModeContext>
      </PageShell>

      {showCharacterTutorial && (
        <OnboardingTutorial
          tutorial='character-edit'
          onClose={handleTutorialClose}
          isEnabled={showCharacterTutorial}
        />
      )}

      {/* Edit mode toolbar */}
      {isEditMode && (
        <>
          <EditModeToolbar
            isDirty={isDirty}
            actionCount={getActionCount()}
            isPublishing={isPublishing}
            onDiscard={discardChanges}
            onPublish={handlePublish}
            advancedSubmit={advancedSubmit}
            onExitEditMode={exitEditMode}
            entityName={currentCharacterId}
            draftInfo={draftInfo}
            draftsSummary={draftsSummary}
            isTutorialEnabled={isToolbarTutorialEnabled}
          />
        </>
      )}
    </>
  );
}
