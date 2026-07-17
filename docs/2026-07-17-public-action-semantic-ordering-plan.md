# Public-Action Semantic Ordering and Atomic Replay Plan

## Status

- Date: 2026-07-17
- Last revised: 2026-07-18
- State: Foundational semantics complete; trust-boundary work remains
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

Remaining work:

1. Close the direct publish and approval RPC bypasses through server-owned preparation and
   service-role-only persistence. Preserve current publish row boundaries while doing so.
2. Migrate live replay through the pure published-data and editable-store-loading plans; do not
   adapt the legacy mutable replay into the checked engine.
3. Enable publish-time dependency grouping only after the store-loading plan removes root-client
   replay.

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
  route-to-persistence race is limited by exact raw-entry comparison for approval; broader revision
  policy remains separate work.

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
  grouping waits for removal of root-client replay.

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
5. Derive resource contexts from every decoded child action. The standard route selects
   `game_data_action.create`; the relations route selects
   `game_data_action.publish_relations`, valid only for the `characters` entity type. Never accept a
   permission key or actor ID from the body.
6. Dry replay the complete prepared request against one uncached, throwing approved-action snapshot.
   Operation-local invalidity returns `400`; failure against current target shape returns `409`.
   Database read failure fails closed.
7. Add a prepared publishing RPC callable only by `service_role`. It accepts the route-authorized
   actor, server-selected permission, entity type, canonical rows, and message. It recursively repeats
   permission checks for every child; auto-approval also checks `game_data_action.approve`.
8. Call the prepared RPC through the server-only admin client and update generated database types in
   the additive migration.
9. Cut over both routes, then revoke `EXECUTE` on the legacy `publish_game_data_actions` RPC from
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
- Both routes derive permission contexts for every child and cannot substitute each other's
  permission contract.
- Dry replay maps operation-local invalidity to `400` and current-baseline structural failure to
  `409`.
- Anonymous and authenticated clients cannot execute legacy or prepared publish RPCs; the
  service-role path still enforces the supplied actor's recursive permissions.
- Later grouping preserves noncontiguous transitive order, final replay result, and independent row
  separation.

## Work Package 2: Route-Owned Approval

1. Add one pending-row loader and decoder shared by single and batch moderation. Decode each complete
   row with `decodeStoredActionRow`; one invalid child makes that row ineligible for approval.
2. Retain the exact raw `entry` and normalized actions. Dry replay normalized actions against one
   uncached, throwing current approved snapshot. A structural failure leaves the row pending and
   rejectable; rejection never requires successful decode.
3. Take the moderator ID only from the route guard.
4. Add a prepared approval RPC callable only by `service_role`. Under a row lock it must require the
   row to remain pending, recursively repeat `game_data_action.approve` checks for the supplied actor,
   and compare current `entity_type` and raw `entry` with the route-supplied expected values before
   approving atomically.
5. Call it through the server-only admin client from both moderation routes. Batch approval may call
   once per row so each database row remains an independent result. Update database types with the
   additive migration.
6. Cut over both approval routes, then revoke `EXECUTE` on legacy
   `approve_game_data_action` from `PUBLIC`, `anon`, and `authenticated`. Rejection may remain
   callable under its existing permission contract because it cannot publish data.

Roll out additively: add the prepared RPC, deploy both moderation cutovers, then deploy the revoke.
The complete trust boundary is secure only after both legacy publish and approval RPCs are revoked.

### Exit tests

- Single, array-shaped, and legacy mixed rows approve as one database unit.
- One malformed child or structural failure prevents approval without preventing rejection.
- Batch moderation reports per-row failures and never partially approves a row.
- Status, entity type, or raw entry changes between route decode and RPC execution fail the locked
  compare.
- Recursive resource permission checks cover every child action.
- Anonymous and authenticated clients cannot execute legacy or prepared approval RPCs; service-role
  route calls remain permission checked.

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

1. Add shared bounded publish preparation and the additive prepared publish and approval RPCs.
2. Cut over approval routes and revoke the legacy approval RPC.
3. Cut over publish routes without grouping and revoke the legacy publish RPC.
4. Rerun the approved, synced, and pending audit so no row created through a closing bypass escapes
   review.
5. Complete the pure published-data server cutover and editable-store Phases 1-4.
6. Enable and verify publish-time dependency grouping.
7. Complete moderation and direct-RPC security verification.
8. Add submission metadata only if later evidence establishes a concrete operational need.

Items 1-4 are ready now. Item 6 is explicitly gated on removal of root-client replay.

## Validation and Completion

For each work package, run focused unit, route, and migration tests, then lint and type-check. Run the
full Jest suite and `npm run build:skip-images` for the cross-cutting route/RPC cutovers.

The plan is complete when:

- all active readers use their purpose-specific status contract and stored rows are decoded atomically;
- ordinary checked failures expose no partial published value and invariant failures remain fatal;
- synced rows are history-only;
- legacy server and root-client replay are removed before grouping is enabled;
- separately persisted rows from one publish request commute;
- strict canonical publish input and checked dry replay run before persistence;
- legacy and prepared publish/approval RPCs are inaccessible to browser roles; and
- existing valid stored shapes remain compatible.

## Deferred and Non-Goals

Do not add submission sequence metadata unless implementation demonstrates a need for operational
group identity. If justified later, nullable `submission_id` and `entry_index` are diagnostic only and
must not override semantic dependency grouping.

This plan does not solve stale drafts, cross-submission conflict policy, last-writer-wins behavior,
local undo history, route read models, client bundle boundaries, or general event sourcing. It does
not introduce a transaction framework, command bus, or dependency-injection system.
