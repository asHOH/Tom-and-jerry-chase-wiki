import React, { useState, useEffect } from 'react';
import { characters } from '@/data'; // Import Character type
import { setNestedProperty, saveFactionsAndCharacters } from '@/lib/editUtils';
import type { KnowledgeCardGroup } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';
import { useLocalCharacter } from '@/context/EditModeContext';

interface KnowledgeCardManagerProps {
  factionId: 'cat' | 'mouse';
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const [knowledgeCardGroups, setKnowledgeCardGroups] = useState<KnowledgeCardGroup[]>([]);
  const { localCharacter: character, setLocalCharacter } = useLocalCharacter();

  useEffect(() => {
    if (character && character.knowledgeCardGroups) {
      setKnowledgeCardGroups(character.knowledgeCardGroups);
    }
  }, [character]);

  const handleSaveChanges = (updatedGroups: KnowledgeCardGroup[]) => {
    const path = `${character.id}.knowledgeCardGroups`;
    setNestedProperty(characters, path, updatedGroups);
    setLocalCharacter({ ...character, knowledgeCardGroups: updatedGroups });
    saveFactionsAndCharacters();
  };

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = [];
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
