# Public-Action Semantic Ordering and Atomic Replay Plan

## Status

- Date: 2026-07-17
- Last revised: 2026-07-17
- State: Partially implemented
- Scope: Public game-data row selection, decoding, replay atomicity, publish grouping, and moderation
  boundaries

Completed work:

- Commit `65ff1c78` added deterministic `(created_at ASC, id ASC)` ordering to both public-action
  read paths and matching entity-history tie-breaking.
- Commit `99f49c50` added the shared `actionDependencies` analyzer for path overlap, structural-array
  dependencies, transitive grouping, and stable input order.
- Commit `c7ee3fb8` made the legacy mutable replay transactional at the database-row boundary by
  backing up touched root branches and rolling back every resolved target on an ordinary failure.
- Commit `c0361043` classified numeric `set`-deletes as structural array operations in the dependency
  analyzer.
- Commit `1288415c` made an incomplete legacy rollback a fatal replay invariant error instead of a
  recoverable skipped-row failure.
- The public replay API now filters to public `approved` rows and preserves its `500` query-error
  response. Entity update history now uses a separate public `approved | synced` reader. Focused tests
  cover both status contracts and their ordering.

Remaining work:

- Decode every stored row as one validated atomic unit.
- Add checked structural apply semantics for store-free plain-object replay; the legacy mutable path
  already provides rollback-based row atomicity as temporary compatibility code.
- Audit legacy `approved`, `synced`, and `pending` rows before replay cutover.
- Group dependent operations at the publish boundary and close the direct publish and approval RPC
  bypasses.

## Decision and Invariants

Cross-row replay remains ordered by `(created_at, id)` for deterministic compatibility, but UUID order
does not represent edit chronology and must not be relied on for correctness.

The database row is the atomic boundary. A row may encode one `Action`, an `Action[]`, or a legacy
mixed array of actions and action arrays, but the whole row is decoded, approved, and replayed
together.

A successfully decoded stored row retains two representations: the exact raw `jsonb` value read from
the database, and one normalized ordered `Action[]` used for analysis, permissions, presentation, and
replay. Normalization must never be used to reconstruct a value for an exact database compare. New
publish input follows a stricter contract: reject unknown action fields and persist only canonical
prepared actions, never the untrusted raw request value.

The implementation must preserve these invariants:

1. One malformed child invalidates its complete row; valid siblings are not applied separately.
2. Every action in a row must apply successfully to working copies of every resolved target before
   any target is committed.
3. An ordinary decode, clone, or checked-apply failure leaves targets and handled-ID state unchanged
   after replay returns. A commit or rollback invariant breach is fatal and must not be downgraded to
   an ordinary skipped-row result.
4. Newly published order-dependent operations occupy one database row. Rows emitted separately by
   one publish request commute according to the shared dependency analyzer.
5. Structural array inserts, removals, `length` writes, and every direct numeric array `set` depend on
   every affected action at or below that array root. Dependency grouping never trusts `oldValue` to
   decide whether a numeric `set` is structural.
6. Replay and dynamic wiki history read public `approved` rows. Entity-update and audit history read
   public `approved | synced` rows. Synced rows are never replayed over the checked-in baseline.
7. Browser-authenticated clients cannot call a publish or approval persistence primitive that
   bypasses server-side decoding and preparation. Database permission checks still cover every
   child action for the authenticated actor.
8. Legacy row order is never repaired by guessing chronology. Candidate submission groups have
   unknown provenance unless external evidence proves otherwise.
9. Structural replay success does not decide stale-baseline or cross-submission conflicts; those
   remain owned by revision and touched-path policy.
10. Route-to-RPC race checks compare the exact raw stored `entry`; normalized actions are never used
    as the compare token.
11. Authentication and explicit request bounds precede dependency grouping. The quadratic analyzer
    never receives an unbounded or unauthenticated payload.
12. Stored-row compatibility may retain unknown fields for an exact `jsonb` compare, but new publish
    requests reject them and persist only canonical prepared rows.

### Frozen action, path, array, and error contract

- Paths use unescaped dot-separated segments. Trim outer whitespace; reject empty, whitespace-only,
  `__proto__`, `prototype`, and `constructor` segments; and do not add an escaping syntax until
  persisted data requires one.
