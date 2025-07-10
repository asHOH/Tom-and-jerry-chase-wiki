'use client';

import { CharacterDetails } from '@/components/displays/characters/character-detail';
import { CharacterDetailsProps } from '@/lib/types';
import { characters } from '@/data';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const [character, setCharacter] = useState(props.character);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const pathParts = pathname.split('/');
      const characterId = decodeURIComponent(pathParts[pathParts.length - 1] || '');
      const newCharacter = characters[characterId];
      if (newCharacter && newCharacter.id !== character.id) {
        setCharacter(newCharacter);
      }
    } catch (error) {
      console.error('Error updating character from URL:', error);
    }
  }, [pathname, character.id]);

  return <CharacterDetails character={character} />;
}
