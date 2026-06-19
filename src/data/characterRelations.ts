import type { SingleItem, Trait } from '@/data/types';
import { characterFactionById } from '@/features/characters/data/characterMetadata';

import { splitCharacterRelationTraits } from './characterRelationData';
import {
  assertValidCharacterRelations,
  type CharacterRelationValidationContext,
} from './characterRelationValidation';
import { cards, specialSkills } from './static';

type CharacterRelationTrait = Trait & { relation: NonNullable<Trait['relation']> };

const toItemKey = (item: SingleItem) => `${item.type}-${item.name}-${item.factionId ?? ''}`;

const toCharacterRelationExportKey = (trait: CharacterRelationTrait) =>
  `${trait.relation.kind}-${toItemKey(trait.relation.subject)}-${toItemKey(trait.relation.target)}`;

const hasRelation = (trait: Trait): trait is CharacterRelationTrait => !!trait.relation;

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
  traits: Trait[],
  validationContext: CharacterRelationValidationContext = characterRelationValidationContext
) {
  assertValidCharacterRelations(traits, validationContext);

  const relationTraits = traits.map((trait, index) => {
    if (hasRelation(trait)) return trait;
    throw new Error(`Character relation trait #${index + 1} is missing relation.`);
  });

  return Object.fromEntries(
    relationTraits.map((trait) => [toCharacterRelationExportKey(trait), trait])
  );
}

export const characterRelationTraits: Trait[] = splitCharacterRelationTraits;

export default buildCharacterRelationMap(characterRelationTraits);
