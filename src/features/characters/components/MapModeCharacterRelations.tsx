'use client';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { MapModeRelationCharacterLookup } from '@/lib/gameData/published/clientProjections';
import type { CharacterWithFaction } from '@/lib/types';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useAppContext } from '@/context/AppContext';
import type { CharacterRelationItem, TraitRelationKind } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import SectionHeader from '@/components/ui/SectionHeader';

import {
  AdvantageIcon,
  DisadvantageIcon,
} from './character-detail/character-relations/CharacterRelationIcons';
import CharacterRelationPanel, {
  type CharacterRelationPanelSection,
} from './character-detail/character-relations/CharacterRelationPanel';
import {
  buildCharacterItems,
  sortByImportance,
} from './character-detail/character-relations/characterRelationViewModel';

type MapModeCharacterRelationsProps = {
  targetName: string;
  targetType: 'map' | 'mode';
  charactersData: MapModeRelationCharacterLookup;
};

const relationKindsByTarget = {
  map: {
    advantage: 'advantageMaps',
    disadvantage: 'disadvantageMaps',
  },
  mode: {
    advantage: 'advantageModes',
    disadvantage: 'disadvantageModes',
  },
} as const satisfies Record<
  MapModeCharacterRelationsProps['targetType'],
  Record<'advantage' | 'disadvantage', TraitRelationKind>
>;

export default function MapModeCharacterRelations({
  targetName,
  targetType,
  charactersData,
}: MapModeCharacterRelationsProps) {
  const editRuntime = useDraftDataRuntime();
  const charactersSnapshot = useOptionalEditSnapshot<MapModeRelationCharacterLookup>(
    editRuntime?.stores.characters as unknown as MapModeRelationCharacterLookup | undefined,
    charactersData
  );
  const { handleSelectCharacter } = useAppContext();
  const relationKinds = relationKindsByTarget[targetType];
  const charactersRecord = charactersSnapshot as unknown as Readonly<
    Record<string, CharacterWithFaction>
  >;
  const advantageCharacters: CharacterRelationItem[] = [];
  const disadvantageCharacters: CharacterRelationItem[] = [];

  Object.values(charactersSnapshot).forEach((character) => {
    const characterRelations = getCharacterRelation(charactersRecord, character.id);
    const advantageRelation = characterRelations[relationKinds.advantage].find(
      (relation) => relation.id === targetName
    );
    const disadvantageRelation = characterRelations[relationKinds.disadvantage].find(
      (relation) => relation.id === targetName
    );

    if (advantageRelation) {
      advantageCharacters.push({ ...advantageRelation, id: character.id });
    }
    if (disadvantageRelation) {
      disadvantageCharacters.push({ ...disadvantageRelation, id: character.id });
    }
  });

  const buildItems = (relations: CharacterRelationItem[], relationKind: TraitRelationKind) =>
    sortByImportance(
      buildCharacterItems(
        relations,
        (characterId) => charactersSnapshot[characterId]?.imageUrl ?? '',
        handleSelectCharacter,
        {
          view: (characterId) => `查看角色 ${characterId}`,
          edit: (characterId) => `查看角色 ${characterId}`,
        },
        { relationKind, isEditable: false }
      )
    );

  const advantageItems = buildItems(advantageCharacters, relationKinds.advantage);
  const disadvantageItems = buildItems(disadvantageCharacters, relationKinds.disadvantage);

  if (advantageItems.length === 0 && disadvantageItems.length === 0) {
    return null;
  }

  const sections: CharacterRelationPanelSection[] = [
    {
      key: 'advantage',
      theme: 'orange',
      title: `在${targetName}中有优势的角色`,
      icon: <AdvantageIcon size={12} aria-hidden='true' />,
      items: advantageItems,
      show: advantageItems.length > 0,
    },
    {
      key: 'disadvantage',
      theme: 'purple',
      title: `在${targetName}中处于劣势的角色`,
      icon: <DisadvantageIcon size={12} aria-hidden='true' />,
      items: disadvantageItems,
      show: disadvantageItems.length > 0,
    },
  ];

  return (
    <>
      <SectionHeader title='角色适配' id='Section:角色适配' />
      <CharacterRelationPanel sections={sections} isEditMode={false} />
    </>
  );
}
