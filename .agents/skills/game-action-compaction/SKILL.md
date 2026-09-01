---
name: game-action-compaction
description: 'Prepare large or dependency-heavy approved game_data_actions cohorts for baseline compaction through manifest-based planning, local source patching, and verification. Use for broad date ranges, more than 25 rows, oversized inspection output, or requests such as syncing a month of approved changes; use game-action-patching for small clear batches.'
metadata:
  argument-hint: 'Date range, actor filter, manifest policy, status policy'
  user-invocable: true
---

# Game Action Compaction

## Goal

Prepare a large approved public-action cohort as reviewed, dependency-aware local source patches and
verified exact row IDs. This workflow does not complete remote compaction; treat remote status
changes and deployment cutover as separate operations.

This is a bulk orchestration workflow, not another action decoder or replay implementation. Reuse
the repository inspector, checked replay, source projection, and reverse verifier.

## Routing

Read `../game-action-patching/SKILL.md` completely before acting. Its source-file mapping, relation
semantics, write-set conflict rules, legacy projection, verification rules, and safety gates also
apply here.

Use this skill when any of the following is true:

- the discovered cohort has more than 25 rows;
- a date-range inventory reports `output_too_large`;
- the request covers a broad period such as a month or asks for all approved actions;
- rows form several parent/child, same-path, array-structural, or relation-semantic dependencies; or
- the purpose is baseline compaction rather than one routine patch.

If the cohort has at most 25 rows, every row maps clearly, and no dependency crosses the cohort,
use the small-batch skill instead.

## Operation Boundary

- Treat the normal workflow as read-only remote discovery plus local source edits.
- Stay on the current branch.
- Do not use a browser.
- Do not mutate remote moderation status, deploy, or perform a production cutover as part of this
  workflow, except for an explicitly authorized duplicate rejection/revocation under the policy
  below. A later explicit request still requires an authorized mechanism and the cutover gates below.
- Never claim that a locally patched or verified row is `synced`. Only an exact re-query confirming
  `status = 'synced'` permits that wording.
- Never rewrite complete aggregated published records merely because replay can construct them.
  Persist only source-aware changes in canonical feature-local or relation files.

## Cohort Discovery

1. Interpret date ranges as inclusive Beijing calendar days using the small-batch skill's time rules.
2. Run `npm run inspect:game-data-actions` with the requested date and actor scope.
3. If the inventory exceeds its output cap, bisect the Beijing date range until every subrange
   succeeds. Do not add unbounded output or fetch complete values for the whole cohort.
4. Merge subrange results by `created_at`, then `id`, then action order. Deduplicate database rows by
   ID without splitting an atomic multi-action row.
5. Record an exact manifest before editing. At minimum include:
   - the original user scope and UTC bounds;
   - the ordered row IDs;
   - `created_at`, `entity_type`, status, visibility, and decoded action count per row;
   - dependency groups and same-path chain links reported by the inspector; and
   - the discovery timestamp.
     A cutover-grade manifest must additionally bind the complete approved snapshot's replay epoch and
     action revision, plus a canonical content digest for every exact row. If supported acquisition
     cannot provide those values, local preparation may continue after the required checkpoint, but
     record `manifest fingerprint tooling unavailable` as a cutover blocker.
6. Keep any machine-readable manifest under an ignored `.tmp/` path. Never commit action payloads,
   credentials, user identifiers, or temporary manifests.
7. After discovery, use exact-ID queries in groups of at most 25 for `--values` and
   `--include-history`. Date scopes are inventory only; do not continue applying a mutable date-only
   selection after freezing the manifest.

If rows change status, visibility, entry content, entity type, creation order, or membership between
discovery and an exact-ID re-query, stop and regenerate the manifest. Do not silently mix snapshots.

## Grouping

Build work groups around correctness and source locality, not arbitrary groups of 25.

- Keep all actions from one database row atomic.
- Union inspector dependency groups, exact/ancestor/descendant overlaps, containing-array overlaps,
  and matching old/new chains.
- Add semantic relation overlaps that the inspector cannot yet infer, including inverse counters and
  reversed symmetric endpoints.
