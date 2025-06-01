'use client';

import CharacterDetails from '@/components/displays/characters/CharacterDetails';
import { CharacterDetailsProps } from '@/lib/types';

export default function CharacterDetailsClient(props: CharacterDetailsProps) {
  return <CharacterDetails {...props} />;
}
