'use client';

import React, { useState, useEffect } from 'react';
import { characters } from '@/data'; // Import Character type
import { setNestedProperty } from '@/lib/editUtils';
import type { KnowledgeCardGroup } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';
import { useLocalCharacter } from '@/context/EditModeContext';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';

interface KnowledgeCardManagerProps {
  factionId: 'cat' | 'mouse';
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const [knowledgeCardGroups, setKnowledgeCardGroups] = useState<
    DeepReadonly<KnowledgeCardGroup[]>
  >([]);
  const { localCharacter: character } = useLocalCharacter();

  useEffect(() => {
    if (character?.knowledgeCardGroups) {
      setKnowledgeCardGroups(character.knowledgeCardGroups);
    }
  }, [character.knowledgeCardGroups]);

  const handleSaveChanges = (updatedGroups: DeepReadonly<KnowledgeCardGroup[]>) => {
    const path = `${character.id}.knowledgeCardGroups`;
    setNestedProperty(characters, path, updatedGroups);
  };

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    const updatedGroups = [...knowledgeCardGroups, newGroup];
    handleSaveChanges(updatedGroups);
  };

  const handleRemoveGroup = (index: number) => {
    const updatedGroups = knowledgeCardGroups.filter((_, i) => i !== index);
    handleSaveChanges(updatedGroups);
  };

  return (
    <KnowledgeCardSection
      knowledgeCardGroups={knowledgeCardGroups}
      factionId={factionId}
      characterId={character.id}
      onSaveChanges={handleSaveChanges}
      onCreateGroup={handleCreateGroup}
      onRemoveGroup={handleRemoveGroup}
    />
  );
}
