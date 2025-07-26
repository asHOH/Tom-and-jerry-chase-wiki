'use client';

import React, { useState, useEffect } from 'react';
import { characters } from '@/data'; // Import Character type
import type { KnowledgeCardGroup, KnowledgeCardGroupSet, FactionId } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';
import { useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';

interface KnowledgeCardManagerProps {
  factionId: FactionId;
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const [knowledgeCardGroups, setKnowledgeCardGroups] = useState<
    DeepReadonly<(KnowledgeCardGroup | KnowledgeCardGroupSet)[]>
  >([]);
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);

  useEffect(() => {
    if (character?.knowledgeCardGroups) {
      setKnowledgeCardGroups(character.knowledgeCardGroups);
    }
  }, [character.knowledgeCardGroups]);

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    characters[character.id]!.knowledgeCardGroups.push(newGroup);
  };

  const handleRemoveGroup = (index: number) => {
    characters[character.id]!.knowledgeCardGroups = characters[
      character.id
    ]!.knowledgeCardGroups.filter((_, i) => i !== index);
  };

  return (
    <KnowledgeCardSection
      knowledgeCardGroups={knowledgeCardGroups}
      factionId={factionId}
      characterId={character.id}
      onCreateGroup={handleCreateGroup}
      onRemoveGroup={handleRemoveGroup}
    />
  );
}
