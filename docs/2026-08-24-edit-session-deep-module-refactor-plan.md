# Edit Session Deep-Module Refactor Plan

**Status:** Phase 0 landed; Phases 1–5 not started
**Created:** 2026-08-24  
**Revised:** 2026-09-04  
**Scope:** Client-side game-data edit runtime, draft lifecycle, and feature-facing edit interfaces

## Decision summary

The refactor remains worthwhile, but this revised plan narrows its ownership and migration shape.

The current edit implementation is behaviorally capable and well tested, but its feature-facing
seam is shallow: 65 production files still reach raw edit stores directly. Feature code must know
Valtio store topology, faction nesting, runtime readiness, mutable proxy conventions, registry
lookup, draft history, and publishing details.

The target is one deep edit-session module for client session state and draft mechanics, exposed to
features through typed hooks. Shared action types and pure replay semantics remain shared with the
server-side game-data modules. Presentation policy remains in React callers.

The migration starts by placing typed hooks over the current runtime, not by introducing a second
compatibility runtime. Once feature callers no longer need raw stores, the current store and
registry implementation can be folded behind the session interface and its raw exports removed.

This is primarily a maintainability and testability investment. The publish-history reconciliation
work in Phase 0 has landed independently as a correctness fix; the remaining refactor should not
displace higher-priority production work.

## Current repository facts

The following remain true as of the revision date:

- `ActiveEditRuntime` exposes `stores` and `registry`.
- Store construction, draft restoration, subscriber setup, runtime installation, and teardown span
  `EditRuntime`, `editStores`, `editModeRegistry`, and `activeEditRuntime`.
- Page and relation-matrix draft workflows duplicate selection, squashing, discard, publishing,
  persistence, and result handling.
- Read-only and mutation callers traverse raw store shapes throughout feature code.
- Publishing now includes behavior added after the original plan:
  - a stable `Idempotency-Key` header backed by a session-stored operation fingerprint;
  - pending-action overlap acknowledgement through `pendingAcknowledgementToken`;
  - advisory pending-action refresh after conflict or success; and
  - advanced submit modes derived from permissions and the selected actions.
- Phase 0 inventory baseline: `65` feature-facing production files cross the raw runtime seam.
  Read paths include `53` `useOptionalEditSnapshot` and `39` `useDraftDataRuntime` callers;
  mutation and character-special-operation paths include `8` direct
  `requireActiveEditRuntime` callers. Draft orchestration remains in the page and relation hooks,
  runtime lifecycle remains in four edit modules, and `15` tests use raw runtime/store setup.
- Shared action types and replay helpers from `diffUtils` are consumed by server-side replay, audit,
  decoding, dependency, compaction, and publish modules. They are not solely edit-session details.

## Relationship to completed game-data work

This plan builds on, and must preserve, the completed architecture recorded in:

- `docs/archive/completed/2026-07-16-editable-game-data-store-loading-plan.md`;
- `docs/archive/completed/2026-07-17-pure-published-game-data-foundation-plan.md`; and
- `docs/archive/completed/2026-07-17-public-action-semantic-ordering-plan.md`.

Those plans established lazy edit-runtime loading, published snapshot revisions, canonical data
isolation, checked replay, and action ordering. This plan does not revisit those decisions.

## Problems to resolve

### 1. Feature code sees implementation details

`src/lib/edit/activeEditRuntime.ts` exposes `stores` and `registry`. Callers therefore depend on:

- Valtio as the storage mechanism;
- each publishable domain's root-store shape;
- faction nesting for achievements and special skills;
- mutable proxy references and their lifetime;
- an untyped entity registry; and
- a module-global runtime readiness convention.

Changing any of those decisions requires coordinated feature edits instead of one local change.

### 2. Draft lifecycle knowledge is duplicated

Draft behavior is distributed across:

- `src/lib/edit/editModeRegistry.ts` for restoration, subscriber setup, teardown, and clearing;
- `src/hooks/usePageEditMode.ts` for entity/domain draft selection, discard, publishing, summaries,
  idempotency, overlap acknowledgement, and cleanup;
