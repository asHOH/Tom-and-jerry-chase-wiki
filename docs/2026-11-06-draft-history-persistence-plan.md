# Draft History Persistence Rewrite Plan

**Status:** Implemented

**Date:** 2026-11-06

**Primary outcome:** Reduce coordination between edit modules while preserving stored drafts and submission retry identity.

**Confirmed recovery scope:** Same-tab reload recovery is sufficient. Operation recovery after closing the tab is outside this rewrite.

## Decision

Make the edit session the sole owner of draft history and its relationship to publication. Implement that ownership in one private draft-journal module. The journal owns restoration, recording, persistence, draft selection, draft subscriptions, discard, submission attempts, and cleanup. Feature callers continue through `EditSession` and typed hooks.

Keep the existing localStorage history keys and action-array format. Keep the existing sessionStorage operation keys, UUIDs, and fingerprints. New game-data attempts add a versioned recovery record to their existing operation value so a reload can recover the full request and cleanup checkpoint. Existing operation values remain readable.

The working assumption is that fewer independently coordinated lifecycles matter more than a storage-engine change. Browser storage remains the persistence mechanism. Database schemas, server request semantics, article authoring, and public-data replay retain their existing contracts.

## Evidence and ownership before the rewrite

| Concern                                                       | Current owner                               | Coordination cost                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Proxy operation recording and draft restoration               | `src/lib/edit/editModeRegistry.ts`          | Registry must understand pending publish scopes before migrating history.                                                          |
| History persistence                                           | `browserEditHistoryStore` in the registry   | `append` rereads and rewrites history and discards the write result.                                                               |
| Scope selection, squash, discard, publication, reconciliation | `src/lib/edit/editSession.ts`               | Session coordinates registry suppression, history replacement, and separate operation storage.                                     |
| Operation identity and browser storage                        | `src/lib/gameData/publishOperation.ts`      | Shared by game-data and article workflows; also contains server UUID validation.                                                   |
| Draft refresh and overview derivation                         | `src/hooks/useEditDraft.ts` and the session | Every hook render requests scope and overview computations; draft listeners observe domain mutations independently of persistence. |

The existing session interface already hides raw stores from features. The rewrite deepens its implementation and removes internal coordination. A successful change removes the registry's independent history lifecycle and the session's scattered calls to operation-storage helpers.

## Module ownership and interface

Use `src/lib/edit/draftJournal.ts` as a private implementation of the session. Keep pure action/relation helpers in their existing modules because server replay, validation, and compaction also consume them.

