import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

import type { Database } from '@/data/database.types';

export type Role = Database['public']['Enums']['role_type'];

// ---------------------------------------------------------------------------
// Actions (verbs)
// ---------------------------------------------------------------------------

export const Actions = {
  // Standard CRUD
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',

  // Article version moderation
  APPROVE: 'approve',
  REJECT: 'reject',
  REVOKE: 'revoke',

  // Comment moderation
  MODERATE: 'moderate',

  // Game data action lifecycle
  MARK_SYNCED: 'mark_synced',

  // Relation publishing
  PUBLISH_RELATIONS: 'publish_relations',

  // User management
  UPDATE_ROLE: 'update_role',
  UPDATE_USER: 'update_user',
  VIEW_USERS: 'view_users',
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

// ---------------------------------------------------------------------------
// Subjects (resource types — only real domain objects, no meta subjects)
// ---------------------------------------------------------------------------

export const Subjects = {
  ARTICLE: 'Article',
  ARTICLE_VERSION: 'ArticleVersion',
  COMMENT: 'Comment',
  GAME_DATA_ACTION: 'GameDataAction',
  CATEGORY: 'Category',
  USER: 'User',
  RELATION: 'Relation',
} as const;

export type Subject = (typeof Subjects)[keyof typeof Subjects];

// ---------------------------------------------------------------------------
// App ability type
// ---------------------------------------------------------------------------

export type AppAbility = MongoAbility;

// ---------------------------------------------------------------------------
// abilityFor — build an AppAbility from a role + optional userId
// ---------------------------------------------------------------------------

/**
 * Build a CASL ability for the given role.
 *
 * When `userId` is supplied, ownership-based rules use CASL conditions
 * (e.g. `{ author_id: userId }`) so that instance-level checks like
 * `ability.can('update', subject('Article', article))` automatically
 * verify ownership.
 *
 * Without `userId`, the same actions are granted unconditionally —
 * suitable for client-side subject-type checks (e.g. "can I edit SOME article?").
 *
 * Role hierarchy (lowest → highest):
 * - `null`              → unauthenticated (public read-only)
 * - `'Contributor'`     → create articles/comments/actions; update own
 * - `'Reviewer'`        → Contributor + moderation + category CRUD + update any
 * - `'Coordinator'`     → Reviewer + user management + mark_synced
 */
export function abilityFor(role: Role | null, userId?: string): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // ---- Public (unauthenticated) ----
  can(Actions.READ, Subjects.ARTICLE);
  can(Actions.READ, Subjects.ARTICLE_VERSION);
  can(Actions.READ, Subjects.COMMENT);
  can(Actions.READ, Subjects.CATEGORY);
  can(Actions.READ, Subjects.RELATION);

  if (!role) return build();

  // ---- Contributor ----
  can(Actions.CREATE, Subjects.ARTICLE);
  can(Actions.CREATE, Subjects.COMMENT);
  can(Actions.CREATE, Subjects.GAME_DATA_ACTION);
  can(Actions.PUBLISH_RELATIONS, Subjects.GAME_DATA_ACTION);

  // Ownership-based update: conditions when userId is available,
  // unconditional grant otherwise (subject-type check on the client).
  if (userId) {
    can(Actions.UPDATE, Subjects.ARTICLE, undefined, { author_id: userId });
    can(Actions.UPDATE, Subjects.RELATION, undefined, { editor_id: userId });
  } else {
    can(Actions.UPDATE, Subjects.ARTICLE);
    can(Actions.UPDATE, Subjects.RELATION);
  }

  // ---- Reviewer ----
  if (role === 'Reviewer' || role === 'Coordinator') {
    // Unconditional update overrides Contributor's ownership conditions
    can(Actions.UPDATE, Subjects.ARTICLE);
    can(Actions.APPROVE, Subjects.ARTICLE_VERSION);
    can(Actions.REJECT, Subjects.ARTICLE_VERSION);
    can(Actions.REVOKE, Subjects.ARTICLE_VERSION);
    can(Actions.MODERATE, Subjects.COMMENT);
    can(Actions.APPROVE, Subjects.GAME_DATA_ACTION);
    can(Actions.REJECT, Subjects.GAME_DATA_ACTION);
    can(Actions.CREATE, Subjects.CATEGORY);
    can(Actions.UPDATE, Subjects.CATEGORY);
    can(Actions.DELETE, Subjects.CATEGORY);
  }

  // ---- Coordinator ----
  if (role === 'Coordinator') {
    can(Actions.MARK_SYNCED, Subjects.GAME_DATA_ACTION);
    can(Actions.UPDATE_ROLE, Subjects.USER);
    can(Actions.UPDATE_USER, Subjects.USER);
    can(Actions.VIEW_USERS, Subjects.USER);
  }

  return build();
}