- Keep a parent action with its flattened children and all rows needed to reconstruct an array state.
- Keep duplicate or repeated exact paths together, including identical submissions; duplication is
  evidence to review, not permission to discard a row.
- A group may span files when semantic atomicity requires it. Otherwise prefer groups that touch one
  canonical record or relation file.
- Never split a dependency group merely to satisfy the inspector's 25-ID detail limit. If a group
  exceeds the limit, fetch bounded detail slices but classify, apply, and verify the group as one
  logical unit. If the verifier cannot accept the complete group, report a tooling blocker.

## Duplicate Resolution

Apply this policy to exact duplicate database rows, including duplicates nested inside a larger
dependency group. Two rows are exact duplicates only when their `entity_type` and complete decoded,
ordered action content match; a repeated path with different content is not a duplicate.

1. Inspect `created_by` without writing user identifiers to the manifest or report.
2. If any duplicate copy is anonymous (`created_by = null`), retain a non-anonymous copy when one
   exists and reject/revoke anonymous copies until one row remains. If all copies are anonymous,
   retain the earliest row by `created_at`, then `id`.
3. If all copies were submitted by the same non-anonymous user, retain the earliest row by
   `created_at`, then `id`, and reject/revoke the other copies.
4. If otherwise-identical copies were submitted by different non-anonymous users, classify the set
   as **Review required**; this policy does not choose between distinct contributors.
5. A pending/private duplicate uses the authorized reject path. An approved/public duplicate uses
   the authorized revoke path because the repository's reject RPC is pending-only. Require explicit
   authorization, an identified moderator actor, the prepared mutation RPC, replay-epoch protection,
   and an exact post-mutation re-query. Never update status directly.
   Read the local operator UUID from `GAME_DATA_COMPACTION_ACTOR_ID` when it is configured in an
   ignored local environment file. Never put its value in this tracked skill, a manifest, logs, or a
   user-facing report, and never treat the variable's presence as authorization for a mutation.
6. Preserve the original discovery manifest. Record rejected/revoked row IDs only in a separate
   deduplication observation, then freeze a new exact working or cutover manifest containing the one
   retained row. Do not include a rejected/revoked duplicate in `cutoverRowIds` or
   `verificationDependencyRowIds`.
7. After the exact post-mutation re-query succeeds, continue classification, patching, replay, and
   verification as though the removed duplicate had not existed. Recompute group membership,
   chain links, row/action counts, fingerprints, and later-overlap evidence first.

## Classification

Assign every group exactly one disposition before editing:

- **Ready**: every write-set location is explainable under the small-batch `S/O/N` rules; every
  physical target is unambiguous; required old/new or parent-array chains are valid; and no safety
  gate raises a content concern.
- **Represented**: the final effect is already present exactly or through an accepted semantic
  relation equivalent. Plan no source rewrite, but retain every covered row for verification.
- **Review required**: the source matches neither old nor new but bounded overlapping history may
  explain it; relation orientation or material-field intent requires judgment; repeated submissions
  conflict; or a paired field may contradict its sibling.
- **Blocked**: malformed or unsupported data, unexplained broken chains, shifted or unstable array
  identities, missing/duplicate source identities, ambiguous factions, likely placeholder children,
  or any state that cannot be reconstructed without guessing.

Do not turn `Review required` into `Ready` by replaying over unexplained source. Resolve it using the
complete overlapping history allowed by the small-batch rules or leave it deferred. Pending,
rejected, and revoked rows never explain source state.

## Required Checkpoint

Before editing, present a concise plan and wait for approval. Include:

- manifest row/action counts and the exact scope;
- counts for Ready, Represented, Review required, and Blocked groups;
- dependency-group sizes and important broken-chain or missing-source findings;
- proposed group order and affected source files when known;
- which groups will be deferred; and
- the explicit stopping point: local verification only, unless the user later authorizes more.

Do not begin a large local patch merely because discovery succeeded.

## Apply

After approval:

1. Re-query each group's exact IDs immediately before editing and confirm they still match the
   manifest's status and visibility.
