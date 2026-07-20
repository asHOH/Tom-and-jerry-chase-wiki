'use client';

import { useSnapshot } from 'valtio';

import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import type { FactionId, KnowledgeCardGroup } from '@/data/types';
import { getGeneralKnowledgeCardGroupCount } from '@/features/characters/utils/recommendations';
import { characters, factionData } from '@/data';

import KnowledgeCardSection from './KnowledgeCardSection';

interface KnowledgeCardManagerProps {
  factionId: FactionId;
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);
  const generalGroupCount = getGeneralKnowledgeCardGroupCount(factionData[factionId]);

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    const groups = characters[character.id]!.knowledgeCardGroups;
    const generalStartIndex = Math.max(0, groups.length - generalGroupCount);
    groups.splice(generalStartIndex, 0, newGroup);
  };

  const handleRemoveGroup = (topIndex: number, innerIndex?: number) => {
    const groups = characters[character.id]!.knowledgeCardGroups;
    const generalStartIndex = Math.max(0, groups.length - generalGroupCount);

    if (topIndex >= generalStartIndex) return;

    // If no innerIndex is provided, remove a top-level group.
    if (innerIndex === undefined) {
      characters[character.id]!.knowledgeCardGroups = groups.filter((_, i) => i !== topIndex);
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
