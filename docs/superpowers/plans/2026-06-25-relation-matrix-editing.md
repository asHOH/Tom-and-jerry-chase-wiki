# Relation Matrix Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `/relations/` matrix with login/role-gated cell editing so users can add, edit, remove, or change relation types in existing edit-mode drafts, then submit only relation-scoped character actions for review. This plan does not build the read-only matrix page and does not introduce a new relation data source.

**Architecture:** The read-only route and matrix module already exist; this feature adds an edit layer on top of them. Matrix edits write through existing character relation overlay arrays under `characters.<characterId>.<relationKind>`, and both public and edit-mode matrix cells read from `getCharacterRelation(...)` / `getEditableCharacterRelations(...)` so approved public actions and local drafts share one display path. Relation-only publishing reuses the existing edit-mode storage, toolbar, schema, and Supabase RPC contracts, adding only relation path filtering plus UI/API role gates.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript strict mode, Valtio edit stores, Jest/React Testing Library, Supabase RPC-backed game-data action publishing.

---

## Settled Decisions

- Relation matrix submissions publish relation actions only.
- Edit entry and relation publishing are gated to `Contributor`, `Reviewer`, and `Coordinator`.
- The existing `/relations/` route, matrix feature module, `CatalogPageShell`, `EditButton`, `EditModeToolbar`, `BaseDialog`, edit-mode action storage, and game-data action schemas must be reused. Do not add a second route, second matrix module, custom draft store, custom toolbar, or new relation data source.
- Owned relation arrays are authoritative overrides. If a character record owns `counters`, `counteredBy`, or another relation key, that array is the complete value for that relation kind, including empty arrays.
- Removals start from `getEditableCharacterRelations(...)` projected current values, filter the target out, and write the filtered full array.
- Character-vs-character saves use row-primary ownership plus mirrored inverse maintenance for deterministic opposite-orientation display.
- Mirrored inverse mapping:
  - `counters` <-> `counteredBy`
  - `counterEachOther` <-> `counterEachOther`
  - `collaborators` <-> `collaborators`
- Empty cells with multiple legal relation types open the dialog with no selected relation type; `保存` is disabled until the user chooses one.
- For non-character targets, there is no mirrored write.
- Matrix view-model cells built from row-local relations must not re-project inverse character edges a second time. `getCharacterRelation(...)` / `getEditableCharacterRelations(...)` already expose the row's display-ready relation arrays.
- Relation-only discard must suppress Valtio recording while applying inversions so undo operations do not become new drafts.

## Execution Phases

### Phase 1: Data And Publish Contracts

Tasks 1, 2, 3, and 8. This establishes relation action filtering, authoritative overlays, legal edit-kind rules, and the role-gated relation publish endpoint before any clickable UI depends on them.

### Phase 2: Editable Matrix Surface

Tasks 4, 5, and 6. This changes the matrix read model to use row-local relation data, makes valid cells selectable in edit mode, and adds the dialog that orchestrates row-primary and mirrored writes.

### Phase 3: Relations Page Integration

Tasks 7, 9, and 10. This adds the relation-only draft hook, wires role-gated page controls and toolbar behavior, then runs focused and broad verification.

## File Structure

- Create `src/lib/edit/characterRelationActions.ts`: path parsing, shared relation-kind constants, action filtering/splitting.
- Create `src/lib/edit/characterRelationActions.test.ts`: path parsing and relation-only split coverage.
- Create `src/lib/gameData/publishGameDataActions.ts`: shared Supabase RPC helper for game-data action publishing.
- Modify `src/app/api/game-data-actions/publish/route.ts`: use shared RPC helper without changing existing broad request parsing.
- Create `src/app/api/game-data-actions/publish-relations/route.ts`: relation-only role-gated publish endpoint.
- Modify `src/features/characters/utils/relationReadModel.ts`: authoritative owned relation arrays with direct-ownership metadata separated from inverse overlay projection.
- Modify `src/features/characters/utils/characterRelationOverlay.ts`: import shared relation-kind constants, add upsert and multi-kind removal helpers.
- Create `src/features/character-relations/matrix/relationMatrixEditing.ts`: legal relation kinds, labels, inverse mapping, edit target helpers.
- Modify `src/features/character-relations/matrix/relationMatrixViewModel.ts`: build cells from row-local relation data.
- Modify `src/features/character-relations/matrix/CharacterRelationsMatrix.tsx`: edit-mode clickable cells.
- Create `src/features/character-relations/matrix/RelationMatrixCellEditor.tsx`: BaseDialog relation editor.
- Create `src/features/character-relations/matrix/useRelationMatrixEditMode.ts`: relation-only toolbar state and publish/discard handling.
- Modify `src/app/(main)/relations/RelationsClient.tsx`: role-gated edit button, dialog state, toolbar, editable view model.

