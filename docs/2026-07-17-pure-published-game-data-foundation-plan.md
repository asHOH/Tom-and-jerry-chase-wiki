# Pure Published Game-Data Foundation Plan

## Status

- Date: 2026-07-17
- State: Proposed
- Scope: Identity-isolated canonical game data, an immutable approved-action input, and pure
  per-domain public-action overlay

## Relationship to Other Plans

- `2026-07-16-editable-game-data-store-loading-plan.md` owns published-snapshot caching, build and
  action revisions, route read models, server and client cutovers, the lazy edit runtime, and removal
  of the transitional root replay.
- `2026-07-17-public-action-semantic-ordering-plan.md` owns database-row selection, decoding,
  normalization, deterministic ordering, path and touched-root interpretation, checked action
  application, row-local rollback semantics, publish grouping, and the publish and approval trust
  boundaries.
- This plan supplies the store-free foundation consumed by both. It must reuse the semantic-ordering
  contracts and must not create a second decoder, ordering rule, or mutation language.
- This plan owns canonical-source isolation, canonical branch cloning, copy-on-write overlay
  composition, and the resulting pure published values. Those responsibilities do not belong in the
  checked replay engine.

This work can land independently beside the current global server targets. Landing it must not
change route output or client behavior.

## Goal

Provide one server-safe way to answer:

> Given canonical data for one publishable domain and one immutable ordered action snapshot, what is
> the published value for that domain?

The answer must be deterministic and must not mutate canonical data, the action snapshot, legacy
server targets, or Valtio stores.

This foundation is complete when every publishable domain can be produced through that pure path and
the result is behaviorally equivalent to the current checked replay for the same inputs.

## Why This Needs a Separate Plan

The implementation is bounded, but it is not a one-file mechanical extraction. Three details need
to be solved together:

1. Current static-looking values and legacy replay targets can share object identity.
2. Characters and cards contain derived data assembled by `GameDataManager`, while the other
   domains mostly expose checked-in records directly.
3. Reusing the checked mutating replay engine without mutating canonical data requires a deliberate
   copy-on-write boundary.

The solution below resolves those details without committing to caching or route migration.

## Decisions

### One publishable-domain contract

Move the publishable entity-type list and its type to a store-free module under
`src/lib/gameData/`. Both the edit registry and the published-data foundation consume that module.

The database boundary continues to accept `entity_type: string`. Only rows recognized by the
shared normalizer are narrowed to `PublishableEntityType`.

The initial publishable domains remain:

| Domain          | Canonical shape                  | Persisted entity prefix    |
| --------------- | -------------------------------- | -------------------------- |
| `characters`    | Record keyed by character ID     | character ID               |
| `cards`         | Record keyed by card ID          | card ID                    |
| `entities`      | Existing checked-in record shape | existing entity path       |
| `buffs`         | Record keyed by buff ID          | buff ID                    |
| `items`         | Record keyed by item ID          | item ID                    |
| `fixtures`      | Record keyed by fixture ID       | fixture ID                 |
| `maps`          | Record keyed by map ID           | map ID                     |
| `modes`         | Record keyed by mode ID          | mode ID                    |
| `specialSkills` | Record keyed by faction, then ID | faction and skill ID       |
| `achievements`  | Record keyed by faction, then ID | faction and achievement ID |

The overlay must use the stored action path exactly as decoded by the shared action-entry
normalizer. It must not infer a different path from UI route parameters. Known compatibility rows
that are deliberately non-publishable retain the semantic-ordering plan's no-op behavior; unknown
entity types remain ignored and observable through existing diagnostics.

### Canonical data is isolated by identity

Create a server-only canonical-source registry with one getter per publishable domain. A canonical
root and all mutable nested branches must not share identity with a legacy target that public replay
can still mutate.

Use these construction rules:

- Extract pure character and card builders from `GameDataManager`'s raw inputs and derived-field
  logic. The existing `GameDataManager` accessors and the canonical registry must call the same
  builders so their results cannot drift.
- For directly checked-in domains, construct one server-only canonical root from the checked-in
  definitions. During coexistence, isolate it once from any legacy mutating target with a deep
  clone at the boundary.
- Do not use a Valtio proxy, `src/data/store.ts`, or a module cache that legacy replay mutates as a
  canonical source.