- An array-index segment is canonical decimal `0` or a non-zero decimal without leading zeroes, in the
  range `0..2^32-2`. Reject negative, signed, fractional, exponent, leading-zero, and out-of-range
  forms as `invalid_array_index` when replay addresses an array.
- Stored compatibility replay preserves sparse numeric `set`, clamped numeric `add`, valid `length`
  assignment, object-property overwrite by `add`, and the current replacement of missing, `null`, or
  scalar traversal values with `{}` or `[]` as appropriate.
- A stored `set` without a defined `newValue` retains the legacy checked-delete meaning. Strict new
  publish input rejects that ambiguity and requires an explicit `delete`. Both stored and new input
  reject `add` without a defined `newValue`.
- A checked delete requires every intermediate segment and the final own property or in-bounds array
  index to exist; otherwise it returns `missing_path`. `oldValue` remains presentation metadata and is
  not a replay or concurrency condition.
- Decoder and checked replay failures use a stable internal discriminated union. Initial codes are
  `invalid_shape`, `empty_row`, `unknown_field`, `invalid_path`, `invalid_array_index`,
  `missing_new_value`, `missing_path`, `invalid_array_length`, `clone_failed`, `apply_failed`, and
  fatal `invariant_failed`. Routes map these internal results to HTTP responses rather than parsing
  error messages.
- An ordinary malformed or structurally failing approved row is skipped atomically with high-signal
  diagnostics so one row cannot take down all public rendering. The legacy audit must nevertheless
  report zero such approved rows before replay cutover. A commit or rollback invariant failure remains
  fatal and aborts the complete replay call.

Do not add submission sequence columns by default. Reconsider metadata only after the five work
packages below are complete.

## Relationship to Editable Store Loading

Most of this plan can land before `2026-07-16-editable-game-data-store-loading-plan.md`, but its
client replay and publish-grouping cutovers are deliberately coupled to that plan.

- Strict readers, decoders, the legacy audit, checked plain-object replay, dry replay, and the
  publish and approval trust-boundary migrations can be built independently.
- The store-loading work must consume the selection, decoder, and checked replay contracts defined
  here rather than introduce another normalizer or replay order.
- This plan owns path parsing, touched-root interpretation, checked action application, structured
  failures, and row-local rollback semantics. The pure foundation owns canonical-source isolation,
  canonical branch cloning, copy-on-write overlay composition, and published snapshot results.
- Do not replace top-level branches in mounted Valtio stores. Existing components subscribe
  directly to child proxies and would remain attached to replaced branches.
- The store-loading plan owns the client atomicity solution: derive the complete published baseline
  with checked replay before creating any edit-runtime proxies, then remove the transitional root
  client replay before publish-time grouping is enabled.
- Draft base revisions, stale-draft checks, and cross-submission conflict policy remain outside this
  plan and the store-loading migration.

## Work Package 1: Shared Row Decoding

The strict approved replay reader and the strict `approved | synced` history reader are prerequisites
for this package. They own status selection, `(created_at, id)` ordering, cache-error propagation, and
the replay API's existing response contract. Decoder work consumes those readers and does not add a
third selection path.

### Deliverables

1. Replace `normalizePublicActionEntries` with two result-returning decoder entry points over one
   shared internal action parser:
   - `decodeActionRowEntry(raw)` is the strict publish-input decoder for a payload without a database
     row ID. It rejects unknown action fields and returns normalized `actions` plus a `canonicalEntry`
     constructed only from validated fields; persistence uses `canonicalEntry`, never `raw`;
   - `decodeStoredActionRow(row)` is the compatibility decoder for persisted rows. It associates its
     result or error with the row ID, retains the exact immutable `rawEntry` for database comparison,
     and returns normalized `actions` for replay, moderation, history, permissions, and audit;
   - accept a single action, an action array, or a legacy mixed array;
   - reject empty or partially invalid rows;
   - enforce the frozen path and array-index grammar;
   - reject operation-local invalidity that cannot depend on target state, including `add` without a
     defined `newValue`, and reject `set` without a defined `newValue` only for strict new publish
     input while retaining its checked-delete meaning for stored compatibility rows;
   - flatten a valid payload into one ordered `Action[]`;
   - return a structured error rather than silently returning `[]`.
