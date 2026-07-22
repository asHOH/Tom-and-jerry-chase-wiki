# Public-Action Semantic Ordering and Atomic Replay Plan

## Status

- Date: 2026-07-17
- Last revised: 2026-07-22
- State: Additive trust-boundary cutover deployed; revoke implemented but rollout closure remains
- Scope: Public-row decoding and replay semantics, trusted publish and approval persistence, and
  publish-time dependency grouping

Completed foundation:

- Ordered public readers, the dependency analyzer, and transactional legacy row replay landed in
  commits `65ff1c78`, `99f49c50`, `c7ee3fb8`, `c0361043`, and `1288415c`.
- Strict publish decoding, compatible whole-row stored decoding, shared path parsing, and checked
  atomic row application landed in `846d2a01` and `5465e9a2`.
- Numeric-array dependency hardening and the read-only three-cohort audit landed in `b2f8b57f` and
  `6ceb4b61`.
- The production audit passed: 65 approved and 8 pending rows decoded and checked-replayed without
  failure; 1125 synced rows decoded for history only. See
  `reports/2026-07-18-public-action-replay-audit-result.md`.
- Measured publish limits, bounded server preparation, the approved-replay epoch and trigger, and
  the atomic approved snapshot reader landed in `bb02ec74`.
- Service-role-only prepared publish, approval, and mark-synced RPCs, complete candidate replay, and
  the publish and moderation route cutovers landed in `85e5934f`.
- The additive epoch/prepared-RPC migrations and route cutovers are deployed. The separate Step 5B
  revoke migration landed in `e04fcfa1` but is not deployed. After a read-only ledger check confirmed
  its original duplicate version was absent remotely, its unchanged SQL was retimestamped to unique
  repository version `20260722000000` and committed in `2b2b0792`.
- The scalar-property delete squashing fix landed in `c07b4a14`, and the frozen container replay fix
  landed in `bf71c68e`. Both are present in the verified production build. The remaining mixed
  numeric-child/parent-array squash failure was reproduced after that deployment and fixed in
  `749573da` by cloning scratch-replay payloads and admitting verified direct parent-array sets.
  That fix is repository-validated but not deployed; affected-user resubmission verification is
  still pending.
- The anonymous prepared-publish function is live with its expected signature and service-role-only
  execution privileges. A catalog-only comparison recorded in
  [the live-comparison report](./reports/2026-07-22-anonymous-prepared-publish-live-comparison.md)
  confirmed that its complete definition matches the repository migration. Approved history-only
  repair then recorded `20260720000001` as applied without re-executing its SQL.
- A clean local `supabase db reset --local` was deferred because the pinned Postgres Docker image
  could not finish downloading. No local database container or migration ran; this is optional
  reproducibility validation, not a blocker for the already-validated retimestamp-only change.

Remaining work:

1. Deploy application fix `749573da`, verify it through `/api/version/`, then use one affected-user
   normal-route resubmission to establish prepared-path persistence with server/database evidence.
2. Optionally repeat the clean local reset in CI, on another machine, or after the Docker image is
   available; record it as deferred until then.
3. Obtain explicit approval before deploying the uniquely versioned Step 5B migration alone. Follow
   the [Step 5C production runbook](./2026-07-22-game-data-step-5c-runbook.md); do not use an
   unreconciled normal migration push.
4. Verify the post-revoke privileges and intended read/rejection behavior with the Step 5D probes.
5. Rerun the approved, synced, and pending production audit after the bypasses are closed.
6. Migrate live replay through the pure published-data and editable-store-loading plans; do not
   adapt the legacy mutable replay into the checked engine.
7. Enable publish-time dependency grouping only after the store-loading plan removes root-client
   replay.

While the resubmission is pending, the application-only deployment, optional local reset, and
read-only reconciliation planning for the remaining migration-ledger differences may proceed. The
Step 5C production preflight and revoke, Steps 5D-5E, and the editable-store implementation remain
blocked unless their stated gate is satisfied or the work is explicitly reprioritized.

## Frozen Contract

- Public replay is ordered by `(created_at ASC, id ASC)`. This is deterministic compatibility order,
  not proof of edit chronology.
- One database row is one atomic unit. One malformed child invalidates its complete row.
- Stored decoding retains the exact raw `jsonb` value for race comparisons and separately exposes a
  normalized ordered action list. New publish input persists only strict canonical output.
- Paths use unescaped dot-separated segments. Outer whitespace is trimmed; empty, whitespace-only,
  `__proto__`, `prototype`, and `constructor` segments are rejected.
