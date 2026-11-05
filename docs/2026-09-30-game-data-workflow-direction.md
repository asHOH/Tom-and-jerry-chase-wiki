# Game-data workflow

**Created:** 2026-09-30 · **Last reviewed:** 2026-11-06
**Status:** Retain the current workflow; larger changes remain deferred.

## Decision and goal

The goal is dependable editing and publishing with less recurring maintenance work. Approved edits must become public independently of code deployment.

Earlier stray submissions and difficult cleanup prompted a proposal to make the database authoritative for published content. Validation and retry safeguards have since improved the existing workflow. On 2026-11-06, the user clarified that moderation conflicts are rare, including stale pending edits and approvals that block other submissions. Their frequency offers little benefit for the cost and risk of a redesign.

Keep the current architecture and recovery procedures. Defer the workflow overhaul, legacy relation migration, and additional moderation recovery tooling. The immediate priority is documentation cleanup. There is no implementation timetable or dedicated monitoring or investigation project.

## Current position and evidence

Public game data combines a checked-in baseline with public database actions. Publishing, replay, deployment, and eventual compaction all participate in the content lifecycle. Server validation protects against unsupported structures, contradictory relations, new character roots, and ineffective submissions. Atomic requests and stable operation keys protect retries; rejected drafts remain available for correction.

Character-pair editing already shares one record between both characters, including description, tags, and strength. Deleting a pair suppresses it from both views and from inferred suggestions. Legacy data remains readable, and draft/history adapters preserve older work. This arrangement is independent of any decision to move published content into the database.

A 2026-11-04 dry run converted 490 unique baseline pairs to shared overrides and replayed approved edits. It changed inferred tags and display order, blocked a valid legacy draft, and made an unsent shared-pair draft stale. History and exact retry requests survived with the existing adapters retained; the retry receipt was simulated. Full legacy removal would therefore add transition logic while retaining compatibility responsibilities. Keep the current representation. The relation-report command was repaired and regression-tested.

## Deferred architectural direction

If maintenance becomes burdensome, consider storing current published content and its revision in the database. Approval would apply a reviewed change once to current content. Public pages would read that state through caches; history would serve review, attribution, and undo.

> Edit published data → submit intended changes → validate and review → atomically update content and history → refresh public caches.

The benefit would come from retiring routine replay and baseline compaction for migrated content. Scope database authority to editable published content; application configuration, assets, and other static definitions can retain their existing storage.

This direction could remove conflicts caused by inserting approvals into historical replay order. Overlapping edits would still need an explicit resolution policy. Changing storage alone cannot settle which changes belong together for review or how moderators should resolve competing edits.

## When and how to reconsider

Revisit the proposal if routine submissions or support reports show recurring incorrect publications, valid edits blocked by replay history, or repeated manual repair. Keep concrete examples of the author's intent, submitted changes, and published result. Assess whether a bounded fix would remove the burden before expanding the scope.

If an overhaul becomes worthwhile, first re-establish the repository, deployment, and live-data state. Prove one complete character-edit flow covering submission, review, publication, conflict resolution, retry, and undo. Reuse the existing editing and public-read boundaries. Choose the UI, schema, and migration sequence around that proof.

Preserve these contracts:

- **Published content and pending work:** import the full published result, including uncompacted approved edits; retain drafts, submissions, history, and attribution.
- **Editing intent:** publish deliberate changes, preserve unrelated edits, and require explicit resolution for overlapping changes.
- **Atomic publication and retries:** keep dependent changes together and ensure content, revision, and history agree. An uncertain retry must recover the original result.
- **Access and contribution rules:** retain validation, permissions, moderation, supported anonymous contributions, and deployment-independent publishing.
- **Undo:** use a deliberate reversal that preserves unrelated later work.
- **One publication authority:** define deployment and outage behavior, then remove obsolete replay and synchronization responsibilities as each part migrates.

Before implementation, settle the unit of review and undo, moderator resolution powers, treatment of conflicting legacy copies, and whether deployments may intentionally replace published content. These decisions remain open until a redesign has a demonstrated maintenance benefit.

## References

- [Project contracts](../AGENTS.md), [submission and approval](../src/lib/gameData/trustedGameDataMutations.ts), and [published reads](../src/lib/gameData/published/): current boundaries and safeguards.
- [Relation read model](../src/features/characters/utils/relationReadModel.ts) and [shared-pair attribution migration](../supabase/migrations/20261025000000_credit_both_character_relation_endpoints.sql): current pair behavior and its database prerequisite.
- [Compaction operations](operations/game-data-action-compaction.md) and [pending-action recovery](operations/pending-game-data-recovery.md): current maintenance procedures.
- [Completed edit-session refactor](archive/completed/2026-08-24-edit-session-deep-module-refactor-plan.md): implementation background.
