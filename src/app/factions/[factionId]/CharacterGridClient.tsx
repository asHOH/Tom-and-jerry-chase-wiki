'use client';

import { CharacterGrid } from '@/components/displays/characters';
import { FactionCharactersProps } from '@/lib/types';

export default function CharacterGridClient(props: FactionCharactersProps) {
  return <CharacterGrid {...props} />;
}