- Canonical array indexes are `0` or non-zero decimal values without leading zeroes in
  `0..2^32-2`. Target-aware replay rejects other numeric forms.
- Stored compatibility preserves sparse numeric `set`, clamped numeric `add`, valid `length`
  assignment, object overwrite by `add`, and existing container-creation behavior.
- Stored `set` without `newValue` retains its checked-delete meaning. Strict publish requires an
  explicit `delete`. `add` without `newValue` is invalid.
- Checked delete requires every intermediate segment and final target to exist. `oldValue` is
  presentation metadata, not a replay or concurrency condition.
- Direct numeric `set`, `add`, and `delete` and `length` writes are structural dependencies. Invalid
  paths fail dependency analysis closed.
- Ordinary row failure restores all supplied working targets and does not mark the row handled.
  Incomplete rollback is a fatal invariant failure.
- Replay and dynamic wiki history use public `approved` rows. Entity-update and audit history may
  also read public `synced` rows. Synced rows are never replayed.
- Internal failures use stable codes: `invalid_shape`, `empty_row`, `unknown_field`, `invalid_path`,
  `invalid_array_index`, `missing_new_value`, `missing_path`, `invalid_array_length`, `clone_failed`,
  `apply_failed`, and fatal `invariant_failed`.
- Structural validation does not solve stale drafts or cross-submission conflicts. The accepted
  stale-draft and semantic-conflict policy remains separate work. Structural validity does require
  race protection: candidate replay uses one atomic approved-row snapshot and its replay epoch, and
  the persistence RPC rejects if that epoch changed before it acquires the mutation lock.
- Publish and moderation candidate checks replay the complete proposed approved row set from a
  pristine canonical baseline in `(created_at ASC, id ASC)` order. An older pending row is inserted
  at its stored position; it is never checked merely by applying it after the current final value.
- A database-maintained approved-replay epoch changes whenever a row enters, leaves, or changes the
  approved replay set. Publish, approval, and mark-synced persistence compare that epoch while
  holding the same singleton revision row lock. This epoch is an internal concurrency token, not the
  published-snapshot content hash owned by the store-loading plan.

## Ownership and Gates

- This plan owns row selection, decoding, ordering, path and touched-root interpretation, checked
  application, row rollback, dependency grouping, and publish/approval trust boundaries.
- The pure foundation owns canonical-source isolation, canonical branch cloning, copy-on-write
  composition, and pure published results.
- The editable-store plan owns snapshot caching, route read models, edit-runtime initialization, and
  removal of server and root-client mutable replay.
- Never replace branches in mounted Valtio stores. Approved rows must be applied to a plain published
  baseline before edit proxies are created.
- Closing persistence bypasses is ready now and must not wait for client migration. Only dependency
  grouping waits for removal of root-client replay. Correct candidate replay does depend on the
  pure-foundation plan's pristine canonical-source factories; implement that bounded prerequisite
  before route cutover rather than cloning possibly mutated legacy targets.

## Work Package 1: Trusted Publish Boundary

### Stage A: Close the bypass now without grouping

1. Add one server preparation helper shared by `/api/game-data-actions/publish` and
   `/api/game-data-actions/publish-relations`.
2. Add shared named limits for request bytes, top-level entries, flattened actions, actions per row,
   path length, and message length. Select them once from current valid output plus explicit
   operational headroom and freeze every boundary in tests. Enforce bytes with a bounded reader or
   platform limit before `request.json()`; `Content-Length` alone is insufficient.
3. Apply the byte and cheap shape bounds, establish the authenticated actor and route permission,
   then perform strict decoding and other potentially quadratic work. Client `squashActions` output
   remains an untrusted optimization.
4. Preserve the current top-level publish row boundaries in this stage. Validate each row with
   `decodeActionRowEntry` and persist only its canonical value. Reject malformed, empty, unknown-field,
   split, or dropped input with `400`.
5. Run `groupActionEntriesByDependency` as a validation-only check. Until Stage B is enabled, reject
   any request containing a non-singleton dependency group. Separately persisted rows must commute,
   because rows created by one transaction can share `created_at` and therefore replay in UUID `id`
   order rather than request order.
6. Derive resource contexts from every decoded child action. The standard route selects
   `game_data_action.create`; the relations route selects
   `game_data_action.publish_relations`, valid only for the `characters` entity type. Never accept a
   permission key or actor ID from the body.
