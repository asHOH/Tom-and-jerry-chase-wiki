# Public-Action Replay Handoff

## Purpose

This document hands the next three semantic-ordering steps to another implementer:

1. harden numeric-array dependency analysis;
2. add the read-only three-cohort legacy audit; and
3. review every audit failure before migrating a live replay consumer.

Do not use these steps to cut over `publicActions.ts`, `usePublicGameDataActions.ts`, moderation,
history, publishing, or approval. The immediate goal is to make the analyzer and audit trustworthy,
then establish whether the stored rows are safe to replay with the new checked engine.

## Repository State at Handoff

- Current HEAD is `5465e9a2` (`feat(game-data): add checked action row replay`).
- The three plan files and this handoff are untracked. Preserve and commit them deliberately; they
  are not part of the code commits listed below.
- Active server and client consumers still use `normalizePublicActionEntries` and
  `applyPublicActionRows`. This is intentional compatibility behavior, not evidence that the new
  decoder or checked engine is unused by mistake.
- The last validation of the decoder and checked replay work passed:
  - `npm test -- --runInBand --testPathPatterns=gameData` (11 suites, 98 tests);
  - `npm run type-check`;
  - `npm run lint`; and
  - Prettier checks for the affected source and plan files.

### Landed semantic work

| Commit     | Result                                                           |
| ---------- | ---------------------------------------------------------------- |
| `65ff1c78` | Deterministic public-row ordering by `(created_at ASC, id ASC)`  |
| `99f49c50` | Shared dependency analyzer and transitive stable grouping        |
| `c7ee3fb8` | Transactional rollback for each row in legacy mutable replay     |
| `c0361043` | Numeric `set`-delete classified as structurally dependent        |
| `1288415c` | Incomplete legacy rollback made a fatal invariant failure        |
| `846d2a01` | Strict publish and compatible stored-row decoders completed      |
| `5465e9a2` | Shared path parsing and checked atomic row application completed |

The new semantic modules are:

- `src/lib/gameData/actionErrors.ts` for stable internal error codes;
- `src/lib/gameData/actionRowDecoder.ts` for strict publish and stored compatibility decoding;
- `src/lib/gameData/actionPath.ts` for path parsing and target-aware array-index validation;
- `src/lib/gameData/cloneGameDataValue.ts` for JSON-shaped cloning; and
- `src/lib/gameData/checkedActionReplay.ts` for checked action and atomic row application against
  caller-supplied plain-object targets.

`applyCheckedActionRow` backs up only touched roots, restores all targets after an ordinary row
failure, and throws `CheckedActionReplayInvariantError` if rollback itself is incomplete. Applying
it to disposable clones is sufficient for audit dry replay; do not add a general transaction or
commit framework.

## Current Problems in the Three Plans

### Public-action semantic ordering

The plan status is stale. Its status section still lists shared decoding and checked apply as
remaining even though commits `846d2a01` and `5465e9a2` completed those foundations. Update the plan
after these three steps so completed work and remaining consumer migrations are unambiguous.

The immediate code defect is in `src/lib/gameData/actionDependencies.ts`:

- it has a private permissive `split('.').filter(Boolean)` path parser instead of the frozen shared
  path contract; and
- it treats a direct numeric `set` as structural only when `oldValue` or `newValue` is `undefined`.
  `oldValue` is presentation metadata and may be missing, stale, or false. Every direct numeric
  array `set` must be structural regardless of either value.

The legacy-row audit does not exist. Therefore there is no evidence yet that all approved rows
decode and apply under the frozen contract. No live replay consumer should be migrated until that
evidence exists and failures have dispositions.

The publish and approval RPC bypasses also remain open. They are a current security boundary: a
browser-authenticated caller must not be able to bypass server-owned decoding, preparation, and
permission checks. The three tasks in this handoff do not close that boundary; keep it high priority
immediately afterward and do not enable dependency-grouped publishing while it remains open.

### Pure published game-data foundation

