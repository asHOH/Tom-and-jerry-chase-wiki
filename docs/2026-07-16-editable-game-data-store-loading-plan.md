# Editable Game-Data Store Loading Plan

## Status

- Date: 2026-07-16
- Last revised: 2026-07-24
- State: Phase 0 verified; parent Phases 1-5 remain
- Scope: Client bundle size, edit-mode initialization, published-snapshot caching, public-action
  replay, route read models, and data-module boundaries

Implementation status:

- The identity-isolated canonical sources, immutable approved-action value, and pure per-domain
  copy-on-write overlays required by Phase 1 landed in `5a0ebc73`, `beb94365`, and `5724e296`.
- The parent Phase 1 work for build identity, action/global revisions, measured persistent caching,
  complete snapshot composition, route read models, and history selectors has not started.
- Phases 2-5, including the import inventory, server/client consumer migration, lazy edit runtime,
  atomic root payload/replay removal, boundary enforcement, and final bundle audit, have not started.
- The semantic-ordering trust-boundary closure, post-revoke audit compatibility gate, and direct
  array-index dependency classifier are complete. The parent implementation may proceed.
- Phase 0 verification is complete. Characterization coverage now freezes approved-action effects on
  normal rendering, metadata, structured data, and wiki history, plus draft restore, preview,
  discard, publish, exit, and cross-domain summaries.

## Related Work and Dependencies

- `2026-07-17-pure-published-game-data-foundation-plan.md` owns the identity-isolated canonical
  sources, immutable approved-action input, and pure per-domain copy-on-write overlay. Phase 1 of
  this plan composes and caches that foundation; it does not redefine its domain or overlay
  contracts.
- `2026-07-17-public-action-semantic-ordering-plan.md` owns row selection, decoding, ordering,
  path interpretation, checked plain-object apply semantics, publish grouping, and publish and
  approval trust boundaries. This plan consumes those contracts and must not introduce another replay
  order, decoder, or apply engine.
- The semantic-ordering plan's post-bypass audit gate passed with zero approved malformed rows,
  checked-replay failures, and unknown entity types. Its pending output was non-provisional, and its
  only nonzero synced finding was already dispositioned as history-only shape information. Future
  audit reruns must retain those gates before live consumer migration continues.
- This plan owns the client-side atomicity solution. It must derive the complete published baseline
  through checked replay before constructing Valtio proxies, then remove the transitional root
  client replay. The semantic-ordering plan must not enable publish-time grouping until that Phase 4
  cutover is complete.
- Public-action mutations already invalidate their shared cache through
  `invalidatePublicGameDataActionsCache()`, which uses blocking expiration for the next read. This
  plan reuses that helper and cache tag; it does not add a second invalidation path.
- Stale-draft conflict detection, touched-path rebasing, and cross-submission conflict policy are
  separate correctness work. The semantic-ordering plan owns only the row-locked pending-state and
  exact-entry compare needed to make route-owned approval safe. This migration preserves the existing
  draft workflow and does not add a broader concurrency protocol.

## Decision

This is a valid, high-priority performance and architecture issue. Normal routes must not load or
initialize the complete mutable game-data graph.

The precise problem statement is:

> Every route's initial client graph includes and evaluates the complete editable game-data store.

The server module may be cached between requests, so this plan does not assume that the server
reinitializes the store for every request. The confirmed client-side behavior is sufficient to
justify the work, particularly because more than 70% of traffic is mobile.

The implementation follows one dependency chain:

1. Build identity-isolated canonical inputs and pure published-data selectors alongside the legacy
   path.
2. Cut server rendering, metadata, structured data, and history over to those selectors.
3. Migrate normal client consumers to route read models, then remove mutable stores from `@/data`.
4. Enable the lazy edit runtime and remove the root public-action payload and client replay in one
   cutover.

## Current Evidence

Two independent root-level import paths pull the editable store into all routes:

1. `src/app/layout.tsx` always mounts `EditModeProvider`. `EditModeProvider` statically imports
   `editModeRegistry`, which imports all editable stores.
2. `ClientProviders` statically imports `usePublicGameDataActions`, which also imports all editable
   stores.

When `src/data/store.ts` is evaluated, its top-level declarations use `structuredClone` and Valtio
`proxy` to create mutable copies of characters, cards, items, buffs, maps, fixtures, modes,
entities, special skills, and achievements. Checking `?edit=1` later inside an effect cannot defer
this module evaluation.

