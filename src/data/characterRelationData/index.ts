import type { Trait } from '@/data/types';

import { characterRelationCharacterTraits } from './characters';
import { characterRelationKnowledgeCardTraits } from './knowledgeCards';
import { characterRelationMapTraits } from './maps';
import { characterRelationModeTraits } from './modes';
import { characterRelationSpecialSkillTraits } from './specialSkills';

export const characterRelationTraitGroups = {
  characters: characterRelationCharacterTraits,
  knowledgeCards: characterRelationKnowledgeCardTraits,
  maps: characterRelationMapTraits,
  modes: characterRelationModeTraits,
  specialSkills: characterRelationSpecialSkillTraits,
} satisfies Record<string, Trait[]>;

export const splitCharacterRelationTraits: Trait[] = Object.values(
  characterRelationTraitGroups
).flat();
