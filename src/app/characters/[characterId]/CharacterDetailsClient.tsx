'use client';

import dynamic from 'next/dynamic';
import { CharacterDetailsProps } from '@/lib/types';

// Dynamic import for CharacterDetails component
const CharacterDetails = dynamic(
  () =>
    import('@/components/displays/characters').then((mod) => ({ default: mod.CharacterDetails })),
  {
    loading: () => (
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='h-64 bg-gray-200 rounded mb-6'></div>
          <div className='space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  return <CharacterDetails {...props} />;
}
