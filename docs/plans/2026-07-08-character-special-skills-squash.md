# Plan: Fix Character Recommended Special Skill Squashing

## 1. Observation

The rejected 玛丽 changes from `2026-07-06 19:22:25 +08:00` show that recommended special-skill edits were published as noisy intermediate array operations instead of one clear final intent.

The rejected `玛丽.specialSkills` rows included:

- repeated `delete` operations on `玛丽.specialSkills.0` and `玛丽.specialSkills.1`
- repeated `set` operations on `玛丽.specialSkills.length`
- repeated `set` operations recreating `{ name: '魔术漂浮', description: '' }`
- one material-looking delete of `玛丽.specialSkills.1` where the old value was `{ name: '干扰投掷', description: '提高干扰能力和技能命中率。' }`

The current source data for 玛丽 has:

```ts
specialSkills: [
  { name: '魔术漂浮', description: '通用特技。' },
  { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
];
```

The rejected batch had 15 `玛丽.specialSkills` rows. Most were edit churn around the default mouse special skill `魔术漂浮`; only the `干扰投掷` deletion appears to be a meaningful final change candidate.

The character-detail UI records this kind of churn naturally:

- removing a special skill uses `splice(index, 1)`, which Valtio records as an index `delete` plus a `length` `set`
- adding a special skill uses `push({ name: '魔术漂浮', description: '' })` for mouse characters
- repeated remove/add attempts therefore produce alternating `delete`, `length`, and indexed `set` actions

The publish RPC stores each submitted entry as its own `game_data_actions` row. Since these rows only share `created_at` and have no explicit client sequence column, review and patching see a pile of separate operations rather than a single normalized final array edit.

## 2. Problem To Solve

`src/lib/edit/actionSquash.ts` currently treats any subtree containing a structural operation as unsafe to squash. For `delete 玛丽.specialSkills.0`, it records `玛丽.specialSkills` as a structural parent. After that, every action under `玛丽.specialSkills.*` is considered inside a structural zone.

That protection is too broad for array edit churn:

- descendant `set`s under `玛丽.specialSkills.*` are excluded from normal latest-value squashing
- descendant `set`s are also excluded from parent folding
- `length` updates are kept instead of being interpreted as part of the array mutation
- delete-then-readd sequences are not cancelled
- readding the same default skill is not recognized as no-op or final-value replacement
- repeated identical indexed `set`s leak through to moderation

This means `squashActions` preserves intermediate UI operations rather than the final semantic result. The behavior is safe in the narrow sense that it avoids incorrectly merging structural edits, but it is broken for user-facing moderation because it produces unreadable and sometimes misleading action rows.

The important distinction is:

- structural edits should not be blindly reduced by path the same way scalar fields are
- but structural array edits still need to be normalized to their final array state when the final state can be derived safely from the action history

The fix should not be a 玛丽-specific patch and should not rely on reviewer-side cleanup. The action history should be squashed before publishing so moderation receives either:

- no action, when the final array equals the original array
- one clear final array `set`, when the final array differs from the original array
- preserved detailed actions only when the final array cannot be derived safely

## 3. Fix Direction

Make this a generic action-history squashing fix, but keep the first implementation narrower than a full draft-baseline system.

Update `squashActions` so it can optionally receive the current mutated root object:

```ts
type SquashActionsOptions = {
  currentRoot?: Record<string, unknown>;
};

export function squashActions(
  entries: ActionHistoryEntry[],
  options?: SquashActionsOptions
): ActionHistoryEntry[];
```

When `currentRoot` is not provided, keep the current conservative behavior.

When `currentRoot` is provided, `squashActions` should:

1. Convert `currentRoot` to a deep plain cloneable value, then clone it. For Valtio-backed roots, use `snapshot(currentRoot)` from `valtio/vanilla`; shallow `getUntracked(currentRoot) || currentRoot` is not sufficient for editable proxy roots and can still throw `DataCloneError`.
2. Reverse-apply the same `entries` into the clone to derive the effective before-state for the submitted draft.
3. Detect structural array parent paths from array index deletes, array-like numeric-index adds, and `length` updates. Valtio records `push()` and inserts as `set parent.<number>` actions, not `add`, so treat `set parent.<number>` with `oldValue === undefined` as an array-add candidate once the parent is confirmed to be an array.
4. For each safe array parent, compare:
   - `oldValue`: the parent array from the reversed before-state
   - `newValue`: the parent array from `currentRoot`
