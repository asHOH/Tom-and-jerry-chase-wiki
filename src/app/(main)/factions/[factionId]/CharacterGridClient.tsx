'use client';

import dynamic from 'next/dynamic';

import { FactionCharactersProps } from '@/lib/types';
import LoadingState from '@/components/ui/LoadingState';

// Dynamic import for CharacterGrid component
const CharacterGrid = dynamic(
  () =>
    import('@/features/characters/components').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <LoadingState type='character-grid' message='加载角色列表中...' />
      </div>
    ),
    ssr: false,
  }
);

export default function CharacterGridClient(props: FactionCharactersProps) {
  return <CharacterGrid {...props} />;
}
