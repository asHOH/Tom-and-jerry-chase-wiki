# Lean Game-Data Loading and Semantic Grouping Plan

## Status

- Date: 2026-07-16
- Last revised: 2026-07-24
- State: Foundation and published-data selectors complete; Lean Step 1 is next
- Scope: Remove universal editable-store initialization and root approved-action replay, preserve
  edit behavior, then enable publish-time dependency grouping

This is the only active execution plan for the remaining game-data work. The completed
[semantic-ordering trust-boundary record](./archive/completed/2026-07-17-public-action-semantic-ordering-plan.md)
preserves the earlier security rollout and detailed replay decisions.

## Goal

Normal visitors must not load or initialize the complete mutable game-data graph. Edit mode must
still start from the complete published baseline, restore cross-domain drafts, and preserve the
existing publish workflow.

The remaining work solves that problem directly. It does not attempt to remove every static or
canonical data value from every client bundle unless bundle measurements show that a particular
value remains a material cost.

## Completed Foundation

The following work is complete and must not be repeated:

- Phase 0 characterization covers approved rendering, metadata, structured data, wiki history,
  draft restoration, preview, discard, publish, exit, and cross-domain summaries.
- Canonical sources are identity-isolated from legacy mutable targets.
- Pure per-domain copy-on-write overlays use `decodeStoredActionRow`,
  `collectTouchedRootKeys`, and `applyCheckedActionRow`.
- One immutable approved-action snapshot has a deterministic `v1:` SHA-256 action revision.
- One production build identity and action revision produce the global published revision.
- Persistent published caching uses per-domain entries keyed by build identity, action revision,
  and entity type. The measured complete canonical graph is 1,220,169 UTF-8 JSON bytes; the largest
  domain is characters at 555,464 bytes.
- Complete snapshot, domain, entity-route, and history selectors exist alongside the legacy path.
- The publish and moderation trust boundaries, replay epoch, prepared RPCs, browser-role revokes,
  production compatibility audit, and direct array-index dependency classifier are complete.

Phase 1 validation passed focused and wider game-data tests, Oxlint, strict TypeScript,
actor-profile validation, and `npm run build:skip-images`.

## Frozen Correctness Contracts

The leaner delivery scope does not relax these contracts:

- Approved replay order remains `(created_at ASC, id ASC)`.
- One database row remains one atomic unit.
- Stored rows continue through `decodeStoredActionRow`; new publish input continues through the
  strict canonical decoder.
- Checked replay remains the only live apply engine. Ordinary failure exposes no partial row, and
  incomplete rollback remains fatal.
- Synced rows remain history-only and are never replayed.
- Approved rows are applied to plain published data before edit proxies are created.
- Approved rows are never replayed against mounted Valtio proxies.
- The edit runtime receives a complete published baseline and global revision, not approved rows.
- Stage B dependency grouping remains blocked until root-client replay is removed.

Do not add another replay engine, a mutable-target adapter, or route-scoped edit stores.

## Scope Reduction

The following parts of the previous plan are removed:

- No permanent TypeScript dependency-graph inventory.
- No checked-in migration-batch report.
- No temporary mutable-store or canonical-value allowlist framework.
- No requirement to create a dedicated read model for every route before the root cutover.
- No requirement to eliminate every canonical client value.
- No generalized dependency-injection layer.

A focused import audit using `rg`, TypeScript errors, existing tests, and bundle output is
sufficient. Migrate consumers that actually retain mutable stores or cause the measured shared
graph; leave small static client assets alone unless evidence shows a material cost.

## Remaining Work

### Lean Step 1: Sever legacy server mutation and mutable barrel imports

1. Use a focused import audit to identify:
   - imports of mutable symbols from `@/data` or `@/data/store`;
   - root imports of `usePublicGameDataActions`, `editModeRegistry`, and edit stores;
   - normal-mode client consumers that read the mutable `characters` store or an `*Edit` store.
2. Move server rendering, metadata, structured data, chat, and EchoFlow callers from legacy global
   mutation to the completed published selectors. A render or handler that needs several
   projections acquires one approved-action snapshot and passes it through.
3. Change `ClientProvidersWithInitialData` to a fetch-only compatibility path while root-client
   replay still exists. Fetching rows must no longer mutate server data.
4. After the last server caller is migrated, remove legacy server target mutation and the
   module-global applied-ID set.
5. Make proxy-dependent modules import the edit-store path explicitly.
6. Remove the mutable-store re-export from `@/data`. Keep types and justified static client values;
   do not force unrelated static assets through route models.
7. Migrate only normal-mode consumers that still depend on a mutable store. Pass published values
   through existing page props or a narrow route projection. Character detail is the first
   checkpoint because it exercises the largest domain and the most shared helpers.

Exit gate:

- server rendering, metadata, and structured data show approved values without global mutation;
- `@/data` no longer re-exports Valtio stores;
- edit-only consumers use explicit store imports;
- root-client replay is still the only temporary normal-path store dependency; and
- focused tests, lint, type-check, and a character-detail build/bundle check pass.

### Lean Step 2: Atomically install the lazy edit runtime and remove root replay

Preparatory code may land earlier, but runtime enablement and root replay removal are one cutover.

