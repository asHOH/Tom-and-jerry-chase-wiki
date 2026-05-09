# Public Game Data Action Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the public game data action pipeline while preserving active local edits, moderation publishing, public replay, server-side patched data, and wiki-history generation.

**Architecture:** Keep public game data actions as the canonical edit artifact. Centralize normalization, flattening, squashing, and replay loops into small shared utilities, while keeping client/server target differences explicit through registries or callbacks.

**Tech Stack:** Next.js App Router, React, TypeScript, Valtio, Jest, Supabase.

---

## Reviewed Concerns To Preserve

- Squash divergence is the highest-risk issue: app code currently uses root-level structural protection while the admin script uses parent-path protection.
- Client/server replay intentionally target different stores; the shared replay core must accept target resolution instead of hiding that difference.
- Removing full character persistence is valid only if `editmode:actions:*` remains the only draft source and draft replay still works.
- Server no-op rows such as `factions` must remain readable, even if they are not replay-applied.
- Entity replay needs explicit coverage because entity data may be shaped differently across static and editable stores.

## Phase 0: Complete Normalization Cleanup

**Files:**

- Modify: `src/lib/gameData/actionEntries.ts`
- Modify: `src/lib/wikiHistoryFromActions.ts`
- Modify: `src/lib/gameData/actionEntries.test.ts`
- Create or modify: `src/lib/wikiHistoryFromActions.test.ts`

- [ ] **Step 1: Write tests for action flattening**

Add coverage for a helper named `flattenActionEntries`:

```ts
import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';

describe('flattenActionEntries', () => {
  it('should flatten mixed action history entries into actions', () => {
    const action = { op: 'set', path: 'Tom.description', oldValue: 'old', newValue: 'new' };
    const batch = [{ op: 'delete', path: 'Tom.aliases.0', oldValue: 'alias', newValue: undefined }];

    expect(flattenActionEntries([action, batch])).toEqual([action, ...batch]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- src/lib/gameData/actionEntries.test.ts`

Expected: FAIL because `flattenActionEntries` is not exported yet.

- [ ] **Step 3: Implement flattening and fix the compatibility comment**

In `src/lib/gameData/actionEntries.ts`, export:

```ts
export function flattenActionEntries(entries: ActionHistoryEntry[]): Action[] {
  return entries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
}
```

Update the comment to state that a plain `Action[]` currently normalizes to multiple replay entries, preserving existing behavior.

- [ ] **Step 4: Update wiki history conversion**

In `src/lib/wikiHistoryFromActions.ts`, replace direct `actionHistoryEntrySchema.safeParse(row.entry)` usage with:

```ts
const entries = normalizePublicActionEntries(row.entry);
const actionsArray = flattenActionEntries(entries);
```

Skip rows where `actionsArray.length === 0`.

- [ ] **Step 5: Add wiki history tests**

Cover single action, plain `Action[]`, mixed `ActionHistoryEntry[]`, and invalid payloads. Assert generated `batchChanges` contains the expected item names and does not include invalid rows.

- [ ] **Step 6: Verify Phase 0**

Run:

```powershell
npm test -- src/lib/gameData/actionEntries.test.ts src/lib/wikiHistoryFromActions.test.ts
npm run lint
npm run type-check
```

- [ ] **Step 7: Commit Phase 0**

```powershell
git add src/lib/gameData/actionEntries.ts src/lib/gameData/actionEntries.test.ts src/lib/wikiHistoryFromActions.ts src/lib/wikiHistoryFromActions.test.ts
git commit -m "refactor(game-data): normalize public action history usage"
```

## Phase 1: Unify Squash Behavior Safely

**Files:**

- Modify: `src/lib/edit/diffUtils.ts`
- Create: `src/lib/edit/actionSquash.ts`
- Create: `src/lib/edit/actionSquash.test.ts`
- Modify: `src/lib/edit/diffUtils.test.ts` only if existing tests import `squashActions` from `diffUtils.ts`
- Modify: `scripts/squash-pending-game-data-actions.mjs`
- Modify: `src/context/EditModeContext.tsx` only if the export path changes