5. Replace all low-level actions under that parent with:
   - no action, if the arrays are deeply equal
   - one parent-level `set`, if they differ
6. Fall back to the original detailed actions for any parent whose before/final arrays cannot be derived safely.

This gives moderation one semantic array change without requiring a new persistent draft snapshot. The effective baseline is still the state before the local draft action history was applied; it is derived from the current edited store plus the recorded inverse actions.

## 4. Scope

### Revision after `develop` sync

After syncing `develop` past `6ad88958ef51e7b3808328809986ef0ef2c33524`, the plan still applies. The new commits do not replace the `actionSquash` structural-zone behavior, but they add two integration details that the implementation must preserve:

- `src/hooks/usePageEditMode.ts` now derives active edit mode from `originalIsEditMode && !isPreviewMode`. When wiring `currentRoot` into `squashActions`, keep the preview-mode behavior and the "do not discard on preview toggle" effect logic intact.
- `src/hooks/usePageEditMode.test.tsx` now provides `isPreviewMode` and `setIsPreviewMode` through `EditModeContext`. Any new hook test fixtures must include those provider fields.
- `src/features/character-relations/matrix/useRelationMatrixEditMode.ts` still squashes relation actions without a current root, and `src/lib/edit/characterRelationActions.ts` still splits relation arrays by current relation-kind paths. The relation smoke test should use current paths such as `杰瑞.counters`.
- Rebase or merge the implementation onto current local `develop` before final verification so the preview-mode changes and character-relation refactor are not overwritten.

Modify:

- `src/lib/edit/actionSquash.ts`
  - add `SquashActionsOptions`
  - convert `currentRoot` to a deep plain value with `snapshot(currentRoot)` before cloning, because the callers pass Valtio-backed stores
  - wrap plain-value conversion and cloning so failures fall back to the existing conservative squashing behavior
  - add internal path helpers needed to clone, read, set, delete, add, and reverse-apply actions without importing from `diffUtils` and creating a circular dependency
  - normalize only proven-safe structural array parents
- `src/hooks/usePageEditMode.ts`
  - pass the relevant entity registry root to `squashActions` for action counts, draft summaries, and publishing
- `src/features/character-relations/matrix/useRelationMatrixEditMode.ts`
  - pass `characters` to `squashActions` for relation matrix counts, summaries, and publishing
- `src/lib/edit/actionSquash.test.ts`
  - cover the structural array normalization behavior directly

Do not modify:

- `src/features/characters/components/character-detail/skills/SpecialSkillsSection.tsx`
- Supabase migrations or RPCs
- moderation UI rendering
- the pending-action squash script, except as an optional follow-up if it can later provide a current root snapshot

## 5. Safety Rules

Normalize a structural array parent only when all of these are true:

- `currentRoot` is provided.
- `currentRoot` can be converted to a deep plain cloneable value. Prefer `snapshot(currentRoot)` from `valtio/vanilla` for Valtio-backed roots before calling `structuredClone`; if conversion or cloning fails, do not normalize structural arrays.
- The parent path resolves to an array in both the derived before-state and the current final state.
- Every action being removed or replaced is under that same parent path.
- Descendant paths under the parent are array-shaped: `parent.length`, `parent.<number>`, or `parent.<number>.*`.
- Numeric-index `set` actions with `oldValue === undefined` are treated as array-add candidates only after the parent path is confirmed to resolve to an array. Do not classify arbitrary object property creation as structural array churn.
- The derived before array is dense: no sparse holes. This matters for Valtio `delete index` plus `set length` histories, where a naive reverse replay can create a hole or extra empty slot.
- The final array is dense: no sparse holes.
- Forward-replaying the original low-level actions for that parent from the derived before-state produces the current final parent array.
- Replaying the candidate parent `set` from the derived before-state also produces the current final parent array.

If any check fails, preserve the existing actions for that parent. The fallback must be conservative; noisy moderation is better than publishing an incorrect semantic change.

## 6. Test Plan

Add focused tests in `src/lib/edit/actionSquash.test.ts`:

- `should collapse special skill delete/add churn to no action when final array equals the derived original`
- `should collapse a real special skill deletion to one parent array set`
- `should reconstruct dense oldValue for Valtio delete-index plus length-set array histories`
- `should collapse Valtio push-style numeric-index set into one parent array set`
- `should collapse middle-index array deletion with shifted items to one parent array set`
- `should preserve detailed structural actions when no current root is provided`
- `should preserve detailed structural actions when the candidate parent is not an array`
- `should continue squashing unrelated scalar sets while normalizing a structural array parent`