- `src/features/character-relations/matrix/useRelationMatrixEditMode.ts` for the corresponding
  relation scope; and
- `src/components/EditRuntime.tsx` for construction and teardown ordering.

A mistake can duplicate actions, erase unrelated drafts, lose edits appended during publishing, or
record discard inversions as new changes.

### 3. Read and mutation conventions are inconsistent

Features variously use `useOptionalEditSnapshot`, `useDraftDataRuntime`, and
`requireActiveEditRuntime()`. Mutations range from shared editable adapters to direct assignments,
array mutation, nested-path helpers, and whole-record replacement.

The feature interface does not answer consistently:

- what to render while the runtime is loading;
- when mutation is allowed;
- how faction-scoped entities are resolved;
- whether a caller may retain a mutable reference; or
- which mutations produce one draft history entry versus several.

### 4. Publish cleanup can lose concurrent local edits

Both publish hooks capture the unsubmitted remainder before the request and write that captured
value after success. An edit appended while the request is in flight can therefore be overwritten.

The fix must also preserve the newer idempotency and pending-overlap protocols. Request-body
equivalence alone is no longer sufficient.

### 5. Tests often cross past the intended seam

Tests commonly install a global runtime, obtain `runtime.stores`, and inspect localStorage history.
Behavioral tests should primarily use the session interface. A small number of production-adapter
integration tests must remain to prove current storage keys, serialized draft compatibility,
runtime installation, and teardown.

## Goals

- Give feature code typed interfaces for effective domain/entity reads and synchronous edits.
- Make the edit-session module own client runtime lifecycle, Valtio proxies, topology lookup,
  subscriptions, browser draft history, scoped selection, discard, publish reconciliation, and
  disposal.
- Preserve current storage keys, serialized action values, operation fingerprints, endpoint
  requests, and revision behavior.
- Share entity, domain, and character-relation draft mechanics without coupling the session to
  localized labels, toasts, permissions, or SWR awareness state.
- Support flat domains, faction-scoped domains, whole-domain editors, entity editors, draft-only
  characters, and character-relation scope.
- Remove feature access to raw stores, the registry, subscribers, and browser history operations.
- Keep the interface small enough that a new field does not require a new command method.

## Non-goals

- Replacing Valtio or adding another state-management framework.
- Moving shared action types, validation, or pure replay behavior behind a client-only session.
- Changing the persisted action format, ordering, storage keys, or squash semantics.
- Changing Supabase schemas, trusted publishing RPCs, moderation, or approval behavior.
- Changing either publish route's request or response shape.
- Moving permission policy, pending-action fetching, localized labels, or toast wording into the
  session.
- Reworking published server read models, canonical factories, `GameDataManager`, or static-data
  imports except for a minimal compatibility edit.
- Adding a command method for every editable field or property.
- Introducing a dependency-injection container, repository framework, or revocable proxy membrane.
- Rebasing stale drafts or changing the revision-mismatch policy.
- Allowing approved actions to add a root-level character. The invariant in `AGENTS.md` remains.

## Safety invariants

### Runtime and persisted drafts

- Edit stores are created from the published baseline only after visible and baseline revisions
  match.
- Draft actions are restored before normal recording subscribers attach.
- Drafts written by the current implementation remain readable without migration.
- Exiting edit mode tears down subscribers and prevents mutations leaking into a later session.
- Re-entering edit mode creates a fresh session from the current published baseline.
- Preview and ready/loading/error states retain their visible behavior.
- Faction-scoped persisted paths retain their current format.
- Normal pages do not eagerly load the complete editable baseline.

### Discard

- Discard affects only the requested scope and preserves unrelated entries.
- Discard inversions never become recorded edits.
- Relation discard preserves ordinary character drafts and entity discard preserves other entities.
- Discard clears the scope's publish operation identity only after both the inverse replay and draft
  history persistence succeed. A storage failure keeps the operation identity and is reported.

