import { subject } from '@casl/ability';

import { abilityFor, Actions, Subjects, type Action, type Subject } from '@/lib/auth/permissions';

describe('abilityFor', () => {
  // -----------------------------------------------------------------------
  // Unauthenticated
  // -----------------------------------------------------------------------
  describe('null (unauthenticated)', () => {
    const ability = abilityFor(null);

    it('should allow read on all public resources', () => {
      expect(ability.can(Actions.READ, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.ARTICLE_VERSION)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.COMMENT)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.CATEGORY)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.RELATION)).toBe(true);
    });

    it('should not allow any write or moderation actions', () => {
      expect(ability.can(Actions.CREATE, Subjects.ARTICLE)).toBe(false);
      expect(ability.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(false);
      expect(ability.can(Actions.CREATE, Subjects.COMMENT)).toBe(false);
      expect(ability.can(Actions.MODERATE, Subjects.COMMENT)).toBe(false);
      expect(ability.can(Actions.APPROVE, Subjects.ARTICLE_VERSION)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Contributor
  // -----------------------------------------------------------------------
  describe('Contributor', () => {
    const ability = abilityFor('Contributor');

    it('should allow read on public resources', () => {
      expect(ability.can(Actions.READ, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.COMMENT)).toBe(true);
      expect(ability.can(Actions.READ, Subjects.CATEGORY)).toBe(true);
    });

    it('should allow create and update on articles (subject type check)', () => {
      expect(ability.can(Actions.CREATE, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(true);
    });

    it('should allow create comments', () => {
      expect(ability.can(Actions.CREATE, Subjects.COMMENT)).toBe(true);
    });

    it('should allow create game data actions and publish relations', () => {
      expect(ability.can(Actions.CREATE, Subjects.GAME_DATA_ACTION)).toBe(true);
      expect(ability.can(Actions.PUBLISH_RELATIONS, Subjects.GAME_DATA_ACTION)).toBe(true);
    });

    it('should allow update on relations (subject type check)', () => {
      expect(ability.can(Actions.UPDATE, Subjects.RELATION)).toBe(true);
    });

    it('should NOT allow moderation or admin actions', () => {
      expect(ability.can(Actions.APPROVE, Subjects.ARTICLE_VERSION)).toBe(false);
      expect(ability.can(Actions.REJECT, Subjects.ARTICLE_VERSION)).toBe(false);
      expect(ability.can(Actions.MODERATE, Subjects.COMMENT)).toBe(false);
      expect(ability.can(Actions.MARK_SYNCED, Subjects.GAME_DATA_ACTION)).toBe(false);
      expect(ability.can(Actions.CREATE, Subjects.CATEGORY)).toBe(false);
      expect(ability.can(Actions.UPDATE, Subjects.CATEGORY)).toBe(false);
      expect(ability.can(Actions.DELETE, Subjects.CATEGORY)).toBe(false);
      expect(ability.can(Actions.UPDATE_ROLE, Subjects.USER)).toBe(false);
      expect(ability.can(Actions.UPDATE_USER, Subjects.USER)).toBe(false);
      expect(ability.can(Actions.VIEW_USERS, Subjects.USER)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Contributor with userId — instance-level ownership checks
  // -----------------------------------------------------------------------
  describe('Contributor with userId (conditions)', () => {
    const userId = 'user-1';
    const ability = abilityFor('Contributor', userId);

    it('should allow update on own article (instance check)', () => {
      expect(ability.can('update', subject('Article', { author_id: userId }))).toBe(true);
    });

    it('should deny update on another author article (instance check)', () => {
      expect(ability.can('update', subject('Article', { author_id: 'other' }))).toBe(false);
    });

    it('should allow update on own relation (instance check)', () => {
      expect(ability.can('update', subject('Relation', { editor_id: userId }))).toBe(true);
    });

    it('should deny update on another editor relation (instance check)', () => {
      expect(ability.can('update', subject('Relation', { editor_id: 'other' }))).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Reviewer
  // -----------------------------------------------------------------------
  describe('Reviewer', () => {
    const ability = abilityFor('Reviewer');

    it('should inherit all Contributor permissions', () => {
      expect(ability.can(Actions.CREATE, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.CREATE, Subjects.COMMENT)).toBe(true);
    });

    it('should allow update on any article regardless of ownership', () => {
      // Reviewer has unconditional update — overrides Contributor conditions
      expect(ability.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(true);
    });

    it('should allow article version moderation', () => {
      expect(ability.can(Actions.APPROVE, Subjects.ARTICLE_VERSION)).toBe(true);
      expect(ability.can(Actions.REJECT, Subjects.ARTICLE_VERSION)).toBe(true);
      expect(ability.can(Actions.REVOKE, Subjects.ARTICLE_VERSION)).toBe(true);
    });

    it('should allow comment moderation', () => {
      expect(ability.can(Actions.MODERATE, Subjects.COMMENT)).toBe(true);
    });

    it('should allow game data action moderation', () => {
      expect(ability.can(Actions.APPROVE, Subjects.GAME_DATA_ACTION)).toBe(true);
      expect(ability.can(Actions.REJECT, Subjects.GAME_DATA_ACTION)).toBe(true);
    });

    it('should allow category CRUD', () => {
      expect(ability.can(Actions.CREATE, Subjects.CATEGORY)).toBe(true);
      expect(ability.can(Actions.UPDATE, Subjects.CATEGORY)).toBe(true);
      expect(ability.can(Actions.DELETE, Subjects.CATEGORY)).toBe(true);
    });

    it('should NOT allow Coordinator-only actions', () => {
      expect(ability.can(Actions.MARK_SYNCED, Subjects.GAME_DATA_ACTION)).toBe(false);
      expect(ability.can(Actions.UPDATE_ROLE, Subjects.USER)).toBe(false);
      expect(ability.can(Actions.UPDATE_USER, Subjects.USER)).toBe(false);
      expect(ability.can(Actions.VIEW_USERS, Subjects.USER)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Reviewer with userId — instance checks override conditions
  // -----------------------------------------------------------------------
  describe('Reviewer with userId (conditions overridden)', () => {
    const ability = abilityFor('Reviewer', 'user-1');

    it('should allow update on any article regardless of author_id', () => {
      expect(ability.can('update', subject('Article', { author_id: 'user-1' }))).toBe(true);
      expect(ability.can('update', subject('Article', { author_id: 'other' }))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Coordinator
  // -----------------------------------------------------------------------
  describe('Coordinator', () => {
    const ability = abilityFor('Coordinator');

    it('should inherit all Reviewer permissions', () => {
      expect(ability.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(true);
      expect(ability.can(Actions.APPROVE, Subjects.ARTICLE_VERSION)).toBe(true);
      expect(ability.can(Actions.MODERATE, Subjects.COMMENT)).toBe(true);
    });

    it('should allow mark_synced on game data actions', () => {
      expect(ability.can(Actions.MARK_SYNCED, Subjects.GAME_DATA_ACTION)).toBe(true);
    });

    it('should allow user management', () => {
      expect(ability.can(Actions.UPDATE_ROLE, Subjects.USER)).toBe(true);
      expect(ability.can(Actions.UPDATE_USER, Subjects.USER)).toBe(true);
      expect(ability.can(Actions.VIEW_USERS, Subjects.USER)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Inverted checks (cannot)
  // -----------------------------------------------------------------------
  describe('cannot (negative assertions)', () => {
    it('should match the inverse of can', () => {
      const ability = abilityFor('Contributor');
      expect(ability.cannot(Actions.APPROVE, Subjects.ARTICLE_VERSION)).toBe(true);
      expect(ability.cannot(Actions.CREATE, Subjects.ARTICLE)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Hierarchy — Coordinator inherits Reviewer inherits Contributor
  // -----------------------------------------------------------------------
  describe('hierarchy', () => {
    it('Coordinator should have all Contributor permissions', () => {
      const coordinator = abilityFor('Coordinator');
      const contributor = abilityFor('Contributor');

      expect(coordinator.can(Actions.CREATE, Subjects.ARTICLE)).toBe(true);
      expect(coordinator.can(Actions.UPDATE, Subjects.ARTICLE)).toBe(true);
      expect(coordinator.can(Actions.CREATE, Subjects.COMMENT)).toBe(true);
      expect(coordinator.can(Actions.PUBLISH_RELATIONS, Subjects.GAME_DATA_ACTION)).toBe(true);

      for (const rule of contributor.rules) {
        expect(coordinator.can(rule.action as Action, rule.subject as Subject)).toBe(true);
      }
    });

    it('Reviewer should have all Contributor permissions', () => {
      const reviewer = abilityFor('Reviewer');
      const contributor = abilityFor('Contributor');

      for (const rule of contributor.rules) {
        expect(reviewer.can(rule.action as Action, rule.subject as Subject)).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('should not throw for any valid role value', () => {
      expect(() => abilityFor('Contributor')).not.toThrow();
      expect(() => abilityFor('Reviewer')).not.toThrow();
      expect(() => abilityFor('Coordinator')).not.toThrow();
      expect(() => abilityFor(null)).not.toThrow();
    });

    it('should not throw when userId is provided with any role', () => {
      expect(() => abilityFor('Contributor', 'user-1')).not.toThrow();
      expect(() => abilityFor('Reviewer', 'user-1')).not.toThrow();
      expect(() => abilityFor('Coordinator', 'user-1')).not.toThrow();
      expect(() => abilityFor(null, 'user-1')).not.toThrow();
    });
  });
});
