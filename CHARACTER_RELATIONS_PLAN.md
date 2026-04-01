# Character Relations Refactor Plan

## Summary

This document records the current assessment and the recommended phased plan for character relation editing.

The main conclusion is:

- The long-term architecture should remain edge-centric for shared character-character relations.
- The immediate priority is not a new `characterRelations` entity type.
- Phase 0 must be split into separate safety slices for tests, path semantics, and index refresh policy.
- The default plan should be the lighter path.
- A full `characterRelations` platform migration should happen only after an explicit decision gate.
- The legacy `sync-pr` maintenance path is de-scoped from this plan; future source patching should be handled directly by coding agents following [.github/skills/game-action-patching/SKILL.md](/d:/P/Tom-and-jerry-chase-wiki/.github/skills/game-action-patching/SKILL.md).

## Current State

### Runtime read model

The project does not currently use a pure graph-only runtime read model.

Instead, runtime relation reads are hybrid:

- shared relation graph projection from:
  - [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts)
  - [src/data/traits.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/traits.ts)
  - [src/features/shared/traits/relationIndex.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/shared/traits/relationIndex.ts)
  - [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts)
- page-local legacy overlay from the editable `characters` store in:
  - [src/data/store.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/store.ts)
  - [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts)
- synthesized inverse legacy links by scanning all characters in:
  - [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts)

So the long-term architectural direction should still be edge-centric for shared character-character relations, but any migration plan must treat current runtime behavior as hybrid rather than graph-only.

### Write model

The current edit mode does not edit the shared relation graph directly. Instead, it overlays page-local arrays under `characters[id]` and publishes path diffs against the `characters` entity:

- [src/features/characters/components/character-detail/CharacterRelationDisplay.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/components/character-detail/CharacterRelationDisplay.tsx)
- [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx)
- [src/lib/edit/diffUtils.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/edit/diffUtils.ts)
- [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts)
- [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts)

This mismatch between read model and write model is the root of the current complexity.

## Confirmed Problems

### 1. Current relation edit path semantics are inconsistent

This is real and should be fixed before any larger redesign.

What is true:

- Relation description fields pass paths that already include the current character id.
- `editable('characters')` assumes `path` is relative to the current character.
- Relation items are arrays, but some editable paths are constructed as if relation items were keyed by `itemId`.

Important nuance:

- The description fields currently use `onSave`, so they do not necessarily corrupt state through the default editable writer on blur.
- However, the path contract is still wrong and misleading, and it makes current behavior harder to trust and future changes easy to break.

Implication:

- Fix this first.
- Do not start architecture migration work before path semantics are coherent and test-covered.

### 1a. Current runtime behavior is hybrid, not graph-only

This is also real and changes how migration should be framed.

Implication:

- The plan must not describe current runtime behavior as if it were already “canonical shared graph only”.
- Any adapter or migration must preserve:
  - graph-derived relations
  - page-local legacy overlays
  - synthesized inverse legacy links
- Phase 0 and Phase 1 must use characterization tests to lock current user-visible behavior before changing architecture.

### 2. Adding `entityType: characterRelations` is a platform migration

This is also real.

It is not only a relation-module refactor. It would require coordinated changes across at least these subsystems:

- publishable entity registries and stores
- draft counting and per-page draft summaries
- server public replay
- client public replay
- wiki history type mapping
- likely moderation and tooling assumptions around path shape

Implication:

- This should be treated as a strategic investment.
- It should not be the default plan for a minor cleanup.

### 3. Relation index rebuild cost is immediate, not optional

This is real and should be moved earlier in the plan.

Why it matters:

- [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts) unconditionally calls `refreshRelationIndex()` in `getCharacterRelation()`.
- Some screens call `getCharacterRelation()` in loops, such as [RecommendedPageClient.tsx](</d:/P/Tom-and-jerry-chase-wiki/src/app/(main)/recommended/RecommendedPageClient.tsx>).
- [src/features/shared/traits/relationIndex.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/shared/traits/relationIndex.ts) rebuilds the whole index.

Implication:

- Relation-index refresh policy should be part of the main path, not a later optional optimization.

## Goals

### Primary goals

- Make relation editing behavior reliable and understandable.
- Keep edit counting, submit payloads, and public replay correct.
- Reduce architecture confusion without breaking existing moderation and runtime replay workflows.