- [ ] **Step 1: Add divergence tests**

In `src/lib/edit/actionSquash.test.ts`, write tests proving nested structural edits should only protect their parent path subtree. Example: a delete at `Tom.skills.1` should prevent squashing under `Tom.skills.*` but should not prevent squashing repeated sets under `Tom.description`.

- [ ] **Step 2: Run the tests and verify they fail against current root-level behavior**

Run: `npm test -- src/lib/edit/actionSquash.test.ts`

Expected: FAIL because `src/lib/edit/actionSquash.ts` does not exist yet, or because the first extracted implementation still uses root-level structural protection and keeps too many unrelated sets.

- [ ] **Step 3: Replace squash logic with parent-path structural protection**

Extract the shared implementation into `src/lib/edit/actionSquash.ts` so app code and tests can import it without pulling in Valtio/proxy helpers from `diffUtils.ts`.

Use the script behavior as the winner: collect parent paths for `add` and `delete`, treat only matching descendants as structural zones, and squash unrelated repeated `set` actions normally.

- [ ] **Step 4: Reuse the shared squash implementation in the script**

Remove the copied algorithm from `scripts/squash-pending-game-data-actions.mjs`. Because the script is executed directly with `node scripts/squash-pending-game-data-actions.mjs`, do not import TypeScript app source from the script unless a runner/transpiler is added in the same phase.

Use the repo's existing `jiti` dependency inside `scripts/squash-pending-game-data-actions.mjs` to load the TypeScript module directly:

```js
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { squashActions } = jiti('../src/lib/edit/actionSquash.ts');
```

After this change, `scripts/squash-pending-game-data-actions.mjs` should no longer define its own `deepEqual`, `isNoOp`, or `squashActions` helpers unless one is still needed outside squash behavior.

- [ ] **Step 5: Verify Phase 1**

Run:

```powershell
npm test -- src/lib/edit/actionSquash.test.ts src/lib/edit/diffUtils.test.ts
npm run lint
npm run type-check
```

- [ ] **Step 6: Commit Phase 1**

```powershell
git add src/lib/edit/actionSquash.ts src/lib/edit/actionSquash.test.ts src/lib/edit/diffUtils.ts src/lib/edit/diffUtils.test.ts scripts/squash-pending-game-data-actions.mjs
git commit -m "fix(edit-mode): unify action squash behavior"
```

## Phase 2: Remove Full Character Store Persistence

**Files:**

- Modify: `src/components/ClientProviders.tsx`
- Delete: `src/hooks/usePersistentGameStore.ts`
- Delete: `src/hooks/usePersistentGameStore.test.tsx`
- Modify or add tests around edit-mode action replay if coverage is missing

- [ ] **Step 1: Add or confirm draft replay coverage**

Ensure tests prove that `editmode:actions:characters` restores a local character edit when entering edit mode.

- [ ] **Step 2: Remove `usePersistentGameStore` usage**

Delete the import and call from `ClientProviders`.

- [ ] **Step 3: Delete the obsolete hook and test**

Remove `src/hooks/usePersistentGameStore.ts` and `src/hooks/usePersistentGameStore.test.tsx`.

- [ ] **Step 4: Confirm no full-character persistence remains**

Run:

```powershell
rg "usePersistentGameStore|localStorage\\.getItem\\('characters'|localStorage\\.setItem\\('characters'" src
```

Expected: no matches.

- [ ] **Step 5: Add a draft history size warning if needed**

If existing draft replay has no guard, log a warning when a single `editmode:actions:*` history exceeds a high threshold such as 1000 entries. Do not block replay.

- [ ] **Step 6: Verify Phase 2**

Run:

```powershell
npm test -- src/context/EditModeContext.test.tsx src/hooks/usePublicGameDataActions.test.tsx
npm run lint
npm run type-check
```

- [ ] **Step 7: Commit Phase 2**

