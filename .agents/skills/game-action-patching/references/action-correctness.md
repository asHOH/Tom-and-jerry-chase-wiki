# Shared Game Action Correctness Rules

Both game-action-patching and game-action-compaction must read this reference before inspecting, classifying, or editing actions. Workflow routing, checkpoints, and cutover authorization remain in their respective skills.

## Scope

- Use feature-local canonical data. Character fields and pair overrides live in `src/features/characters/data/*Characters.ts`; other relations follow the mapping below. `src/data/characterRelations.ts` is a facade. Defer ambiguous physical targets.
- Interpret date ranges as inclusive Beijing calendar days. In `Asia/Shanghai`, query from the start day at 00:00 through the day after the end at 00:00 (exclusive); e.g. `2026-07-06~07-08` becomes `[2026-07-05T16:00:00Z, 2026-07-08T16:00:00Z)`. Apply the same next-day-exclusive rule to one day. Resolve omitted years from user/current-date context.

A clear target is one canonical file/record with a matching old projection or an accepted already-represented result: a unique `ItemId.description`, a nested skill index whose skill/level and old value match, or one relation target/kind with the required `factionId`. Never rewrite complete aggregated published records merely because replay can construct them.

## Inspection Command

Use the repository inspector instead of writing one-off SQL or manually decoding `entry` JSONB:

```powershell
# Approved, public actions for one inclusive Beijing day
npm run inspect:game-data-actions -- --date=2026-07-24

# Approved, public actions for an inclusive Beijing range, optionally limited to one actor root
npm run inspect:game-data-actions -- --from=2026-07-24 --to=2026-07-26 --actor=Tom

# Compact whole-row inventory pages; continue until nextCursor is null
npm run inspect:game-data-actions -- --date=2026-07-24 --page-size=25
npm run inspect:game-data-actions -- --date=2026-07-24 --page-size=25 --cursor=<nextCursor>

# Exact rows, with small values and optional overlapping history
npm run inspect:game-data-actions -- --ids=<comma-separated UUIDs> --values
npm run inspect:game-data-actions -- --ids=<comma-separated UUIDs> --include-history

# Complete evidence, including oversized payloads; parent directory must already exist
npm run inspect:game-data-actions -- --date=2026-07-24 --output=.tmp/inventory-2026-07-24.json
npm run inspect:game-data-actions -- --ids=<comma-separated UUIDs> --include-history --output=.tmp/details.json
```

The inspector decodes stored action shapes, projects legacy paths, compares source values, groups dependencies, and checks old/new chains. Keep these output forms distinct:

- Console reports summarize large values; `--values` includes values up to 10,000 serialized bytes. Output is capped near 50,000 bytes. Exact-ID requests accept at most 25 IDs.
- `--output=<new ignored path>` retains complete `rows`, `entry`, and matching `historyRows`, regardless of size or date/ID scope, plus target, query times, and repository HEAD. Create its parent directory; existing, tracked, or unignored output paths are rejected. Actor filters retain whole matching rows, including sibling actions and malformed selected rows. Reuse this content instead of refetching it.
- `--page-size=1..100` pages inventory only; the default is 25. Each call still reads the whole scope. Keep date/actor scope fixed with `nextCursor`; a changed snapshot requires restarting. Pagination cannot combine with exact IDs or `--output`. Groups may span pages.

Inspection exports are neither atomic snapshots nor deployment proofs. They omit `created_by` and `reviewed_at`; obtain contributor identity through an exact-ID server-side query when deduplicating. Use verifier-produced digests, not hashes reconstructed from incomplete inspection metadata.

`--include-history` follows exact, ancestor/descendant, structural-array, inverse-counter, symmetric-pair, and canonical pair overlaps. It considers old/new endpoints, indexed edits, and whole-character snapshots. Unknown endpoints conservatively match possible dependencies; an overlap alone does not prove equality. Keep logical groups intact when splitting inspection requests. Use direct SQL only for a diagnosed inspector limitation, and report that limitation.