`src/data/index.ts` also re-exports both `./static` and `./store`. This mixes static or
canonical-looking data with side-effectful mutable state and makes an innocent-looking `@/data`
import capable of retaining the store graph. The current static exports are not yet guaranteed to
be immutable because server replay can mutate some of the same objects.

The existing production build artifacts confirm the effect:

| Route                       | First-load JS raw | Gzipped |
| --------------------------- | ----------------: | ------: |
| `/_not-found`               |           2.54 MB |  683 KB |
| `/`                         |           3.58 MB |  978 KB |
| `/characters/[characterId]` |           5.44 MB | 1.23 MB |

A shared chunk is 1,161.2 KB raw and 293.5 KB gzipped and is referenced by all 57 measured route
manifests. It contains the editable stores and unrelated game datasets. The build predates current
HEAD, but the responsible import chains remain present in the current source.

There is an additional root-level cost: `ClientProvidersWithInitialData` fetches and serializes the
complete public-action list into every route. The client then replays those actions against all
editable stores.

## Target Architecture

### Normal rendering

- Canonical data and approved public-action replay remain server-side.
- The server produces serializable read models for each route.
- Client components receive only that route's explicit data requirements.
- Normal client rendering does not import editable stores, `editModeRegistry`, or edit replay code.
- Client-safe modules may import data types from `@/data/types`, but canonical data values are
  ultimately exposed through a server-only entry point. During migration, existing client value
  imports use a temporary reviewed allowlist until they receive read models.

"Route data requirements" does not always mean one entity record. A character page can legitimately
need its character plus small projections for related cards, skills, maps, modes, tooltips, or
relations. List pages may require one complete entity category, while games may require several
categories. The goal is explicit, justified data dependencies rather than an artificial one-record
limit.

### Edit rendering

- The root edit provider remains lightweight and only exposes URL-derived edit state.
- When `?edit=1` is active, an edit runtime is loaded dynamically.
- The edit runtime owns Valtio stores, the edit registry, local draft restoration, and
  subscriptions. It does not receive or replay approved action rows.
- The runtime loads the complete published editable baseline only after edit mode is activated. A
  route-scoped read model is not sufficient because draft summaries, cross-route navigation, global
  discard, and draft restoration span all publishable entity types.
- The server produces the editable baseline through the same published-data selectors as normal
  route models. The response includes the global published revision so an edit-capable route and
  the runtime can detect a stale baseline without comparing the complete graph.
- The runtime creates mutable proxies from the already-published baseline, restores the existing
  local draft history, and keeps that baseline fixed for the edit session. It does not refresh
  approved data while the user has in-progress edits.
- No approved action row is replayed after those proxies are created. Editor components that call
  `useSnapshot` mount only after the runtime-owned proxy set exists and initialization reaches ready,
  so no subscribed child proxy is replaced by public replay.
- Editable UI becomes interactive only after the complete baseline and stored drafts have been
  restored. Initialization failure keeps editing disabled and exposes a retry path rather than a
  partially initialized editor.

Loading the registry dynamically inside `EditModeProvider` alone is insufficient. `usePageEditMode`,
editable primitives, `useSnapshot` consumers, and direct store imports must also be placed behind
the edit boundary or removed from the normal rendering path.

Loading the complete graph in edit mode is acceptable. The performance requirement is that normal
visitors do not download or initialize it. Do not introduce route-scoped edit stores unless future
measurements show that edit-mode loading itself needs optimization.

### Canonical data contract

- Canonical source objects are never mutated by public-action replay, edit mode, or consumer code.
- Canonical exports use deep-readonly types where practical. Type-level `Readonly<Record<...>>`
  alone is not considered an immutability guarantee because nested records remain mutable and casts
  can bypass it.
- Final canonical value entry points are marked server-only. Client-safe modules receive values
  through serializable read models and may import only types or explicitly approved small client
  assets.
- Published-data replay is pure and uses copy-on-write or equivalent cloning of changed branches.
- Canonical source objects and nested branches must not share identity with any legacy target that
  is still mutated during migration. When the same raw module feeds both paths, the legacy path
  operates on a private mutable copy.
- Mutable Valtio proxies are created only inside the edit runtime from the published editable
  baseline.
- A production deep-freeze of the complete dataset is not required. Tests enforce the non-mutation
  contract without adding runtime work to normal routes.

