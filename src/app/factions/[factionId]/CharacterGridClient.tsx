'use client';

import dynamic from 'next/dynamic';
import { FactionCharactersProps } from '@/lib/types';
import LoadingState from '@/components/ui/LoadingState';

// Dynamic import for CharacterGrid component
const CharacterGrid = dynamic(
  () =>
    import('@/components/displays/characters').then((mod) => ({
      default: mod.CharacterGrid,
    })),
  {
    loading: () => (
      <div className='max-w-6xl mx-auto p-6 space-y-6'>
        <LoadingState type='character-grid' message='加载角色列表中...' />
      </div>
    ),
    ssr: false,
  }
);

export default function CharacterGridClient(props: FactionCharactersProps) {
  return <CharacterGrid {...props} />;
}