## Relation Mapping

Character pairs use `characters.<owner>.characterRelationOverrides.<other>` in the character data files. Use `getCharacterRelationPairLocation` and inverse-kind helpers from `src/features/characters/utils/characterRelationPairs.ts`; the lexically smaller ID owns the record. Description, tags, and strength are shared; the inverse kind is derived. `null` suppresses the pair, including suggestions. Preserve tombstones and legacy reads/history. Overrides supersede legacy traits; editing only a masked legacy record will not change the published pair.

Legacy `counters`, `counteredBy`, `counterEachOther`, and `collaborators` actions still require semantic projection and whole-chain verification. Check existing overrides before choosing their physical source; `characterCounters.ts` and `characterCollaborators.ts` remain legacy inputs, not universal write targets.

Other relations use `src/data/characterRelationData/`: `knowledgeCards.ts`, `specialSkills.ts`, `maps.ts`, or `modes.ts`. Preserve subject, target, kind, and card/skill `factionId`.

- `X.counteredBy Y` equals `Y.counters X`; collaborators and counterEachOther are symmetric.
- In shared traits, description is top-level; in pair overrides, it belongs to the pair record.
- Preserve equivalent edges and ordering. Remove only a redundant edge explicitly removed by the action.
- Verify array indices, identities, and old values. Verify flattened parent/child chains together.
- Treat unreplaced placeholder defaults such as `新别名` as likely mis-adds; defer their groups.

## Core Rules

1. Process `created_at`, then `id`, ascending; for overlaps, apply parents before children and let later/child values win. Remove obsolete twins; defer ambiguity.
2. Project legacy actions into the current schema before comparison. For positioning tags, convert `isMinor: true -> level: 2` and `false -> 4`; an existing valid `level` wins. This is one-way compatibility—never collapse levels 0, 1, or 3 back to a boolean.
3. Compare conflicts at the action's **write set**, not by labeling whole rows "conflicted" or "non-conflicted":
   - Scalar/null `set`, and non-array `add` or `delete`: the exact action path is the write set.
   - Array-index `add` or `delete`: the containing array's structure and order are the write set. Array-index `set` writes the indexed item, but requires old-value and identity verification.
   - Object `set`: changed/added/deleted descendant leaves between projected `oldValue` and `newValue` are the write set. Include the container path when existence, type, or an empty container changes.
   - Array `set`: length, order, identities, and changed fields are the write set. If items lack a unique stable `id`/`name`, the entire array path is the write set.
   - Relation `set`: membership by semantic endpoints/kind/`factionId` and changed material fields (`description`, `isMinor`, tags) are the write set; orientation-equivalent edges are one item.

   Treat an absent value as `ABSENT`, distinct from JSON `null`. Derive projected source `S`, old state `O`, and new state `N` at each write-set location. Exact-path `add` has `O = ABSENT` and `delete` has `N = ABSENT`; array-index structural operations require verified parent-array before/after states. If those states cannot be reconstructed from a valid chain, defer.
   - `S = O`: apply `N` at that location.
   - `S = N`: it is already represented; do not rewrite it.
   - `S` matches neither: without a date restriction, query all decoded actions for the same `entity_type` whose exact, ancestor/descendant, containing-array, or equivalent-relation write sets overlap. Order them by `created_at`, `id`, then action order, and resolve only as follows:
     1. A later `synced` row, or later `approved` row with `is_public = true`, that writes the location and whose resulting value equals `S` supersedes this action there; preserve `S`.
     2. An earlier `synced` row whose resulting value equals `S` proves the source state, but does not repair a stale `O`; defer the current action and never infer or text-merge a value.
     3. An earlier row with `status = 'approved'` and `is_public = true` whose result supplies the required `O` is an unsynced dependency. Apply and verify it first only when it is explicitly in the current batch; otherwise defer and report the dependency.
     4. Replay multiple qualifying rows in `(created_at, id)` order. If their old/new chain breaks, two rows claim incompatible results, or no qualifying row produces `S`, defer.

   Rows with `pending`, `rejected`, or `revoked` status never explain source state. Preserve values outside the write set. Never overwrite an unexplained or superseding source value.