This plan is still proposed and has no implementation. Its ownership is now correctly limited to
canonical-source isolation, canonical branch cloning, copy-on-write composition, and pure published
results. It must consume the semantic plan's decoder, path, touched-root, and checked-apply
contracts rather than create alternatives.

Do not begin the foundation's replay-based cutover until the approved cohort has zero unresolved
decode or checked-replay failures. The audit may use disposable compatibility clones, but it must
not pre-emptively build the canonical registry or copy-on-write foundation.

### Editable game-data store loading

This plan remains proposed. Its old bundle measurements are historical evidence and deliberately do
not need a new pre-implementation baseline. Refresh manifests and bundle measurements only after the
character-detail pilot and final lazy-runtime cutover, as the plan now requires.

Two decisions are still required before cache design begins:

- the stable production deployment build ID; and
- the canonical serialization and hash format for the approved action revision.

Do not invent either decision as part of the audit. Also do not start route/read-model or root-client
replay migration before the audit gate below passes.

## Step 1: Harden Numeric-Array Dependency Analysis

### Required change

Update `src/lib/gameData/actionDependencies.ts` and its colocated tests.

1. Reuse `parseActionPath` rather than maintaining a second dot-path parser. Invalid paths should
   not be normalized by dropping segments.
2. Use the shared canonical array-index interpretation for the final segment. A direct canonical
   numeric `set`, `add`, or `delete` is structural at its parent; `set` of `length` is also
   structural.
3. Remove all `oldValue`/`newValue` conditions from direct numeric `set` classification.
4. Keep writes below separate indexes independent when neither action structurally edits the array.
   For example, `aliases.0.name` and `aliases.1.name` remain independent.
5. Preserve transitive grouping and stable input order.

The analyzer does not have runtime target shape, so this is intentionally conservative: a canonical
numeric final segment is treated as array-structural for grouping. Do not add baseline lookup or
target resolution to the analyzer.

Keep the existing boolean analyzer API and fail closed on invalid paths. If `parseActionPath` fails
for either action, or if `resolveArraySegment` rejects a numeric-looking final segment, treat every
comparison involving that action as dependent by returning `true`. Do not throw, normalize the bad
path, or add a second validation result type. The decoder remains responsible for reporting the
specific validation error; the analyzer is responsible only for never separating malformed input
into a supposedly independent group.

### Tests

At minimum, prove that:

- `set('Tom.aliases.0', definedOld, definedNew)` depends on a write under
  `Tom.aliases.1`, even when both values are present;
- changing or lying about `oldValue` never changes the dependency result;
- a direct numeric `set` forms the expected transitive group;
- nested property writes under different indexes remain independent; and
- empty, unsafe, and noncanonical numeric segments fail closed as dependent instead of being
  normalized or throwing.

Run the focused dependency tests, the game-data test group, type-check, and lint. This step is small
enough to land as its own commit.

## Step 2: Add the Read-Only Three-Cohort Audit

### Boundaries

The audit must be reproducible and structurally unable to write:

- no `--apply` option;
- no insert, update, delete, or RPC call;
- no repaired action payloads or complete raw entries written to disk or Git; and
- no replay against imported module-global targets.

Pending-row visibility may require the secret/service key. That credential does not make mutation
acceptable: construct only ordered `.select()` queries and keep mutation methods out of the script.
Load environment variables in the same way as existing operations scripts.

Use keyset pagination rather than offset pagination; Supabase's default row limit is not a complete
audit. Order each cohort by `created_at ASC, id ASC`, with `id` as the deterministic tie-breaker, and
continue after the last `(created_at, id)` pair from the preceding page. Fetch all three cohorts once
per command invocation and derive either the summary or the requested detail page from that complete
in-memory result.

### Cohorts

Fetch and report these cohorts separately:

1. public `approved` rows (`is_public = true`, `status = approved`), eligible for replay;
2. public `synced` rows (`is_public = true`, `status = synced`), history only; and
3. `pending` moderation rows, retaining `is_public` in their audit metadata.

Encode the cohort distinction in types or separate functions so a synced row cannot enter dry
replay accidentally.

### Suggested structure

