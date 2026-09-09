# Shared Game Action Correctness Rules

Both game-action-patching and game-action-compaction must read this reference before inspecting,
classifying, or editing actions. Workflow routing, checkpoints, and cutover authorization remain
in their respective skills.

## Scope

- Prefer feature-local files: character fields in `src/features/characters/data/*Characters.ts`,
  relations in `src/data/characterRelationData/*.ts`, then entity/special-skill data. Treat
  `src/data/characterRelations.ts` as a facade, not a source of truth. Defer ambiguous targets.
- Interpret date ranges as inclusive Beijing calendar days. In `Asia/Shanghai`, query from the
  start day at 00:00 through the day after the end at 00:00 (exclusive); e.g. `2026-07-06~07-08` becomes
  `[2026-07-05T16:00:00Z, 2026-07-08T16:00:00Z)`. Apply the same next-day-exclusive rule to
  one day. Resolve omitted years from user/current-date context.

A clear target is one canonical file/record with a matching old projection or an accepted
already-represented result: a unique `ItemId.description`, a nested skill index whose skill/level
and old value match, or one relation target/kind with the required `factionId`.
Never rewrite complete aggregated published records merely because replay can construct them.

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
if it reports `output_too_large`. Split inspection output only; keep dependency groups together
for classification, patching, and verification.

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

4. Valid statuses: `pending`, `approved`, `rejected`, `synced`, `revoked`. Only a separately
   authorized, parity-preserving status-cutover workflow may sync verified approved rows; never
   sync failed, fuzzy, skipped, pending, rejected, or revoked rows.
5. Stay on the current branch. Treat Chinese terminal mojibake as a display issue unless file
   bytes/editor output prove corruption; do not rewrite strings solely to fix terminal display.
6. Report any important gap or error discovered in these instructions. If it makes an action
   ambiguous, defer that action rather than guessing.

## Classification

Assign every group exactly one disposition before editing. For each deferred row, report its ID/path,
current baseline value, recorded old/new values, reason, and dependencies; link full values if lengthy.

- **Ready**: every write-set location is explainable under the `S/O/N` rules above; every
  physical target is unambiguous; required old/new or parent-array chains are valid; and no safety
  gate raises a content concern.
- **Represented**: the final effect is already present exactly or through an accepted semantic
  relation equivalent. Plan no source rewrite, but retain every covered row for verification.
- **Review required**: the source matches neither old nor new but bounded overlapping history may
  explain it; relation orientation or material-field intent requires judgment; repeated submissions
  conflict; or the action introduces a semantic contradiction with a paired field.
- **Blocked**: malformed or unsupported data, unexplained broken chains, shifted or unstable array
  identities, missing/duplicate source identities, ambiguous factions, likely placeholder children,
  or any state that cannot be reconstructed without guessing.

Do not turn `Review required` into `Ready` by replaying over unexplained source. Resolve it using the
complete overlapping history allowed by the write-set rules above or leave it deferred. Pending,
rejected, and revoked rows never explain source state.

## Verification

- **Static/object**: Compare the affected canonical field/subtree exactly after transforms.
- **Array**: Verify the literal index and old item, then final length, order, identity (`id`/`name`),
  and changed fields.
- **Relation**: Verify semantic subject/target/kind/`factionId` and material fields, accepting
  inverse/symmetric equivalents.
- Verify every flattened parent/child action against the final source and check for duplicates,
  contradictions, or unintended reordering.

Run `npm run verify:game-data-actions -- --ids=<complete-group-row-ids>` for every applied or
represented group. Pass every row in a parent/child or old/new chain together so reverse
verification can reconstruct intermediate states. Defer the whole submitted verification batch
if any row is unsupported or mismatched. Never split a dependency group to fit a tool limit;
report a tooling blocker if the verifier cannot accept the complete group.

## Safety Gates

- Check newValue placement and schema shape.
- Report existing semantic differences (including summary/detail mismatches), but do not defer solely
  because of them. Defer contradictions introduced by the action until user-approved reconciliation;
  do not mark those actions verified or remotely sync them before resolution.
- Verify message intent (e.g. relation added and old deleted).
- Relations: run targeted Prettier, grep/read checks, and
  `npm run report:character-relations` (the report does not check formatting).
- Static character data: run targeted Prettier, projection checks, `npm run lint`, and
  `npm run type-check`. Run full tests only for shared logic/components or on request.
- Run relevant tests when shared projection, replay, verification, source-mapping logic, or
  components change. Ordinary data-only patches do not require unrelated full tests.
