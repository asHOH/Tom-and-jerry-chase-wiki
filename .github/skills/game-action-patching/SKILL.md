---
name: game-action-patching
description: 'Patch approved game_data_actions into character relation/data files.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching

## Goal

Safely patch approved game_data_actions into code, verify, and set synced; defer/reject the rest.

## Scope

- Prefer feature-local files: character fields in `src/features/characters/data/*Characters.ts`,
  relations in `src/data/characterRelationData/*.ts`, then entity/special-skill data. Treat
  `src/data/characterRelations.ts` as a facade, not a source of truth. Defer ambiguous targets.
- Interpret date ranges as inclusive Beijing calendar days. In `Asia/Shanghai`, query from the
  start day at 00:00 through the day after the end at 00:00 (exclusive); e.g. `2026-07-06~07-08` becomes
  `[2026-07-05T16:00:00Z, 2026-07-08T16:00:00Z)`. Apply the same next-day-exclusive rule to
  one day. Resolve omitted years from user/current-date context.

## Discovery Queries

`game_data_actions` stores the operation and values in `entry` JSONB; do not query nonexistent
flattened columns such as `entity_id`, `action`, `field_path`, `old_value`, or `new_value`.
An `entry` may be one action or an action array. Start with one inventory row per decoded action,
substituting the UTC bounds derived above:

```sql
select id, created_at, status, is_public, entity_type,
       action.value->>'op' as op, action.value->>'path' as path,
       pg_column_size(action.value->'oldValue') as old_bytes,
       pg_column_size(action.value->'newValue') as new_bytes,
       message
from public.game_data_actions
cross join lateral jsonb_array_elements(
  case jsonb_typeof(entry) when 'array' then entry else jsonb_build_array(entry) end
) with ordinality as outer_action(value, outer_ord)
cross join lateral jsonb_array_elements(
  case jsonb_typeof(outer_action.value)
    when 'array' then outer_action.value else jsonb_build_array(outer_action.value)
  end
) with ordinality as action(value, action_ord)
where status = 'approved'
  and created_at >= timestamptz 'FROM_UTC'
  and created_at <  timestamptz 'TO_UTC'
order by created_at, id, outer_ord, action_ord;
```

Fetch complete values only after this inventory. Treat either value over 10,000 stored bytes as a
large-payload heuristic, and aim to keep returned JSON text under about 50,000 bytes. For a large
action, query it alone and return structure/diffs instead of both complete values:

- Object with a large array child: compare the objects with that child removed, then inspect the
  child separately.
- Array: get old/new lengths and compare order. Use `id`, then `name`, only when present and unique
  in both arrays; otherwise compare by literal index. Return only added, removed, moved, or changed
  elements with ordinality.
- Chained parent sets: after legacy/schema projection, verify each `newValue` equals the next
  `oldValue`; inspect the first old value, each step's changes, and the last new value.

Do not request multiple complete map/large parent values in one MCP result.

## Relation Mapping (src/data/characterRelationData/\*.ts)

Use `characterCounters.ts`, `characterCollaborators.ts`, `knowledgeCards.ts`, `specialSkills.ts`,
`maps.ts`, or `modes.ts` according to target type.

| Action Path                 | Target kind                               | subject | target                         |
| --------------------------- | ----------------------------------------- | ------- | ------------------------------ |
| X.counters                  | counters                                  | X       | Y                              |
| X.counteredBy               | counteredBy                               | X       | Y                              |
| X.counterEachOther          | counterEachOther                          | X       | Y                              |
| X.advantageMaps             | advantageMaps                             | X       | map                            |
| X.disadvantageMaps          | disadvantageMaps                          | X       | map                            |
| X.advantageModes            | advantageModes                            | X       | mode                           |
| X.disadvantageModes         | disadvantageModes                         | X       | mode                           |
| X.counteredBy[Cards/Skills] | counteredBy[KnowledgeCards/SpecialSkills] | X       | [card/skill] (needs factionId) |

- **Text**: Put user text in top-level description.
- **Equivalence**: Preserve existing orientation: `X.counteredBy Y` equals `Y.counters X`.
  `collaborators` and `counterEachOther` are symmetric, so reversed endpoints are also equal.
  Keep one edge; update only material fields (`description`, `isMinor`, tags).
- **No-op**: Don't reorder or rewrite an equivalent unchanged relation; it may be synced after
  verification.
- **Duplicate cleanup**: If an action removes a redundant edge that is already covered by another relation, remove only the redundant edge. Do not rewrite the other one.
- **Indices**: Treat 0, 1 literally. Defer if oldValue mismatches.
- **Flattened children**: If a parent `set` row is applied and child-path rows describe the same final value, verify against the final source once and sync all covered rows.
- **Placeholder defaults**: If a child action only writes a likely UI default/placeholder value (e.g. `新别名`) and no later action replaces it with a real value, do not sync it; report it as a likely mis-add.

## Core Rules

1. Process `created_at`, then `id`, ascending; for overlaps, apply parents before children and let
   later/child values win. Remove obsolete twins; defer ambiguity.
2. Project legacy actions into the current schema before comparison. For positioning tags,
   convert `isMinor: true -> level: 2` and `false -> 4`; an existing valid `level` wins. This is
   one-way compatibility—never collapse levels 0, 1, or 3 back to a boolean.
