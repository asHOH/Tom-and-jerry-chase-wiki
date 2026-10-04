import { isCharacterRelationKind } from '@/lib/edit/characterRelationActions';
import type { Action } from '@/lib/edit/diffUtils';
import type { TraitRelationKind } from '@/data/types';

type RelationScope = {
  domain: string;
  characters: ReadonlySet<string> | null;
};

const domains = {
  counters: 'character',
  counteredBy: 'character',
  counterEachOther: 'character',
  collaborators: 'character',
  countersKnowledgeCards: 'knowledgeCard',
  counteredByKnowledgeCards: 'knowledgeCard',
  countersSpecialSkills: 'specialSkill',
  counteredBySpecialSkills: 'specialSkill',
  advantageMaps: 'map',
  disadvantageMaps: 'map',
  advantageModes: 'mode',
  disadvantageModes: 'mode',
} satisfies Record<TraitRelationKind, string>;

function relationScope(action: Action): RelationScope | null {
  const [characterId, field, ...rest] = action.path.split('.');
  // Root replacements can change any relation, including implicit inverse links.
  if (field === undefined) return { domain: '*', characters: null };
  // Multiple faction changes can preserve an untouched relationship together while
  // either change alone makes it illegal; those existing edges are not in the request.
  if (field === 'factionId') return { domain: 'character', characters: null };
  if (!isCharacterRelationKind(field)) return null;

  const domain = domains[field];
  const characters = new Set([characterId!]);
  if (domain !== 'character') return { domain, characters };

  // An absent overlay or a deleted collection exposes shared/inverse defaults that
  // are not recorded in the action. Indexed edits likewise lack complete endpoints.
  // Keep these cases together rather than guessing independence from partial values.
  if (rest.length > 0 || !Array.isArray(action.oldValue) || !Array.isArray(action.newValue)) {
    return { domain, characters: null };
  }
  for (const item of [...action.oldValue, ...action.newValue]) {
    if (item === null || typeof item !== 'object' || typeof item.id !== 'string') {
      return { domain, characters: null };
    }
    characters.add(item.id);
  }
  return { domain, characters };
}

/** Dependencies in the explicit relation projection, beyond overlapping write paths. */
export function areCharacterRelationsDependent(left: Action, right: Action): boolean {
  const a = relationScope(left);
  const b = relationScope(right);
  if (!a || !b) return false;
  if (a.domain === '*' || b.domain === '*') return true;
  if (a.domain !== b.domain) return false;
  if (a.characters === null || b.characters === null) return true;
  return [...a.characters].some((id) => b.characters!.has(id));
}