1. Reduce the root edit provider to URL-derived state, preview state, and initialization status.
2. Dynamically import `EditRuntime` only when `?edit=1` is active.
3. Add a dedicated server endpoint for the complete published editable baseline. It returns the
   global revision and published domains, never approved rows.
4. Replace module-level edit proxies with `createEditStores(baseline)`. Create one store set per
   edit session and pass it to the registry, subscribers, and editor adapters.
5. Restore stored draft histories before mounting editable controls. Keep loading, ready, and
   retryable error states explicit.
6. Compare the route revision with the baseline revision. Refresh once on mismatch; if the second
   comparison still differs, keep editing disabled and offer retry.
7. Keep the baseline fixed until edit mode is exited and re-entered.
8. Replace the root raw-action history input with server-derived action-history data or a narrow
   route history projection. Do not send raw approved rows for history.
9. Remove `usePublicGameDataActions`, the root approved-row payload, and all client replay against
   game-data stores in the same cutover.

Exit gate:

- a normal route makes no editable-baseline request and does not initialize Valtio game-data
  proxies;
- direct edit entry loads one baseline and one runtime;
- the first mounted editor state already contains approved values;
- restore, preview, discard, publish, exit, re-entry, and cross-domain drafts work;
- no mounted client path replays approved rows; and
- non-edit route manifests no longer contain the former shared store/edit chunk.

### Lean Step 3: Enable semantic dependency grouping

Only begin after Lean Step 2 proves root-client replay is gone.

1. In the existing trusted publish preparation, merge prepared entries for the same entity type.
2. Run the existing `groupActionEntriesByDependency` classifier on their top-level rows.
3. Preserve singleton groups.
4. Flatten each multi-row dependency group into one ordered canonical action array at its earliest
   member position.
5. Verify that entries crossed by the move commute with every group member and that every
   separately persisted row from one request commutes with the others.
6. Persist through the existing prepared service-role RPC and retain complete candidate checked
   replay plus replay-epoch comparison.

Exit gate:

- noncontiguous transitive groups preserve action order and final replay results;
- independent rows remain separate;
- same-index, parent/child, structural array, malformed, and unknown cases still fail closed or
  group as defined by the existing classifier;
- route bounds, permission derivation, strict decoding, candidate replay, and atomic persistence
  tests remain green; and
- the approved compatibility audit still reports zero malformed rows, checked-replay failures, and
  unknown entity types.

### Lean Step 4: Add small regression guards and finish the audit

1. Add or extend one straightforward import-boundary test proving:
   - `@/data` does not re-export mutable stores;
   - root providers do not statically import edit stores, the edit registry, or the edit runtime;
   - normal-mode code does not import the edit-store path; and
   - canonical source modules do not import edit or replay code.
2. Do not forbid all canonical client values. Add a restriction only when bundle evidence identifies
   a concrete costly import.
3. Inspect route manifests for `/_not-found`, `/`, `/characters/[characterId]`, and representative
   item, map, and relation routes.
4. Confirm that approved rows are absent from normal root payloads and edit-baseline responses.
5. Run final focused manual edit checks, full Jest, lint, type-check, Prettier, and
   `npm run build:skip-images`.

## Validation Strategy

Validate in proportion to each landing:

- Server-call-site batches: focused page/metadata/JSON-LD or API tests, lint, and type-check.
- Character checkpoint: approved-data tests plus a production bundle inspection.
- Runtime cutover: edit workflow tests, root-provider tests, direct/client navigation checks, and a
  production build.
- Stage B: dependency, preparation, route, candidate replay, and trusted mutation tests.
- Final audit: full Jest and production build.

Do not require a full suite for every small import move.

## Acceptance Criteria

The remaining work is complete when:

- normal unrelated routes do not load or initialize editable game-data stores;
- the complete editable baseline is requested only after edit mode activation;
- published route content and edit baselines use the defined global revision;
- approved changes remain visible in rendering, metadata, structured data, and history;
- approved rows are applied before proxy construction and never against mounted proxies;
- raw approved rows are absent from normal root and edit-runtime payloads;
- edit restore, preview, discard, publish, exit, re-entry, and cross-domain drafts work;
- publish-time dependency grouping preserves the frozen ordering and atomicity contracts;
- the focused import guard and final bundle audit pass; and
- lint, type-check, relevant tests, full final tests, and the production build pass.

## Stop Conditions

Stop and report rather than broadening the design if:

- a migrated selector differs from legacy visible rendering, metadata, structured data, or history;
- an approved row fails strict decoding or checked replay, or an unknown approved entity type
  appears;
- a normal client cannot be detached from a mutable store without a materially broader product
  change;
- edit initialization would require replay after proxy construction or replacement of a subscribed
  child proxy;
- route and baseline revisions still differ after one refresh;
- root replay remains reachable after the proposed atomic cutover; or
- the bundle retains the shared store graph for an import path not covered by this plan.

## Deferred and Non-Goals

- Eliminating all canonical or static data values from client bundles.
- Building a permanent import graph or allowlist system.
- Route read models for routes that do not retain mutable stores or material shared datasets.
- Stale-draft rebasing or cross-submission conflict policy.
- A new state-management framework or dependency-injection container.
- Optional local Supabase reset.
- Submission sequence metadata.