The real 玛丽 deletion fixture should use this current source shape:

```ts
{
  玛丽: {
    specialSkills: [
      { name: '魔术漂浮', description: '通用特技。' },
      { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
    ],
  },
}
```

For a final state that removes `干扰投掷`, the expected squashed action is:

```ts
{
  op: 'set',
  path: '玛丽.specialSkills',
  oldValue: [
    { name: '魔术漂浮', description: '通用特技。' },
    { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
  ],
  newValue: [{ name: '魔术漂浮', description: '通用特技。' }],
}
```

The exact Valtio fixture for `specialSkills.splice(1, 1)` should include this action history:

```ts
[
  {
    op: 'delete',
    path: '玛丽.specialSkills.1',
    oldValue: { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
    newValue: undefined,
  },
  {
    op: 'set',
    path: '玛丽.specialSkills.length',
    oldValue: 2,
    newValue: 1,
  },
];
```

with this current root:

```ts
{
  玛丽: {
    specialSkills: [{ name: '魔术漂浮', description: '通用特技。' }],
  },
}
```

The expected `oldValue` must be the dense two-item array shown above. It must not be a sparse array, and it must not include an empty slot at index `1`.

The exact Valtio fixture for `specialSkills.push(...)` should include this action history:

```ts
[
  {
    op: 'set',
    path: '玛丽.specialSkills.1',
    oldValue: undefined,
    newValue: { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
  },
];
```

with this current root:

```ts
{
  玛丽: {
    specialSkills: [
      { name: '魔术漂浮', description: '通用特技。' },
      { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
    ],
  },
}
```

The expected squashed action is one parent-level `set` for `玛丽.specialSkills`, with `oldValue` equal to the one-item array and `newValue` equal to the two-item array. The numeric-index `set` should not leak through as a separate moderation row.

Add hook wiring tests:

- In `src/hooks/usePageEditMode.test.tsx`, add a publish/count test where stored `characters` history contains the Valtio `delete 玛丽.specialSkills.1` plus `set 玛丽.specialSkills.length` pair and the current `characters` store already has the final one-item array. Assert `getActionCount()` reports the normalized count and the publish request body contains one parent `set` for `玛丽.specialSkills`, not the two low-level structural actions.
- In `src/features/character-relations/matrix/useRelationMatrixEditMode.test.tsx`, add a smoke test that relation-matrix squashing calls the new `currentRoot` path. It can use a minimal structural array action under `characters`; the assertion should prove publish uses the normalized parent `set` instead of the conservative low-level actions.

Run:

```powershell
npm test -- src/lib/edit/actionSquash.test.ts
npm test -- src/hooks/usePageEditMode.test.tsx
npm test -- src/features/character-relations/matrix/useRelationMatrixEditMode.test.tsx
npm run type-check
npm run lint
```

## 7. Alternatives Not Chosen

### Patch only `SpecialSkillsSection`

Do not do this. It would fix the observed 玛丽 workflow but leave the same failure mode in aliases, positioning tags, knowledge-card groups, character relations, and future editable arrays.

### Reviewer-side cleanup or one-off database script

Do not rely on this as the product fix. It helps existing pending rows, but moderators still receive noisy or misleading submissions until someone cleans them. The history should be normalized before publish.

### Relax the structural-zone guard without a base state

Do not do this. Array index operations are order-dependent. Squashing by path alone can drop deletes, preserve stale shifted indexes, or turn a reorder into the wrong final data.

### Add persistent first-draft baselines now

Defer this. Persisting the exact root snapshot from the first draft action is the most robust long-term model, but it adds storage format changes, stale-draft handling, migration behavior, and more UI policy than this bug needs. The current-root plus inverse-history approach fixes the moderation noise without that machinery.

### Add client sequence columns or batch grouping to `game_data_actions`

Do not make this the first fix. Better sequencing could help auditability, but it does not turn low-level array ops into semantic final array changes. It also requires database and RPC changes for a problem that can be solved before publish.

### Record every array edit as a full parent `set` at capture time

Avoid this for now. It would increase draft storage noise for every small array edit, make text-field edits inside array items look like full-array replacements, and still would not clean already-recorded draft histories. Normalizing at squash time is more targeted.