### Published snapshot and revision contract

- There is one global published revision used to compare route models with the complete editable
  baseline. It consists only of the immutable production build identity and the action revision.
- The production build identity is one opaque value generated once while evaluating `next.config.ts`
  for a build. Use a new optional server environment variable, `DEPLOY_BUILD_ID`, when the deployment
  system provides an immutable build/deployment ID; otherwise generate a random UUID fallback once
  for that build. Return that exact value from
  `generateBuildId` and expose the same value through a server-only build-time constant. Do not use
  `NEXT_PUBLIC_BUILD_TIMESTAMP`, runtime server-start time, or a commit SHA alone: they either expose
  an unnecessary client value or do not uniquely identify every built deployment.
- That immutable production build identity is part of the global revision and every published-cache
  key. Canonical-data and selector changes therefore receive a new cache identity without a second
  canonical-source hashing or version-generation system. Every server instance using one built
  artifact must use the embedded value; local development may generate a new value per dev-server
  start.
- One immutable approved-action snapshot contains the ordered, normalized rows and its action
  revision. The action revision covers every field that affects replay or published history,
  including action identity, order, entity type, entry, and visible history metadata.
- The action revision encoding is versioned and deterministic. Serialize the ordered approved rows
  as a `v1` array of explicit positional tuples containing `id`, `created_at`, `entity_type`, the
  normalized canonical action list, `status`, `created_by`, `message`, and `reviewed_at`. Preserve
  array order, recursively sort object keys, encode absent optional metadata as `null`, serialize as
  UTF-8 JSON without insignificant whitespace, and hash with SHA-256. Expose lowercase hex prefixed
  with `v1:`. Add fixed test vectors so browser, Node, or database JSON key order cannot change the
  revision. The raw stored entry remains available for approval race comparison but is not used as
  an order-sensitive object serialization shortcut.
- A request acquires the approved-action snapshot once. Metadata, structured data, page rendering,
  history, route read models, and editable-baseline composition derive from that exact snapshot.
- Start with one immutable complete published snapshot per request, derived from the exact immutable
  action snapshot represented by its revision. Before placing that complete graph in the persistent
  Next data cache, measure its canonical serialized byte size and verify it against every supported
  production cache backend. If the complete value is not safely below the smallest supported item
  limit, cache per-domain published values by the same build identity and action revision and compose
  the complete editable baseline request-locally. In either form, computation must not close over
  unkeyed action rows or independently refetch a newer action set.
- Route and domain selectors derive serializable projections from one revision-consistent published
  snapshot view. Persistent caching uses either the measured-safe complete value or per-domain values
  selected by the byte-size gate above; do not introduce independently versioned domain revisions.
- The complete editable baseline is the domain data from that one published snapshot, not a
  composition of independently versioned results.
- The existing public-action cache tag and hard-expiration helper invalidate action and dependent
  published-snapshot caches after public mutations. A new deployment receives a new build identity,
  so canonical-data or implementation changes cannot reuse an older snapshot.

## Implementation Plan

### Phase 0: Confirm behavioral invariants (complete)

Use the existing evidence as justification. In the first implementation change:

1. Add or confirm tests showing that approved public actions affect normal rendering, metadata,
   structured data, and wiki history.
2. Add or confirm edit tests for restore, preview, discard, publish, exit, and cross-route drafts.
3. Define one canonical-data-only change and one code-only change with an unchanged approved-action
   set so cache-key tests prove that a new production build cannot reuse an older snapshot.

Verification record:

- An item-detail characterization applies an approved action through the legacy replay boundary and
  verifies that the published description reaches normal rendering props, generated metadata, and
  JSON-LD. Existing wiki-history tests verify approved action-derived history and entity filtering.
- Existing edit tests cover restoration, current-entity discard and publish while preserving other
  drafts, successful-publish exit, failed-publish retention, and preview rendering. Added coverage
  verifies both preview toggle directions and cross-domain draft summaries while editing one route.
- Freeze the canonical-data-only cache vector as: keep the ordered approved-action snapshot and
  selector code fixed, change one canonical item description between build identities, and require
  the second build to miss the first build's published cache and return the new description.
- Freeze the code-only cache vector as: keep canonical data and the ordered approved-action snapshot
  fixed, change one published selector projection between build identities, and require the second
  build to miss the first build's published cache and return the new projection.

