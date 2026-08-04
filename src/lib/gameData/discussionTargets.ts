import { getAffectedGameDataNames } from '@/lib/gameData/contributionDisplay';

export type GameDataDiscussionTarget = {
  scope: string;
  targetId: string;
};

const ENTITY_TYPE_TO_SCOPE: Record<string, string> = {
  cards: 'knowledge_cards',
  specialSkills: 'special_skills',
};

const ENTITY_TYPE_TO_ROUTE: Record<string, string> = {
  cards: 'cards',
  specialSkills: 'special-skills',
};

export function getDiscussionTargetForEntity(entityType: string, entityId: string) {
  const scope = ENTITY_TYPE_TO_SCOPE[entityType] ?? entityType;
  const route = ENTITY_TYPE_TO_ROUTE[entityType] ?? entityType;
  return {
    scope,
    targetId: entityId,
    href: `/discuss/${encodeURIComponent(route)}/${encodeURIComponent(entityId)}/`,
  };
}

export function getGameDataDiscussionTargets(
  entityType: string,
  entry: unknown
): GameDataDiscussionTarget[] {
  const scope = ENTITY_TYPE_TO_SCOPE[entityType] ?? entityType;
  return getAffectedGameDataNames(entityType, entry).map(({ name, factionId }) => ({
    scope,
    targetId: factionId ? `${factionId}.${name}` : name,
  }));
}

export function actionMatchesDiscussionTarget(
  entityType: string,
  entry: unknown,
  target: GameDataDiscussionTarget
): boolean {
  return getGameDataDiscussionTargets(entityType, entry).some(
    (candidate) => candidate.scope === target.scope && candidate.targetId === target.targetId
  );
}