2. Preserve unknown fields only on stored `rawEntry` values for exact `jsonb` comparisons. The stored
   compatibility decoder may ignore those fields when producing normalized actions, but must not
   mutate the raw value. Do not compare a normalized single-action array with a stored action object
   or reconstruct a legacy mixed array from its flattened actions.
3. Move replay, moderation preview, wiki-history conversion, entity history, and audit consumers to
   the decoder without changing visible child-action presentation.

### Exit tests

- Every supported legacy shape decodes in order, while one invalid child invalidates the complete
  row.
- Stored results retain a structurally identical immutable raw `jsonb` value for the database compare
  while exposing the same flattened ordered actions for single, array, and legacy mixed shapes.
- Strict publish decoding rejects unknown action fields, and its canonical persistence value contains
  only validated fields without sharing mutable identity with the raw request.
- `add` without `newValue` and other operation-local invalid input fail decoding before replay.
- Publish preparation validates an ID-less payload through `decodeActionRowEntry`, while stored-row
  errors include their database row ID.
- Preview and history output remain unchanged for valid rows.

This package changes no database schema or publish behavior.

## Work Package 2: Read-Only Legacy Audit

### Deliverables

1. Add a reproducible read-only script with three separately labelled cohorts:
   - public `approved` replay rows;
   - public `synced` history-only rows;
   - `pending` moderation rows.
2. Decode every row with the shared decoder and report malformed rows explicitly.
3. For approved and pending rows, form candidate groups by `created_at`, `created_by`, and
   `entity_type`, then pass each decoded row to `groupActionEntriesByDependency` as one indivisible
   entry.
4. Report only actionable categories and representative row IDs:
   - malformed rows;
   - dependent candidate groups with unknown chronology;
   - already atomic multi-action rows; and
   - checked-replay failures once Work Package 3 supplies dry mode.
5. For synced rows, report decode and shape results only. Never dry replay them over the checked-in
   baseline or include them in replay-repair decisions.
6. Dry replay each pending row independently from the same approved baseline unless external evidence
   establishes one atomic submission group. Never accumulate unrelated pending rows in database
   order, because that would invent chronology and contaminate later results.

Candidate fields are a heuristic, not a submission identifier. The script must not infer authorship
boundaries, guess chronology, or modify data. Any repair requires canonical data, moderation context,
or confirmation from the original author.

Do not check raw action values or complete entries into Git. Retain cohort counts, stable error codes,
and representative row IDs only. Any malformed or structurally failing approved row blocks replay
cutover until it receives an evidence-based repair or an explicitly documented compatibility ruling.

### Exit tests

- Fixtures cover approved, synced, and pending cohorts.
- Synced fixtures are classified for history only and cannot enter the dry-replay path.
- Malformed and dependent fixtures are reported without provenance claims or mutation.

## Work Package 3: Checked Apply Semantics and Published-Baseline Handoff

### Deliverables

1. Add checked action helpers that report structural success or a structured failure while
   preserving current container creation and array-operation behavior except that previously silent
   missing delete targets become structured failures. Do not treat `oldValue` as a concurrency
   check.
2. Add one store-free row-application primitive for a decoded row and caller-supplied plain-object
   working targets:
   - derive affected top-level branches through the shared path helper;
   - capture only the row-local backups required to restore those working targets on failure;
   - apply the complete ordered action list and return a structured success or failure;
   - leave target resolution, canonical branch cloning, published snapshot composition, and final
     installation to the caller;
   - mark the row handled only after the caller successfully commits its result.
3. Preserve registry behavior: unknown entity types remain unhandled, while known no-op entity types
   are marked handled without mutation.
4. Add dry mode and run it against audited approved and pending rows on the applicable baseline.
   Review every failure with evidence before production cutover. Never dry replay synced rows.
5. Make the pure published-data foundation consume the checked path and row-application primitives.
   The checked engine must not select canonical inputs, implement the foundation's copy-on-write
   overlay, or gain a generalized mutable-target transaction adapter solely to upgrade a compatibility
   path that the store-loading migration removes.
6. Freeze the legacy server and root-client mutable replay paths as compatibility code. Keep their
   existing rollback as defense in depth and preserve the landed behavior that an incomplete rollback
   throws a fatal invariant error out of the complete replay call rather than invoking `onError` and
   continuing. Remove server mutation during the store-loading server cutover and remove root-client
   replay in Phase 4, before runtime-owned proxies are created and before publish grouping is enabled.