2. Process groups in deterministic row order, while applying parent actions before children inside
   an overlapping group and preserving later/child results.
3. Use checked/pure published replay only as an expected-output oracle. It is not a source writer and
   does not replace the write-set conflict rules.
4. Edit canonical feature-local and relation sources according to the small-batch mapping. Preserve
   values outside each write set, comments, file organization, and equivalent relation orientation.
5. Do not rewrite a Represented group. Include it in verification when the verifier supports its
   complete chain.
6. Stop the current group on an unexplained mismatch. Do not contaminate later independent groups;
   record the group as deferred and continue only when doing so cannot break a dependency.
7. Pause after each coherent group or bounded set of independent groups and report progress. Do not
   wait until the entire cohort is edited to expose failures.

## Verification

For every applied or represented group:

1. Run targeted read/grep and Prettier checks on affected files.
2. Run `npm run verify:game-data-actions -- --ids=<complete-group-row-ids>`. Pass all rows required
   to reconstruct parent/child and old/new chains in the same invocation.
3. Apply the small-batch domain gates, including `npm run report:character-relations` for relations
   and `npm run lint` plus `npm run type-check` for static character data.
4. Run relevant tests for shared projection, replay, verification, or source-mapping logic changed by
   the patch. Ordinary data-only patches do not require unrelated full tests.
5. Re-run exact-ID inspection to confirm current remote status and visibility; this is a consistency
   check, not authorization to mutate them.

Before any future remote cutover, additionally prove full published-domain equality between:

- the original checked-in baseline plus the frozen approved snapshot; and
- the patched baseline plus the same snapshot with the manifest rows excluded.

If the repository lacks a supported command that proves this equality for the complete manifest,
report `published parity tooling unavailable` as a cutover blocker. Do not improvise a production
status transition or weaken the gate.

## Cutover Gates

Local verification is not a complete compaction. Any separately authorized deployment/status
cutover must also satisfy all of these:

- the exact manifest is unchanged and bound to a stable approved replay epoch/revision;
- the manifest contains a canonical content digest for every exact row;
- every manifest row is locally verified or deliberately excluded with a recorded reason;
- before/excluded-after published-domain parity is proven;
- no deployment can serve a baseline containing a non-idempotent action while also replaying that
  action;
- concurrent approved-set mutations are prevented or detected; and
- there is a reviewed recovery path for partial deployment or status-transition failure.

If no established repository workflow satisfies these gates, stop after local verification and
recommend a separate reviewed cutover plan.

## Production Cutover

Before any production status transition, read the
[human operator runbook](../../../docs/operations/game-data-action-compaction.md) and follow it as
the source of truth for commands, deployment order, recovery, and stop conditions.

Agent-specific invariants:

- Keep `cutoverRowIds`, `verificationDependencyRowIds`, and retrospective observations separate.
  Only the exact cutover set may reach the RPC; never rewrite the original manifest `rows`.
- The normal path requires concrete `set` actions, a deployment-bound check, one separately
  authorized atomic transition, and a second deployment. Always print and verify the expected
  Supabase host/project ref.
- If rows are already `synced/private`, never restore or sync them again. Use the read-only retained-row
  `post-check` path; it may write only `postCutoverVerification` after strict parity and production
  artifact proof pass.
- Never infer missing actor, time, fingerprint, or atomicity evidence, and never weaken an exact
  equality or stop condition.

The reconciled 2026-07-28 through 2026-07-29 cohort (24 original rows plus 3 G09 rows) is already
synced and must never enter sync mode again. Its character-relation parity mismatch remains a
verification blocker.

## Final Report

Report:

- manifest scope, row count, action count, and discovery timestamp;
- each group's final disposition and affected files;
- locally verified row IDs;
- represented rows verified without edits;
- deferred or blocked rows with stable reasons and dependencies;
- validation commands and results;
- remote statuses from the final exact re-query; and
- remaining cutover blockers, especially missing full-manifest parity tooling.

Keep `Patched`, `Verified`, `Deferred`, and remotely `Synced` as distinct states.
