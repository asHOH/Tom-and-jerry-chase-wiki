import type { PublishedGameDataByType } from './types';

type PublishedCharacter = PublishedGameDataByType['characters'][string];

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