- Expose canonical values through deep-readonly types. Do not deep-freeze the production graph.
  Tests provide the mutation guard without adding normal-request work.

Cloning once while establishing an isolated server-only canonical root is acceptable. Cloning the
complete graph for each selector call is not.

### The action input is an immutable value

Introduce an `ApprovedActionSnapshot` value containing the ordered results of
`decodeStoredActionRow`. Construction makes a private copy of the row array and of mutable
normalized actions, then exposes a deep-readonly type. Retain any immutable raw entry or metadata
that the parent plan needs for revision or history, but replay consumes only the normalized actions.

This foundation does not fetch or decode rows and does not decide cache identity. Callers supply
rows already selected, ordered, and decoded by the semantic-ordering path. The parent plan later
adds the action revision and caching around this value without changing overlay semantics.

Do not put a module-global handled-ID set in the snapshot or selector. Each overlay evaluation uses
fresh, call-local replay state.

### Pure overlay through copy-on-write plus checked replay

The overlay remains pure at its public boundary while reusing the existing checked mutating replay
engine internally:

1. Select only decoded rows for the requested publishable domain. Preserve their supplied order.
2. Collect the top-level canonical branches touched by their normalized action paths.
3. Shallow-copy the domain root.
4. Deep-clone each touched top-level branch exactly once into the working root. If an action creates
   a new top-level branch, start that branch as absent rather than copying unrelated data.
5. Replay the selected database rows against only that working root with the shared checked,
   transactionally replayable engine and fresh call-local handled IDs.
6. Return the working root as a deep-readonly published value.

Gather touched branches before replay. Cloning a canonical branch immediately before each row could
erase changes made to that branch by an earlier row.

The checked replay engine remains responsible for path validation, action semantics, and restoring
all branches touched by a database row when an entry in that row fails. The overlay must not catch
and convert replay invariant failures into a partially published result.

Untouched branches may retain identity with the immutable canonical root. No returned branch may
share identity with a legacy mutable target.

For faction-nested domains, cloning the touched faction branch is the initial granularity. A more
fine-grained clone is unnecessary unless measurement shows that these selectors are costly.

## Proposed Module Boundaries

Names may change to match adjacent conventions, but the responsibilities must remain separated.

```text
src/lib/gameData/
├── publishableEntityTypes.ts       # Store-free domain list and union type
└── published/
    ├── types.ts                    # Deep-readonly domain map and snapshot types
    ├── canonicalSources.ts         # Server-only isolated canonical registry
    ├── approvedActionSnapshot.ts   # Immutable input construction
    ├── copyOnWrite.ts              # Canonical branch cloning using shared touched roots
    └── selectPublishedDomain.ts    # Pure per-domain overlay
```

The public API should remain small:

```ts
createApprovedActionSnapshot(rows);
getCanonicalGameData(entityType);
selectPublishedGameData(entityType, canonicalData, actionSnapshot);
```

`selectPublishedGameData` receives canonical data explicitly. This makes purity testable and avoids
an unkeyed closure over mutable module state. A later convenience selector may obtain the canonical
value from the registry, but snapshot caching must remain in the parent plan.

Avoid a new general-purpose data framework. A typed domain-to-value map and a small exhaustive
registry are sufficient for ten domains.

## Implementation Sequence

### Phase 1: Extract store-free domain contracts

1. Add `publishableEntityTypes.ts` with the ordered constant and `PublishableEntityType` union.
2. Update `editModeRegistry.ts` and public-action target construction to consume it without changing
   their behavior.
3. Define an exhaustive `PublishedGameDataByType` map from each domain name to its existing data
   type.
4. Keep database row types permissive at the boundary and narrow only after shared normalization.

Acceptance:

- Adding or removing a publishable domain creates a TypeScript error in the canonical registry and
  domain map until both are handled.
- Importing the domain contract does not evaluate Valtio stores or checked-in data values.

### Phase 2: Establish identity-isolated canonical sources

1. Extract pure character and card construction functions from the current manager logic.
2. Make both the existing manager path and the canonical registry use those functions.
3. Add server-only canonical getters for all directly checked-in domains.
4. Isolate every canonical root from legacy mutation at construction time.
5. Add type-level server-only and deep-readonly boundaries.

Acceptance:

- Canonical character and card output is deeply equal to the current unmodified manager output.
- Every domain root, plus representative nested mutable branches, has different identity from the
  corresponding legacy replay target.
