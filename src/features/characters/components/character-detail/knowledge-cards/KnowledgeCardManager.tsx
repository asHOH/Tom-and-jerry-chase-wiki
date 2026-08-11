'use client';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { factionData } from '@/data/static';
import type { FactionId, KnowledgeCardGroup } from '@/data/types';
import { getGeneralKnowledgeCardGroupCount } from '@/features/characters/utils/recommendations';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import KnowledgeCardSection from './KnowledgeCardSection';

interface KnowledgeCardManagerProps {
  factionId: FactionId;
}

// TODO: use local character to refactor
export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const { characterId } = useLocalCharacter();
  const editRuntime = useDraftDataRuntime();
  const editCharacter = editRuntime?.stores.characters[characterId];
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(editCharacter, publishedCharacter);
  const generalGroupCount = getGeneralKnowledgeCardGroupCount(factionData[factionId]);

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    const groups = editCharacter!.knowledgeCardGroups;
    const generalStartIndex = Math.max(0, groups.length - generalGroupCount);
    groups.splice(generalStartIndex, 0, newGroup);
  };

  const handleRemoveGroup = (topIndex: number, innerIndex?: number) => {
    const groups = editCharacter!.knowledgeCardGroups;
    const generalStartIndex = Math.max(0, groups.length - generalGroupCount);

    if (topIndex >= generalStartIndex) return;

    // If no innerIndex is provided, remove a top-level group.
    if (innerIndex === undefined) {
      editCharacter!.knowledgeCardGroups = groups.filter((_, i) => i !== topIndex);
      return;
    }

    // Otherwise remove the inner group from a KnowledgeCardGroupSet at topIndex.
    const groupEntry = editCharacter!.knowledgeCardGroups[topIndex];
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
