# Direct Array-Index Set Dependency Classification Plan

## Status

- Date: 2026-07-23
- Last revised: 2026-07-24
- State: Complete; repository implementation and validation passed
- Scope: Dependency classification for direct array-index `set` actions submitted as separate
  top-level rows
- Production impact: Application-only change; no database migration

Completion summary:

- `actionDependencies.ts` now retains defined direct-index assignment metadata and exempts only the
  assignment's broad structural-parent dependency for distinct canonical numeric siblings.
- Focused dependency, commutativity, and publish-preparation coverage proves the accepted and
  fail-closed cases.
- Lint, TypeScript, Prettier, the complete Jest suite, and the production build pass.
- The production-connected read-only audit retained fingerprint
  `audit-f0429897bfb2022d8095508c61791e487de723ff6b6cd0db72387f5d669db246`, with no classification
  delta and approved replay compatibility still passing.
- Stage B dependency grouping remains disabled until its existing editable-store Phase 4 gate.

## Problem

Production rejected request `e651181b-de28-4953-8165-eaa8df269c97` with `dependent_rows`. Its two
rows assigned distinct sibling indexes under the same array:

- one direct `set` at index `2`;
- one direct `set` at index `3`.

A payload-free local reproduction confirmed that:

1. client `squashActions` preserves the two assignments as separate rows; and
2. `areActionsOrderDependent` classifies them as dependent because every direct numeric-index
   `set`, `add`, and `delete` currently marks the complete array parent as structurally affected.

Direct `set` uses assignment semantics and does not shift neighboring indexes. Assignments whose
paths enter distinct canonical numeric siblings therefore commute, including when either assignment
extends the array. Rejecting that narrower shape is a dependency-classification false positive.

A direct numeric assignment is not generally independent from every non-overlapping path under the
same textual parent. When the parent is missing or scalar, `Tom.a.0` causes checked replay to create
an array while `Tom.a.foo` causes it to create an object. Numeric-then-property retains array keys
`0` and `foo`; property-then-numeric replaces the object with an array and loses `foo`. Both orders
report successful application but produce different results.

## Separation from the previous incidents

This is separate from the earlier client history-squashing defects even though all three surfaced as
`dependent_rows`:

- `c07b4a14` corrected scalar object-property delete/set histories before publication.
- `f02945c1` corrected scratch-replay mutation and mixed numeric-child/whole-parent array
  normalization.
- This incident reaches server preparation with two valid sibling rows; the false rejection is
  caused by the server-owned dependency classifier treating non-shifting assignments as structural.

The previous fixes remain valid and should not be reverted or generalized into whole-array
replacement for this case.

## Decision

Refine dependency classification according to actual replay semantics:

- Preserve structural-parent metadata for every direct numeric `set`.
- Also preserve the canonical index and parent metadata for a direct numeric `set` with a defined
  `newValue`.
- Exempt that assignment's structural-parent dependency only when the other path enters a distinct,
  canonical numeric sibling immediately beneath the same parent.
- The exemption is pairwise and symmetric. It removes only the dependency contributed by that
  defined assignment; the other action's own structural analysis may still make the pair dependent.
- A path entering a property, malformed numeric segment, or the same numeric sibling beneath that
  parent remains dependent.
- A direct `set` with an undefined `newValue` remains structural without the exemption for
  compatibility with stored legacy rows, where it has delete semantics. Strict publish decoding
  already rejects this input.
- Array-index `add` and `delete` remain structural because they shift indexes.
- A `set` of array `length` remains structural.
- Same-path, ancestor/descendant, whole-parent, same-index subtree, invalid-path, and interactions
  with structural array operations remain dependent and fail closed.

Do not use `oldValue` to establish independence. It is not needed to prove assignment commutativity
and remains untrusted request metadata.

## Why not collapse the client edit to a parent-array set

Replacing two element assignments with one whole-array value would make the request pass, but it
would broaden the write set. A stale draft could overwrite unrelated sibling changes that the
original element-level actions did not touch. It would also solve only first-party client output
while leaving the server's semantic false positive intact.

Client squashing remains an optimization. The server remains responsible for deciding whether
separately persisted rows commute.

## Relationship to Stage B grouping

This change does not enable publish-time dependency grouping.

