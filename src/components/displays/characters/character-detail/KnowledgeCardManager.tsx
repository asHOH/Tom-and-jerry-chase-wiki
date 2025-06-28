import React, { useState, useReducer, useEffect } from 'react';
import { characters, Character } from '@/data'; // Import Character type
import { setNestedProperty, saveFactionsAndCharacters, updateKnowledgeCardGroupsInEditableFields } from '@/lib/editUtils';
import type { KnowledgeCardGroup } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';

interface KnowledgeCardManagerProps {
  factionId: 'cat' | 'mouse';
  characterId: string;
}

export default function KnowledgeCardManager({
  factionId,
  characterId,
}: KnowledgeCardManagerProps) {
  const [knowledgeCardGroups, setKnowledgeCardGroups] = useState<KnowledgeCardGroup[]>([]);
  const [key, rerender] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    // Ensure characterId is a valid key for the characters object
    const characterData: Character | undefined = characters[characterId];
    if (
      characterData &&
      characterData.factionId === factionId && // Corrected to use factionId
      characterData.knowledgeCardGroups
    ) {
      setKnowledgeCardGroups(characterData.knowledgeCardGroups);
    }
  }, [characterId, factionId, key]);

  const handleSaveChanges = (updatedGroups: KnowledgeCardGroup[]) => {
    const path = `${characterId}.knowledgeCardGroups`;
    setNestedProperty(characters, path, updatedGroups);
    updateKnowledgeCardGroupsInEditableFields(characterId, updatedGroups);
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
      characterId={characterId}
      onSaveChanges={handleSaveChanges}
      onCreateGroup={handleCreateGroup}
      onRemoveGroup={handleRemoveGroup}
    />
  );
}