The two cache vectors are specifications for Phase 1 because the production build identity and
published cache do not exist before that phase.

### Phase 1: Build deterministic published data and history selectors

Implement the canonical-source and pure-overlay work through
`2026-07-17-pure-published-game-data-foundation-plan.md`. The steps below describe how this parent
plan composes that completed foundation with revisions, caching, read models, and history.

1. Reuse the strict approved-row reader, `decodeStoredActionRow`, and checked apply helpers owned by
   `2026-07-17-public-action-semantic-ordering-plan.md`. Do not fork selection, decoding, ordering,
   or apply semantics in the new selectors.
2. Establish canonical source modules for every publishable entity type that do not share object or
   nested-branch identity with the legacy mutating replay targets. Add canonical characters from raw
   character data rather than aliasing the current mutable proxy or a cache that legacy replay can
   mutate. Where both paths originate from one raw module, make the legacy target a private copy.
3. Generate the immutable production build identity using the frozen contract above and make it
   importable by server selectors without reading the filesystem at runtime. Resolve
   `process.env.DEPLOY_BUILD_ID` or one random UUID fallback at `next.config.ts` module evaluation,
   use that exact value for `generateBuildId`, and expose it as a server-only build-time constant.
   Add `DEPLOY_BUILD_ID` to `src/env.ts` and `.env.example`. Every server instance in one deployed
   artifact must receive the same value.
4. Fetch the normalized ordered rows once as one immutable approved-action snapshot and derive the
   versioned SHA-256 action revision from the frozen tuple encoding. Add cross-process fixed vectors
   for nested objects, arrays, null metadata, and object-key reordering.
5. Define the global published revision from the production build identity and action revision. Use
   it for route models and editable baselines.
6. Compose the foundation's pure per-domain copy-on-write overlays into one complete published-data
   snapshot. Those overlays use the checked apply engine so canonical inputs remain unchanged and a
   failed database row leaves the working snapshot unchanged.
7. Measure the complete snapshot's canonical serialized bytes before choosing its persistent cache
   shape. Cache either the proven-safe complete snapshot or per-domain values by production build
   identity and action revision; compose one request-local complete view in both cases. Avoid unkeyed
   closures over action rows. Canonical imports are safe closure inputs because a new deployment
   receives a new build identity.
8. Derive route and domain read models from the revision-consistent snapshot view and retain its
   global published revision on every result. Keep selector APIs domain-oriented so the byte-size
   gate can select complete or per-domain persistent caching without changing route contracts.
9. Use the same complete snapshot as the published editable baseline. Do not add a second replay
   implementation for edit mode and do not refetch actions separately per domain.
10. Acquire the immutable approved-action snapshot once per server render or baseline request and
    derive metadata, structured data, server rendering, route read models, history, and baseline
    composition from that exact snapshot.
11. Reuse `invalidatePublicGameDataActionsCache()` and the existing public-action cache tag for the
    action snapshot and dependent published caches. Deployments invalidate canonical-data and
    implementation changes through the build-identity cache key rather than through an action
    mutation.
12. Build entity-scoped wiki-history selectors from the same immutable action snapshot while
    preserving static history as the fallback.
13. Remove reliance on a module-global `appliedPublicActionIds` set for correctness in the new
    selectors.
14. Add equivalence tests for every publishable entity type. Assert that canonical inputs are
    unchanged after replay and do not share identity with legacy mutable targets.
15. Add cache tests proving that an unchanged action set under a new production build identity cannot
    reuse an older snapshot, and that all projections from one snapshot view carry its exact global
    revision.

Build this path alongside the existing behavior first. The implementation must not clone and replay
the entire graph on every request. Keep legacy server mutation active until the Phase 2 server
cutover. Keep root client replay active through Phase 3 for unmigrated normal consumers, but treat it
as a frozen compatibility path: do not add branch-replacing commits to its mounted Valtio stores.
The semantic-ordering plan's publish grouping remains disabled until Phase 4 removes this path.

### Phase 2: Establish explicit data boundaries without changing visible behavior

1. Generate a checked-in or deterministically generated import inventory before moving consumers.
   Classify every client-reachable canonical-value import and every mutable-store import by route or
   shared feature. Use that inventory to seed the two temporary allowlists and name the Phase 3
   migration batches; do not rely on the domain list alone as proof that all consumers were found.