### Publish protocol

- Production requests preserve their current endpoint, JSON body, `Idempotency-Key` header, and
  response interpretation.
- Identical retries use the same operation ID and fingerprint until confirmed local cleanup,
  explicit discard, or a confirmed no-op clears it.
- A `pending_action_overlap` response preserves drafts and operation identity, exposes its
  acknowledgement token, and remains retryable with that token.
- Advanced submit modes and permission-derived availability remain presentation-layer behavior.
- Pending-awareness refresh remains advisory: its failure cannot turn a successful publish into a
  failed publish.
- Failed publishing preserves all draft entries and operation identity.
- Successful publishing removes only entries selected from the source history captured when the
  request started.
- Entries appended while publishing survive successful cleanup, including same-scope entries.
- Cleanup rereads latest history. It proceeds only when the captured source history is an exact
  prefix, then persists the captured unsubmitted entries followed by the appended suffix.
- A divergent history or failed storage write/removal returns a successful server outcome with a
  non-fatal cleanup conflict and leaves stored history untouched.
- A cleanup conflict does not clear operation identity or silently create a new operation for a
  different fingerprint. Until the conflict is resolved, the scope cannot publish a changed draft
  that could include already accepted entries.

### Existing editing behavior

- Character creation, import, ID changes, skills, allocations, tags, media, and relations retain
  their user-visible behavior.
- Mutation grouping remains semantically equivalent; the refactor does not invent transactions that
  alter persisted action rows.
- Draft-only character routes work without a published fallback.

## Interfaces

### Entity and draft references

Reuse `PublishedGameDataByType` and `PublishedGameDataEntityByType` for data typing rather than
creating a second domain map.

```ts
type FactionScopedEditEntityType = Extract<PublishableEntityType, 'achievements' | 'specialSkills'>;

type EditEntityRef =
  | {
      entityType: FactionScopedEditEntityType;
      entityId: string;
      factionId: FactionId;
    }
  | {
      entityType: Exclude<PublishableEntityType, FactionScopedEditEntityType>;
      entityId: string;
      factionId?: never;
    };

type EditDraftScope =
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'character-relations' };
```

### Session interface

The exact generic spellings may follow adjacent TypeScript conventions, but the callable surface
and outcomes are required before implementation begins:

```ts
type EditDraftState = Readonly<{
  actionCount: number;
  publishEntries: readonly ActionHistoryEntry[];
}>;

type EditDraftOverviewItem = Readonly<{
  entityType: PublishableEntityType;
  entityId: string;
  factionId?: FactionId;
  actionCount: number;
}>;

type EditPublishOptions = Readonly<{
  message?: string;
  pendingAcknowledgementToken?: string;
  submitMode?: GameDataSubmitMode;
}>;

type EditPublishResult =
  | { status: 'empty' }
  | { status: 'published'; outcome: GameDataSubmitOutcome }
  | { status: 'pending-conflict'; conflict: PendingActionOverlapResponse }
  | {
      status: 'cleanup-conflict';
      outcome: GameDataSubmitOutcome;
      reason: 'history-diverged' | 'storage-failed';
    }
  | { status: 'failed'; error: Error };

type EditDiscardResult = { status: 'discarded' } | { status: 'storage-failed'; error: Error };

type EditSubscriptionTarget =
  | { kind: 'domain'; entityType: PublishableEntityType }
  | { kind: 'entity'; entity: EditEntityRef }
  | { kind: 'draft'; scope: EditDraftScope }
  | { kind: 'draft-overview' };

type EditSession = Readonly<{
  revision: PublishedRevision;
  readDomain: <T extends PublishableEntityType>(
    entityType: T
  ) => DeepReadonly<PublishedGameDataByType[T]>;
  readEntity: (ref: EditEntityRef) => DeepReadonly<unknown> | null;
  subscribe: (target: EditSubscriptionTarget, listener: () => void) => () => void;
  updateDomain: (entityType: PublishableEntityType, mutate: (value: object) => void) => void;
  updateEntity: (ref: EditEntityRef, mutate: (value: object) => void) => void;
  readDraft: (scope: EditDraftScope) => EditDraftState;
  readDraftOverview: () => readonly EditDraftOverviewItem[];
  discardDraft: (scope: EditDraftScope) => EditDiscardResult;
  publishDraft: (scope: EditDraftScope, options?: EditPublishOptions) => Promise<EditPublishResult>;
  dispose: () => void;
}>;
```

