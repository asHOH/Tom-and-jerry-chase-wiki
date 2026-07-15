import type { CharacterRelationTrait, SingleItem } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import { splitCharacterRelationTraits } from './characterRelationData';
import {
  assertValidCharacterRelations,
  type CharacterRelationValidationContext,
} from './characterRelationValidation';
import { cards, specialSkills } from './static';

const toItemKey = (item: SingleItem) => `${item.type}-${item.name}-${item.factionId ?? ''}`;

export const getCharacterRelationKey = (trait: CharacterRelationTrait) =>
  `${trait.relation.kind}-${toItemKey(trait.relation.subject)}-${toItemKey(trait.relation.target)}`;

export const characterRelationValidationContext = {
  getCharacterFactionId: (characterId: string) => characterFactionById[characterId],
  getKnowledgeCardFactionId: (cardId: string) => cards[cardId]?.factionId,
  getSpecialSkillFactionId: ({ name, factionId }: SingleItem) => {
    if (factionId && specialSkills[factionId][name]) return factionId;

    const hasCatSkill = !!specialSkills.cat[name];
    const hasMouseSkill = !!specialSkills.mouse[name];

    if (hasCatSkill && !hasMouseSkill) return 'cat';
    if (hasMouseSkill && !hasCatSkill) return 'mouse';

    return undefined;
  },
} satisfies CharacterRelationValidationContext;

export function buildCharacterRelationMap(
  traits: CharacterRelationTrait[],
  validationContext: CharacterRelationValidationContext = characterRelationValidationContext
) {
  assertValidCharacterRelations(traits, validationContext);

  return Object.fromEntries(traits.map((trait) => [getCharacterRelationKey(trait), trait]));
}

export const characterRelationTraits: CharacterRelationTrait[] = splitCharacterRelationTraits;

export default buildCharacterRelationMap(characterRelationTraits);
