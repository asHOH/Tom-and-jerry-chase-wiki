import { characters } from '@/data/static';
import type { CharacterRelation } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

import { createActionAuditTargetRegistry } from './actionAuditTargets';
import type { ActionPatchTargetRegistry } from './actionPatchVerification';

const relationKeys = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
] satisfies readonly (keyof CharacterRelation)[];

export function createActionPatchTargetRegistry(): ActionPatchTargetRegistry {
  const auditTargets = createActionAuditTargetRegistry();
  const targets = Object.fromEntries(
    Object.entries(auditTargets).map(([entityType, values]) => [entityType, values[0]!])
  );
  const characterTarget = targets.characters;

  for (const characterId of Object.keys(characters)) {
    const character = characterTarget?.[characterId];
    if (!character || typeof character !== 'object' || Array.isArray(character)) continue;
    const mutableCharacter = character as Record<string, unknown>;
    const relation = getCharacterRelation(characters, characterId);
    for (const key of relationKeys) mutableCharacter[key] = relation[key];
  }

  return targets;
}
