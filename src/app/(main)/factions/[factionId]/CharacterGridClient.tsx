'use client';

import dynamic from 'next/dynamic';

import { FactionCharactersProps } from '@/lib/types';
import { LOADING_COUNTS } from '@/constants/loadingCounts';
import LoadingState from '@/components/ui/LoadingState';

const CharacterGridCat = dynamic(
  () =>
    import('@/features/characters/components').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState
          type='character-grid'
          message='加载角色列表中...'
          count={LOADING_COUNTS.factionCharacters.cat}
        />
      </div>
    ),
    ssr: false,
  }
);

const CharacterGridMouse = dynamic(
  () =>
    import('@/features/characters/components').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState
          type='character-grid'
          message='加载角色列表中...'
          count={LOADING_COUNTS.factionCharacters.mouse}
        />
      </div>
    ),
    ssr: false,
  }
);

export default function CharacterGridClient(props: FactionCharactersProps) {
  if (props.factionId === 'cat') {
    return <CharacterGridCat {...props} />;
  }

  return <CharacterGridMouse {...props} />;
}
