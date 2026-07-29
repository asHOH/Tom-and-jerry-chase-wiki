# Lean Game-Data Loading and Semantic Grouping Plan

## Status

- Date: 2026-07-16
- Last revised: 2026-07-29
- State: Foundation, published-data selectors, Lean Steps 1 and 2, and the Step 2 follow-up gate
  complete; Lean Step 3 is unblocked, actionable, and next
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

Lean Step 1 is also complete:

- Server rendering, metadata, structured data, sitemap generation, chat, and EchoFlow use the
  published selectors instead of mutating shared game-data modules.
- `ClientProvidersWithInitialData` is fetch-only, and the legacy server mutator and module-global
  applied-ID set are removed.
- `@/data` no longer re-exports Valtio stores; proxy-dependent modules use `@/data/store`
  explicitly.
- Published detail routes carry their exact published revision into edit-capable client shells,
  with character detail and faction character lists migrated as the first large-domain checkpoint.
- Published detail routes retain static generation through explicit `force-static` contracts;
  character detail retains its eight-hour ISR interval, while tagged published-data invalidation
  remains available for on-demand refresh.
- Focused characterization tests, Oxlint, strict TypeScript, Prettier, and
  `npm run build:skip-images` pass.

Lean Step 2 is also complete:

- The root provider now derives request state from the URL and lazy-loads one `EditRuntime` only
  for `?edit=1`.
- The edit baseline endpoint returns one complete published snapshot and global revision with
  private, no-store caching. It never returns approved action rows.
- Edit stores are created once per edit session from the verified published baseline. Drafts are
  restored before subscribers and editable controls become ready.
- A visible-route/baseline revision mismatch triggers one route refresh. A persistent mismatch
  leaves editing disabled with an explicit retry path.
- Root approved-row transport, `usePublicGameDataActions`, mounted-client approved replay, and the
  root raw-row history input are removed. Detail history uses route-scoped server projections.
- Normal routes no longer construct module-level game-data proxies. Mixed-mode consumers use the
  active edit session only after it exists, while normal reads use published route data or
  justified static inputs.
- Production manifests for the home page and representative character, item, map, and relation
  routes do not contain the lazy edit-runtime chunk.
- Full Jest, Oxlint, strict TypeScript, Prettier, actor-profile validation, and
  `npm run build:skip-images` pass.
- The Step 2 commit was rebased onto current `develop` while preserving advanced submission modes,
  result-derived publish messaging, auto-approve compatibility, and the current edit-button UI.
  Focused runtime, provider, registry, page-edit, relation-edit, and baseline-endpoint tests pass
  after conflict resolution.

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

### Lean Step 1 (complete): Sever legacy server mutation and mutable barrel imports

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
   and the revision used to produce them through existing page props or a narrow route projection.
   Character detail is the first checkpoint because it exercises the largest domain and the most
   shared helpers.

Exit gate:

- server rendering, metadata, and structured data show approved values without global mutation;
- `@/data` no longer re-exports Valtio stores;
- edit-only consumers use explicit store imports;
- migrated edit-capable route props carry the exact published revision used for their visible data;
- root-client replay is still the only temporary normal-path store dependency; and
- focused tests, lint, type-check, and a character-detail build/bundle check pass.

### Lean Step 2 (complete): Atomically install the lazy edit runtime and remove root replay

Preparatory code may land earlier, but runtime enablement and root replay removal are one cutover.

1. Reduce the root edit provider to URL-derived state, preview state, and initialization status.
2. Dynamically import `EditRuntime` only when `?edit=1` is active.
3. Add a dedicated server endpoint for the complete published editable baseline. It returns the
   global revision and published domains, never approved rows.
4. Keep each normal route shell free of edit-store and registry imports. Where a component serves
   both modes and its module graph reaches those imports, lazy-load only its narrow editor adapter
   after edit mode activates; do not create a parallel route implementation.
5. Replace module-level edit proxies with `createEditStores(baseline)`. Create one store set per
   edit session and pass it to the registry, subscribers, and editor adapters.
6. Restore stored draft histories before mounting editable controls. Keep loading, ready, and
   retryable error states explicit.
7. Compare the revision carried by the visible route data with the baseline revision before
   constructing edit stores. Refresh once on mismatch and wait for the refreshed route revision; if
   the second comparison still differs, keep editing disabled and offer retry.