7. Load the ordered approved rows and `approved_replay_epoch` together through one uncached,
   throwing, service-role-only snapshot RPC. Compose the complete proposed approved row set, including
   only rows from this request that will auto-approve, and checked-replay it from pristine canonical
   targets in semantic order. Operation-local invalidity returns `400`; candidate-set structural
   failure returns `409`; database read failure fails closed.
8. Add a singleton approved-replay epoch table and a trigger that increments it whenever an insert,
   update, or delete changes approved replay membership or replay-relevant fields. This trigger must
   cover legacy functions during rollout as well as prepared functions. The snapshot RPC returns rows
   and epoch from one database statement so they cannot describe different committed states.
9. Add a prepared publishing RPC callable only by `service_role`. It accepts the route-authorized
   actor, server-selected permission, entity type, canonical rows, message, and expected replay epoch.
   It locks the singleton epoch row, rejects a mismatch with a stable conflict code, recursively
   repeats permission checks for every child, and lets the trigger advance the epoch for auto-approved
   inserts. Pending-only inserts do not change the replay set.
10. Call the prepared RPC through the server-only admin client and update generated database types in
    the additive migration.
11. Cut over both routes, then revoke `EXECUTE` on the legacy `publish_game_data_actions` RPC from
    `PUBLIC`, `anon`, and `authenticated`. The package is incomplete until this revoke is deployed.

Roll out additively: add the prepared RPC, deploy both route cutovers, then deploy the revoke. This
stage changes validation and trust ownership but deliberately does not introduce dependency grouping.

### Stage B: Enable grouping after root-client replay is gone

After the editable-store Phase 4 gate passes:

1. Merge prepared entries for the same entity type and call
   `groupActionEntriesByDependency` on their top-level rows.
2. Preserve singleton groups. Flatten each multi-row dependency group into one ordered action array
   at its earliest member position. Entries crossed by that move must commute with every group member.
3. Persist the grouped canonical rows through the already trusted prepared RPC.
4. Verify that every separately stored row from one request commutes with the others.

### Exit tests

- Bounds reject oversized input before expensive analysis; unauthenticated requests never reach
  grouping or persistence.
- Unknown fields and missing values fail before persistence, and persisted JSON equals strict
  canonical output.
- Dependent top-level rows are rejected before Stage B; accepted separately persisted rows commute
  even when their database tie-break order differs from request order.
- Both routes derive permission contexts for every child and cannot substitute each other's
  permission contract.
- Candidate replay places existing and proposed rows in semantic order, maps operation-local
  invalidity to `400`, and maps structural or replay-epoch conflicts to `409`.
- Anonymous and authenticated clients cannot execute legacy or prepared publish RPCs; the
  service-role path still enforces the supplied actor's recursive permissions.
- Later grouping preserves noncontiguous transitive order, final replay result, and independent row
  separation.

## Work Package 2: Route-Owned Approval

1. Add one pending-row loader and decoder shared by single and batch moderation. Decode each complete
   row with `decodeStoredActionRow`; one invalid child makes that row ineligible for approval.
2. Retain the exact raw `entry` and normalized actions. Load the approved rows and replay epoch
   atomically, insert the pending row into its `(created_at, id)` position, and checked-replay the
   complete candidate set from pristine canonical targets. A structural failure leaves the row
   pending and rejectable; rejection never requires successful decode.
3. Take the moderator ID only from the route guard.
4. Add a prepared approval RPC callable only by `service_role`. It locks the replay-epoch singleton
   and pending row, requires the expected replay epoch and pending state to remain unchanged,
   recursively repeats `game_data_action.approve` checks for the supplied actor, and compares current
   `entity_type` and raw `entry` with the route-supplied expected values before approving atomically.
5. Call it through the server-only admin client from both moderation routes. Batch approval may call
   once per row so each database row remains an independent result. Update database types with the
   additive migration.
6. Cut over both approval routes, then revoke `EXECUTE` on legacy
   `approve_game_data_action` from `PUBLIC`, `anon`, and `authenticated`. Rejection may remain
   callable under its existing permission contract because it cannot publish data.
7. Cut the existing mark-synced route over to a service-role-only prepared RPC in the same package.
   Candidate replay excludes the target approved row and uses the expected replay epoch; the RPC
   locks the epoch and row, repeats `game_data_action.mark_synced`, compares the expected raw row,
   and changes it to `synced`. Revoke any browser-callable mutation path that can perform this
   transition directly. Mark-synced is included because it removes a row from replay even though it
   is not an approval operation.

