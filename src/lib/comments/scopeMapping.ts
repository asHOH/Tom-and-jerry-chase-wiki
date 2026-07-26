import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

/**
 * Maps URL route segments to comment_scope enum values.
 * Used by the catch-all discussion route handler.
 */
const ROUTE_SEGMENT_TO_SCOPE: Record<string, string> = {
  entities: 'entities',
  items: 'items',
  buffs: 'buffs',
  maps: 'maps',
  fixtures: 'fixtures',
  modes: 'modes',
  achievements: 'achievements',
  cards: 'knowledge_cards',
  'special-skills': 'special_skills',
  characters: 'characters',
};

const SCOPE_TO_ROUTE_SEGMENT: Record<string, string> = {
  entities: 'entities',
  items: 'items',
  buffs: 'buffs',
  maps: 'maps',
  fixtures: 'fixtures',
  modes: 'modes',
  achievements: 'achievements',
  knowledge_cards: 'cards',
  special_skills: 'special-skills',
  characters: 'characters',
};

export function routeSegmentToScope(segment: string): string {
  return ROUTE_SEGMENT_TO_SCOPE[segment] ?? segment;
}

export function scopeToRouteSegment(scope: string): string {
  return SCOPE_TO_ROUTE_SEGMENT[scope] ?? scope;
}

/** Chinese labels for entity types — used for discussion page titles. */
export const ENTITY_LABELS: Record<string, string> = {
  entities: '衍生物',
  items: '道具',
  buffs: '状态',
  maps: '地图',
  fixtures: '组件',
  modes: '模式',
  achievements: '对局成就',
  cards: '知识卡',
  'special-skills': '特技',
  characters: '角色',
};

/** All valid entity types for notFound() gating on discussion routes. */
export const VALID_ENTITY_TYPES = [
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'cards',
  'special-skills',
  'characters',
] as const;

type EntityWithName = { name: string };

/**
 * Looks up an entity by its type and ID in static data.
 * Returns the entity (which has a `name` property) or undefined if not found.
 *
 * Special cases:
 * - `cards`: uses `id` as the name (Card type uses `id` not `name`)
 * - `special-skills` and `achievements`: entityId is split by `.` into factionId + entity name
 * - `articles`: returns a synthetic object (Supabase-backed, no static data)
 */
export function getEntityByTypeAndId(
  entityType: string,
  entityId: string
): EntityWithName | undefined {
  switch (entityType) {
    case 'entities': {
      const e = entities[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'items': {
      const e = items[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'buffs': {
      const e = buffs[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'maps': {
      const e = maps[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'fixtures': {
      const e = fixtures[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'modes': {
      const e = modes[entityId];
      return e ? { name: e.name } : undefined;
    }
    case 'achievements': {
      const dotIndex = entityId.indexOf('.');
      if (dotIndex === -1) return undefined;
      const factionId = entityId.slice(0, dotIndex);
      const achievementName = entityId.slice(dotIndex + 1);
      if (factionId !== 'cat' && factionId !== 'mouse') return undefined;
      const achievement = achievements[factionId][achievementName];
      return achievement ? { name: achievement.name } : undefined;
    }
    case 'cards': {
      const e = cards[entityId];
      return e ? { name: e.id } : undefined;
    }
    case 'characters': {
      const e = characters[entityId];
      return e ? { name: e.id } : undefined;
    }
    case 'special-skills': {
      const dotIndex = entityId.indexOf('.');
      if (dotIndex === -1) return undefined;
      const factionId = entityId.slice(0, dotIndex);
      const skillId = entityId.slice(dotIndex + 1);
      if (factionId === 'cat' || factionId === 'mouse') {
        const skills = specialSkills[factionId] as Record<string, { name: string }> | undefined;
        const skill = skills?.[skillId];
        return skill ? { name: skill.name } : undefined;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

export function getDiscussionNotificationTarget(
  scope: string,
  targetId: string
): {
  entityTitle: string;
  entityTypeLabel: string;
  href: string;
} {
  if (scope === 'list_pages') {
    const entityTypeLabel = ENTITY_LABELS[targetId] ?? targetId;
    return {
      entityTitle: entityTypeLabel,
      entityTypeLabel,
      href: `/discuss/${encodeURIComponent(targetId)}/`,
    };
  }

  const routeSegment = scopeToRouteSegment(scope);
  const entity = getEntityByTypeAndId(routeSegment, targetId);
  const entityTypeLabel = ENTITY_LABELS[routeSegment] ?? routeSegment;

  return {
    entityTitle: entity?.name ?? targetId,
    entityTypeLabel,
    href: `/discuss/${encodeURIComponent(routeSegment)}/${encodeURIComponent(targetId)}/`,
  };
}

export const getDiscussionCommentHref = (scope: string, targetId: string, commentId: string) =>
  `${getDiscussionNotificationTarget(scope, targetId).href}#comment-${commentId}`;