Keep the checked engine specific to row-level application against caller-supplied plain-object working
targets. It does not obtain canonical data, clone canonical branches for copy-on-write, or compose a
published snapshot. Mounted browser Valtio stores and module-global mutable server targets are
excluded. Do not introduce a general transaction framework, extensible commit abstraction,
runtime-poisoning protocol, or new mutable-target adapter.

The pure foundation owns returning a completed published snapshot without exposing intermediate
commits. The legacy mutable compatibility path cannot guarantee containment if rollback itself fails
because later code could observe its module-global targets. The landed immediate safeguard is to abort
the replay call with a fatal invariant error; the architectural fix is to remove that path, not attempt
to make partial mutable state recoverable.

### Checked structural result contract

Checked replay uses target shape and operation requirements only. It never compares `oldValue` with
the current value and therefore is not a stale-write or optimistic-concurrency check.

| Condition                                                                                       | Checked result                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The trimmed path is empty or contains an empty or whitespace-only dot-separated segment         | Decoder-level `invalid_path` failure before replay                                                                                                                       |
| Replay addresses an array with a non-canonical or out-of-range index segment                    | Checked `invalid_array_index` failure before mutation                                                                                                                    |
| `set` or `add` traverses a missing, `null`, scalar, or non-array value before a numeric segment | Create or replace it with `[]` when the next segment is numeric, otherwise `{}`, preserving current container-creation behavior                                          |
| `set` has a defined `newValue`                                                                  | Assign it; numeric array assignment retains current append/sparse-index behavior, and an invalid `length` assignment is a structured failure                             |
| Stored `set` has `newValue: undefined`                                                          | Treat it as a checked delete; every intermediate segment and the final own property or in-bounds array index must exist, otherwise return `missing_path`                 |
| Strict publish `set` has `newValue: undefined`                                                  | Decoder-level `missing_new_value` failure requiring an explicit `delete`                                                                                                 |
| `add` has `newValue: undefined`                                                                 | Decoder-level `missing_new_value` failure before replay; the checked helper retains the same defense-in-depth failure for typed internal callers                         |
| `add` targets an object property                                                                | Assign it, including the current overwrite behavior when the property already exists                                                                                     |
| `add` targets a numeric array index                                                             | Insert with `splice`; an index beyond the current length clamps to append, preserving current behavior                                                                   |
| `delete` targets an object property or numeric array index                                      | Every intermediate segment and the final own property or in-bounds array index must exist; then delete the property or splice the array, otherwise return `missing_path` |
| A valid `set` assigns a value already present                                                   | Structural success; value equality is not an error and does not become a concurrency check                                                                               |
| Checked apply or row-local backup throws                                                        | Structured row failure containing the row ID, target identity, action index when applicable, operation, path, stage, and cause                                           |
| Legacy compatibility rollback throws                                                            | Fatal invariant breach containing the row ID and cause; abort the complete replay call without invoking the recoverable-row `onError` callback                           |

Dry mode runs the same checks and working-copy application without committing or marking the row
handled. Audit output groups failures by stable error code and includes representative row IDs; it
does not reinterpret `oldValue` mismatches as structural failures.

### Exit tests

- A malformed row or a failure in the middle of a row leaves all targets and handled IDs unchanged.
- Focused tests cover every row in the structural-result table, including missing delete targets,
  scalar-to-container replacement, array append clamping, sparse `set`, invalid `length`, and a
  successful equal-value `set`.
- Checked replay reads and mutates only caller-supplied working targets; it does not resolve canonical
  inputs, clone canonical branches, or install published snapshots.
- A failed row restores its supplied working targets and leaves handled IDs unchanged.
- The legacy compatibility path rethrows rollback invariant errors from the complete replay call and
  is removed rather than adapted into the checked engine.
- The edit runtime creates Valtio proxies from the fully replayed published baseline; approved action
  rows are never replayed against mounted proxies.
- After the edit runtime reaches ready and a consumer subscribes to a child proxy, lifecycle and
  draft operations do not invoke public replay or replace that subscribed proxy.

Publish-time grouping must not be enabled until the store-loading plan removes the transitional root
client replay. At that point all normal rendering and edit initialization consume the checked
published baseline before any client proxy exists.

## Work Package 4: Trusted Publish Preparation

### Server preparation

