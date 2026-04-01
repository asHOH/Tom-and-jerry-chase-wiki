# Character Relations Refactor Plan

## Summary

This document records the current assessment and the recommended phased plan for character relation editing.

The main conclusion is:

- The long-term architecture should remain edge-centric for shared character-character relations.
- The immediate priority is not a new `characterRelations` entity type.
- Phase 0 must first stabilize the current edit path semantics and add characterization tests.
- The default plan should be the lighter path.
- A full `characterRelations` platform migration should happen only after an explicit decision gate.

## Current State

### Read model

The project already uses a shared relation graph as its canonical read-side source:

- [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts)
- [src/data/traits.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/traits.ts)
- [src/features/shared/traits/relationIndex.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/shared/traits/relationIndex.ts)
- [src/features/characters/utils/relations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/utils/relations.ts)

This is already suitable for the requirement that one character-character relation can affect two pages.

### Write model

The current edit mode does not edit the shared relation graph directly. Instead, it overlays page-local arrays under `characters[id]` and publishes path diffs against the `characters` entity:

- [src/features/characters/components/character-detail/CharacterRelationDisplay.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/components/character-detail/CharacterRelationDisplay.tsx)
- [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx)
- [src/lib/edit/diffUtils.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/edit/diffUtils.ts)
- [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts)
- [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts)
- [src/app/api/admin/sync-pr/route.ts](/d:/P/Tom-and-jerry-chase-wiki/src/app/api/admin/sync-pr/route.ts)

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

### 2. Adding `entityType: characterRelations` is a platform migration

This is also real.

It is not only a relation-module refactor. It would require coordinated changes across at least these subsystems:

- publishable entity registries and stores
- draft counting and per-page draft summaries
- server public replay
- client public replay
- admin sync target resolution and patching
- wiki history type mapping
- likely moderation and tooling assumptions around path shape

Implication:

- This should be treated as a strategic investment.
- It should not be the default plan for a minor cleanup.

## Goals

### Primary goals

- Make relation editing behavior reliable and understandable.
- Keep edit counting, submit payloads, and public replay correct.
- Reduce architecture confusion without breaking existing moderation and sync workflows.

### Secondary goals

- Preserve the edge-centric read model for shared character-character relations.
- Improve test coverage and validation around relation projection.
- Create a clean decision point for whether a full platform migration is worth it.

## Non-Goals

- Replacing the entire game-data action system immediately.
- Rebuilding relation rendering from scratch.
- Migrating to a new entity type before the current path contract is stabilized.

## Recommended Plan

## Phase 0: Stabilization and Characterization

This phase is mandatory.

### Work

- Fix the current relation editable path contract in [src/features/characters/components/character-detail/CharacterRelationDisplay.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/features/characters/components/character-detail/CharacterRelationDisplay.tsx) and/or [src/components/ui/editable.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/components/ui/editable.tsx).
- Ensure relation description editing does not depend on malformed or ambiguous nested paths.
- Remove any assumption that relation arrays can be addressed by `itemId` through dot-path access unless that is actually implemented.
- Add characterization tests for the current relation projection layer and current edit behavior.

### Minimum test coverage

- `getCharacterRelation()` returns expected `counters`, `counteredBy`, `counterEachOther`, and `collaborators` from the shared relation graph.
- Inverse projection from other characters still works.
- Page-local relation edits on a character page update the rendered relation view as expected.
- Draft counting in [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx) correctly counts relation edits for the current character page.
- Public replay through [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts) and [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts) still applies relation edits correctly.

### Exit criteria

- Relation edit widgets use a coherent path contract.
- Tests prove current relation editing behavior is stable enough to serve as a migration baseline.
- No known malformed-path behavior remains in relation editing.

## Phase 1: Lightweight Boundary Cleanup

This is the default path after Phase 0.

### Work

- Keep `entityType: 'characters'` unchanged.
- Keep the existing shared relation graph in [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts) as the read-side canonical source.
- Introduce a clear relation-domain adapter between:
  - shared relation graph projection
  - page-local edit overlay
  - publishable character-page diff output
- Make the page-level relation editing model explicit instead of implicit.

### Design direction

- Treat page-local relation edits as an overlay model, not as if they were the same thing as canonical relation storage.
- Avoid cross-entity writes.
- Keep current publish/dispersal behavior compatible with existing `characters` actions.

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
- Existing public replay and admin sync continue to work without new entity-type support.

## Phase 2: Validation and Tooling Improvements

This phase is still part of the lightweight path.

### Work

- Add invariant checks for duplicate `(kind, subject, target)` relation entries in [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts).
- Add explicit validation for contradictory pairs where applicable.
- Reduce relation-index rebuild overhead if needed.
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
- the team accepts platform-level changes across edit mode, replay, admin sync, and history tooling

## Phase 3: Full `characterRelations` Entity Migration

This phase is optional and should happen only after the decision gate.

### Target outcome

Introduce `entityType: 'characterRelations'` as a first-class editable and publishable entity.

### Required system changes

- Add `characterRelations` to publishable entity definitions and stores in [src/context/EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx).
- Add server public replay support in [src/lib/gameData/publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts).
- Add client public replay support in [src/hooks/usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts).
- Add admin sync target resolution and file patching for [src/data/characterRelations.ts](/d:/P/Tom-and-jerry-chase-wiki/src/data/characterRelations.ts) in [src/app/api/admin/sync-pr/route.ts](/d:/P/Tom-and-jerry-chase-wiki/src/app/api/admin/sync-pr/route.ts).
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
- Public replay and admin sync patch the relation source file correctly.
- Per-page relation views are still correct.
- Wiki history and moderation flows remain coherent.

## Suggested Implementation Order

1. Phase 0 stabilization and tests
2. Phase 1 lightweight boundary cleanup
3. Phase 2 validation/tooling improvements
4. Decision gate
5. Phase 3 only if explicitly approved

## Acceptance Criteria

The lightweight plan is successful if:

- relation edit widgets have coherent path semantics
- relation projection is covered by tests
- current public replay and admin sync remain functional
- developers can reason about read-side vs edit-side relation behavior without tracing multiple hidden assumptions

The full migration is successful if:

- `characterRelations` becomes a first-class editable entity
- relation actions replay and sync back to the relation source file
- per-page projection and moderation behavior remain correct

## Recommendation

Proceed with Phases 0 through 2 as the default plan.

Do not start Phase 3 unless relation editing is explicitly treated as a strategic platform concern rather than a localized cleanup.