Keep database I/O in a small script such as `scripts/audit-game-data-actions.mjs`. Put classification
and reporting logic in a testable TypeScript module under `src/lib/gameData/`. Add an npm script only
if it makes the exact invocation easier to reproduce.

For every row:

1. Decode the complete row with `decodeStoredActionRow`. One invalid child makes the entire row
   malformed.
2. Record whether it is already an atomic multi-action row (`actions.length > 1`).
3. For approved and pending rows, form heuristic candidate sets keyed by the exact tuple
   `(created_at, created_by, entity_type)`. Pass each decoded database row to
   `groupActionEntriesByDependency` as one indivisible entry. Report dependency clusters containing
   more than one row as having unknown chronology; never claim that the tuple is a submission ID.
4. Never group or dry replay synced rows. Report only their decode and shape results.

For dry replay:

- Build disposable plain-object clones through an audit-only compatibility target factory. The
  factory may import the current baseline sources in the audit's fresh process, but it must clone
  every source before returning and must never pass an imported object or Valtio proxy to checked
  replay. A baseline-clone failure is an audit failure, not permission to reuse the source object.
- Freeze the audit factory to this current server compatibility mapping:

  | Entity type     | Baseline sources to clone            | Target count |
  | --------------- | ------------------------------------ | ------------ |
  | `achievements`  | `achievements`, `achievementsEdit`   | 2            |
  | `characters`    | `characters`                         | 1            |
  | `cards`         | `cards`, `cardsEdit`                 | 2            |
  | `entities`      | `entities`                           | 1            |
  | `buffs`         | `buffs`, `buffsEdit`                 | 2            |
  | `items`         | `items`, `itemsEdit`                 | 2            |
  | `fixtures`      | `fixtures`, `fixturesEdit`           | 2            |
  | `maps`          | `maps`, `mapsEdit`                   | 2            |
  | `modes`         | `modes`, `modesEdit`                 | 2            |
  | `specialSkills` | `specialSkills`, `specialSkillsEdit` | 2            |

  This is an audit snapshot of the legacy server consumer, not the canonical-source registry from
  the pure published-data foundation. Keep it audit-only and compare it with
  `serverPublicActionTargetRegistry` whenever the audit is run from a different commit.

- Apply approved rows sequentially in deterministic database order with `applyCheckedActionRow`.
  Its row rollback means an ordinary failure can be recorded and skipped without contaminating the
  next row. Any invariant failure aborts the audit.
- Use the resulting approved clone set as the baseline for pending checks. Apply each pending row to
  its own fresh clone of that same approved baseline. Never accumulate unrelated pending rows.
- Never dry replay synced rows.
- The current server compatibility mapping has no known no-op entity types, so initialize the
  audit's known-no-op set as explicitly empty. Every type absent from the table, including
  `factions`, is unknown. Adding a known no-op type is a separate, reviewed behavior change; do not
  silently invent target behavior to make the audit pass.

If any approved row fails, pending dry-replay output is provisional. Continue collecting useful
diagnostics, but rerun the complete audit after approved failures are resolved.

### Output contract

Output only:

- per-cohort row and decoded-action counts;
- counts by stable decoder or checked-replay error code;
- counts and representative row IDs for malformed rows, dependent candidate clusters, existing
  atomic multi-action rows, checked-replay failures, unknown entity types, and known no-op rows; and
- a clear pass/fail gate for approved replay compatibility.

Do not print action values, raw entries, user data beyond the grouping fields already required, or
unbounded lists of IDs. Use a fixed small representative-ID limit.

The default command prints only that summary. Add a bounded read-only detail mode so Step 3 can
enumerate all findings without weakening the output rules, for example:

```text
--details=<cohort-or-category> --limit=25 [--cursor=<opaque-cursor>]
```

The detail limit must have a small hard maximum. Sort findings deterministically and make the cursor
cover both findings and members of a large dependency cluster, so every matching finding and row ID
is reachable exactly once. A detail page may print only cohort, audit category or stable error code,
a non-sensitive cluster fingerprint, and row IDs. It must never print action values, raw entries,
authors, timestamps, or grouping-field values.

