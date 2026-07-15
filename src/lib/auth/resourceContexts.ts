import type { PermissionKey, ResourceContext } from '@/lib/auth/permissions';
import type { Json } from '@/data/database.types';

export const SCOPABLE_RESOURCE_TYPES = [
  'articles',
  'categories',
  'characters',
  'cards',
  'knowledge_cards',
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'special_skills',
  'specialSkills',
  'list_pages',
] as const;

const GAME_DATA_RESOURCE_TYPES = new Set<string>([
  'characters',
  'cards',
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'specialSkills',
]);

const RESOURCE_TYPE_SET = new Set<string>(SCOPABLE_RESOURCE_TYPES);
const COMMENT_RESOURCE_TYPES = new Set<string>([
  'articles',
  'characters',
  'knowledge_cards',
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'special_skills',
  'list_pages',
]);

export const isScopableResourceType = (value: string): boolean => {
  if (RESOURCE_TYPE_SET.has(value)) return true;
  if (!value.startsWith('comments/')) return false;
  return COMMENT_RESOURCE_TYPES.has(value.slice('comments/'.length));
};

export const isPermissionResourceTypeAllowed = (
  permission: PermissionKey,
  resourceType: string
): boolean => {
  if (permission.startsWith('article.')) {
    return resourceType === 'articles' || resourceType === 'categories';
  }
  if (permission.startsWith('article_version.')) {
    return resourceType === 'articles' || resourceType === 'categories';
  }
  if (permission.startsWith('comment.')) {
    return (
      resourceType.startsWith('comments/') &&
      COMMENT_RESOURCE_TYPES.has(resourceType.slice('comments/'.length))
    );
  }
  if (permission.startsWith('category.')) return resourceType === 'categories';
  if (permission === 'relation.update') return resourceType === 'characters';
  if (permission.startsWith('game_data_action.')) {
    return GAME_DATA_RESOURCE_TYPES.has(resourceType);
  }
  return false;
};

const collectRoots = (entityType: string, value: Json, roots: Set<string>) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRoots(entityType, entry, roots));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const path = value.path;
  let foundRoot = false;
  if (typeof path === 'string') {
    const parts = path.split('.').filter(Boolean);
    const root = entityType === 'specialSkills' ? parts[1] : parts[0];
    if (root) {
      roots.add(root);
      foundRoot = true;
    }
  } else if (Array.isArray(path)) {
    const parts = path.filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    );
    const root = entityType === 'specialSkills' ? parts[1] : parts[0];
    if (root) {
      roots.add(root);
      foundRoot = true;
    }
  }
  if (!foundRoot) {
    const fallback = value.id ?? value.key;
    if (typeof fallback === 'string' && fallback) roots.add(fallback);
  }
};

export const getGameActionResourceContexts = (
  entityType: string,
  entries: readonly Json[]
): ResourceContext[] => {
  const roots = new Set<string>();
  entries.forEach((entry) => collectRoots(entityType, entry, roots));
  if (roots.size === 0) return [{ resourceType: entityType }];
  return [...roots].map((resourceId) => ({ resourceType: entityType, resourceId }));
};
