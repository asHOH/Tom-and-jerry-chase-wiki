---
name: game-action-patching
description: 'Patch and verify small, clear cohorts of at most 25 approved game_data_actions in canonical character relation/data files. Use game-action-compaction for broad, oversized, or dependency-heavy cohorts.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching

## Goal

Safely patch approved game_data_actions into code and verify them; defer the rest.

## Routing

Use this skill only when the cohort has at most 25 rows, every row maps clearly, and no dependency
crosses the selected cohort. For a broad period, more than 25 rows, `output_too_large`, or
dependency-heavy baseline compaction, read `../game-action-compaction/SKILL.md` and continue under
that workflow. Do not turn one bulk compaction into unrelated 25-row patches.

## Operation Boundary

- Treat patching as a local source-code workflow by default.
- Never open, inspect, or control a browser as part of this skill.
- Do not mutate remote moderation status unless the user explicitly requests it as a separate
  follow-up and an established parity-preserving status-cutover workflow is available. Local
  verification alone does not prove that a remote status transition is safe. Otherwise report the
  verified IDs for a separately reviewed cutover.

## Scope

- Prefer feature-local files: character fields in `src/features/characters/data/*Characters.ts`,
  relations in `src/data/characterRelationData/*.ts`, then entity/special-skill data. Treat
  `src/data/characterRelations.ts` as a facade, not a source of truth. Defer ambiguous targets.
- Interpret date ranges as inclusive Beijing calendar days. In `Asia/Shanghai`, query from the
  start day at 00:00 through the day after the end at 00:00 (exclusive); e.g. `2026-07-06~07-08` becomes
  `[2026-07-05T16:00:00Z, 2026-07-08T16:00:00Z)`. Apply the same next-day-exclusive rule to
  one day. Resolve omitted years from user/current-date context.

## Inspection Command

Use the repository inspector instead of writing one-off SQL or manually decoding `entry` JSONB:

```powershell
# Approved, public actions for one inclusive Beijing day
npm run inspect:game-data-actions -- --date=2026-07-24

# Approved, public actions for an inclusive Beijing range, optionally limited to one actor root
npm run inspect:game-data-actions -- --from=2026-07-24 --to=2026-07-26 --actor=Tom

# Exact rows, with small values and optional overlapping history
npm run inspect:game-data-actions -- --ids=<comma-separated UUIDs> --values
npm run inspect:game-data-actions -- --ids=<comma-separated UUIDs> --include-history
```

The command is read-only and uses the same service-key credential convention and paginated query
adapter as `npm run audit:game-data-actions`. It decodes single, array, and nested-array entries;
projects legacy paths; compares each action with current source; groups dependent rows; and checks
same-path old/new chains. Date scopes perform the Beijing-to-UTC conversion and return inventory
without complete values. Exact-ID scopes accept at most 25 IDs. `--values` returns complete values
only for payloads at or below 10,000 serialized bytes; larger payloads always return bounded
structural summaries/diffs. Total output is capped near 50,000 bytes, so split an exact-ID request
if it reports `output_too_large`.

`--include-history` finds exact and ancestor/descendant path overlaps. Until relation-semantic
history matching is implemented, also inspect inverse and symmetric relation endpoints using the
mapping below. Report this limitation if it affects a decision. Use direct SQL only as a diagnosed
fallback when the inspector cannot express the required scope, and report the missing capability.

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
- **No-op**: Don't reorder or rewrite an equivalent unchanged relation. Report its ID as verified
  after verification without changing remote status.
- **Duplicate cleanup**: If an action removes a redundant edge that is already covered by another relation, remove only the redundant edge. Do not rewrite the other one.
- **Indices**: Treat 0, 1 literally. Defer if oldValue mismatches.
- **Flattened children**: If a parent `set` row is applied and child-path rows describe the same
  final value, verify against the final source once and report all covered rows as verified.