2. Treat the existing `@/data/store` module as the edit-only mutable entry point. Temporarily change
   proxy-dependent consumers to import this path explicitly; do not silently switch them to
   canonical data before they receive published read models.
3. Switch server rendering, metadata, and structured-data call sites to the Phase 1 published
   selectors before removing the legacy server mutation path.
4. Replace `getPublicGameDataActionsAndApplyToServerData` in the transitional root provider with a
   fetch-only path. Continue passing those rows to the existing client replay until Phase 4, but do
   not mutate server data as a side effect of fetching them.
5. After no server caller relies on mutation, remove the legacy mutating server replay and its
   module-global applied-ID set.
6. Make `@/data` export canonical data and types only, then remove `export * from './store'` from
   `src/data/index.ts`.
7. Move client type imports to `@/data/types` where practical. Treat canonical value exports from
   `@/data` as transitional and server-intended; do not mark them server-only until their existing
   client consumers have migrated in Phase 3.
8. Prefer explicit exports where a wildcard export could obscure whether a module is stateful or
   server-only.
9. Maintain a temporary, reviewed allowlist of non-edit client modules that still depend on
   `@/data/store`. It initially includes the root client replay and unmigrated normal
   consumers. Remove consumer entries during Phase 3; the root replay remains until Phase 4.
10. Maintain a second temporary allowlist of client-reachable modules that import canonical data
    values. It exists only to support incremental read-model migration and must not grow without
    review.
11. Add a boundary check that permits `@/data/store` and canonical-value imports only from their
    respective temporary allowlists, and prevents mutable modules from being re-exported by `@/data`.

The ordering inside this phase is required: the pure barrel is enforced only after the server no
longer depends on mutating canonical-looking exports. This phase is not expected to remove the
universal client bundle because the root client replay remains active for unmigrated consumers.

### Phase 3: Migrate normal consumers to published read models

1. Migrate `/characters/[characterId]` early because it has the highest measured first-load
   JavaScript and exercises relations, skills, cards, tooltips, metadata, and history.
2. Define a serializable `CharacterDetailReadModel` owned by the route. It contains the published
   character record, only the related-card, skill, map, mode, tooltip, relation, and history
   projections used by the page, and the global published revision. Build it in the server route and
   pass it to read-only client components through props or a narrow route-local read context.
3. Include the published revision in each edit-capable route model and pass it to that route's
   editor entry point. The complete game graph must not be passed with it.
4. Split read-only presentation from editor-specific controls. During this phase, existing editor
   modules may continue to use the current provider and explicit edit-store imports; Phase 4 moves
   those modules behind the lazy boundary after the read-only path no longer needs them.
5. Continue through the named route/shared-feature batches produced by the Phase 2 import inventory.
   At minimum those batches must account for cards, items, buffs, maps, fixtures, modes, entities,
   special skills, achievements, and every shared cross-domain consumer; a domain name without its
   concrete importing routes is not a migration batch.
6. Migrate shared search, tooltips, relations, rankings, and games using purpose-built projections
   rather than passing the complete graph.
7. Provide entity-scoped action-derived history to every migrated history display.
8. Remove each consumer from both temporary allowlists only after approved-data, hydration, and
   client-bundle tests pass for that route.
9. Ensure client utility modules used by migrated components accept explicit projection inputs and
   do not hide canonical value imports behind search, tooltip, relation, or navigation helpers.

Keep the root public-action replay until no normal consumer depends on it. This temporarily
duplicates some work but preserves behavior during incremental delivery. Each domain migration must
be independently testable and measurable.

### Phase 4: Cut over to the lazy edit runtime and remove the root payload

This phase is gated on Phase 3: no read-only presentation or shared normal-mode client consumer may
read an editable store. The transitional root client replay is the only remaining normal-path
exception and is removed in the same production cutover. Static editor imports can remain until
this phase moves them behind the lazy boundary.

1. Reduce `EditModeProvider` to search-parameter state and lightweight context.
2. Dynamically import a dedicated `EditRuntime` only when `?edit=1` is active.
3. Move the following behind that boundary:
   - `editModeRegistry`
   - all Valtio edit stores
   - draft restoration and persistence subscribers
   - `usePageEditMode`
   - edit toolbars and editor-only controls
4. After activation, request the complete published editable baseline produced by the Phase 1
   selectors through a dedicated server endpoint. Its response contains the global published
   revision and published domain data, but no approved-action rows. Do not include it in the normal
   root payload.