```powershell
git add src/components/ClientProviders.tsx src/context/EditModeContext.tsx
git rm src/hooks/usePersistentGameStore.ts src/hooks/usePersistentGameStore.test.tsx
git commit -m "refactor(edit-mode): rely on action logs for draft persistence"
```

## Phase 3: Centralize Replay Core

**Files:**

- Create: `src/lib/gameData/actionReplay.ts`
- Create: `src/lib/gameData/actionReplay.test.ts`
- Modify: `src/hooks/usePublicGameDataActions.ts`
- Modify: `src/lib/gameData/publicActions.ts`

- [ ] **Step 1: Write replay-core tests**

Cover:

- skips already-applied IDs
- skips invalid entries
- applies one row to multiple targets
- allows custom `applyEntry(row, entry)` behavior
- distinguishes handled rows from rows that actually mutate data
- preserves no-op rows such as `factions` by adding them to handled IDs while returning zero mutated count

- [ ] **Step 2: Implement replay helper**

Export a helper with this shape:

```ts
export type PublicActionApplyResult = 'mutated' | 'handled' | 'skipped';

export function applyPublicActionRows(options: {
  rows: PublicActionRow[];
  handledIds: Set<string>;
  resolveTargets: (entityType: string) => Record<string, unknown>[] | null;
  shouldApply?: (row: PublicActionRow) => boolean;
  applyWithin?: (row: PublicActionRow, fn: () => void) => void;
  applyEntry?: (row: PublicActionRow, entry: ActionHistoryEntry) => PublicActionApplyResult;
  onError?: (row: PublicActionRow, error: unknown) => void;
}): { handledCount: number; mutatedCount: number; handledIds: string[] };
```

Default behavior should normalize entries, resolve targets, apply every entry to every target, and mark a row handled only after all entries apply without throwing.

Semantics:

- `handledIds` means "do not retry this row in this runtime."
- `mutatedCount` means "this row changed at least one target."
- `resolveTargets()` returning `null` means unknown/unhandled entity type; do not mark the row handled.
- `resolveTargets()` returning `[]` means known no-op entity type such as `factions`; mark the row handled and keep `mutatedCount` unchanged.
- `applyEntry()` returning `'mutated'` marks the row as handled and mutated.
- `applyEntry()` returning `'handled'` marks the row as handled without mutation.
- `applyEntry()` returning `'skipped'` leaves the row unhandled so it can be retried later.

- [ ] **Step 3: Update the client hook**

Keep only React state, edit-mode cutoff, recording suppression, target registry, `GameDataManager.invalidate()`, and logging in `usePublicGameDataActions`.

The hook may keep its public return field named `appliedCount` for compatibility, but internally it should use the helper's `mutatedCount` for that value and `handledIds` for retry suppression.

- [ ] **Step 4: Update server public replay**

Use the shared helper with a server resolver or custom apply handler that preserves current static/edit dual-apply behavior.

- [ ] **Step 5: Verify Phase 3**

Run:

```powershell
npm test -- src/lib/gameData/actionReplay.test.ts src/hooks/usePublicGameDataActions.test.tsx
npm run lint
npm run type-check
```

- [ ] **Step 6: Commit Phase 3**

```powershell
git add src/lib/gameData/actionReplay.ts src/lib/gameData/actionReplay.test.ts src/hooks/usePublicGameDataActions.ts src/lib/gameData/publicActions.ts
git commit -m "refactor(game-data): centralize public action replay"
```

## Phase 4: Replace Switches With Registries

**Files:**

- Modify: `src/hooks/usePublicGameDataActions.ts`
- Modify: `src/lib/gameData/publicActions.ts`
- Modify: `src/lib/gameData/actionReplay.test.ts`

- [ ] **Step 1: Add registry tests**

Add tests showing:

- client entities resolve to `entitiesEdit`
- server cards/buffs/items/etc. resolve to both static and edit targets where current behavior does
- `factions` rows remain no-op and do not throw
- entity rows apply exactly as current server behavior applies them

- [ ] **Step 2: Replace client switch**