1. Keep client-side `squashActions` as an optimization and presentation improvement only; client
   output is untrusted.
2. Add one server-side preparation helper used by both `/api/game-data-actions/publish` and
   `/api/game-data-actions/publish-relations`.
3. Reject oversized input before dependency analysis. Shared named limits must cover request bytes,
   top-level entries, flattened child actions, actions per atomic entry, path length, and message
   length. Choose the constants once from current valid client output plus explicit operational
   headroom, enforce them in both routes, and test every boundary. Enforce the byte limit through a
   platform limit or bounded body reader before `request.json()` materializes the complete payload;
   `Content-Length` alone is not sufficient.
4. After the bounded schema and route-specific allowlist parse, establish the authenticated actor and
   permission grants before running the quadratic dependency analyzer. Do not perform grouping for an
   unauthenticated request.
5. Merge entries for the same entity type, then call `groupActionEntriesByDependency` on its top-level
   entries.
6. Preserve singleton groups as their existing entry. Flatten a multi-entry dependency group into one
   ordered `Action[]`, retaining original action order, and emit the group at its earliest member's
   position. Entries moved across the group must commute with every member.
7. Validate every prepared row with the strict `decodeActionRowEntry`. Reject malformed, empty,
   unknown-field, split, or dropped input with a clear `400` response. Pass only its canonical
   prepared value to persistence; never persist a raw request entry.
8. Dry replay the complete prepared request against one exact approved-action snapshot before
   persistence. Operation-local invalidity is a `400`; a target-shape failure against the current
   published baseline is a `409`. This is structural validation only and does not compare
   `oldValue` or claim to resolve stale-draft and semantic conflicts. Acquire the snapshot through
   the uncached throwing `queryApprovedPublicActionRows` helper; a database failure fails closed and
   must never become the rendering reader's cached log-and-empty fallback.
9. Derive route permission contexts from every decoded child action before persistence. Select the required
   permission from the route contract—`game_data_action.create` for the standard route and
   `game_data_action.publish_relations` for the relations route—and never accept that permission key
   from the request body.

Prefer one proven semantic parent set over an ordered batch. Use an ordered action array when an
equivalent final action cannot be safely reconstructed.

Dry replay is a fail-fast check against the exact snapshot observed by the route, not a database
serialization boundary. The prepared RPC does not lock the complete approved baseline, so another
publish or approval can land between dry replay and persistence. This cross-submission race is
explicitly accepted by the current non-goals: checked replay must still reject the later row
atomically if the intervening change makes it structurally invalid. Add a revision compare or
serialization policy only with the deferred stale-draft and cross-submission conflict work.

### Database trust boundary

1. Add a prepared publishing RPC callable only by `service_role`. It accepts the route-authorized
   actor ID, the server-selected required permission key, entity type, canonical prepared rows, and
   message.
2. The RPC supports existing single-action and array-shaped row values and repeats recursive
   publishing-permission checks for the supplied actor using the server-selected route permission.
   Constrain the accepted keys to `game_data_action.create` and
   `game_data_action.publish_relations`, and accept the latter only for the `characters` entity type.
   Auto-approval still requires recursive `game_data_action.approve` checks for every child action.
3. Call it through the existing server-only admin client. Take the actor ID only from the route guard,
   take the required permission only from the route implementation, never take either from the
   request body, and never expose the service key.
4. After both routes cut over, revoke `EXECUTE` on the legacy `publish_game_data_actions` RPC from
   `PUBLIC`, `anon`, and `authenticated`.
5. Update `src/data/database.types.ts` with the prepared RPC signature in the same change as the
   additive migration so the admin-client call remains fully typed.

If application and migration deployment are not atomic, roll out in this order:

1. Add the service-role-only prepared RPC.
2. After the store-loading Phase 4 gate passes, deploy both route cutovers.
3. Revoke the legacy RPC in a contract migration.

The package is incomplete until the revoke is deployed; otherwise an authenticated client can
bypass route grouping by calling the legacy RPC directly.

### Exit tests

- Both routes turn dependent input into one row and leave independent input separately reviewable.
- Noncontiguous transitive groups preserve action order and replay result.
- Oversized or unauthenticated requests are rejected before dependency grouping.
- Operation-local invalid rows return `400`, and structurally unreplayable prepared requests return
  `409` without persistence.
