import type { SingleItem, Trait } from '@/data/types';

import { splitCharacterRelationTraits } from './characterRelationData';
import { assertValidCharacterRelations } from './characterRelationValidation';

type CharacterRelationTrait = Trait & { relation: NonNullable<Trait['relation']> };

const toItemKey = (item: SingleItem) => `${item.type}-${item.name}-${item.factionId ?? ''}`;

const toCharacterRelationExportKey = (trait: CharacterRelationTrait) =>
  `${trait.relation.kind}-${toItemKey(trait.relation.subject)}-${toItemKey(trait.relation.target)}`;

const hasRelation = (trait: Trait): trait is CharacterRelationTrait => !!trait.relation;

export function buildCharacterRelationMap(traits: Trait[]) {
  assertValidCharacterRelations(traits);

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