- Mutating a representative legacy target in a test does not change its canonical value.
- Canonical-source modules do not import `src/data/store.ts`, Valtio, or `editModeRegistry.ts`.

### Phase 3: Add the immutable action snapshot and wire shared touched roots

1. Construct a private immutable action input from ordered decoded rows.
2. Reuse `decodeStoredActionRow`'s result; do not add a published-selector-specific decoder or
   action shape unless it is only a typed view of that normalized result.
3. Consume the checked replay engine's top-level touched-branch calculation so foundation-owned
   copy-on-write and semantic-owned row rollback use one path interpretation.
4. Add fixtures for top-level replacement, nested set, array editing, deletion, creation, faction
   nesting, malformed input, an unknown domain, and multiple entries in one database row.

Acceptance:

- Mutating the caller's original decoded-row array or action object after snapshot construction
  cannot change selector output.
- The touched-branch helper and transactional replay identify the same top-level branches for every
  fixture.
- No ordering or action-entry normalizer is duplicated.

### Phase 4: Implement and prove the pure overlay

1. Implement copy-on-write preparation for one requested domain.
2. Replay relevant rows with the existing checked engine and call-local handled IDs.
3. Return the published root without writing to canonical or legacy state.
4. Add table-driven equivalence tests for all publishable domains.
5. Add failure-in-the-middle coverage at the selector boundary even though row atomicity is already
   covered by the replay engine. This test proves that copy-on-write does not weaken that guarantee.

Acceptance:

- For representative actions in every domain, the pure result is deeply equal to applying the same
  rows through the current checked replay against an isolated legacy-style target.
- Canonical data and the action snapshot are deeply equal before and after selection.
- Untouched canonical branches retain identity in the returned result; touched branches do not.
- A failed multi-entry database row leaves the selector's working result as it was before that row,
  while earlier successful rows remain applied.
- Selecting one domain neither clones nor replays another domain.
- Repeated calls with the same inputs are deeply equal and do not depend on an earlier call.

### Phase 5: Land beside the legacy path

1. Export the foundation only from a server-safe game-data entry point.
2. Do not switch existing pages, metadata, history, client providers, or edit stores in this change.
3. Document the foundation as the required input to Phase 1 of the parent store-loading plan.
4. Keep legacy replay frozen except for compatibility fixes needed to maintain equivalence until the
   parent plan performs the server cutover.

## Validation

Run validation in proportion to the touched source:

```powershell
npm run lint
npm run type-check
npm test -- --testPathPatterns=gameData
```

Also run the focused character/card manager tests if their builder extraction is not already covered
by the game-data filter. A production build is not required for the foundation alone because it
does not change imports used by routes; the parent plan owns build and bundle validation at cutover.

## Risks and Controls

### Derived character or card data drifts

Control: extract shared pure builders and make the old and new entry points call them. Do not copy
the derivation logic into the canonical registry.

### Copy-on-write interprets a path differently from rollback

Control: share the top-level touched-branch helper with checked replay and exercise it with persisted
path shapes from every domain.

### A canonical value still aliases a mutable legacy branch

Control: add root and representative nested identity assertions for all domains, plus a mutation
isolation test. Deep equality alone cannot detect this problem.

### Pure selection becomes a full-graph clone

Control: assert identity preservation for untouched branches and use a test instrument or injected
clone helper to prove only collected branches are deep-cloned. Do not introduce per-request deep
freeze or full-graph `structuredClone`.

### Error handling silently diverges

Control: preserve the semantic-ordering plan's treatment of malformed rows, unknown domains, known
compatibility no-ops, diagnostics, and invariant failures. Equivalence fixtures must cover each
case.

## Explicit Non-Goals

This foundation does not:

- fetch approved rows from Supabase;
- compute action, build, or global published revisions;
- define cache keys, cache tags, or invalidation;
- build the complete cross-domain published snapshot;
- build wiki-history selectors;
- build route read models or migrate server call sites;
- change `@/data` barrels or normal client imports;
- remove root public-action serialization or replay;
- create Valtio proxies, load edit mode, or restore drafts;
- change publishing, approval, or persisted action semantics; or
- optimize beyond touched top-level branch cloning without measurements.

Those steps remain in the parent plans and can begin only after this foundation satisfies its
acceptance criteria.