- Unknown action fields are rejected, and persisted rows equal the canonical prepared values rather
  than the raw request entries.
- Permission contexts and database checks cover every child action.
- The standard route checks `game_data_action.create`; the relations route checks
  `game_data_action.publish_relations`; a relation-only publisher can publish valid relation actions
  but cannot use that permission for other entity types or through the standard route.
- Authenticated and anonymous clients cannot execute either publishing persistence function, while
  the service-role path still enforces the supplied actor's permissions.

## Work Package 5: Route-Owned Approval

### Server preparation

1. Add one server-side pending-row loader and decoder used by both the single-action and batch
   moderation routes.
2. Decode the complete stored row with `decodeStoredActionRow` before approval. One malformed child
   makes the row ineligible for approval; the single route returns a clear client error and the batch
   route reports that row as a per-row failure without approving valid siblings from the same row.
3. Retain both the exact raw `entry` and normalized actions from the decoded result. Dry replay the
   normalized row against one current approved-action snapshot before approval; report structural
   failure without changing the pending row. This check does not compare `oldValue` or decide
   cross-submission conflicts. Acquire the snapshot through the uncached throwing
   `queryApprovedPublicActionRows` helper; a database failure fails closed and must never approve
   against an empty cached fallback. The same accepted cross-submission race described for publishing
   applies between this dry replay and the prepared approval RPC.
4. Keep rejection available for malformed or structurally failing pending rows so moderators can
   remove them from the queue.
   Rejection does not require a successful action decode because it never makes the row public.
5. Take the approving actor ID only from the route guard. Never accept it from the request body.

### Database trust boundary

1. Add a prepared approval RPC callable only by `service_role`. It accepts the route-authorized
   actor ID, action ID, expected entity type, and the exact raw stored `entry` retained by the route.
2. Under a row lock, require the row to remain pending, recursively repeat
   `game_data_action.approve` permission checks for every child action and the supplied actor, and
   require its current `entity_type` and raw `entry` to equal the route-supplied expected values before
   performing the existing approval transition atomically. Never compare the normalized `Action[]`
   with the stored JSON. This compare closes the read/decode/approve race without treating action
   `oldValue` fields as concurrency controls.
3. Call the prepared approval RPC through the existing server-only admin client from both moderation
   routes. Batch moderation may call it once per decoded row so each database row remains an
   independent moderation result.
4. After both approval routes cut over, revoke `EXECUTE` on the legacy
   `approve_game_data_action` RPC from `PUBLIC`, `anon`, and `authenticated`. The rejection RPC may
   remain available because malformed rows must still be rejectable and rejection cannot publish
   data.
5. Update `src/data/database.types.ts` with the prepared approval RPC signature in the additive
   migration.

If application and migration deployment are not atomic, roll out in this order:

1. Add the service-role-only prepared approval RPC.
2. Deploy the single and batch moderation route cutovers.
3. Revoke the legacy approval RPC in a contract migration.

This package is not sufficient while the legacy publish RPC remains callable: an actor with
auto-approval permission could still publish a malformed row directly. Final trust-boundary
verification therefore occurs only after both legacy publish and approval RPCs are revoked.

### Exit tests

- A valid pending single-action or array-shaped row is decoded and approved as one unit.
- Single-action objects and legacy mixed arrays use their unchanged raw JSON for the row-locked
  compare while permissions and replay use normalized actions.
- One malformed child prevents approval of its complete row, while rejection of that row still
  succeeds.
- A structurally failing row remains pending and rejectable.
- Batch approval reports malformed rows separately and never partially approves one database row.
- A status, entity-type, or entry change between route decoding and RPC execution fails the
  row-locked compare.
- Resource-scoped approval permission is checked recursively for every child action using the actor
  ID supplied by the route guard.
- Authenticated and anonymous clients cannot execute either approval persistence function, while the
  service-role route path can call the prepared function.
- Moderation approves or rejects each prepared database row as one unit.

## Dependency Analyzer Cutover Requirement

The analyzer currently treats numeric `set`-deletes as structural array removals. Before publish-time
grouping is enabled, conservatively classify every direct numeric array `set` as structural and add
focused counterexamples proving that client-supplied `oldValue` cannot split noncommuting array
operations into separate rows. Publish correctness must never depend on the truthfulness of
client-supplied `oldValue`.

## Deferred Submission Metadata