5. Have each edit-capable route pass its route-model revision to the editor entry point. Compare it
   with the baseline revision. If they differ, refresh the route once before enabling controls so
   the read-only route content and editor begin from the same published state. Compare again after
   the refresh; if the revisions still differ, keep editing disabled and show a retryable
   initialization error instead of looping or continuing with mixed baselines.
6. Replace the module-level proxy declarations in `@/data/store` with a `createEditStores(baseline)`
   factory. `EditRuntime` creates exactly one store set for an edit session; the registry,
   subscribers, and editor adapters receive that store set rather than importing singleton proxies.
7. Treat the server-produced baseline as the final published input to `createEditStores`. Do not pass
   approved action rows to the factory and do not invoke public-action replay after proxy creation.
8. Restore the existing local draft histories into the runtime-owned stores before enabling controls,
   and keep the baseline and global revision fixed until edit mode is exited and re-entered.
9. Expose explicit loading, ready, and initialization-error states through the edit runtime context.
   Do not mount editable controls until initialization reaches ready.
10. Replace the root `WikiHistoryProvider` action payload with route-local published history data.
11. Remove `usePublicGameDataActions` and complete public-action rows from normal root providers only
    after the preceding gates pass.
12. Verify direct edit loads, client-side entry, navigation with drafts across different domains,
    existing-draft restoration, preview, discard, publish, exit, and re-entry.
13. After production verification confirms that no mounted client path replays public rows, release
    the semantic-ordering plan's gate for publish-time dependency grouping.

The root action payload and root replay must be removed together. Removing only the edit registry
imports is safe as an earlier preparatory change, but it does not deliver the universal store-chunk
reduction while root public replay still imports every store.

Preparatory runtime code may land disabled, but production enablement of the new `EditRuntime`,
creation of its baseline-derived proxies, and removal of root replay and root action payload are one
atomic cutover. Two independently replayed editable graphs must never be active in the same client
session.

### Phase 5: Prevent regression and complete the bundle audit

Add an automated boundary check using an existing lint/import-restriction mechanism or a small CI
script:

- Non-edit code must not import the edit-store path.
- Client-reachable code must not import canonical data values. Type-only imports from
  `@/data/types` and explicitly approved small client assets remain allowed.
- The pure `@/data` barrel must not re-export mutable stores.
- Root providers must not statically import the edit runtime.
- Canonical modules must not import action replay or edit code.
- Canonical value entry points are marked server-only after the client canonical-value allowlist is
  empty. The compatibility `@/data` value barrel is either server-only or removed.
- Both temporary Phase 2 allowlists must be empty before final completion.

Do not add a custom framework or generalized dependency-injection layer solely for this rule.

## Risks and Mitigations

### Approved changes disappear

Current public-action replay mutates both canonical-looking and editable objects. Server selectors
must preserve exactly what visitors see today.

Mitigation: keep root client replay active until normal consumers have moved to published read
models. Add equivalence tests that replay representative approved actions for every publishable
entity type and compare the old visible result with the new published read model before removing the
root replay.

### Canonical data is mutated accidentally

The current data manager exposes cached objects that are only shallowly typed as readonly, and
existing replay code casts canonical-looking records back to writable records.

Mitigation: use deep-readonly canonical types, apply approved actions through copy-on-write overlays,
ensure the legacy mutable path operates on identity-isolated copies, and test object identities plus
snapshots or hashes before and after replay. Do not rely on a production deep-freeze for correctness.

### Hydration mismatch

The server-rendered record and client editor could begin from different data versions.

Mitigation: include the same global published revision in route models and the server-produced
editable baseline. If the revisions differ on edit activation, refresh the route once before
creating proxies or restoring drafts. Keep that baseline fixed for the edit session.

### Draft behavior changes during migration

Changing when the editable baseline and proxies are created could alter draft restore, preview,
discard, publish, or cross-route behavior even when the persisted format is unchanged.

Mitigation: preserve the existing draft storage format and replay order, load the complete baseline
before restoring drafts, and keep the baseline fixed for the edit session. Regression-test the
existing workflow across routes. New stale-draft conflict handling is outside this migration.

### RSC payload inflation

Passing the complete game dataset as props would move the cost from JavaScript chunks into the RSC
payload rather than fixing it.