The semantic-ordering plan's Stage B remains the durable solution for genuinely dependent rows: it
will flatten each dependency group into one ordered atomic database row. Stage B remains gated on
editable-store Phase 4 removing root-client public-action replay.

This classifier correction is safe before Stage B because it accepts only pairs that enter distinct
canonical numeric siblings and are not made dependent by either action's remaining structural
analysis. It does not change the rule that separately stored rows may replay in database tie-break
order rather than request order.

## Implementation

1. Extend `analyzeActionPath` in `src/lib/gameData/actionDependencies.ts` to retain both:
   - the existing structural array parent for every direct numeric `set`; and
   - direct-assignment metadata containing the parent and canonical index only when `newValue` is
     defined.
2. Add a helper that determines whether another analyzed path enters a distinct canonical numeric
   sibling immediately below that assignment's parent. Resolve the sibling segment with the shared
   canonical array-segment parser; do not use string or numeric coercion.
3. In `areActionsOrderDependent`, preserve overlap checks and evaluate each action's structural
   parent. Skip only a defined direct assignment's broad parent dependency when the helper proves
   that the other path enters a distinct canonical numeric sibling. Continue evaluating the other
   action's structural parent so its `add`, `delete`, undefined `set`, or `length` semantics can
   still make the pair dependent.
4. Keep non-index and malformed siblings beneath the same parent dependent. Keep all invalid paths
   fail-closed.
5. Revise the frozen dependency bullet in
   `docs/archive/completed/2026-07-17-public-action-semantic-ordering-plan.md` to prescribe this
   exact pairwise
   exception and retain all fail-closed cases.
6. Do not change request decoding, permission derivation, candidate replay, replay-epoch locking,
   prepared RPCs, or persistence row boundaries.
7. Do not modify `squashActions` for this incident unless an independent client-history defect is
   reproduced.

## Tests

Add focused dependency tests proving:

- direct sets at distinct sibling indexes are independent;
- a direct set and a descendant write under a different sibling index are independent;
- `Tom.a.0` and `Tom.a.foo` are dependent, including when `a` is missing or scalar;
- a direct set and a malformed or non-canonical numeric sibling are dependent;
- direct sets at the same index are dependent;
- a direct set and a descendant write under the same index are dependent;
- a direct set and a whole-parent set are dependent;
- direct sets remain dependent on array `add`, `delete`, and `length` changes;
- a legacy-style direct set with undefined `newValue` remains structural; and
- invalid paths remain fail-closed.

Add commutativity tests that apply accepted action pairs in both orders and require identical final
results. Cover:

- dense arrays;
- assignments that extend an array;
- nested array paths;
- missing intermediate containers; and
- scalar and container assigned values.

Add a non-commutativity regression that applies `Tom.a.0` and `Tom.a.foo` in both orders against
missing and scalar `a`. Compare array own keys and property values explicitly; JSON serialization
does not expose custom non-index properties on arrays.

Add publish-preparation tests proving:

- the production sibling-index shape is accepted as two canonical rows;
- the mixed numeric/property shape remains rejected with `dependent_rows`;
- malformed and non-canonical numeric siblings remain rejected;
- genuinely dependent rows still return `dependent_rows`; and
- repeated items for the same entity type receive the same analysis.

## Validation and rollout

Repository validation completed:

1. Run the focused action-dependency and publish-preparation tests.
2. Run lint, TypeScript, Prettier, and the complete Jest suite.
3. Run the production-connected action audit read-only and record any classification delta. Do not
   mutate or repair rows as part of this validation.
4. Build the production application.

Operational follow-up: deploy through the normal application path without applying migrations.
Verify `/api/version/` and `/api/health/`, then ask the affected user to resubmit the retained draft
once. Retain only the submission time, route/status, returned result IDs/statuses, matching safe
database metadata, and the replay-epoch change.

## Exit criteria

- The sibling direct-index reproduction is accepted and persists successfully.
- All newly accepted separately stored rows commute under the checked replay semantics.
- Existing genuinely dependent cases remain rejected.
- The read-only audit reports no new malformed or replay-failing approved rows.
- Stage B remains disabled until its existing gate is deliberately completed or revised.

The repository exit criteria are met. Production verification of the retained draft remains an
operational rollout check: it must succeed without `dependent_rows`, `candidate_conflict`,
persistence failure, or unexpected HTTP 500.
