'use client';

import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { PageLoadingState } from '@/components/ui/LoadingState';
import CharacterDetailsClient from '@/app/(main)/characters/[characterId]/CharacterDetailsClient';
import { characters } from '@/data';

/**
 * This is the client component that contains the actual page logic.
 * It can safely use hooks that depend on the contexts provided by its parent.
 */
export default function UserCharacterPageClient() {
  const { isLoading, isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const character = characterId ? (characters[characterId] ?? null) : null;

  if (isLoading) {
    return <PageLoadingState type='character-detail' message='加载角色详情中...' />;
  }

  if (!isEditMode) {
    return <PageLoadingState type='character-detail' message='请在编辑模式下查看角色草稿。' />;
  }

  if (!character) {
    return <PageLoadingState type='character-detail' message='未找到角色草稿，可能已被清除。' />;
  }

  return <CharacterDetailsClient character={character} />;
}