Use a plain object registry for client editable stores.

- [ ] **Step 3: Replace server switch**

Use a server registry that returns target arrays or an explicit custom handler. Preserve `factions` as no-op.

- [ ] **Step 4: Verify Phase 4**

Run:

```powershell
npm test -- src/lib/gameData/actionReplay.test.ts src/hooks/usePublicGameDataActions.test.tsx
npm run lint
npm run type-check
```

- [ ] **Step 5: Commit Phase 4**

```powershell
git add src/hooks/usePublicGameDataActions.ts src/lib/gameData/publicActions.ts src/lib/gameData/actionReplay.test.ts
git commit -m "refactor(game-data): use registries for action replay targets"
```

## Phase 5: Split Fetch From Fetch-And-Apply

**Files:**

- Modify: `src/lib/gameData/publicActions.ts`
- Modify: `src/components/ClientProvidersWithInitialData.tsx`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/echoflow/resolvers.ts`
- Modify or add tests for public action consumers where practical

- [ ] **Step 1: Add tests or assertions for fetch behavior**

Ensure pure fetch returns all public rows, including unknown/no-op entity types, without applying them.

- [ ] **Step 2: Split exports**

Add:

```ts
export async function fetchPublicGameDataActions(): Promise<PublicActionRow[]>;
export async function getPublicGameDataActionsAndApplyToServerData(): Promise<PublicActionRow[]>;
```

Keep `getPublicGameDataActions` temporarily as an alias to the side-effectful behavior if needed, but document it clearly.

- [ ] **Step 3: Update side-effectful consumers**

Update chat and server data consumers that rely on patched imported data to call the explicit side-effectful function.

Known side-effectful consumers:

- `src/app/api/chat/route.ts` calls this before using imported game data for chat.
- `src/components/ClientProvidersWithInitialData.tsx` currently calls `getPublicGameDataActions()` during root layout rendering. Update it to call `getPublicGameDataActionsAndApplyToServerData()` so SSR keeps the current patched-data behavior while still passing the fetched rows to the client provider.
- `src/app/api/echoflow/resolvers.ts` reads imported game data directly. Ensure `resolvePath()` applies public rows through `getPublicGameDataActionsAndApplyToServerData()` before resolving list/detail/full-data responses, unless a route-level caller already applies them first in the same request path.

- [ ] **Step 4: Update pure consumers**

Update consumers that only need rows, such as update-history or wiki-history code paths, to call the pure fetch function where appropriate.

Known pure consumers:

- `getEntityUpdateHistory()` in `src/lib/gameData/publicActions.ts` should call `fetchPublicGameDataActions()` so update metadata does not mutate imported data as a side effect.
- wiki-history conversion paths should receive rows from `fetchPublicGameDataActions()` when they only need action metadata.

- [ ] **Step 5: Verify Phase 5**

Run:

```powershell
npm test -- src/lib/gameData/actionReplay.test.ts
npm run lint
npm run type-check
```

- [ ] **Step 6: Commit Phase 5**

```powershell
git add src/lib/gameData/publicActions.ts src/components/ClientProvidersWithInitialData.tsx src/app/api/chat/route.ts src/app/api/echoflow/resolvers.ts
git commit -m "refactor(game-data): make public action replay side effects explicit"
```

## Final Verification

- [ ] Run all relevant checks:

```powershell
npm test
npm run lint
npm run lint:fast
npm run type-check
```

- [ ] Manually inspect:

```powershell
rg "parseEntries|usePersistentGameStore|localStorage\\.getItem\\('characters'|localStorage\\.setItem\\('characters'" src scripts
rg "function squashActions" src scripts
```

Expected:

- no duplicated entry parser
- no full-character localStorage persistence
- only one app-owned squash implementation, or script wrapper code that delegates to it

- [ ] Commit any final test/doc adjustments:

```powershell
git add docs/superpowers/plans/2026-05-09-public-game-data-action-simplification.md
git commit -m "docs(game-data): document action pipeline simplification plan"
```