Mitigation: define and measure route-specific read models. Include only required entity categories,
records, and indexes.

### Canonical data returns to the client bundle

Removing Valtio stores does not prevent a client component or helper from importing a complete
canonical dataset. That would restore a large JavaScript payload while still passing an edit-store-
only boundary check.

Mitigation: track canonical value imports separately during migration, move normal clients to
explicit read-model projections, then mark canonical value entry points server-only. Keep
`@/data/types` client-safe and assert that normal client graphs contain neither edit stores nor
canonical domain datasets.

### Edit initialization race

Editable controls could render before stores or drafts are ready.

Mitigation: keep a clear loading state and mount editor controls only after runtime initialization
completes.

### Mounted Valtio subscriptions become stale

Replacing a top-level branch after a component subscribes directly to one of its child proxies leaves
that component attached to the old proxy. A transaction that is correct as plain object state can
therefore leave mounted editor UI stale.

Mitigation: complete checked public-action replay while constructing the immutable published
baseline, then create the edit-runtime proxy set exactly once from that result. Never replay approved
rows or replace published branches after editor consumers mount. After the runtime reaches ready,
subscribe to a child proxy and verify that lifecycle and subsequent draft mutations keep that proxy
current without a public replay pass.

### Cross-route drafts are lost or applied to incomplete stores

Draft storage and summaries span every publishable entity type. Initializing edit mode from only the
current route model could omit the baseline records required by drafts created on another route.

Mitigation: load the complete published editable baseline after edit activation, then restore all
stored drafts before exposing the editor. Test a draft created in one domain while navigating to,
editing, discarding, and returning from another domain.

### Client navigation behavior

Entering edit mode after client navigation must load and initialize the runtime correctly. Leaving
edit mode does not need to evict an already downloaded chunk from the browser cache.

Mitigation: test direct edit-mode loads, client-side entry into edit mode, navigation while editing,
preview, exit, and re-entry.

### Wiki-history regression

Removing root action data could remove approved action-derived history entries.

Mitigation: provide entity-scoped history data where `SingleItemWikiHistoryDisplay` is rendered and
test static plus dynamic history merging.

### Cache and ISR inconsistency

Approved actions, metadata, structured data, and page output could use different snapshots.

Mitigation: acquire one immutable approved-action snapshot per render, use one complete published
snapshot keyed by production build identity and action revision, and derive page output and the
editable baseline from that snapshot. Invalidate public-action-dependent caches through the existing
hard-expiration helper; a new build identity invalidates deployment changes. Test both static
generation and ISR paths.

### A deployment reuses an older published cache entry

The public-action set can remain unchanged while canonical data or selector/replay code changes. An
action tag alone does not distinguish those deployments, and including a version only in the
returned payload does not change cache identity.

Mitigation: include the immutable production build identity in every published-snapshot cache key and
global revision. Add a deployment-style cache test proving that a new build identity misses the old
snapshot even when approved actions are unchanged.

## Validation Plan

### Automated tests

- Pure public-action overlay for every publishable entity type.
- Published-data equivalence with current visible behavior.
- Canonical source records remain unchanged after public-action replay.
- Global revision determinism from production build identity and the immutable approved-action
  snapshot.
- Fixed action-revision vectors prove recursive object-key sorting, array-order preservation, tuple
  field order, null normalization, UTF-8 handling, and the `v1:` SHA-256 encoding.
- Complete-snapshot serialized-size measurement selects and records either the complete-cache or
  per-domain-cache path for the supported deployment backends.
- The complete published-snapshot cache misses across production build identities when canonical data
  and approved actions do not change.
- Route read models and the editable baseline derived from one snapshot view carry its exact global
  revision, for both supported persistent-cache shapes.
- Metadata, structured data, page rendering, history, and route read models use one acquired action
  snapshot in a render.
- Edit runtime initialization from the complete published editable baseline.
- Edit stores are created once from an already-replayed baseline, receive no approved action rows,
  and do not replace a child proxy after a `useSnapshot` consumer mounts.
- Route-model and editable-baseline revision match, including the one-refresh stale-route path.
- Local draft restore, discard, preview, publish, and exit.
- Cross-route and cross-domain draft summary, navigation, discard, and publish behavior.
- Static and action-derived wiki-history merging.
- Route read-model selectors, including missing and malformed IDs.
- Import-boundary regression checks for both edit stores and canonical data values.

### Manual checks