### Secondary goals

- Preserve the edge-centric read model for shared character-character relations.
- Improve test coverage and validation around relation projection.
- Create a clean decision point for whether a full platform migration is worth it.

## Non-Goals

- Replacing the entire game-data action system immediately.
- Rebuilding relation rendering from scratch.
- Migrating to a new entity type before the current path contract is stabilized.
- Maintaining or extending the legacy `sync-pr` route as part of this effort.

## Recommended Plan

## Phase 0A: Characterization Baseline

This phase is mandatory and must happen before any production logic changes.

### Work

- Add characterization tests for the current relation projection layer and current edit behavior.
- Document the current hybrid runtime behavior explicitly so follow-up work does not accidentally assume graph-only reads.
- Record that source-file patching is outside the runtime architecture plan and will be handled, when needed, by the coding-agent workflow in [.github/skills/game-action-patching/SKILL.md](/d:/P/Tom-and-jerry-chase-wiki/.github/skills/game-action-patching/SKILL.md).

### Rules

- No production logic changes.
- No perf-policy changes.
- Only tests and minimal test-only helpers.

### Minimum test coverage

- `getCharacterRelation()` returns expected `counters`, `counteredBy`, `counterEachOther`, and `collaborators` from the shared relation graph.
- `getCharacterRelation()` preserves current hybrid behavior, including graph projection plus legacy overlay merge and inverse legacy synthesis.
- Inverse projection from other characters still works.
- Page-local relation edits on a character page update the rendered relation view as expected.
- Draft counting in [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx) correctly counts relation edits for the current character page.
- Public replay through [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts) and [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts) still applies relation edits correctly.

### Exit criteria

- Tests capture current hybrid user-visible behavior.
- The migration baseline is trustworthy before any behavior change.
- No production code behavior changed in this slice.

## Phase 0B: Path Contract Stabilization

This phase is mandatory and must happen after Phase 0A.

### Work

- Fix the current relation editable path contract in [src/features/characters/components/character-detail/CharacterRelationDisplay.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/components/character-detail/CharacterRelationDisplay.tsx) and/or [src/components/ui/editable.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/components/ui/editable.tsx).
- Ensure relation description editing does not depend on malformed or ambiguous nested paths.
- Remove any assumption that relation arrays can be addressed by `itemId` through dot-path access unless that is actually implemented.

### Rules

- No perf-policy changes.
- No opportunistic refactors.
- No intentional behavior changes beyond removing malformed or misleading path semantics.

### Validation

- Re-run Phase 0A tests.
- Run focused manual smoke checks on relation editing and public replay behavior.

### Exit criteria

- Relation edit widgets use a coherent path contract.
- No known malformed-path behavior remains in relation editing.
- Phase 0A tests still pass.

## Phase 0C: Relation Index Refresh Policy

This phase is mandatory and must happen after Phase 0B.

### Work

- Review relation-index refresh policy and eliminate unconditional full rebuilds on hot read paths.
- Add targeted freshness tests so index reuse does not introduce stale relation output.
- Add one focused perf sanity check if practical.

### Rules

- No relation editor path changes in this slice.
- No unrelated refactors.
- Keep scope limited to index refresh / invalidation policy and its direct test coverage.

### Validation

- Re-run Phase 0A tests.
- Add targeted tests for freshness and invalidation.
- Run one focused check for repeated `getCharacterRelation()` usage on a looped screen such as [RecommendedPageClient.tsx](</d:/P/Tom-and-jerry-chase-wiki/src/app/(main)/recommended/RecommendedPageClient.tsx>).

### Exit criteria

- The current hot-path relation lookup no longer pays unnecessary full-index rebuild cost.
- Relation output stays correct under the Phase 0A baseline tests.
- Index invalidation behavior is explicit and test-covered.

## Phase 1: Lightweight Boundary Cleanup

This is the default path after Phase 0A through 0C.

### Work

- Keep `entityType: 'characters'` unchanged.
- Keep the existing shared relation graph in [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts) as the primary shared source for character-character relation semantics.
- Preserve current hybrid runtime reads during this phase unless an explicit behavior change is approved.
- Introduce a clear relation-domain adapter between:
  - shared relation graph projection
  - page-local edit overlay
  - publishable character-page diff output
- Make the page-level relation editing model explicit instead of implicit.