| Module                              | Responsibility after the rewrite                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EditSession`                       | Own the baseline and mutable data, expose typed reads/mutations, delegate draft operations, and dispose the journal.                                         |
| Private draft journal               | Own recorded history, scope/overview projections, subscriptions, restoration/migration ordering, persistence outcomes, publish attempts, and reconciliation. |
| Private browser persistence adapter | Read and write existing history/operation records with explicit missing, success, failure, and invalid-data results. Preserve raw failed/invalid records.    |
| Existing publish transport          | Send a pinned request and classify responses. Browser fetch and the existing injected test transport remain adapters.                                        |
| Typed hooks and UI                  | Subscribe and render session results; own labels, toasts, permissions presentation, pending-overlap acknowledgement, and the recent-publish cookie.          |

The journal receives the session's baseline, internal mutable stores, persistence adapter, and existing transport when constructed. Its internal interface covers draft reads, subscription, discard, publish, persistence retry, and disposal. Recording and migration remain internal; callers never sequence `load`, `suppress`, `replace`, and `clearOperation` themselves.

`updateEntity` and `updateDomain` keep their public signatures. Their implementation uses a journal-controlled recording transaction so the operation batch is recorded before a draft read, publish, discard, or notification can observe it. Preserve Valtio operation conversion and pair normalization. Characterize the current batching behavior before selecting the synchronous recording mechanism; one logical mutation must retain array and relation operation ordering.

Preserve existing publish/discard result variants and add a `busy` discard result for an in-flight request. Add a persistence field to `EditDraftState` and one session operation to retry failed draft persistence. `useEditDraft` forwards these results. The shared edit runtime presents one persistence banner with retry and a confirmed exit choice. Typed editable hooks show expected cancellation errors through existing toast facilities and preserve the failure signal for field editors. Persistence failure keeps the session active and the live draft accessible.

Change the page and relation hooks' `discardChanges` and the toolbar's `onDiscard` from `void` to a success/failure result. Forward it through page-shell and relation-matrix callers. `EditModeToolbar.handleDiscard` exits only after successful discard; busy or failed persistence keeps the session mounted. An explicit choice to leave with an unsaved buffer is a separate user decision, with a warning about loss. Apply the same exit guard to publication that leaves unsaved later edits or unfinished cleanup.

Extend the existing import-boundary test to keep the journal and browser adapter internal. Keep storage injection in the existing session test-construction seam; remove the old `EditHistoryStore` contract after its callers migrate.

## Draft storage and lifecycle

### Restore

1. Read history and relevant operation records before transforming either. Distinguish an absent key from inaccessible storage and malformed data.
2. Validate with existing action schemas and preserve action order, grouped entries, faction scope, pair ownership, `null`, and absent values.
3. Resolve unresolved attempts before legacy relation migration or payload-changing normalization. Preserve both current and legacy squash candidates used by existing retries, including zero-net submissions.
4. Persist an allowed migration successfully before treating the migrated history as durable. On failure, leave the original stored value intact and report restoration failure through the existing runtime path.
5. Replay into stores with recording suppressed internally, then activate recording and draft listeners. Construction failure disposes every subscription created during construction.

Malformed records stay in place for recovery. An invalid record blocks replacement of its key; restoring an empty draft over it would destroy recovery evidence.

### Record and save

Maintain validated history in memory for the lifetime of the session. Record a complete logical mutation batch, normalize its new entries, and synchronously attempt one history write for the affected domain. Keep the existing raw action history until explicit discard or successful publish cleanup; squash remains a derived view.

A failed write retains the new in-memory entries and marks the domain unsaved. Reads and draft counts include those entries. Further edits extend the same buffer. An explicit persistence retry saves that buffer; publish first requires a successful save and a durable operation record. The UI explains that reload can lose unsaved changes.

Keep writes synchronous in this rewrite. Debounced writes, IndexedDB, background workers, and automatic history compaction would add lifecycle decisions beyond this objective.

### Subscribe and dispose

Draft notifications originate from the journal after recording and updating persistence state. `EditSession.subscribe` routes draft subscriptions there and retains data subscriptions for ordinary entity/domain views. Hook renders derive scope and overview results from in-memory history through the session. Projection caching can follow independently if measurements justify it.

Disposal removes listeners and recording subscriptions. Storage failure remains visible until recovery or an explicit user decision to leave; disposal itself never clears a draft or operation. Existing lifecycle UI must warn about an unsaved buffer before an explicit exit, and browser unload receives a best-effort warning while unsaved entries exist. A transport callback checks journal disposal before any persistence, cleanup, store mutation, or notification. A late response leaves the durable prepared attempt for the next session to recover through its original UUID; the disposed instance never races the replacement session.

### External storage changes

Before replacing a history record, compare its current raw value with the last observed durable value. Check again after an in-flight publish before cleanup. A mismatch retains the current session's buffer and the external stored value, reports a conflict, and prevents an overwrite. A storage-event listener can mark the conflict earlier; it must never silently rebase a live draft onto another tab's history.

This preserves conservative conflict behavior when caching replaces repeated storage reads. localStorage offers no atomic compare-and-swap across tabs. Fully concurrent writers and old-client coordination remain a documented limitation; this rewrite adds conflict detection, without claiming transaction isolation across tabs.

## Exact submission retries

### Compatibility and stored request

Preserve `game-data-publish-operation:v1:<encoded scope>` and its existing `{ fingerprint, operationId }` fields. For new game-data attempts, add a validated `gameDataRecovery` field containing a schema version, original endpoint, serialized request body, original draft scope, captured source history, and attempt phase. A successful result and a cleanup target are added when needed for recovery. Store the source history once; derive the captured remainder using the existing selection helpers and original scope.

The recovery field lives in the same sessionStorage value as the UUID, making each operation-record update a single storage write. Its extra storage cost buys complete request recovery and safe cleanup; it is scoped to active attempts. Existing readers ignore the additional field. Articles retain their existing record format and behavior. Shared UUID validation, fingerprints, and exported error classes retain their current contract.

The journal's strict game-data adapter verifies writes and removals and reports failures. The shared best-effort helper stays compatible for article callers. Unknown recovery versions block writes to that operation record and preserve its bytes.

For new attempts, exact means the original endpoint, UUID, and serialized JSON body, including message, submit mode, field omission, and acknowledgement token. Retry reads the pinned body; mutable stores and newer normalization code never rebuild it. Change the private transport input to carry that serialized body directly, updating its test adapters. The transport validates a successful response before acknowledging an attempt; malformed JSON, missing/invalid result rows, or an otherwise unrecognized success response retains the prepared attempt as uncertain.

Legacy records contain a fingerprint rather than a complete transport body. Preserve today's compatibility path: match current or legacy squash output and original endpoint against that fingerprint, using the original submit options. Preserve existing UUIDs, pair aliases, and error behavior. Legacy fingerprints omit acknowledgement tokens and normalize message text, so byte-for-byte recovery of those missing fields is impossible. Promise preservation of the existing server-semantic retry contract for legacy records; retain a conflict when a match cannot be established. Upgrade a matched legacy record before sending, then pin that resolved request for subsequent retries.

### Attempt transitions

| Event                                                            | Journal behavior                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New publish                                                      | Drain recording, persist history, select and validate entries, persist the complete prepared attempt, then call transport. A persistence failure leaves the draft available and prevents sending.                                                                  |
| Timeout, network failure, or unknown response                    | Retain the prepared attempt and all history. Retry uses its original request and UUID.                                                                                                                                                                             |
| Changed draft, message, or submit mode during unresolved attempt | Preserve the existing conflict behavior. Keep later edits; prevent them from being sent under the existing UUID.                                                                                                                                                   |
| Standalone pair retried from another endpoint or page            | Resolve the existing `relations:pair:<path>` identity and send the original endpoint/body. Preserve legacy page/domain scope lookup.                                                                                                                               |
| Confirmed pending-overlap response                               | Preserve the current acknowledgement flow. The response occurs before persistence; accepting the token permits a controlled update of that token in the pinned body under the same UUID. Persist that update before sending. All submission content remains fixed. |
| Definitive `stale_edit` or `invalid_game_data` rejection         | Preserve the draft and clear the attempt only after confirmed record removal. A removal failure retains the attempt and exposes a recoverable error. Keep the existing narrow classification of definitive rejection.                                              |
| Successful response                                              | Persist an acknowledged attempt with its result before history cleanup. Preserve edits appended while the request was in flight.                                                                                                                                   |
| Divergent history                                                | Return the existing cleanup-conflict result and retain the acknowledged attempt and histories.                                                                                                                                                                     |
| Cleanup storage failure                                          | Return cleanup-conflict and keep sufficient recovery information to finish cleanup. Preserve the server-success outcome.                                                                                                                                           |
| Explicit discard                                                 | Preserve scope selection and pair behavior. Return busy during transport; otherwise persist a cancellation intent before changing history for an associated attempt. Follow the cancellation sequence below before reporting success.                              |

Use one active transport/cleanup execution per affected domain within a session. Concurrent invocations reuse the same in-flight promise when identical; conflicting invocations return a conflict. Discard on that domain returns `busy` while transport is in flight, including calls from another page or scope. Other domains remain independent. This prevents asynchronous cleanup and discard from racing while keeping edits appendable during a request. After an uncertain result, the unresolved record reserves its submission identity and overlapping scope until retry or deliberate cancellation. A retry must select the same captured work; broader or narrower selections return a conflict. Owner, target, and matrix aliases remain valid when they select the same standalone pair.

### Cleanup and interruption ordering

Use `reconcilePublishHistory` to verify the captured prefix and preserve appended entries. Before replacing stored history, persist the acknowledged attempt's exact cleanup target. Then write that history target and finally remove the operation record.

On restart, a prepared attempt can be resent with its pinned identity. An acknowledged attempt resumes local cleanup. Evaluate both possible interpretations of stored history: the captured source plus later entries, and the cleanup target plus later entries. Proceed only when the interpretations produce the same remaining history or exactly one interpretation is valid. An empty cleanup target is a prefix of every history and proves nothing by itself. If interpretations disagree, retain the acknowledged record and current history and return a cleanup conflict. Also cover a nonempty cleanup target that prefixes the captured source. Exact equality with the target permits operation removal only when the source interpretation cannot require a different result.

If saving the acknowledgement fails after server success, retain the prepared record and report cleanup failure; a later identical retry safely retrieves the server receipt. If removing the operation fails after cleanup, its acknowledged record prevents a new submission from being mistaken for the unfinished cleanup. Exercise interruptions between each storage write in tests.

### Explicit discard and cancellation

When discard affects an unresolved or acknowledged attempt, first persist a cancellation intent in its operation record, containing the source history, intended remaining history, and associated legacy/pair operation keys. The intent is authoritative for every associated key. Restore examines cancellation intents before treating any associated prepared attempt as retryable. If saving the intent fails, keep the live draft and history unchanged and report failure.

After a durable intent, persist the remaining history, then clear associated operation records with the intent record removed last. Retain the original live draft only while history persistence has failed. Until the history target is durable, reject mutations to that domain before invoking their mutation callback, and route persistence retry through cancellation cleanup. Typed editable-data hooks present that recoverable error through existing feedback so every save respects the cancellation intent.

Once the history write succeeds, immediately update the in-memory journal and live store to the discard target with recording suppressed. Further edits start from that target and may be saved normally. If operation removal fails, retain only the cancellation intent and its checkpoint; subsequent edits must never restore cancelled entries. Retry finishes operation removal while preserving those later edits. Report successful discard only after all required writes/removals succeed. The cancellation intent fences its associated submission identity until cleanup finishes.

A crash after saving the intent resumes cancellation only, even when history replacement or operation removal was interrupted. Reuse the conservative before/after interpretation rule above; ambiguous history remains a conflict with the cancellation fence intact. A cancellation conflict blocks affected-domain mutation and generic persistence until recovery can establish the current history safely.

A scope can cancel an associated attempt only when it includes every entry in that attempt. Partial discard of a broader unresolved submission returns a conflict and preserves its complete identity and history.

When a scope has no associated attempt, its discard remains a single history replacement. A cancellation records the user's decision to stop retrying; any already-committed server submission retains its existing outcome. The UI must preserve that distinction when explaining an uncertain submission.

SessionStorage keeps its existing lifetime: reload in the same tab supports recovery; closing the tab may remove operation identity. This matches the confirmed recovery scope.

## Implementation sequence

Work directly on the current branch. Commit this plan first, then use one commit for each phase below. Before every commit, three independent agents review the proposed change for regressions and unnecessary complexity. Resolve justified findings before committing. Follow the repository's historical `type(scope): description` commit format.

| Phase                        | Deliverable                                                                                                                                                               | Completion gate                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1. Characterize preservation | Stored-history and operation fixtures through the session; retain legacy, zero-net, pair-endpoint, in-flight edit, discard, and restoration coverage.                     | Existing behavior tests pass; missing guarantees are documented for later phases.                                               |
| 2. Consolidate ownership     | Move restoration, recording, and draft lifecycle behind the private journal; preserve storage formats and behavior.                                                       | Existing compatibility tests pass with the new ownership; failure handling and recording timing retain their current semantics. |
| 3. Make persistence explicit | In-memory history, journal notifications, failure status/retry, recording-order guarantees, external-change detection, and exit guards.                                   | Failed saves and discards preserve edits; immediate-read and hook/toolbar tests pass.                                           |
| 4. Build recovery primitives | Validated recovery records, strict browser adapter, and legacy readers. Keep new recovery records inactive in production paths.                                           | Round-trip, schema-version, legacy-compatibility, and injected storage-failure tests pass.                                      |
| 5. Integrate recovery        | Pin requests, classify responses, serialize transport/cleanup, handle cancellation, reload, and disposal. Activate new recovery records only with the complete lifecycle. | Same-tab reload, exact-request, interrupted cleanup/cancellation, and late-callback tests pass.                                 |
| 6. Remove replaced machinery | Remove superseded contracts/helpers and complete import restrictions and integration checks.                                                                              | Lint, type-check, full tests, and all applicable UI checks pass.                                                                |

Each source phase runs lint, type-check, and its relevant tests before review. Full tests also run for cross-cutting phase changes. Derived-projection caching is an optional follow-up; journal-owned notifications and in-memory history belong to this rewrite. Release the completed sequence together so a partial lifecycle migration stays out of production.

## Files and affected callers

| Area                                                                                                                 | Expected changes                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/edit/editSession.ts`                                                                                        | Delegate draft ownership, route subscriptions, retain typed data operations, expose persistence status/retry.                           |
| `src/lib/edit/draftJournal.ts` and a private browser adapter                                                         | New home for the cohesive lifecycle and explicit storage outcomes. Prefer two implementation files over a general repository framework. |
| `src/lib/edit/editModeRegistry.ts`                                                                                   | Fold recording/restoration into the journal; remove the old registry and history-store contract.                                        |
| `src/lib/gameData/publishOperation.ts`                                                                               | Preserve shared public functions and errors; any shared record-type changes must remain additive and article-compatible.                |
| `src/hooks/useEditDraft.ts`                                                                                          | Read stable journal-derived results and forward persistence status/retry.                                                               |
| `src/hooks/usePageEditMode.ts`, `src/features/character-relations/matrix/useRelationMatrixEditMode.ts`               | Return discard success/failure, render persistence failures, and preserve conflict/acknowledgement presentation.                        |
| `src/components/EditRuntime.tsx`, `src/components/ui/EditModeToolbar.tsx`, `src/components/ui/EditModePageShell.tsx` | Keep runtime errors distinct from persistence errors; gate exit on successful discard and preserve unsaved buffers.                     |
| `src/app/(main)/characters/[characterId]/CharacterDetailsClient.tsx`, `src/app/(main)/relations/RelationsClient.tsx` | Forward the discard outcome and session exit guard through the two direct toolbar callers.                                              |
| `src/testUtils/editRuntime.ts`, session/hook/runtime/toolbar/page-shell tests, import-boundary tests                 | Replace raw history setup with session-facing construction helpers and persisted-record fixtures; test exit gating and disposal races.  |
| Article authoring and server UUID consumers                                                                          | Compatibility verification for the shared operation helper; behavior remains stable.                                                    |