---

### Task 1: Relation Action Parsing And Shared Publishing

**Files:**

- Create: `src/lib/edit/characterRelationActions.ts`
- Create: `src/lib/edit/characterRelationActions.test.ts`
- Create: `src/lib/gameData/publishGameDataActions.ts`
- Modify: `src/app/api/game-data-actions/publish/route.ts`

- [ ] **Step 1: Write relation action parsing tests**

Add tests covering zero-based segment names and mixed action splitting:

```ts
import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';

import {
  isCharacterRelationAction,
  parseCharacterRelationActionPath,
  splitCharacterRelationActionHistory,
} from './characterRelationActions';

describe('characterRelationActions', () => {
  it('parses character relation paths with zero-based segment names', () => {
    expect(parseCharacterRelationActionPath('杰瑞.counters.0.description')).toEqual({
      characterId: '杰瑞',
      relationKind: 'counters',
      rest: ['0', 'description'],
    });
  });

  it('rejects non-relation character paths', () => {
    expect(parseCharacterRelationActionPath('杰瑞.description')).toBeNull();
    expect(
      isCharacterRelationAction({
        op: 'set',
        path: '杰瑞.description',
        oldValue: '',
        newValue: 'x',
      })
    ).toBe(false);
  });

  it('splits mixed action history without dropping unrelated drafts', () => {
    const history: ActionHistoryEntry[] = [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      [
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    ];

    expect(splitCharacterRelationActionHistory(history)).toEqual({
      matching: [
        { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
      ],
      remaining: [
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    });
  });
});
```

- [ ] **Step 2: Implement path parsing and splitting**

Implement with explicit segment names:

```ts
const segments = path.split('.').filter(Boolean);
const characterId = segments[0];
const relationKind = segments[1];
const rest = segments.slice(2);
```

Export `CHARACTER_RELATION_KINDS`, `isCharacterRelationKind`, `parseCharacterRelationActionPath`, `isCharacterRelationAction`, and `splitCharacterRelationActionHistory`.

`CHARACTER_RELATION_KINDS` becomes the single source of truth for relation action path filtering. Later tasks should import it from this file instead of keeping a separate relation-kind list in `characterRelationOverlay.ts`.

- [ ] **Step 3: Extract shared publish helper**

Create `publishGameDataActions(supabase, actions)` in `src/lib/gameData/publishGameDataActions.ts`. It should accept entries already validated by the caller and perform the existing `publish_game_data_actions` RPC loop.

- [ ] **Step 4: Refactor existing publish route to use the helper**

Keep current request body support in `src/app/api/game-data-actions/publish/route.ts`, including both legacy single-action and batch formats. Replace only the RPC loop with the shared helper.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- src/lib/edit/characterRelationActions.test.ts
```

Expected: relation action parser tests pass.

---

### Task 2: Authoritative Relation Overlays

**Files:**

- Modify: `src/features/characters/utils/relationReadModel.ts`
- Modify: `src/features/characters/utils/relations.test.ts`
- Modify: `src/features/characters/utils/characterRelationOverlay.ts`
- Modify: `src/features/characters/utils/characterRelationOverlay.test.ts`

- [ ] **Step 1: Add failing read-model removal tests**

Add coverage proving that owned empty or filtered arrays suppress static/shared projection:

```ts
it('uses owned relation arrays as authoritative overrides even when empty', () => {
  const relation = findSharedCharacterRelation('counters');
  setLegacyRelationItems(relation.subject.name, 'counters', []);

  expect(getCharacterRelation(characters, relation.subject.name).counters).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: relation.target.name })])
  );
});
```

- [ ] **Step 2: Implement authoritative ownership tracking**

Do not try to infer ownership after all overlays have been merged together. Refactor the direct legacy overlay projection so it keeps ownership metadata separate from relation items:

```ts
type LegacyOverlayProjection = {
  relations: CharacterRelation;
  ownedRelationKinds: ReadonlySet<keyof CharacterRelation>;
};
```

When the current character record directly has a relation property, add that key to `ownedRelationKinds` even if the stored array is empty. Inverse relation items discovered on other characters should still be added to `relations`, but they must not mark the current character as owning that relation kind.

Then pass the projection into `mergeCharacterRelationProjection`. For every relation key:

- if `ownedRelationKinds.has(key)`, assign `legacyProjection.relations[key]` as the complete value.
- otherwise, keep current additive behavior by merging projected shared items and any inverse overlay items.

- [ ] **Step 3: Add overlay helper tests**

Cover `upsertCharacterRelationItem` add/update/no-op and multi-kind removal. The removal test should start from projected data, filter one item, and verify other projected relation items remain in the written array.

- [ ] **Step 4: Implement overlay helpers**

Add:

```ts
export const upsertCharacterRelationItem = (
  characterId: string,
  relationKind: TraitRelationKind,
  item: CharacterRelationItem
) => { ... };