Evaluate metadata only if completed implementation shows a concrete need to:

- group independent rows for moderation;
- distinguish submissions in operational diagnostics;
- display submitted order across independent rows; or
- satisfy an external integration.

If justified, add nullable `submission_id uuid` and `entry_index integer`, plus a unique constraint on
non-null `(submission_id, entry_index)`. This metadata is diagnostic and must not override dependency
grouping, base revisions, or conflict policy.

## Delivery Order

1. The two decoder layers and consumer migration, using the strict readers as prerequisites.
2. Initial read-only three-cohort audit.
3. Checked plain-object replay engine and dry audit replay.
4. Evidence-based legacy repairs, if required.
5. Pure published-data replay cutover and removal of legacy server mutation; do not adapt the legacy
   mutable replay into the checked engine.
6. Add bounded publish schemas and authenticated preparation, then add the service-role-only prepared
   publishing and approval RPCs.
7. Land and test server publish preparation without switching route persistence; dry replay pending
   rows and cut over the single and batch approval routes.
8. Revoke the legacy approval RPC and verify the route-owned approval boundary.
9. Complete Phases 1–4 of the editable store-loading plan: normal clients use published read models,
   edit proxies are created from the fully replayed baseline, and transitional root client replay is
   removed.
10. Pass the dependency-analyzer cutover gate, enable publish-time dependency grouping, and cut over
    both publish routes.
11. Revoke the legacy publish RPC and verify the complete publish and approval trust boundary.
12. Re-run the approved, synced, and pending audits after the revokes so no row created through a
    closing bypass escapes review.
13. Complete moderation verification.
14. Decide on submission metadata only if evidence meets the deferred gate.

Items 1–8 can progress alongside the editable store-loading implementation. Item 9 is the explicit
cross-plan gate for publish grouping; the remaining order is required.

## Final Validation

- Run focused unit and route tests for each work package, then `npm run lint`, `npm run type-check`,
  and the full Jest suite for the cross-cutting replay and publish changes.
- Run `npm run build:skip-images` after query, RPC, migration, and replay cutovers.
- Compare audit output against representative approved, synced, and pending rows without mutation.
- Mark an approved row synced and confirm it disappears from replay and dynamic wiki history while
  remaining in entity-update and audit history.
- Force a middle-action failure and confirm no target or handled-ID state remains partially changed.
- Force a legacy compatibility rollback failure and confirm it aborts the complete replay call without
  invoking the recoverable-row callback or processing a later row.
- Create the edit-runtime proxies from a baseline containing representative approved rows, mount a
  child-proxy subscriber, and confirm no public-action replay replaces its subscribed proxy.
- Submit repeated scalar edits, structural array edits, and unrelated fields; inspect database row
  boundaries, moderation units, and final replayed data.
- Submit an oversized request and confirm it is rejected before dependency grouping. Submit `add`
  without `newValue` and confirm it fails decoding rather than becoming pending or approved.
- Submit unknown action fields and confirm strict publish decoding rejects them; confirm persistence
  receives only canonical prepared values.
- Approve stored single-action and legacy mixed-array rows and confirm the RPC compares their exact
  raw JSON while permissions and dry replay consume normalized actions.
- Attempt direct browser-authenticated calls to both legacy and prepared publish and approval RPCs
  after the contract migrations and confirm that all are denied.
- Attempt to approve and then reject a malformed pending row; approval must fail without mutation and
  rejection must succeed.

The plan is complete when all active consumers use the purpose-specific readers and decoder, synced
rows are never replayed, ordinary checked-row failures leave no partial published snapshot, legacy
rollback invariant breaches abort replay, mutable server and root-client compatibility replay are
removed before publish grouping, new separately stored rows commute, the legacy publish and approval
bypasses are closed, operation-local invalidity and unknown fields cannot be persisted, detected
baseline-structural failures fail before persistence, and existing valid stored row shapes remain
compatible.

## Non-Goals

- Recording raw UI interactions as a permanent event log.
- Replacing local draft or undo history.
- Solving stale drafts or cross-submission conflicts through replay order.
- Defining last-writer-wins conflict policy.
- Building a generalized event-sourcing, command-bus, or transaction framework.
- Implementing route read models, lazy edit-runtime loading, or client bundle boundaries inside this
  plan; those changes remain owned by the editable store-loading plan.