4. Valid statuses: `pending`, `approved`, `rejected`, `synced`, `revoked`. Sync only verified approved rows through an authorized cutover with parity or exact approved reconciliations; existing batch authorization suffices. Never sync failed, fuzzy, skipped, pending, rejected, or revoked rows.
5. Stay on the current branch. Treat Chinese terminal mojibake as a display issue unless file bytes/editor output prove corruption; do not rewrite strings solely to fix terminal display.
6. Report any important gap or error discovered in these instructions. If it makes an action ambiguous, defer that action rather than guessing.

## Classification

Assign every group exactly one disposition before editing. For each deferred row, report its ID/path, current baseline value, recorded old/new values, reason, and dependencies; link full values if lengthy.

When presenting concrete actions for a user decision, state each row's current database `status` and public visibility (`is_public`) alongside its ID, date, contributor, and relevant change. Use a fresh exact-ID query and give the check time; if unavailable, label the last-known state and its timestamp explicitly. Keep database status separate from local dispositions such as Verified or Deferred. For an option that changes status, state the proposed transition separately from the current status; do not make the user infer status from words such as "published" or "superseded".

- **Ready**: every write-set location is explainable under the `S/O/N` rules above; every physical target is unambiguous; required old/new or parent-array chains are valid; and no safety gate raises a content concern.
- **Represented**: the final effect is already present exactly or through an accepted semantic relation equivalent. Plan no source rewrite, but retain every covered row for verification.
- **Review required**: the source matches neither old nor new but bounded overlapping history may explain it; relation orientation or material-field intent requires judgment; repeated submissions conflict; or the action introduces a semantic contradiction with a paired field.
- **Blocked**: malformed or unsupported data, unexplained broken chains, shifted or unstable array identities, missing/duplicate source identities, ambiguous factions, likely placeholder children, or any state that cannot be reconstructed without guessing.

Do not turn `Review required` into `Ready` by replaying over unexplained source. Resolve it using the complete overlapping history allowed by the write-set rules above or leave it deferred. Pending, rejected, and revoked rows never explain source state.

## Verification

- **Static/object**: Compare the affected canonical field/subtree exactly after transforms.
- **Array**: Verify the literal index and old item, then final length, order, identity (`id`/`name`), and changed fields.
- **Relation**: Verify semantic subject/target/kind/`factionId` and material fields, accepting inverse/symmetric equivalents.
- Verify every flattened parent/child action against the final source and check for duplicates, contradictions, or unintended reordering.

Run `npm run verify:game-data-actions -- --ids=<complete-group-row-ids>` for every applied or represented group. Pass every row in a parent/child or old/new chain together so reverse verification can reconstruct intermediate states. The verifier accepts groups larger than 25 rows: it fetches at most 25 IDs per request, checks that every requested row was returned, then sorts and verifies the entire group once. The inspector's exact-ID limit does not limit verification groups. Defer failed dependency groups intact and reverify the independent remainder. Never split a group to pass verification; report a tooling blocker if the complete group is unsupported.

## Safety Gates

- Check newValue placement and schema shape.
- Report existing semantic differences (including summary/detail mismatches), but do not defer solely because of them. Defer contradictions introduced by the action until user-approved reconciliation; do not mark those actions verified or remotely sync them before resolution.
- Verify message intent (e.g. relation added and old deleted).
- Relations: run targeted Prettier, grep/read checks, and `npm run report:character-relations` (the report does not check formatting).
- Static character data: run targeted Prettier, projection checks, `npm run lint`, and `npm run type-check`. Add relevant tests for logic/components; full tests for broad changes or on request.
- Reuse passing local checks while their source/cohort is unchanged; rerun affected checks after changes or failures. Refresh remote state at cutover; verify deployment and its data snapshot in post-check.