Implementation should tighten the `unknown` and `object` placeholders using the existing published
data maps. Do not introduce a duplicate hand-maintained entity-type map merely to make the
illustration compile.

Mutation callbacks are synchronous and may not retain their mutable value. They narrow proxy
exposure by convention; they are not a security membrane. The session never returns mutable
proxies from read methods or hooks.

### Feature-facing hooks

```ts
useEditableDomain(entityType, publishedFallback);
useEditableEntity(entityRef, publishedFallbackOrNull);
useEditDraft(draftScope);
```

The first two return a read-only effective value and a synchronous update callback. `useEditDraft`
returns observable structural draft state, the cross-domain draft overview, and discard/publish
commands. Presentation callers derive localized summaries, advanced-submit availability, warnings,
and toasts from those results.

Special operations with real domain invariants, such as character import or ID changes, remain
named operations. They receive a session mutation capability rather than acquiring the global
runtime themselves.

## Dependency treatment

### Shared action semantics

`Action`, `ActionHistoryEntry`, action validation, and pure replay behavior are shared by client and
server code. Keep them importable outside the edit session. They may remain in the existing modules;
moving them is not required for this refactor.

The session composes those helpers for restoration, inversion, squashing, discard, and publishing,
but does not claim exclusive ownership of them.

### In-process session behavior

Domain/entity lookup, draft scope selection, publish-history reconciliation, and session lifecycle
belong inside the session and are tested through its interface. Do not expose internal seams solely
for tests.

### Browser storage

Reuse `src/lib/localStorage.ts`; do not create a second browser-storage implementation. The session
may accept a narrow internal history-store dependency for tests. The production adapter delegates
to the existing wrapper and must propagate the boolean result of writes and removals rather than
discard it as `writeActionHistory` currently does.

Keep a production-adapter integration test with a serialized fixture written by the current code.
An in-memory stand-in does not prove storage-key or serialization compatibility.

### Owned publish transport

The two HTTP routes are owned remote dependencies. The session may accept a narrow publish function
used by production and tests. Start in `editSession.ts`; split an `editPublishTransport.ts` file only
if the implementation becomes independently substantial.

The production implementation owns transport mechanics only: endpoint, body, idempotency header,
and response decoding. It does not own permissions, SWR refresh, localized feedback, or toolbar
state.

## Migration strategy

Do not introduce a temporary compatibility adapter. New hooks initially use the existing active
runtime internally while legacy feature callers continue using it directly. The hooks must never
return `session.stores` or another raw proxy root.

After feature callers have migrated, replace the active holder's value with `EditSession`, fold the
current store/registry lifecycle behind it, migrate the two draft hooks, and remove raw exports.

Each phase must leave the application working and be independently revertible without storage or
server migration.

## Phase 0 — Rebaseline contracts and fix publish cleanup

### Actions

1. Inventory raw-store callers by read, mutation, character special operation, draft orchestration,
   and test-only setup.
2. Record the current publish contract for both endpoints, including:
   - body and submit mode;
   - idempotency fingerprint and header;
   - stable retry identity;
   - pending-overlap acknowledgement;
   - success/failure interpretation; and
   - advisory awareness refresh.
3. Add one pure reconciliation helper for captured source, captured remaining, and latest histories.
4. Use it in both existing publish hooks before the broader refactor.
5. Make history writes/removals report failure and surface cleanup conflict without converting the
   server success into failure.

### Acceptance criteria

