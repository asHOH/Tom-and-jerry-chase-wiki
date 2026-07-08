# Character Relation Projection Normalizer Spec

## Goal

Prevent stale or malformed character relation overlays from crashing `/relations/` while keeping
canonical relation validation strict.

The immediate failure mode is a duplicate matrix cell such as:

```text
character:侦探杰瑞:=>character:兔八哥:
```

Canonical relation data no longer reproduces the issue. The reproducible case is stale local edit
state: canonical data projects `侦探杰瑞 -> 兔八哥` as `counters`, while an old draft/overlay still
projects the same row/target pair as `counterEachOther`.

## Scope

Implement a pure projection normalizer in the read-only relation projection path. The normalizer
must not mutate the Valtio store, localStorage, action history, or canonical data.

Use `normalizer` / `normalize*` terminology for implementation names and documentation. The intent
is to derive a deterministic, display-safe projection from already-known relation inputs, not to
perform security-oriented input cleanup.

Preferred integration point:

- `src/features/characters/utils/relationReadModel.ts`

The matrix builder may still keep a defensive fallback, but the main fix belongs before read-only
consumers receive `CharacterRelation` arrays.

Edit-mode helpers may intentionally expose raw stored overlay arrays so users can inspect or repair
draft state. Do not silently rewrite or hide raw edit data as part of this change. If non-edit
character detail rendering should hide malformed overlays, handle that as a separate display-mode
decision.

## Invariants

For one row character, one target can resolve to at most one visible relation within its target
domain.

Do not apply target id uniqueness globally across all relation arrays. `CharacterRelationItem.id` is
a plain string, and different target domains can theoretically reuse the same text id.

Target domains:

- Character target:
  - `collaborators`
  - `counters`
  - `counteredBy`
  - `counterEachOther`
- Knowledge card target:
  - `countersKnowledgeCards`
  - `counteredByKnowledgeCards`
- Special skill target:
  - `countersSpecialSkills`
  - `counteredBySpecialSkills`
- Map target:
  - `advantageMaps`
  - `disadvantageMaps`
- Mode target:
  - `advantageModes`
  - `disadvantageModes`

The normalizer needs character faction information to evaluate legality. Keep that dependency
explicit by passing the `charactersRecord` already available to `getCharacterRelation`, or by
passing a small faction resolver such as `(characterId) => FactionId | undefined`. Do not make the
normalizer import the global character store directly.

## Character Target Rules

Character-character normalization has two separate checks.

### 1. Legality

Drop relation items that are illegal for the row/target faction pair.

- `mouse -> mouse`: only `collaborators` is legal.
- `mouse -> cat` and `cat -> mouse`: only `counters`, `counteredBy`, and `counterEachOther` are
  legal.
- `cat -> cat`: no character relation kind is legal.
- `row === target`: no character relation kind is legal.

Illegal draft data and legal-but-conflicting draft data are different problems and should be warned
with different messages in development.

### 2. Conflict Resolution

After legality filtering, if multiple legal relation kinds still claim the same character target,
keep one deterministically and drop the rest.

Conflict priority:

1. Explicit relation-kind order for character targets:
   `counters`, `counteredBy`, `counterEachOther`, `collaborators`.
2. Within the current relation kind, keep the first item for a duplicated target id.

This is intentionally simple. It fixes stale overlays without requiring localStorage migration or
canonical-vs-overlay provenance tracking.

Do not rely on JavaScript object property order to define conflict priority. Keep the order in a
typed constant or relation-domain metadata array.

## Non-Character Target Rules

For each non-character target domain, relation kind pairs are mutually exclusive:

- `countersKnowledgeCards` conflicts with `counteredByKnowledgeCards`.
- `countersSpecialSkills` conflicts with `counteredBySpecialSkills`.
- `advantageMaps` conflicts with `disadvantageMaps`.
- `advantageModes` conflicts with `disadvantageModes`.

Within each domain, keep the first item for a duplicated target id and drop later duplicates or
conflicting relation kinds.

This can be implemented as a small list of mutually exclusive relation-kind pairs. Avoid building a
generic relation-domain framework unless the existing constants make it trivial.

## Warnings

In development only, warn when dropping an item.

Warnings should include:

- row character id
- target id
- dropped relation kind
- kept relation kind, when applicable
- reason: `illegal` or `conflicting`

Avoid excessive repeated warnings if the same normalized relation is read often.

A module-level `Set` keyed by row id, target domain, target id, dropped kind, kept kind, and reason
is enough. Do not add a logging abstraction for this.

## Non-Goals

- Do not rewrite localStorage during render.
- Do not mutate draft action history automatically.
- Do not weaken canonical relation validation.
- Do not build a generic graph migration system.
- Do not hide publish-time validation needs behind UI normalization.
- Do not implement canonical-vs-overlay provenance tracking.
- Do not make the matrix builder a second copy of the normalizer.

## Brief Implementation Plan

1. Extract or define small pure relation-domain metadata for target-domain groups, explicit
   conflict priority, and character legality rules. Reuse existing relation-kind constants where
   practical, but do not call mutation helpers such as `removeCharacterRelationItemFromKinds`.
2. Add a pure normalizer that accepts the row `characterId`, a merged `CharacterRelation`, and
   explicit faction lookup context such as `charactersRecord` or `getCharacterFactionId`, then
   returns a normalized `CharacterRelation`.
3. For character targets, run legality filtering first, then resolve remaining legal conflicts.
4. For non-character target groups, resolve duplicates and mutually exclusive relation kinds by
   target id.
5. Call the normalizer from `getCharacterRelation` after `mergeCharacterRelationProjection`.
6. Preserve `getEditableCharacterRelations` behavior deliberately: edit mode may still show stored
   raw overlay arrays after the projected baseline is normalized. If display-mode callers need
   normalized arrays, keep that path separate from raw edit state.
7. Add regression tests for `侦探杰瑞 -> 兔八哥` with canonical `counters` plus stale
   `counterEachOther` overlay, proving the read model and `/relations/` matrix do not throw.
8. Add tests for illegal character relation overlays, same-kind duplicate ids, and non-character
   mutually exclusive conflicts.
9. Keep or add a matrix-level defensive fallback as a secondary guard only. If a duplicate cell
   still appears, warn in development and keep the first cell instead of crashing production, but do
   not reimplement legality or domain conflict logic there.

## Verification

Targeted checks:

```powershell
npm test -- src/data/characterRelationValidation.test.ts --runInBand
npm test -- src/features/characters/utils/relations.test.ts --runInBand
npm test -- src/features/character-relations/matrix/relationMatrixViewModel.test.ts --runInBand
```

Project checks:

```powershell
npm run lint
npm run type-check
```
