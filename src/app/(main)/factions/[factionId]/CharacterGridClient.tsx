'use client';

import dynamic from 'next/dynamic';

import { FactionCharactersProps } from '@/lib/types';
import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

const CharacterGridCat = dynamic(
  () =>
    import('@/features/characters/components').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='character-grid'
        message='加载角色列表中...'
        count={LOADING_COUNTS.factionCharacters.cat}
      />
    ),
  }
);

const CharacterGridMouse = dynamic(
  () =>
    import('@/features/characters/components').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <CatalogPageLoadingState
        type='character-grid'
        message='加载角色列表中...'
        count={LOADING_COUNTS.factionCharacters.mouse}
      />
    ),
  }
);

export default function CharacterGridClient(props: FactionCharactersProps) {
  if (props.factionId === 'cat') {
    return <CharacterGridCat {...props} />;
  }

  return <CharacterGridMouse {...props} />;
}
