'use client';

import React from 'react';
import { characters } from '@/data'; // Import Character type
import type { FactionId, KnowledgeCardGroup } from '@/data/types';
import KnowledgeCardSection from './KnowledgeCardSection';
import { useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';

interface KnowledgeCardManagerProps {
  factionId: FactionId;
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    characters[character.id]!.knowledgeCardGroups.push(newGroup);
  };

  const handleRemoveGroup = (topIndex: number, innerIndex?: number) => {
    // If no innerIndex is provided, remove a top-level group.
    if (innerIndex === undefined) {
      characters[character.id]!.knowledgeCardGroups = characters[
        character.id
      ]!.knowledgeCardGroups.filter((_, i) => i !== topIndex);
      return;
    }

    // Otherwise remove the inner group from a KnowledgeCardGroupSet at topIndex.
    const groupEntry = characters[character.id]!.knowledgeCardGroups[topIndex];
    if (groupEntry && 'groups' in groupEntry && Array.isArray(groupEntry.groups)) {
      groupEntry.groups = groupEntry.groups.filter((_, i) => i !== innerIndex);
    }
  };

  return (
    <KnowledgeCardSection
      knowledgeCardGroups={character.knowledgeCardGroups ?? []}
      factionId={factionId}
      characterId={character.id}
      onCreateGroup={handleCreateGroup}
      onRemoveGroup={handleRemoveGroup}
    />
  );
}
