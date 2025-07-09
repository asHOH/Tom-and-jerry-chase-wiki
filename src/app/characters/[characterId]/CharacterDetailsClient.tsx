'use client';

import { CharacterDetails } from '@/components/displays/characters';
import { CharacterDetailsProps } from '@/lib/types';
import { characters } from '@/data';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  const [character, setCharacter] = useState(props.character);
  const pathname = usePathname();

  useEffect(() => {
    const characterId = decodeURIComponent(pathname.split('/').pop() || '');
    const newCharacter = characters[characterId];
    if (newCharacter) {
      setCharacter(newCharacter);
    }
  }, [pathname]);

  return <CharacterDetails character={character} />;
}
