'use client';

import { useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { factionData } from '@/data/static';
import type { FactionId, KnowledgeCardGroup } from '@/data/types';
import { getGeneralKnowledgeCardGroupCount } from '@/features/characters/utils/recommendations';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import KnowledgeCardSection from './KnowledgeCardSection';

interface KnowledgeCardManagerProps {
  factionId: FactionId;
}

export default function KnowledgeCardManager({ factionId }: KnowledgeCardManagerProps) {
  const { characterId } = useLocalCharacter();
  const publishedCharacter = usePublishedCharacter(characterId);
  const [character, updateCharacter] = useEditableEntity(
    { entityType: 'characters', entityId: characterId },
    publishedCharacter
  )!;
  const generalGroupCount = getGeneralKnowledgeCardGroupCount(factionData[factionId]);

  const handleCreateGroup = () => {
    const newGroup: KnowledgeCardGroup = {
      cards: [],
      description: '待补充',
    };
    updateCharacter((draft) => {
      const groups = draft.knowledgeCardGroups;
      const generalStartIndex = Math.max(0, groups.length - generalGroupCount);
      groups.splice(generalStartIndex, 0, newGroup);
    });
  };

  const handleRemoveGroup = (topIndex: number, innerIndex?: number) => {
    updateCharacter((draft) => {
      const groups = draft.knowledgeCardGroups;
      const generalStartIndex = Math.max(0, groups.length - generalGroupCount);
      if (topIndex >= generalStartIndex) return;

      if (innerIndex === undefined) {
        draft.knowledgeCardGroups = groups.filter((_, i) => i !== topIndex);
        return;
      }

      const groupEntry = draft.knowledgeCardGroups[topIndex];
      if (groupEntry && 'groups' in groupEntry && Array.isArray(groupEntry.groups)) {
        groupEntry.groups = groupEntry.groups.filter((_, i) => i !== innerIndex);
      }
    });
  };

  return (
    <KnowledgeCardSection
      knowledgeCardGroups={character.knowledgeCardGroups ?? []}
      factionId={factionId}
      characterId={character.id}
      onCreateGroup={handleCreateGroup}
      onRemoveGroup={handleRemoveGroup}
      updateCharacter={updateCharacter}
    />
  );
}