Roll out additively: add the prepared RPCs, deploy the approval and mark-synced cutovers, then deploy
the revokes. The complete trust boundary is secure only after legacy publish and approval execution
is revoked and no browser-callable path can move a row into or out of the approved replay set.

### Exit tests

- Single, array-shaped, and legacy mixed rows approve as one database unit.
- One malformed child or structural failure prevents approval without preventing rejection.
- Batch moderation reports per-row failures and never partially approves a row.
- Status, entity type, or raw entry changes between route decode and RPC execution fail the locked
  compare.
- Approval replays an older pending row at its stored semantic position, and mark-synced proves the
  remaining ordered approved set against the canonical baseline before removing a row.
- A concurrent publish, approval, or mark-synced transition changes the replay epoch and forces the
  stale prepared request to retry rather than persisting an unchecked replay set.
- Recursive resource permission checks cover every child action.
- Anonymous and authenticated clients cannot execute legacy or prepared approval or mark-synced
  RPCs; service-role route calls remain permission checked.

## Live Replay Handoff

The production audit gate is passed, but live migration stays in the owning plans:

1. The pure foundation consumes `decodeStoredActionRow`, shared touched roots, and
   `applyCheckedActionRow` to build copy-on-write published values without mutating canonical data.
2. Server rendering moves to that pure snapshot and removes legacy global server mutation.
3. The editable-store plan moves normal clients to read models, creates edit proxies from the fully
   replayed baseline, and removes root-client replay.
4. Only then may publish Stage B dependency grouping be enabled.

Do not create a generalized mutable-target adapter or replay approved rows against mounted proxies.

## Delivery Order

1. Complete the pure foundation's pristine canonical-source factories needed by candidate replay.
2. Add shared bounded publish preparation, the approved-replay epoch and trigger, the atomic snapshot
   reader, and additive prepared publish, approval, and mark-synced RPCs.
3. Cut over approval and mark-synced routes and revoke their legacy browser mutation paths.
4. Cut over publish routes without grouping, reject dependent cross-row requests, and revoke the
   legacy publish RPC.
5. Rerun the approved, synced, and pending audit so no row created through a closing bypass escapes
   review.
6. Complete the pure published-data server cutover and editable-store Phases 1-4.
7. Enable and verify publish-time dependency grouping.
8. Complete moderation and direct-RPC security verification.
9. Add submission metadata only if later evidence establishes a concrete operational need.

Items 1-5 form the ready implementation sequence. Item 7 is explicitly gated on removal of
root-client replay.

The post-bypass audit in Item 5 has two distinct gates:

- Approved replay compatibility passes only when malformed rows, checked-replay failures, and
  unknown entity types are all zero. Resolve an approved unknown type by adding checked replay
  targets or by making a separate reviewed known-no-op classification, then rerun the audit.
- Non-approved findings do not block the current approved replay set, but every pending malformed
  row, checked-replay failure, dependency cluster, or unknown entity type must have an owner and a
  repair-or-reject disposition before approval. Every malformed synced row must have an owner and a
  history follow-up. Informational synced multi-action findings require no disposition.

## Validation and Completion

For each work package, run focused unit, route, and migration tests, then lint and type-check. Run the
full Jest suite and `npm run build:skip-images` for the cross-cutting route/RPC cutovers.

The plan is complete when:

- all active readers use their purpose-specific status contract and stored rows are decoded atomically;
- ordinary checked failures expose no partial published value and invariant failures remain fatal;
- approved replay compatibility includes zero unknown entity types, and all actionable pending or
  synced audit findings have the required owner and disposition;
- synced rows are history-only;
- legacy server and root-client replay are removed before grouping is enabled;
- separately persisted rows from one publish request commute;
- strict canonical publish input and checked dry replay run before persistence;
- every replay-set mutation uses the locked replay-epoch compare;
- legacy and prepared publish/approval/mark-synced RPCs are inaccessible to browser roles; and
- existing valid stored shapes remain compatible.

## Deferred and Non-Goals

Do not add submission sequence metadata unless implementation demonstrates a need for operational
group identity. If justified later, nullable `submission_id` and `entry_index` are diagnostic only and
must not override semantic dependency grouping.

This plan does not solve stale drafts, cross-submission conflict policy, last-writer-wins behavior,
local undo history, route read models, client bundle boundaries, or general event sourcing. It does
not introduce a transaction framework, command bus, or dependency-injection system.