3. Compare conflicts at the action's **write set**, not by labeling whole rows "conflicted" or
   "non-conflicted":
   - Scalar/null `set`, and non-array `add` or `delete`: the exact action path is the write set.
   - Array-index `add` or `delete`: the containing array's structure and order are the write set.
     Array-index `set` writes the indexed item, but requires old-value and identity verification.
   - Object `set`: changed/added/deleted descendant leaves between projected `oldValue` and
     `newValue` are the write set. Include the container path when existence, type, or an empty
     container changes.
   - Array `set`: length, order, identities, and changed fields are the write set. If items lack a
     unique stable `id`/`name`, the entire array path is the write set.
   - Relation `set`: membership by semantic endpoints/kind/`factionId` and changed material fields
     (`description`, `isMinor`, tags) are the write set; orientation-equivalent edges are one item.

   Treat an absent value as `ABSENT`, distinct from JSON `null`. Derive projected source `S`, old
   state `O`, and new state `N` at each write-set location. Exact-path `add` has `O = ABSENT` and
   `delete` has `N = ABSENT`; array-index structural operations require verified parent-array
   before/after states. If those states cannot be reconstructed from a valid chain, defer.
   - `S = O`: apply `N` at that location.
   - `S = N`: it is already represented; do not rewrite it.
   - `S` matches neither: without a date restriction, query all decoded actions for the same
     `entity_type` whose exact, ancestor/descendant, containing-array, or equivalent-relation write
     sets overlap. Order them by `created_at`, `id`, then action order, and resolve only as follows:
     1. A later `synced` row, or later `approved` row with `is_public = true`, that writes the
        location and whose resulting value equals `S` supersedes this action there; preserve `S`.
     2. An earlier `synced` row whose resulting value equals `S` proves the source state, but does
        not repair a stale `O`; defer the current action and never infer or text-merge a value.
     3. An earlier row with `status = 'approved'` and `is_public = true` whose result supplies the
        required `O` is an unsynced dependency. Apply and sync it first only when it is explicitly
        in the current batch; otherwise defer and report the dependency.
     4. Replay multiple qualifying rows in `(created_at, id)` order. If their old/new chain breaks,
        two rows claim incompatible results, or no qualifying row produces `S`, defer.

   Rows with `pending`, `rejected`, or `revoked` status never explain source state. Preserve values
   outside the write set. Never overwrite an unexplained or superseding source value.

4. If <=25 rows all map clearly, proceed; otherwise chunk and present a plan. "Clear" means one
   file/record and matching old projection: e.g. a unique `ItemId.description`; a nested skill
   index whose skill/level and old value match; or one relation target/kind plus required
   `factionId`, including equivalent orientations. Missing/duplicate IDs, shifted indices,
   ambiguous factions, old-value mismatch, or unexplained ahead source are unclear.
5. Valid statuses: `pending`, `approved`, `rejected`, `synced`, `revoked`. Sync only verified
   approved rows; never sync failed, fuzzy, skipped, pending, rejected, or revoked rows.
6. Stay on the current branch. Treat Chinese terminal mojibake as a display issue unless file
   bytes/editor output prove corruption; do not rewrite strings solely to fix terminal display.
7. Report any important gap or error discovered in these instructions. If it makes an action
   ambiguous, defer that action rather than guessing.

## Verification

- **Static/object**: Compare the affected canonical field/subtree exactly after transforms.
- **Array**: Verify the literal index and old item, then final length, order, identity (`id`/`name`),
  and changed fields.
- **Relation**: Verify semantic subject/target/kind/`factionId` and material fields, accepting
  inverse/symmetric equivalents.
- Verify every flattened parent/child action against the final source and check for duplicates,
  contradictions, or unintended reordering.

## Workflow

1. **Discovery**: Query approved actions via Supabase MCP using the date rules above.
2. **Classify**: Map or Defer. For large sets, present chunk plan and wait for approval.
3. **Apply & Verify**: Edit, run the verification recipe and safety gates, and pause between chunks.
4. **Mark Synced**: Prefer `prepared_mark_game_data_action_synced`. It must atomically set
   `status: 'synced'` and `is_public: false`; `is_public` controls live replay, while `synced`
   preserves history. Leaving it true replays code already baked into source.
5. **Finalize**: Re-query both fields and summarize Synced and Deferred/Remaining rows.

## Supabase MCP Fallback (If not exposed)

- Use local JS client over NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
- If the RPC is unavailable, update a specific ID guarded by `status = 'approved'` and
  `is_public = true`; set both sync fields together, require one affected row, and re-query it.

## Safety Gates

- Check newValue placement and schema shape.
- For paired summary/detail fields (e.g. a skill level's `description` and
  `detailedDescription`), check that a new value does not contradict its sibling. If it does,
  report and defer the action; do not mark it synced without user-approved reconciliation.
- Verify message intent (e.g. relation added and old deleted).
- Relations: run targeted Prettier, grep/read checks, and
  `npm run report:character-relations` (the report does not check formatting).
- Static character data: run targeted Prettier, projection checks, `npm run lint`, and
  `npm run type-check`. Run full tests only for shared logic/components or on request.
