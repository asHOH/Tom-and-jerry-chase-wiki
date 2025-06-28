import React, { useState, useReducer, useEffect } from 'react';
import { characters, Character } from '@/data'; // Import Character type
import { setNestedProperty, saveFactionsAndCharacters } from '@/lib/editUtils';
import type { KnowledgeCardGroup } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';

interface KnowledgeCardManagerProps {
  factionId: 'cat' | 'mouse';
  character: Character;
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId, character }: KnowledgeCardManagerProps) {
  const [knowledgeCardGroups, setKnowledgeCardGroups] = useState<KnowledgeCardGroup[]>([]);
  const [key, rerender] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (character && character.knowledgeCardGroups) {
      setKnowledgeCardGroups(character.knowledgeCardGroups);
    }
  }, [character, key]);

  const handleSaveChanges = (updatedGroups: KnowledgeCardGroup[]) => {
    const path = `${character.id}.knowledgeCardGroups`;
    setNestedProperty(characters, path, updatedGroups);
    saveFactionsAndCharacters();
    rerender();
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
