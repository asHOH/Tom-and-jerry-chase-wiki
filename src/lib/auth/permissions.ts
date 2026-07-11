import {
  AbilityBuilder,
  createMongoAbility,
  ForcedSubject,
  type MongoAbility,
} from '@casl/ability';

import type { Database } from '@/data/database.types';

export type Role = Database['public']['Enums']['role_type'];

// ---------------------------------------------------------------------------
// Actions (verbs)
// ---------------------------------------------------------------------------

export const enum Actions {
  // Standard CRUD
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Wildcard for any action

  // Article version moderation
  APPROVE = 'approve',
  REJECT = 'reject',
  REVOKE = 'revoke',

  // Comment moderation
  MODERATE = 'moderate',

  // Game data action lifecycle
  MARK_SYNCED = 'mark_synced',

  // Relation publishing
  PUBLISH_RELATIONS = 'publish_relations',
}

export type Action = Actions;

// ---------------------------------------------------------------------------
// Subjects (resource types — only real domain objects, no meta subjects)
// ---------------------------------------------------------------------------

export const enum Subjects {
  ARTICLE = 'Article',
  ARTICLE_VERSION = 'ArticleVersion',
  ALL = 'all', // Wildcard for all subjects
  COMMENT = 'Comment',
  GAME_DATA_ACTION = 'GameDataAction',
  CATEGORY = 'Category',
  USER = 'User',
  RELATION = 'Relation',
}

export type Subject = Subjects | ForcedSubject<Subjects>;

// ---------------------------------------------------------------------------
// App ability type
// ---------------------------------------------------------------------------

export type AppAbility = MongoAbility<[Actions, Subject]>;

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

  void userId;

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
  can(Actions.UPDATE, Subjects.RELATION);
  // NOTE: Ownership-based requirements are handled by supabase policies, so we grant unconditional update here.
  can(Actions.UPDATE, Subjects.ARTICLE);

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
    can(Actions.UPDATE, Subjects.USER);
    can(Actions.READ, Subjects.USER);
  }

  return build();
}