## Acceptance and validation

Include `src/hooks/useEditableGameData.ts` and its tests in the caller changes: handle cancellation-blocked mutations centrally, preserve its typed tuple interface, and keep this error presentation out of individual editors.

The rewrite succeeds when the registry and session cease coordinating separate history and operation lifecycles. Feature code knows draft scope, result, and persistence status; storage keys, suppression, migration order, request reconstruction, and cleanup sequencing stay private.

Required regression cases:

- Valid existing drafts restore with the same values, scope membership, pair ownership, and publish entries. Invalid or unreadable storage survives failed restoration unchanged.
- One mutation followed immediately by read, publish, or discard sees the complete recorded batch. Array splices and pair-map replacements retain operation order.
- Append failure keeps live changes and their publish entries available; persistence retry saves them. Publishing waits for durable history and operation identity.
- Same-tab reload preserves new pinned requests exactly. Existing legacy retry tests retain the same UUID, endpoint, and server-semantic payload, including zero-net submissions.
- Owner/target/matrix navigation shares the existing pair identity. Changed content retains a conflict and later edits.
- Uncertain responses keep the attempt; only confirmed rejection or completed cleanup removes it. Pending acknowledgement changes only through its confirmed-response transition.
- Success preserves same-scope and unrelated in-flight edits. A second concurrent publish cannot race cleanup of the same domain.
- Publish followed by discard from an alternate caller returns busy. Publish followed by disposal/recreation leaves the original request recoverable, and the old callback changes neither storage nor the replacement session.
- Failures and interruption after each acknowledgement/cleanup write recover conservatively. Cleanup never deletes later entries or sends a changed request under an old UUID.
- Cleanup recovery includes an empty target and a target that prefixes the captured source. Conflicting interpretations retain the attempt and history.
- Interrupt discard before and after cancellation intent, history replacement, and each operation removal. A durable cancellation never becomes eligible for publication again. Failed/busy discard leaves the toolbar in edit mode.
- After cancellation history replacement succeeds and operation removal fails, a later edit starts from the discard target and survives cleanup. If history replacement fails, edits are blocked before mutation and generic persistence retry resumes cancellation; cancelled source entries never reappear through a later save.
- Malformed success responses retain the prepared request and draft. Only a validated receipt permits cleanup.
- External history changes cause a conflict before replacement. Tests explicitly distinguish detected changes from the remaining cross-tab atomicity limitation.
- Dispose/recreate leaves durable drafts and attempts intact, clears subscriptions, and handles an unsaved buffer with visible lifecycle feedback.
- Article recovery, shared operation validation, session consumers, and import restrictions keep their current behavior.