- Load a normal route without `?edit=1` and confirm no edit runtime request occurs.
- Load the same route with `?edit=1` and confirm the edit runtime loads once and the editor works.
- Create a draft in one domain, navigate to another domain, and verify that the first draft remains
  visible and usable.
- Navigate into and out of edit mode without a full page refresh.
- Verify approved public changes in visible content, metadata, and structured data.
- Enter edit mode with approved changes present and verify the first mounted editor state already
  contains them without a client replay pass.
- Verify representative mobile interactions on character, map, and item detail pages.

### Bundle checks

After the character-detail pilot and the final lazy-runtime cutover, inspect at least:

- `/_not-found`
- `/`
- `/characters/[characterId]`
- representative migrated detail routes

Confirm that:

- the 1.16 MB shared data/edit chunk is absent from non-edit route manifests;
- non-edit routes do not contain editable stores, `editModeRegistry`, or draft replay code;
- non-edit client graphs do not contain server canonical data modules or full canonical domain
  datasets hidden behind shared helpers;
- the complete editable baseline is requested only after entering edit mode;
- approved-action rows are not serialized through the normal root or sent to the edit runtime;
- route-specific data is not duplicated into several large initial chunks.

## Acceptance Criteria

The work is complete when all of the following are true:

- A normal `/_not-found`, home, or unrelated content route does not reference the edit-store chunk.
- `structuredClone` and Valtio proxy creation for game data do not run without edit mode.
- Canonical source objects remain unchanged after approved-action replay.
- `?edit=1` supports draft restore, edit, preview, discard, publish, and exit.
- Drafts remain intact and correctly summarized across routes and entity domains.
- The complete published editable baseline is loaded only after edit mode is activated.
- Route models and editable baselines use the same defined global published revision contract.
- Published snapshot cache keys include the production build identity and action revision.
- Route read models and the complete editable baseline derive from one immutable published snapshot.
- Approved public changes appear in SSR/SSG output and after client navigation.
- Metadata and structured data use the same published snapshot as visible page content.
- The `@/data` barrel cannot import or re-export mutable state.
- Normal client graphs cannot import server canonical data values; canonical value entry points are
  server-only, client-safe type imports use `@/data/types`, and only explicitly approved small client
  assets remain client-importable.
- Complete public-action rows are no longer serialized through every root route.
- Approved rows are applied before edit proxy construction and are never replayed against mounted
  Valtio stores.
- Wiki-history displays retain approved action-derived entries.
- Bundle diagnostics show the former shared store chunk absent from non-edit route manifests.
- Lint, type-check, relevant tests, and the production build pass.

## Non-Goals

- Replacing Valtio solely because of this issue.
- Rewriting all game-data modules into a new state-management framework.
- Introducing a general dependency-injection container.
- Reimplementing public-action ordering or atomic grouping owned by the semantic-ordering plan.
- Treating action order as a substitute for draft or approval conflict detection.
- Adding a new draft base-revision, touched-path rebasing, or approval compare-and-swap protocol as
  part of this performance migration.
- Recording every raw edit interaction as a permanent event log.
- Restricting every route to exactly one entity record.
- Removing edit-mode support or changing its user-facing workflow.
- Optimizing unrelated route-specific libraries before the universal store cost is removed.

## Recommended Delivery Sequence

1. Build the production build identity, immutable approved-action snapshot, global revision,
   byte-size-selected persistent published cache, pure server-side selectors, and history selectors
   alongside the legacy path.
2. Establish the canonical/`@/data/store` boundary and server cutover with both temporary client
   allowlists.
3. Migrate character detail, followed by remaining normal consumers, reducing the canonical-value
   client allowlist to empty and the mutable-store allowlist to the root client replay only.
4. Perform the atomic lazy edit-runtime and root public-action-payload cutover, removing the final
   mutable-store allowlist entry.
5. Verify that edit proxies are created from the fully replayed baseline and that no mounted client
   path replays approved rows, then release the semantic-ordering plan's publish-grouping gate.
6. Remove the canonical-value client allowlist, mark canonical value entry points server-only, and
   complete the import-boundary and final bundle audit.

Each step should land with relevant tests. Run focused bundle verification after the
character-detail pilot and final cutover. The universal-route reduction is delivered at the Phase 4
cutover, after normal rendering no longer depends on client replay; it is not claimed by the earlier
boundary-only phases.