8. Keep the baseline fixed until edit mode is exited and re-entered.
9. Replace the root raw-action history input with server-derived action-history data or a narrow
   route history projection. Do not send raw approved rows for history.
10. Remove `usePublicGameDataActions`, the root approved-row payload, and all client replay against
    game-data stores in the same cutover.

Exit gate:

- a normal route makes no editable-baseline request and does not initialize Valtio game-data
  proxies;
- direct edit entry loads one baseline and one runtime;
- the first mounted editor state already contains approved values;
- mixed-mode route modules do not retain edit stores or the edit registry in their normal chunk;
- edit stores are not constructed until the visible route and baseline revisions match;
- restore, preview, discard, publish, exit, re-entry, and cross-domain drafts work;
- no mounted client path replays approved rows; and
- non-edit route manifests no longer contain the former shared store/edit chunk.

### Lean Step 2 follow-up gate (complete): Close post-rebase correctness gaps

This gate revised the landed runtime without restoring root replay, module-level edit proxies, or a
universal published-data payload.

Consumer audit disposition:

| Consumer                                                        | Disposition                   | Reason                                                                                                                                                         |
| --------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guess-character, playstyle-quiz, and stat-showdown game clients | Published route domain        | Their clues, matching, and comparisons display current character values; each game route receives only the published character domain.                         |
| Team recommendations                                            | Published route domains       | Recommendations derive from approved character relations and supported maps; the route shares one approved snapshot across the character and map selectors.    |
| Win-rate page and character-detail win-rate view                | Published narrow projection   | The page receives only character-to-faction values, while character detail reuses its already-published character entity for aliases and faction.              |
| Article badges and authoring character selector                 | Published narrow projection   | Article routes send only the character summaries required to render badges or choose a binding.                                                                |
| Pending-article character label                                 | Intentionally identifier-only | The UI displays the submitted binding ID and does not need a game-data lookup.                                                                                 |
| Goto resolution                                                 | Published server read model   | Page and API resolution build their index from the server-only published snapshot; no snapshot is added to a client or root payload.                           |
| AI chat query tool                                              | Published lazy projection     | Its editable domains are fetched only when the tool runs, using the same published snapshot selector as the server instruction.                                |
| Navigation faction tabs                                         | Intentionally build-bound     | They identify the checked-in route taxonomy and generated faction catalog rather than rendering game-data fields.                                              |
| Client search and auto-wrap/tooltip vocabulary                  | Intentionally build-bound     | These are local/offline lexical indexes aligned with the generated route universe; route content and goto resolution remain the authoritative published reads. |
| Admin action-preview fallback labels                            | Intentionally build-bound     | Proposed actions are previewed against their explicit candidate data; canonical labels are only a stable fallback.                                             |

1. Enforce the fixed-baseline session contract in retry handling:
   - a retry before any runtime is installed may remount the lazy runtime and refetch the baseline;
   - once a runtime is ready, a persistent route-revision mismatch must not key-remount the runtime,
     fetch a newer baseline, or replay stored drafts over a replacement baseline;
   - keep editing disabled and require an explicit edit-mode exit and re-entry to acquire a new
     baseline; and
   - prove that route navigation and retry do not change the active runtime or baseline identity.
2. Audit normal-mode consumers changed from the replayed mutable stores to canonical static data,
   including games, recommendations, article clients, win-rate views, navigation/search helpers,
   and goto resolution:
   - classify each static read as intentionally tied to the checked-in build or expected to reflect
     approved public actions;
   - pass a published server read model or narrow route projection to consumers in the second
     category; and
   - do not reintroduce root approved rows or the complete published graph in the root payload.
3. Add focused regressions proving:
   - initial-load failure remains retryable without constructing a partial runtime;
   - an active-session revision mismatch cannot silently rebase cross-domain drafts;
   - explicit exit and re-entry creates exactly one fresh baseline and runtime;
   - representative normal consumers that require live published data render approved values; and
   - reviewer submission modes, auto-approve outcomes, and result-derived success messages remain
     intact through the runtime-backed page and relation hooks.
4. Run focused edit/runtime tests, full Jest, Oxlint, strict TypeScript, Prettier, actor-profile
   validation, `npm run build:skip-images`, and the representative route-manifest inspection.

Exit gate:

- one edit session retains one immutable baseline and runtime until explicit exit;
- retry cannot replace an already-ready runtime;
- every audited static consumer has a recorded static-or-published disposition;
- representative published consumers show approved values without root replay; and
- the complete validation set and bundle checks pass.

Completion evidence:

- Retry can remount a failed pre-install runtime, but it cannot remount or replace an already-ready
  runtime. A persistent mismatch now requires explicit edit-mode exit and re-entry.
- Runtime tests preserve active runtime identity, baseline identity, and cross-domain drafts across
  route navigation and mismatch handling; explicit re-entry creates exactly one fresh runtime.
- Reviewer submission modes, auto-approve behavior, and result-derived success messages remain
  covered by the runtime-backed page and relation hook tests.
- Published recommendation and goto regressions prove approved values reach representative normal
  consumers without root replay.
- Full Jest passes 219 suites and 1,214 tests. Oxlint, strict TypeScript, Prettier, actor-profile
  validation, and `npm run build:skip-images` pass.
- The `_not-found`, home, character, item, map, and relations client-reference manifests contain no
  `EditRuntime`, `activeEditRuntime`, `editStores`, or `editModeRegistry` references.

### Lean Step 3 (actionable): Enable semantic dependency grouping

Multiple users have reported valid game-data submissions failing with `dependent_rows`. A dependency
group means that its actions must retain request order and one atomic persistence boundary; it does
not make those actions invalid. Stage A deliberately rejected these requests as a temporary
fail-safe while rows from one transaction could replay in UUID order.

Step 3 is unblocked. Root-client replay is absent, the Step 2 follow-up gate has passed, and strict
decoding, the dependency classifier, complete candidate checked replay, the replay epoch, and the
prepared service-role RPC are already in place.

No database migration, approved-row compaction, or approved-action synchronization is a
prerequisite. Existing public approved rows remain inputs to complete candidate replay while new
grouped rows are checked against them. Marking an approved row synced is a separate operation that
is valid only after its effect has been incorporated into the checked-in baseline and deployed;
bulk marking rows synced would change the live replay set and must not be part of Step 3. A current
read-only approved compatibility audit is rollout validation, not a blocker to implementation.

1. Reuse the existing `rowsByEntityType` collection in trusted publish preparation, which already
   merges repeated request items for the same entity type. Do not add another merge abstraction.
2. Run the existing `groupActionEntriesByDependency` classifier on each entity type's top-level
   rows.
3. Preserve singleton groups as their existing canonical rows.
4. Flatten each multi-row dependency group into one ordered canonical action array at its earliest
   member position.
5. Re-check every generated grouped row against `PUBLISH_LIMITS.actionsPerRow`. Reject an oversized
   dependent group with the existing row-limit error; do not split a dependency group.
6. Verify that entries crossed by the move commute with every group member and that every
   separately persisted row from one request commutes with the others.
7. Keep recursive permission derivation over every grouped child action, complete candidate checked
   replay, and replay-epoch comparison unchanged.
8. Persist through the existing prepared service-role RPC. Add regressions proving that advanced
   submission modes, auto-approve outcomes, notifications, and result-derived client messaging
   remain correct when several submitted rows become one persisted row.

Exit gate:

- sanitized reproductions of the reported valid `dependent_rows` failures are accepted and persisted
  as ordered atomic rows;
- ordinary groupable dependency is no longer returned as `dependent_rows`;
- noncontiguous transitive groups preserve action order and final replay results;
- independent rows remain separate;
- dependency groups that exceed the per-row action bound are rejected before persistence;
- same-index, parent/child, and structural array cases group as defined by the classifier, while
  malformed and unknown input still fails closed under the existing decoding and replay contracts;
- route bounds, permission derivation, strict decoding, candidate replay, and atomic persistence
  tests remain green;
- result statuses, advanced submission modes, notifications, and success messages remain correct
  after row cardinality changes;
- the approved compatibility audit still reports zero malformed rows, checked-replay failures, and
  unknown entity types; and
- rollout requires no database migration or approved-action synchronization.

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
- Runtime cutover: edit workflow tests, root-provider tests, route-revision mismatch and refresh
  tests, direct/client navigation checks, route chunk inspection, and a production build.
- Stage B: dependency, post-group row-bound, preparation, route, candidate replay, and trusted
  mutation tests.
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
