# Game-data workflow

**Date:** 2026-09-30
**Status:** Observe the current workflow before undertaking an overhaul; allow bounded editor safety fixes.
**Purpose:** Preserve the reasoning for a future agent. This is a direction, not a fixed implementation specification or an instruction to start migrating now.

## Intent

The action workflow has become too large while still allowing stray submissions and requiring difficult cleanup. The goal is to make editing and publishing dependable and easier to maintain, with fewer opportunities for accidental changes and less recurring operator work.

The user has explicitly established that:

- Approved edits must become public independently of code deployment.
- Preventing future stray submissions matters more than further discussion of the completed compaction work.
- The four confirmed validation gaps should be closed first; that implementation work was completed in this chat.
- Making the database authoritative is an acceptable direction, but is open to reconsideration.
- We should now observe for longer and leave the larger change for a later agent.

Keeping the existing editor initially is a recommendation, not a confirmed requirement. No observation deadline, automatic monitoring schedule, or threshold for starting the overhaul has been agreed.

The follow-up review of PR #261 authorized a minimal, low-risk extraction. A shared canonical relation record remains a useful direction, but introducing a new published domain now would also require changes to permissions, draft scoping, validation, and historical replay. That migration remains deferred; it is not a prerequisite for the bounded editor fix below.

## Where things stand

Public game data currently combines a checked-in baseline with public database action rows. The database is therefore not yet the sole authority for current content. Publishing, historical replay, deployment, and eventual compaction all participate in the content lifecycle.

The recent fixes add server-side protection against:

1. Unsupported character fields and structures, including an unrendered `relations` wrapper.
2. Contradictory explicit relations that the display layer would otherwise silently resolve.
3. New root characters submitted through actions, which the current navigation model cannot safely support.
4. Submissions without retry protection. A UUID v4 operation key is now required, and submissions use the atomic request RPC.

Rows with no net change are also rejected. Unchanged array context is still allowed inside a row containing a real edit. Definitively rejected drafts remain editable, while uncertain network outcomes retain the operation identity needed for a safe retry.

The relation editor now builds saved collections from explicit relations rather than the rendered projection, which also includes tag-derived suggestions. Saving unchanged relation fields does not create an overlay; deliberately editing a suggestion makes only that selected relation explicit. Other suggestions remain visible without being saved as incidental edits. Existing character-owned action paths, inverse writes in the matrix, permissions, and publication remain in place. This is an editor safety fix, not completion of #261's single-record relation model; existing drafts and published actions are not rewritten or cleaned up automatically.

The implementation session reported 2,024 passing tests, plus lint, type, formatting, and actor-profile checks. Those are historical validation results, not a claim about a later checkout or production deployment. The guards are present in the checkout inspected for this note; production deployment and current action backlog were not checked for this handoff. The earlier compaction's completion does not establish that the live backlog remains empty.

## What to learn while observing

Use actual submissions, support reports, and existing diagnostics to judge whether the fixes are sufficient. Useful observations include whether stray or duplicate rows recur, whether valid edits are now rejected, whether authors can recover rejected drafts, and how much manual compaction or conflict repair remains necessary.

Keep examples of what the author intended, what was submitted, and what became public. A blocked invalid request and an unintended published change are different outcomes. Absence of incidents during a quiet period provides limited evidence.

Do not build another monitoring subsystem merely to justify this proposal. Keeping the hardened current workflow longer is a valid choice if it proves reliable and inexpensive to operate.

## Proposed destination

Store the current published content and its revision in the database. Publishing changes that current state once. Public reads use that stored state, with appropriate caching. Action history records what happened for review, attribution, and undo; normal page reads no longer need to execute that history.

Conceptually:

> Edit published data → submit intended changes → validate and review → atomically update published data and history → refresh public caches.

This should make routine baseline compaction unnecessary for the migrated content. It should also reduce the number of lifecycle stages that an author or maintainer must understand. A new storage layer that permanently keeps the old replay and compaction machinery in the normal path would miss that goal.

