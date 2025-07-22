import useSWR from 'swr';
import { FactionId } from '@/data/types';

/**
 * Hook for lazy loading character data by faction using dynamic imports
 * This provides data chunking - only loads the faction data you need
 */
export function useCharacterData(factionId: FactionId) {
  return useSWR(
    `characters-${factionId}`,
    async () => {
      // Dynamic import - this creates separate chunks for each faction
      if (factionId === 'cat') {
        const { catCharactersWithImages } = await import('@/data/catCharacters');
        return catCharactersWithImages;
      } else {
        const { mouseCharactersWithImages } = await import('@/data/mouseCharacters');
        return mouseCharactersWithImages;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}
