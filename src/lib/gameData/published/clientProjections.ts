import type { DeepReadonly } from '@/types/deep-readonly';
import type { CharacterRelationItem } from '@/data/types';

import type { PublishedGameDataByType } from './types';

type PublishedCharacter = PublishedGameDataByType['characters'][string];

type MapModeRelationKind =
  'advantageMaps' | 'advantageModes' | 'disadvantageMaps' | 'disadvantageModes';

export type KnowledgeCardCharacterView = Pick<
  PublishedCharacter,
  'id' | 'imageUrl' | 'factionId' | 'knowledgeCardGroups'
>;

export type SpecialSkillCharacterView = Pick<
  PublishedCharacter,
  'id' | 'imageUrl' | 'factionId' | 'specialSkills'
>;

export type KnowledgeCardCharacterLookup = Readonly<
  Record<string, Readonly<KnowledgeCardCharacterView>>
>;

export type SpecialSkillCharacterLookup = Readonly<
  Record<string, Readonly<SpecialSkillCharacterView>>
>;

export type MapModeRelationCharacterView = Pick<
  PublishedCharacter,
  'id' | 'imageUrl' | 'factionId'
> &
  Partial<Record<MapModeRelationKind, readonly DeepReadonly<CharacterRelationItem>[]>>;

export type MapModeRelationCharacterLookup = Readonly<
  Record<string, Readonly<MapModeRelationCharacterView>>
>;

export function projectKnowledgeCardCharacters(
  characters: PublishedGameDataByType['characters']
): KnowledgeCardCharacterLookup {
  return Object.fromEntries(
    Object.entries(characters).map(([characterId, character]) => [
      characterId,
      {
        id: character.id,
        imageUrl: character.imageUrl,
        factionId: character.faction.id,
        knowledgeCardGroups: character.knowledgeCardGroups,
      },
    ])
  );
}

export function projectSpecialSkillCharacters(
  characters: PublishedGameDataByType['characters']
): SpecialSkillCharacterLookup {
  return Object.fromEntries(
    Object.entries(characters).map(([characterId, character]) => [
      characterId,
      {
        id: character.id,
        imageUrl: character.imageUrl,
        factionId: character.faction.id,
        ...(character.specialSkills === undefined
          ? {}
          : { specialSkills: character.specialSkills }),
      },
    ])
  );
}

export function projectMapModeRelationCharacters(
  characters: PublishedGameDataByType['characters']
): MapModeRelationCharacterLookup {
  return Object.fromEntries(
    Object.entries(characters).map(([characterId, character]) => {
      const relationCharacter = character as typeof character &
        Partial<Record<MapModeRelationKind, readonly DeepReadonly<CharacterRelationItem>[]>>;

      return [
        characterId,
        {
          id: character.id,
          imageUrl: character.imageUrl,
          factionId: character.faction.id,
          ...(relationCharacter.advantageMaps === undefined
            ? {}
            : { advantageMaps: relationCharacter.advantageMaps }),
          ...(relationCharacter.advantageModes === undefined
            ? {}
            : { advantageModes: relationCharacter.advantageModes }),
          ...(relationCharacter.disadvantageMaps === undefined
            ? {}
            : { disadvantageMaps: relationCharacter.disadvantageMaps }),
          ...(relationCharacter.disadvantageModes === undefined
            ? {}
            : { disadvantageModes: relationCharacter.disadvantageModes }),
        },
      ];
    })
  );
}