Use browser-storage adapters backed by JSDOM and fault-injecting test adapters through session construction. Assert outcomes and serialized requests at the session seam. Avoid tests that lock down private function layout. Adapter-level checks may verify failure classification and absence of storage reads during repeated unchanged draft reads.

For implementation, run `npm run lint`, `npm run type-check`, and focused session, hook, runtime, relation, retry, article-compatibility, and import-boundary suites, then full `npm test` because this affects the shared edit lifecycle. Run `npm run check:tailwind` if styling changes. Build only if lazy-loading or bundling contracts change, using `npm run build:skip-images`.

Implementation validation covers lint, type-check, the full source suite, and Tailwind checks. Storage and session tests inject failures at request preparation, acknowledgement, cleanup-target persistence, history replacement, and operation removal. UI tests cover retained sessions across navigation, confirmed exit, failed discard, and blocked field saves. Build and deployment checks remain outside this source-only change.

## Implementation record

The plan was committed first, followed by one commit per phase on the existing branch. Three independent agents reviewed each phase for regressions and unnecessary complexity; justified findings were fixed before committing.

- The private journal owns restoration, synchronous recording, in-memory history, subscriptions, persistence status, publication, cancellation, and cleanup.
- The history adapter exposes only reads and replacements. The old registry, append contract, and raw test-history writer are retired; behavior tests mutate through the session, while storage compatibility fixtures remain explicit.
- Game-data attempts use the strict adapter. Article callers keep the existing shared best-effort helper. Import tests enforce that separation and keep the journal and adapters out of public feature and root-provider imports.
- Repeated draft reads use memory without browser-storage reads. Derived-projection caching remains a separate optional optimization.

## Scope and rollback

The smaller option is to move ownership and expose persistence failures while retaining fingerprint-only attempts. The recommended plan also pins new requests because exact retries are an explicit requirement.

Keep server RPCs, database migrations, article workflows, the shared SWR cache, automatic compaction, and a new storage engine outside this change. Existing drafts and operation keys remain present through upgrades. Old code can read the retained fields, but ignores new acknowledgement/cleanup state; rolling back with active recovery records can weaken cleanup behavior. Prefer a forward fix or finish recovery before rollback, and test that an older reader preserves the added field during reads. Existing best-effort writers may overwrite it, so mixed-version writing is outside the recovery guarantee.

The main remaining limits are concurrent cross-tab writes, browser storage loss/quota, legacy records that omitted parts of the transport body, and sessionStorage removal when a tab closes. Make these limits explicit in implementation review; preserve records and return a conflict whenever recovery cannot be proven safe.