export const removeCharacterRelationItemFromKinds = (
  characterId: string,
  relationKinds: readonly TraitRelationKind[],
  itemId: string
) => { ... };
```

Only write when the target item existed in the projected/current list or the relation key is already owned.

Replace the private `characterRelationKinds` array in `characterRelationOverlay.ts` with `CHARACTER_RELATION_KINDS` from `src/lib/edit/characterRelationActions.ts` so relation path filtering and editable relation overlays cannot drift.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- src/features/characters/utils/relations.test.ts src/features/characters/utils/characterRelationOverlay.test.ts
```

Expected: authoritative removal and overlay helper tests pass.

---

### Task 3: Matrix Editing Rules

**Files:**

- Create: `src/features/character-relations/matrix/relationMatrixEditing.ts`
- Create: `src/features/character-relations/matrix/relationMatrixEditing.test.ts`

- [ ] **Step 1: Write legal-kind and inverse-map tests**

Cover:

- mouse/mouse allows `collaborators` and rejects self-cells.
- cross-faction character allows `counters`, `counteredBy`, `counterEachOther`.
- knowledge card, special skill, map, and mode mappings.
- inverse mapping for character-vs-character kinds only.

- [ ] **Step 2: Implement edit rules**

Export:

- `getLegalRelationKinds(row, column, columnCategory)`
- `isEditableRelationCell(row, column, columnCategory)`
- `getRelationKindLabel(kind)`
- `getInverseCharacterRelationKind(kind)`
- `getSiblingRelationKinds(kind, legalKinds)`

Chinese labels should match existing relation language: `克制`, `被克制`, `互克`, `协作`, `优势地图`, `劣势地图`, `优势模式`, `劣势模式`.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
npm test -- src/features/character-relations/matrix/relationMatrixEditing.test.ts
```

Expected: legal mapping and inverse mapping tests pass.

---

### Task 4: Overlay-Aware Matrix View Model

**Files:**

- Modify: `src/features/character-relations/matrix/relationMatrixViewModel.ts`
- Modify: `src/features/character-relations/matrix/relationMatrixViewModel.test.ts`

- [ ] **Step 1: Add tests for approved overlay display**

Add a test where a character relation array is applied to `characters`, then the matrix view model reads through row-local relation data and shows the cell.

- [ ] **Step 2: Add tests for local removal display**

Add a test where an owned authoritative relation array omits a previously static relation and the matrix cell is absent.

- [ ] **Step 3: Refactor view model options**

Add an option such as:

```ts
type RelationMatrixViewModelOptions = {
  rowFaction?: RelationMatrixRowFaction;
  columnCategory?: RelationMatrixColumnCategory;
  getRelationsForRow?: (characterId: string) => CharacterRelation;
};
```

Default `getRelationsForRow` should be `(characterId) => getCharacterRelation(characters, characterId)`, not `characterRelationTraits`, so approved public game-data actions applied to `characters` are visible in the public matrix. `RelationsClient` should pass `getEditableCharacterRelations(...)` only while edit mode is active.

- [ ] **Step 4: Build cells from row-local relations**

Convert row-local relation arrays into `RelationMatrixCell` entries keyed by row entity and column entity. Do not reuse `projectTraitToCells(...)` for row-local relations and do not add another inverse character projection pass here; the row-local relation arrays already contain the row's display-ready values from `getCharacterRelation(...)` / `getEditableCharacterRelations(...)`.

For every cell, set `sourceKind` to the row-local relation key being read (`counters`, `counteredBy`, `advantageMaps`, etc.). This matters because maps/modes render as counter/countered-by colors but must save back to `advantage*` / `disadvantage*` relation keys.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- src/features/character-relations/matrix/relationMatrixViewModel.test.ts
```

Expected: matrix cells display approved overlays and respect authoritative removals.