- **Placeholder defaults**: If a child action only writes a likely UI default/placeholder value
  (e.g. `新别名`) and no later action replaces it with a real value, do not report it verified or
  remotely sync it; report it as a likely mis-add.

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
        required `O` is an unsynced dependency. Apply and verify it first only when it is explicitly
        in the current batch; otherwise defer and report the dependency.
     4. Replay multiple qualifying rows in `(created_at, id)` order. If their old/new chain breaks,
        two rows claim incompatible results, or no qualifying row produces `S`, defer.

   Rows with `pending`, `rejected`, or `revoked` status never explain source state. Preserve values
   outside the write set. Never overwrite an unexplained or superseding source value.

4. If at most 25 rows all map clearly, proceed. "Clear" means one file/record and matching old
   projection: e.g. a unique `ItemId.description`; a nested skill index whose skill/level and old
   value match; or one relation target/kind plus required `factionId`, including equivalent
   orientations. Missing/duplicate IDs, shifted indices, ambiguous factions, old-value mismatch,
   or unexplained ahead source are unclear. Route a larger, oversized, broad, or dependency-heavy
   cohort to `game-action-compaction`; for an unclear small cohort, present a plan and defer
   ambiguity rather than guessing.
5. Valid statuses: `pending`, `approved`, `rejected`, `synced`, `revoked`. Only a separately
   authorized, parity-preserving status-cutover workflow may sync verified approved rows; never
   sync failed, fuzzy, skipped, pending, rejected, or revoked rows.
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

1. **Discovery**: Run `npm run inspect:game-data-actions` with the date scope above. Use exact IDs
   with `--values` for rows being patched and `--include-history` when source matches neither old
   nor new.
2. **Classify**: Map or Defer. If discovery crosses the routing boundary above, stop this workflow
   and continue under `game-action-compaction`. For an unclear small cohort, present a plan and wait
   for approval.
3. **Apply & Verify**: Edit, run the verification recipe and safety gates, and pause between chunks.
   Then run `npm run verify:game-data-actions -- --ids=<comma-separated UUIDs>`. Pass every row in
   a parent/child or old/new chain together in the same invocation so reverse verification can
   reconstruct intermediate states. Defer the whole submitted verification batch if any row is
   unsupported or mismatched.
4. **Report Verified IDs**: Stop after local verification. Report the verified IDs for a separately
   reviewed status cutover; do not use a browser or mutate remote status as part of the normal
   workflow.
5. **Optional Status Cutover**: Only when the user explicitly requests it as a separate follow-up,
   use an authorized non-browser mechanism and an established workflow that preserves published
   output without missing or double-replayed actions. Local reverse verification alone is
   insufficient. Do not add mutation logic to `scripts/verify-game-data-actions.mjs`.
6. **Finalize**: Re-run the inspector for the exact IDs to re-query `status` and `is_public`, then
   summarize locally Verified,
   Deferred/Remaining, and any remotely Synced rows. Do not describe a locally verified row as
   synced unless the re-query confirms `status = 'synced'`.

## Status-Cutover Handoff

Small-batch patching never implies permission to transition status. For a separately authorized
cutover, use the compaction workflow and read the
[human operator runbook](../../../docs/operations/game-data-action-compaction.md) before acting.

Hand off exact cutover and verification-only row IDs as separate sets. The normal path accepts only
concrete `set` actions and requires two deployments plus explicit Supabase target confirmation. If
rows are already `synced/private`, never restore or sync them again; use the read-only `post-check`
recovery path.

The reconciled 2026-07-28 through 2026-07-29 cohort (24 original rows plus 3 G09 rows) is already
synced and must never enter status-cutover mode again.

## Safety Gates

- Check newValue placement and schema shape.
- For paired summary/detail fields (e.g. a skill level's `description` and
  `detailedDescription`), check that a new value does not contradict its sibling. If it does,
  report and defer the action; do not report it verified or remotely sync it without user-approved
  reconciliation.
- Verify message intent (e.g. relation added and old deleted).
- Relations: run targeted Prettier, grep/read checks, and
  `npm run report:character-relations` (the report does not check formatting).
- Static character data: run targeted Prettier, projection checks, `npm run lint`, and
  `npm run type-check`. Run full tests only for shared logic/components or on request.
