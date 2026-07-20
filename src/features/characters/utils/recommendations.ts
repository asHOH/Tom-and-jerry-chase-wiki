import type { Character, Faction, SuggestedSpecialSkillItem } from '@/data/types';

type CharacterRecommendationFields = Pick<Character, 'knowledgeCardGroups' | 'specialSkills'>;

type FactionRecommendationFields = Pick<
  Faction,
  'generalKnowledgeCardGroups' | 'generalSpecialSkills'
>;

export function mergeCharacterRecommendations(
  character: CharacterRecommendationFields,
  faction: FactionRecommendationFields
): CharacterRecommendationFields {
  const characterSpecialSkills = character.specialSkills;
  const characterSpecialSkillNames = new Set(
    characterSpecialSkills?.map((specialSkill) => specialSkill.name)
  );
  const inheritedSpecialSkills = faction.generalSpecialSkills.filter(
    (specialSkill) => !characterSpecialSkillNames.has(specialSkill.name)
  );
  const mergedSpecialSkills =
    characterSpecialSkills === undefined && inheritedSpecialSkills.length === 0
      ? undefined
      : [...(characterSpecialSkills ?? []), ...inheritedSpecialSkills];

  const knowledgeCardGroups = [
    ...character.knowledgeCardGroups,
    ...faction.generalKnowledgeCardGroups,
  ];

  return {
    knowledgeCardGroups,
    ...(mergedSpecialSkills === undefined ? {} : { specialSkills: mergedSpecialSkills }),
  };
}

export function isGeneralSpecialSkill(
  skill: Pick<SuggestedSpecialSkillItem, 'name' | 'description'>,
  faction: FactionRecommendationFields
) {
  return faction.generalSpecialSkills.some(
    (generalSkill) =>
      generalSkill.name === skill.name && generalSkill.description === skill.description
  );
}

export function getGeneralKnowledgeCardGroupCount(faction: FactionRecommendationFields) {
  return faction.generalKnowledgeCardGroups.length;
}

export type { CharacterRecommendationFields, FactionRecommendationFields };
