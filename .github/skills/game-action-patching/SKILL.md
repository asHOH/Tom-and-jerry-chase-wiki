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
3. For an ahead/mismatched source, query later rows for the same entity and overlapping exact,
   ancestor/descendant, array, or equivalent relation paths, even outside the requested dates.
   Preserve a value explained by a later approved/public or synced row; pending/rejected/revoked
   rows do not justify it. Otherwise defer—never overwrite unexplained newer source.
4. If <=25 rows all map clearly, proceed; otherwise chunk and present a plan. "Clear" means one
   file/record and matching old projection: e.g. a unique `ItemId.description`; a nested skill
   index whose skill/level and old value match; or one relation target/kind plus required
   `factionId`, including equivalent orientations. Missing/duplicate IDs, shifted indices,
   ambiguous factions, old-value mismatch, or unexplained ahead source are unclear.
5. Valid statuses: `pending`, `approved`, `rejected`, `synced`, `revoked`. Sync only verified
   approved rows; never sync failed, fuzzy, skipped, pending, rejected, or revoked rows.
6. Stay on the current branch. Treat Chinese terminal mojibake as a display issue unless file
   bytes/editor output prove corruption; do not rewrite strings solely to fix terminal display.

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