Database authority here concerns editable published content. It does not imply moving application configuration, assets, or every static definition into the database.

## Principles to preserve

- **Publish intent, not incidental edit-session activity.** The submitted unit should contain the deliberate, reviewable changes. Initializing an editor, restoring drafts, or normalizing display data must not accidentally create contributions.
- **Protect unrelated work.** The user's earlier preference to apply only the diff when resolving conflicts reflects this intent. Two edits to different fields should coexist. An old whole-record snapshot must not overwrite another author's work; incompatible edits to the same field must not be silently guessed away. This does not require an elaborate automatic merge engine.
- **Validate meaning before publication.** A payload being replayable does not make it valid game data. Relations are a particular concern: shared links, inverse links, local overrides, and derived suggestions must not leave contradictory explicit facts for rendering to hide.
- **Make each accepted change complete and retryable.** Content, its revision, and the corresponding history should agree. Retrying after an uncertain response should recover the original result. Coupled edits must not become public only in part.
- **Preserve the product's existing promises.** Keep permissions, moderation behavior, supported anonymous contributions, draft recovery, and deployment-independent publishing. Changing review policy is a separate decision from changing storage.
- **Make undo deliberate.** Prefer an explicit reversal that preserves unrelated later edits. Removing an old event from a replay chain or restoring an entire old snapshot should not be the default meaning of undo.
- **Remove complexity as the replacement takes over.** The intended benefit includes deleting obsolete replay, synchronization, and compaction responsibilities, not merely adding a cleaner interface over them.

## How a later agent should approach it

First re-establish the actual state of the repository, deployments, and recent submissions. Read the observation evidence before assuming a rewrite is still necessary. The previous validation work is a starting point, not evidence that every action-workflow problem has been solved.

If the overhaul remains worthwhile, a small complete character-edit flow is a reasonable first proof: load, edit, submit, review, publish, retry, conflict, and undo. Reuse the existing edit-session and public-read boundaries where practical. Avoid redesigning the entire UI at the same time without a concrete need.

Any initial import must preserve the currently published result, including public actions that have not been compacted. A transition may temporarily compare old and new reads, but each migrated piece of content needs one clear publication authority. Decide how deployments interact with that authority before switching writes. Preserve historical attribution and pending work, and follow the repository's deployment and migration procedures.

No table layout, API inventory, migration sequence, or implementation timetable is prescribed here. Choose the smallest design that satisfies the intent after inspecting the code and evidence then available.

## Decisions still open

- May code deployments intentionally replace published content, or should content changes always go through publication while deployments change structure and behavior?
- What is the unit of review and undo: a submission, an entity, or a coherent group of related changes? Atomic persistence alone does not settle this product decision.
- Which observation would justify the overhaul: recurring incorrect submissions, excessive manual cleanup, or maintenance complexity despite otherwise correct behavior?
- How should database outages and schema changes affect public reads? An old checked-in baseline must not silently become a competing current authority.

These questions should guide the next conversation; they are not blockers to observing the current system.

## Starting points in the repository

- `src/lib/gameData/submission.ts` and `trustedGameDataMutations.ts`: submission, approval, persistence, and retry handling.
- `src/lib/gameData/actionFreshness.ts`, `characterDataValidation.ts`, and `submissionValidation.test.ts`: existing guards and concrete regression examples.
- `src/lib/gameData/published/`: current baseline-plus-action public reads.
- `src/lib/edit/editSession.ts`: the existing editor and draft-lifecycle boundary.
- `src/features/characters/utils/relationReadModel.ts`: relation composition and display normalization.
- [Edit-session refactor](archive/completed/2026-08-24-edit-session-deep-module-refactor-plan.md), [compaction operations](operations/game-data-action-compaction.md), and [pending-action recovery](operations/pending-game-data-recovery.md): relevant history and current procedures, not a requirement to preserve every mechanism in a replacement.

The handoff succeeds if the next agent understands why simplification matters and which user promises must survive. It does not need to inherit a predetermined implementation.