Compute a non-contract audit-run fingerprint over the complete fetched input and bind detail cursors
to it. If the data changes between pages, reject the cursor and require a fresh audit rather than
silently mixing runs. This fingerprint is only a consistency token for this audit command; it must
not be reused as, or presented as, the deferred canonical approved-action revision hash.

### Tests

Use fixtures, not production rows, to cover:

- all three cohorts;
- malformed rows and one-invalid-child row atomicity;
- an existing multi-action row;
- a transitive dependent candidate cluster;
- synced rows being unable to reach target resolution or dry replay;
- the exact audit-only target mapping, target multiplicities, empty known-no-op set, and an unknown
  `factions` row;
- approved rows accumulating in order;
- pending rows each starting from the identical approved baseline;
- stable summary output without raw action values; and
- bounded detail pagination reaching every finding exactly once and rejecting a cursor from a
  different audit-run fingerprint.

## Step 3: Review Failures Before Any Live Migration

Run the audit against the intended production data source and save only its sanitized summary and
the disposition record. Use the bounded detail mode to enumerate the work; paged diagnostic output
does not need to be committed. Before reviewing findings, require two consecutive complete audit
runs to produce the same audit-run fingerprint; otherwise wait for a stable source and rerun. Create
a disposition for every decode or checked-replay failure, every approved or pending dependent
candidate cluster, and every approved unknown-entity row. Pending and synced dispositions may be an
owner plus the required moderation or history follow-up rather than a cutover blocker. Each
disposition contains:

- cohort and row ID;
- stable error code or audit category;
- evidence consulted;
- decision; and
- follow-up test or data action.

Use these rules:

- An approved decode or checked-replay failure blocks decoder/checked-replay cutover. Resolve it by
  an evidence-based data repair or a narrowly documented compatibility ruling with a regression
  test. Never guess the intended action from row order.
- A dependent candidate cluster has unknown provenance. Use moderation context, canonical data, or
  confirmation from its author to establish intent. Matching timestamps and authors are clues, not
  proof of one submission.
- A pending failure must be repaired or rejected before approval. Do not make replay more permissive
  merely to accept it.
- A synced failure is a history-quality issue only. Never replay a synced row over the checked-in
  baseline.
- A fatal rollback invariant is a code defect, not a row-level compatibility result. Stop and fix
  the engine or target construction before continuing.

Any data repair must be a separate, explicitly reviewed operation with an exact raw-entry compare;
the audit itself remains read-only.

### Gate to pass

Rerun the complete audit after dispositions. Live consumer migration may begin only when:

- approved malformed-row count is zero;
- approved checked-replay-failure count is zero;
- there is no unresolved invariant failure;
- every approved dependent candidate cluster has a documented disposition; and
- every approved unknown-entity row has a documented compatibility disposition; and
- the sanitized audit command and result are reproducible.

Pending and synced issues remain visible with owners, but they do not justify replaying synced rows
or silently accepting a future pending approval. Close the publish/approval bypasses before relying
on server preparation to enforce that future boundary.

## Explicit Non-Goals for These Three Steps

- Do not migrate `publicActions.ts`, `usePublicGameDataActions.ts`, history, moderation, or publish
  routes to the new decoder or checked engine.
- Do not build the canonical-source registry, copy-on-write published foundation, snapshot cache,
  build ID, or action-revision hash.
- Do not repair database rows from the audit script.
- Do not infer chronology from UUIDs, timestamps, authors, or candidate grouping.
- Do not add a generalized replay transaction, dry-run, or dependency framework.
- Do not enable publish-time dependency grouping yet.

## Recommended Commit Sequence

1. `fix(game-data): harden numeric array dependencies`
2. `feat(game-data): add legacy action row audit`
3. `docs(game-data): record legacy action audit dispositions`

After the gate passes, refresh the semantic plan's status. Then prioritize closing the legacy
publish/approval RPC bypasses before live replay migration and before publish-time grouping.