- Current and appended-in-flight entries are covered for page and relation scopes.
- Same-scope and unrelated appended entries survive cleanup.
- Divergent history and failed storage operations are left untouched and reported.
- Stable operation identity survives transport failure, overlap conflict, and cleanup conflict.
- A changed fingerprint cannot be published while unresolved cleanup might include accepted rows.
- No feature read/mutation caller changes in this phase.

## Phase 1 — Add the feature read seam

### Actions

1. Add typed `useEditableDomain` and `useEditableEntity` hooks over the existing active runtime.
2. Preserve published fallback until the edit runtime is ready.
3. Migrate low-risk flat-domain catalogs and details first: items, buffs, fixtures, maps, modes, and
   entities.
4. Migrate faction-scoped achievements and special skills.
5. Migrate cross-domain readers, then character catalogs, ranking, and details.
6. Add an import rule preventing new feature imports of raw runtime/store modules while existing
   mutation exceptions remain explicitly listed.

### Acceptance criteria

- Migrated readers do not import `activeEditRuntime`, `editStores`, `useDraftDataRuntime`, or
  `useOptionalEditSnapshot`.
- Fallback, readiness, faction lookup, and draft-only character behavior match current output.
- Subscription granularity does not regress to whole-domain updates where entity updates suffice.
- Normal pages still avoid eager edit-baseline loading.

## Phase 2 — Migrate ordinary mutations

### Actions

1. Add synchronous domain/entity update capabilities behind the hooks.
2. Migrate `editableStoreAdapters.ts` and ordinary scalar, list, alias, attribute, and array editors.
3. Migrate the trait editor as a whole-domain editor.
4. Preserve mutation grouping and emitted action semantics.

### Acceptance criteria

- Feature results expose no mutable Valtio proxy.
- Mutation callbacks are synchronous and do not retain their argument.
- Representative set, add, delete, splice, replacement, and faction-nesting edits record
  semantically equivalent histories.
- No method-per-field command surface is introduced.

## Phase 3 — Migrate character and relation mutations

### Actions

1. Migrate character fields, tags, knowledge-card groups, special skills, allocations, skill
   properties/media, and relation overlays by existing submodule.
2. Change character import, creation, and ID operations to accept mutation capability rather than
   calling `requireActiveEditRuntime()`.
3. Preserve checked-in-character versus draft-only navigation behavior.
4. Validate cross-domain character reads and edits.

### Acceptance criteria

- Character features no longer acquire raw stores.
- Import, creation, ID change, skills, allocations, tags, media, and relations retain behavior.
- Draft-only routes work without a published fallback.
- Published characters remain classified by checked-in baseline membership.

## Phase 4 — Install the session and centralize draft mechanics

### Actions

1. Add `createEditSession(baseline, revision, dependencies)` using the existing store and registry
   implementation.
2. Move construction, restoration ordering, subscribers, typed lookup, and disposal behind the
   session interface.
3. Replace the active holder's value with the session only after the existing revision gate
   succeeds.
4. Move scope selection, counts, squash, discard, publish reconciliation, and transport mechanics
   behind session commands.
5. Convert `usePageEditMode` and `useRelationMatrixEditMode` into presentation adapters over
   `useEditDraft` while keeping permission, awareness, and feedback behavior outside the session.
6. Roll back partial construction if restoration or subscriber setup throws.

### Acceptance criteria

- Setup and disposal are idempotent and never leave live subscribers after failure or teardown.
- Existing serialized histories restore identically.
- Both draft scopes preserve current request bodies, headers, conflicts, submit modes, and results.
- Tests exercise behavior through `EditSession` with narrow in-memory dependencies.
- Production storage/transport adapter tests remain.

## Phase 5 — Remove raw feature access

### Actions

1. Remove the retired `ActiveEditRuntime` type and raw holder accessors; keep only the session
   holder's public interface.
