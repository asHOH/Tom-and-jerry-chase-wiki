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

  // Article editing (ownership-aware)
  EDIT_OWN: 'edit_own',
  EDIT_ANY: 'edit_any',

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

export type AppAbility = MongoAbility<[Action, Subject]>;

// ---------------------------------------------------------------------------
// Permission definitions per role
// ---------------------------------------------------------------------------

type Permission = [Action, Subject];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Contributor: [
    // Articles
    [Actions.READ, Subjects.ARTICLE],
    [Actions.CREATE, Subjects.ARTICLE],
    [Actions.EDIT_OWN, Subjects.ARTICLE],
    // Article versions (own pending only — RLS enforces the filter)
    [Actions.READ, Subjects.ARTICLE_VERSION],
    // Comments
    [Actions.READ, Subjects.COMMENT],
    [Actions.CREATE, Subjects.COMMENT],
    // Game data actions
    [Actions.CREATE, Subjects.GAME_DATA_ACTION],
    [Actions.PUBLISH_RELATIONS, Subjects.GAME_DATA_ACTION],
    // Categories (read-only)
    [Actions.READ, Subjects.CATEGORY],
    // Relations
    [Actions.READ, Subjects.RELATION],
    [Actions.EDIT_OWN, Subjects.RELATION],
  ],

  Reviewer: [
    // Articles
    [Actions.EDIT_ANY, Subjects.ARTICLE],
    // Article version moderation
    [Actions.APPROVE, Subjects.ARTICLE_VERSION],
    [Actions.REJECT, Subjects.ARTICLE_VERSION],
    [Actions.REVOKE, Subjects.ARTICLE_VERSION],
    // Comment moderation
    [Actions.MODERATE, Subjects.COMMENT],
    // Game data action moderation
    [Actions.APPROVE, Subjects.GAME_DATA_ACTION],
    [Actions.REJECT, Subjects.GAME_DATA_ACTION],
    // Category management
    [Actions.CREATE, Subjects.CATEGORY],
    [Actions.UPDATE, Subjects.CATEGORY],
    [Actions.DELETE, Subjects.CATEGORY],
  ],

  Coordinator: [
    // Game data action finalization
    [Actions.MARK_SYNCED, Subjects.GAME_DATA_ACTION],
    // User management
    [Actions.UPDATE_ROLE, Subjects.USER],
    [Actions.UPDATE_USER, Subjects.USER],
    [Actions.VIEW_USERS, Subjects.USER],
  ],
};

// ---------------------------------------------------------------------------
// Unauthenticated (public) permissions
// ---------------------------------------------------------------------------

const PUBLIC_PERMISSIONS: Permission[] = [
  [Actions.READ, Subjects.ARTICLE],
  [Actions.READ, Subjects.ARTICLE_VERSION],
  [Actions.READ, Subjects.COMMENT],
  [Actions.READ, Subjects.CATEGORY],
  [Actions.READ, Subjects.RELATION],
];

// ---------------------------------------------------------------------------
// abilityFor — build an AppAbility from a role
// ---------------------------------------------------------------------------

/** Role hierarchy order (lowest → highest). */
const ROLE_HIERARCHY: Role[] = ['Contributor', 'Reviewer', 'Coordinator'];

/**
 * Build a CASL ability for the given role.
 *
 * - `null`              → unauthenticated (public read-only)
 * - `'Contributor'`     → base write permissions
 * - `'Reviewer'`        → Contributor + moderation + category CRUD
 * - `'Coordinator'`     → Reviewer + user management + mark_synced
 */
export function abilityFor(role: Role | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // Unauthenticated — public read-only
  if (!role) {
    for (const [action, subject] of PUBLIC_PERMISSIONS) {
      can(action, subject);
    }
    return build();
  }

  // Apply hierarchy: for the given role, include permissions from that role
  // and all roles below it.
  const maxIndex = ROLE_HIERARCHY.indexOf(role);

  for (let i = 0; i <= maxIndex; i++) {
    const r = ROLE_HIERARCHY[i]!;
    for (const [action, subject] of ROLE_PERMISSIONS[r]) {
      can(action, subject);
    }
  }

  return build();
}