---

### Task 5: Editable Matrix Cells

**Files:**

- Modify: `src/features/character-relations/matrix/CharacterRelationsMatrix.tsx`
- Modify: `src/features/character-relations/matrix/CharacterRelationsMatrix.test.tsx`

- [ ] **Step 1: Add edit-mode tests**

Test that:

- view mode keeps current tooltip/link behavior.
- edit mode renders valid empty cells as buttons.
- edit mode filled cells keep color/dot encoding and call `onCellSelect`.
- invalid self-cells are not editable.
- edit mode cell buttons do not wrap the existing `Tooltip` trigger, avoiding mobile tap conflicts between opening a tooltip and opening the editor.

- [ ] **Step 2: Add props**

Add:

```ts
type CharacterRelationsMatrixProps = {
  viewModel: RelationMatrixViewModel;
  cellSize?: number;
  isEditMode?: boolean;
  onCellSelect?: (selection: RelationMatrixCellSelection) => void;
};
```

- [ ] **Step 3: Implement edit-mode button rendering**

Use a full-cell button with an accessible label such as `编辑 杰瑞 与 汤姆 的关系`. Keep existing fill/dot visuals. In view mode, keep the current tooltip behavior unchanged; in edit mode, the cell editor dialog is responsible for showing and editing relation details.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- src/features/character-relations/matrix/CharacterRelationsMatrix.test.tsx
```

Expected: view mode remains unchanged and edit-mode cells are selectable.

---

### Task 6: Relation Matrix Cell Editor

**Files:**

- Create: `src/features/character-relations/matrix/RelationMatrixCellEditor.tsx`
- Create: `src/features/character-relations/matrix/RelationMatrixCellEditor.test.tsx`

- [ ] **Step 1: Write editor behavior tests**

Cover:

- empty ambiguous cell disables `保存` until relation type is selected.
- existing cell preselects current relation kind and description.
- existing map/mode cells preselect the write relation kind from `cell.sourceKind`, not the color/display kind.
- saving changes relation type while preserving description.
- removing a relation calls row and mirrored character removals.

- [ ] **Step 2: Implement BaseDialog editor**

Use `BaseDialog`. Fields:

- relation type control when multiple legal kinds exist.
- `主要` / `次要` toggle.
- description textarea.
- buttons: `保存`, `取消`, `移除`.

- [ ] **Step 3: Implement save/remove orchestration**

Save flow:

1. remove target from all row sibling legal kinds except selected kind.
2. if target is a character, remove row from all mirrored sibling legal kinds except the inverse selected kind.
3. upsert selected row relation.
4. if target is a character, upsert inverse relation on the column character.

Remove flow:

1. remove target from all row legal kinds.
2. if target is a character, remove row from all inverse legal kinds on the column character.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- src/features/character-relations/matrix/RelationMatrixCellEditor.test.tsx
```

Expected: editor add/edit/change/remove tests pass.

---

### Task 7: Relation-Only Edit Mode Hook

**Files:**

- Create: `src/features/character-relations/matrix/useRelationMatrixEditMode.ts`
- Create: `src/features/character-relations/matrix/useRelationMatrixEditMode.test.tsx`

- [ ] **Step 1: Write hook tests**

Cover:

- relation action count excludes unrelated character drafts.
- publish sends only relation actions.
- discard applies inversions only for relation actions while suppressing edit-action recording.
- unrelated character drafts remain in localStorage.
- dirty state and `draftInfo` update after relation overlay edits are written to `characters`.

- [ ] **Step 2: Implement hook**

Use `getActionsStorageKey('characters')`, `readActionHistory`, `writeActionHistory`, `squashActions`, `invertActionEntry`, `applyActionEntry`, `withRecordingSuppressed`, and `splitCharacterRelationActionHistory`.

Subscribe to the existing `characters` Valtio store, as `usePageEditMode(...)` does, so the hook re-computes relation action counts after matrix edits. Keep a small local trigger state for recomputation; do not introduce a second draft store.

Publish to:

```ts
fetch('/api/game-data-actions/publish-relations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ entries: squashedRelationActions, message }),
});
```

- [ ] **Step 3: Preserve toolbar-compatible result shape**

Return the fields needed by `EditModeToolbar`: `isDirty`, `isPublishing`, `draftInfo`, `draftsSummary`, `discardChanges`, `publishChanges`, and `getActionCount`.

`discardChanges` must apply inverse actions inside:

```ts
withRecordingSuppressed(getActionsStorageKey('characters'), () => {
  for (let i = relationActions.length - 1; i >= 0; i -= 1) {
    applyActionEntry(characters, invertActionEntry(relationActions[i]!));
  }
});
```

After publish or discard, write only the unrelated character actions back to `editmode:actions:characters`; remove the storage key if none remain. `draftsSummary` should be derived from the squashed relation-only actions and remain compatible with `EditModeToolbar`, but it must not include unrelated character drafts.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- src/features/character-relations/matrix/useRelationMatrixEditMode.test.tsx
```

Expected: relation-only publish/discard tests pass.

---

### Task 8: Role-Gated Relation Publish API

**Files:**

- Create: `src/app/api/game-data-actions/publish-relations/route.ts`
- Create: `src/app/api/game-data-actions/publish-relations/route.test.ts`

- [ ] **Step 1: Write API tests**

Cover:

- unauthenticated request returns `401`.
- unauthorized role returns `403`.
- Supabase-disabled environment returns the same disabled response pattern as the broad publish route.
- non-relation path returns `400`.
- valid relation action calls shared publish helper with `entityType: 'characters'`.

- [ ] **Step 2: Implement route**

Use:

```ts
const guard = await requireRole(['Contributor', 'Reviewer', 'Coordinator']);
if ('error' in guard) return guard.error;
```

Parse `{ entries, message }`, validate with `actionHistorySchema`, flatten nested entries with `flattenActionEntries(...)`, reject any action whose path fails `isCharacterRelationAction`, then call shared publish helper with exactly one action item: `{ entityType: 'characters', entries }`.

Keep request parsing narrow for this endpoint. It should not accept the broad `/api/game-data-actions/publish` batch shape, because this route exists specifically to prevent relation submissions from publishing unrelated character edits.

- [ ] **Step 3: Run focused API tests**

Run:

```powershell
npm test -- src/app/api/game-data-actions/publish-relations/route.test.ts
```

Expected: API authorization and relation-path validation tests pass.

---

### Task 9: Relations Page Wiring

**Files:**

- Modify: `src/app/(main)/relations/RelationsClient.tsx`
- Create or modify: `src/app/(main)/relations/RelationsClient.test.tsx`

- [ ] **Step 1: Write page integration tests**

Cover:

- edit button is hidden for null role.
- edit button is shown for `Contributor`, `Reviewer`, and `Coordinator`.
- manual unauthorized `?edit=1` exits edit mode and shows a Chinese toast.
- manual unauthorized `?edit=1` does not render the relation editor or toolbar.
- matrix receives `isEditMode` and `onCellSelect`.
- toolbar receives relation-only hook state.

- [ ] **Step 2: Wire role gate**

Use `useUser()`. Define:

```ts
const canEditRelations =
  userRole === 'Contributor' || userRole === 'Reviewer' || userRole === 'Coordinator';
```

- [ ] **Step 3: Wire overlay-aware view model**

Use `useSnapshot(characters)` in edit mode. Pass row relation provider:

```ts
getRelationsForRow: (characterId) =>
  isEditMode
    ? getEditableCharacterRelations(characterId, charactersSnapshot[characterId])
    : getCharacterRelation(characters, characterId);
```

- [ ] **Step 4: Render editor and toolbar**

Add `EditButton` to `CatalogPageShell.actions`, selected-cell state, `RelationMatrixCellEditor`, and `EditModeToolbar`.

If `isEditMode` is true but `canEditRelations` is false, call `exitEditMode()` from `useSearchParamEditMode()` and show a short Chinese toast. This page-level guard is still required even though the API has role enforcement, because the global `EditModeProvider` treats `?edit=1` as active edit mode before page-specific controls render.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- "src/app/(main)/relations/RelationsClient.test.tsx"
```

Expected: role gate, edit-mode wiring, and toolbar tests pass.

---

### Task 10: Final Verification

**Files:**

- All files touched by prior tasks.

- [ ] **Step 1: Run focused test groups**

Run:

```powershell
npm test -- characterRelationActions
npm test -- characterRelationOverlay
npm test -- relationMatrix
npm test -- useRelationMatrixEditMode
npm test -- publish-relations
```

Expected: all focused suites pass.

- [ ] **Step 2: Run project quality checks**

Run:

```powershell
npm run lint
npm run type-check
```

Expected: lint has zero warnings and type-check exits successfully.

- [ ] **Step 3: Run broad tests if the touched surface is broad**

Run:

```powershell
npm test
```

Expected: Jest exits successfully.