2. Make edit stores, registry topology, subscribers, and browser history operations session-private.
3. Keep shared action types and pure replay helpers available to server-side game-data modules.
4. Update `src/testUtils/editRuntime.ts` with behavior-oriented session helpers.
5. Delete superseded shallow tests only after equivalent session-interface coverage exists; retain
   production-adapter integration tests.
6. Tighten the import-convention test to reject feature imports of raw runtime, stores, registry,
   subscribers, and browser history helpers.
7. Update `AGENTS.md` with the final feature-facing conventions.

### Acceptance criteria

- No production feature or app module accesses `.stores` or `.registry` on the active session.
- Removing the edit-session module would force lifecycle and draft complexity back into callers.
- Production callers and behavior tests cross the same session seam.
- No temporary compatibility adapter exists.
- Server-side action replay, audit, compaction, and publishing retain their shared imports and
  behavior.

## Validation

### Focused automated validation

- `src/components/EditRuntime.test.tsx`
- edit-session interface tests
- production storage and publish transport adapter tests
- `src/hooks/usePageEditMode.test.tsx`
- `src/features/character-relations/matrix/useRelationMatrixEditMode.test.tsx`
- editable-field and character edit-handler tests
- faction-scoped and draft-only entity tests
- import-convention tests

Replace implementation-coupled tests only when equivalent interface coverage exists. Do not delete
the few integration tests that verify production adapters, lazy loading, revision gating, and
teardown.

### Repository validation

```powershell
npm run lint
npm run type-check
npm test
npm run build:skip-images
```

Run focused Jest paths during migration and the full suite/build before raw export removal.

### Manual smoke validation

Test desktop and mobile where visible:

1. Enter edit mode from a published detail page.
2. Restore an existing serialized draft after reload.
3. Edit scalar, nested, array, and cross-domain values.
4. Discard one entity while preserving other drafts.
5. Discard relation changes while preserving ordinary character edits.
6. Publish through each supported submit mode.
7. Retry a failed request and verify the same idempotency key is used.
8. Exercise pending-overlap acknowledgement and verify drafts survive the first 409 response.
9. Append an edit during publishing and verify it survives cleanup.
10. Simulate cleanup failure and verify publishing a changed fingerprint is blocked until resolved.
11. Exit and re-enter edit mode and verify fresh session state.
12. Exercise both factions, traits, character skills, import, creation, and ID changes.
13. Trigger a revision mismatch and verify current refresh/error behavior.
14. Confirm dark mode, keyboard behavior, and touch editing remain usable.

## Stop conditions

Stop the current phase and reassess if:

- preserving stored drafts or publish operation identity requires a data migration;
- mutation callbacks cannot preserve action semantics without changing checked replay;
- hooks require eager baseline loading on normal pages;
- faction-scoped paths require a persisted-format change;
- the work begins moving shared server action semantics into the client session;
- character migration exposes an undocumented product rule;
- unresolved cleanup can produce a new publish operation containing already accepted entries; or
- removing raw access requires an equally broad replacement interface.

## Completion criteria

The plan is complete when:

- feature code reads and mutates through typed domain/entity hooks;
- one edit-session interface owns client runtime lifecycle and draft mechanics;
- page and relation workflows share selection, discard, reconciliation, and transport mechanics;
- permission, awareness, labels, and feedback remain presentation concerns;
- shared action types and pure replay remain usable by client and server modules;
- raw stores, registry, subscribers, and browser history are not feature-facing;
- current persisted drafts and publish protocol remain compatible;
- no compatibility adapter exists;
- import rules prevent raw feature access; and
- lint, type-check, full tests, build, and manual smoke checks pass.

## Suggested landing sequence

1. Publish reconciliation and current-protocol contract tests.
2. Typed read hooks and low-risk reader migration.
3. Ordinary mutation migration.
4. Character and relation mutation migration.
5. Session lifecycle plus shared draft commands.
6. Raw export removal, test cleanup, documentation, and final verification.

The lazier implementation is intentional: start with the current runtime behind the new feature
seam, reuse existing storage and action helpers, and split internal files only when their
implementation earns an independent seam.