### Design direction

- Treat page-local relation edits as an overlay model, not as if they were the same thing as canonical relation storage.
- Avoid cross-entity writes.
- Keep current publish/dispersal behavior compatible with existing `characters` actions.
- Make action path production explicit and consistent with current runtime replay semantics.

### Suggested boundaries

- Read-side:
  - `characterRelations.ts` -> `traits.ts` -> `relationIndex.ts` -> `getCharacterRelation()`
- Edit-side:
  - page-local editable relation overlay for the current character
- Publish-side:
  - adapter converts local overlay changes into current `characters` action paths

### Exit criteria

- Relation editing no longer relies on hidden assumptions in UI components.
- Relation edit code has a dedicated boundary module instead of scattered logic.
- Existing public replay continues to work without new entity-type support.
- Runtime relation output remains behaviorally compatible with the current hybrid model unless deliberately changed.

## Phase 2: Validation and Tooling Improvements

This phase is still part of the lightweight path, but it now focuses on data integrity and tooling after the earlier stabilization/performance work is done.

### Work

- Add invariant checks for duplicate `(kind, subject, target)` relation entries in [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts).
- Add explicit validation for contradictory pairs where applicable.
- Add tests around dedupe and merge behavior in [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts).

### Optional tooling

- A local script or test helper that reports duplicate or contradictory relation edges.
- A relation snapshot test for a small set of representative characters.

### Exit criteria

- Shared relation data has basic integrity checks.
- Projection behavior is test-covered and deterministic.
- Editing and read-side projection can be changed independently with confidence.

## Decision Gate

After Phases 0 through 2, decide whether to stop or escalate.

### Stop at the lightweight path if

- relation editing is useful but not a strategic workflow
- current publish/dispersal behavior is acceptable
- the main goal was reliability and maintainability rather than platform redesign

### Escalate to full migration only if

- relation editing is a strategic content workflow
- relation history/moderation should be first-class
- patching back to [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts) is a long-term requirement
- the team accepts platform-level changes across edit mode, replay, and history tooling

## Phase 3: Full `characterRelations` Entity Migration

This phase is optional and should happen only after the decision gate.

### Target outcome

Introduce `entityType: 'characterRelations'` as a first-class editable and publishable entity.

### Required system changes

- Add `characterRelations` to publishable entity definitions and stores in [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx).
- Add server public replay support in [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts).
- Add client public replay support in [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts).
- Add wiki history mapping in [src/lib/wikiHistoryFromActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/wikiHistoryFromActions.ts).
- Redesign draft counting so it no longer assumes the first path segment is the current page entity id.

### Data model direction

- Use relation edges as the editable unit for shared character-character relations.
- Keep a single stored record for one shared relation fact.
- Preserve page projections for rendering.

### Open design decisions for this phase

- Whether edge descriptions are shared or side-specific.
- Whether non-character relations also move into `characterRelations`, or only character-character relations do.
- Whether current page-level UX should edit relation records directly or through a page adapter.

### Exit criteria

- Relation edits publish as `characterRelations` actions.
- Per-page relation views are still correct.
- Wiki history and moderation flows remain coherent.
- If source-file patching is still desired, the workflow is handled outside this plan through the coding-agent process described in [.github/skills/game-action-patching/SKILL.md](/d:/P/Tom-and-jerry-chase-wiki/.github/skills/game-action-patching/SKILL.md).

## Suggested Implementation Order

1. Phase 0A characterization baseline
2. Phase 0B path contract stabilization
3. Phase 0C relation index refresh policy
4. Phase 1 lightweight boundary cleanup
5. Phase 2 validation/tooling improvements
6. Decision gate
7. Phase 3 only if explicitly approved

## Acceptance Criteria

The lightweight plan is successful if:

- relation edit widgets have coherent path semantics
- relation projection is covered by tests
- current public replay remains functional
- developers can reason about read-side vs edit-side relation behavior without tracing multiple hidden assumptions

The full migration is successful if:

- `characterRelations` becomes a first-class editable entity
- relation actions replay correctly at runtime
- per-page projection and moderation behavior remain correct

## Recommendation

Proceed with Phases 0 through 2 as the default plan.

Do not start Phase 3 unless relation editing is explicitly treated as a strategic platform concern rather than a localized cleanup.
