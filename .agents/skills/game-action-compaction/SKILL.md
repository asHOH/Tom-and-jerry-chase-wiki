---
name: game-action-compaction
description: 'Prepare large or dependency-heavy approved game_data_actions cohorts for baseline compaction through manifest-based planning, local source patching, and verification. Use for broad date ranges, more than 25 rows, oversized date inventories, or requests such as syncing a month of approved changes; use game-action-patching for small clear batches.'
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

Read [Shared Game Action Correctness Rules](../game-action-patching/references/action-correctness.md)
before acting. It owns inspection commands, source mapping, conflict rules, dispositions, and
verification gates; the small-batch workflow is not a prerequisite.

Use this skill when any of the following is true:

- the discovered cohort has more than 25 rows;
- a date-range inventory reports `output_too_large`;
- the request covers a broad period such as a month or asks for all approved actions;
- rows form several parent/child, same-path, array-structural, or relation-semantic dependencies; or
- the purpose is baseline compaction rather than one routine patch.

If the cohort has at most 25 rows, every row maps clearly, and no dependency crosses the cohort,
use [game-action-patching](../game-action-patching/SKILL.md) for a routine patch. Explicit baseline
compaction and dependency-heavy requests remain in this workflow regardless of row count.

## Operation Boundary

- Treat the normal workflow as read-only remote discovery plus local source edits.
- Stay on the current branch.
- Do not use a browser.
- Do not mutate remote moderation status, deploy, or perform a production cutover as part of this
  workflow, except for an explicitly authorized duplicate rejection/revocation under the policy
  below. A later explicit request still requires an authorized mechanism and the cutover handoff below.
- Never claim that a locally patched or verified row is `synced`. Only an exact re-query confirming
  `status = 'synced'` permits that wording.

## Cohort Discovery

1. Interpret date ranges as inclusive Beijing calendar days using the shared reference's time rules.
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
     action revision, plus a canonical content digest for every exact cutover row. The supported
     deployment-bound verifier can bind these later (see Verification). Until then, record that
     cutover evidence is pending; local preparation may continue after the required checkpoint.
     Report a specific tooling blocker if the supported path cannot produce the required evidence.
6. Keep any machine-readable manifest under an ignored `.tmp/` path. Never commit action payloads,
   credentials, user identifiers, or temporary manifests.
7. After discovery, use exact-ID queries in groups of at most 25 for `--values` and
   `--include-history`. Date scopes are inventory only; do not continue applying a mutable date-only
   selection after freezing the manifest. Retain exact content or a supported content digest in
   ignored companion evidence before editing so later content comparisons are possible. Bounded
   structural summaries alone cannot prove equality; defer groups whose content cannot be compared.

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
   manifest's status, visibility, entry content, entity type, creation order, and exact membership.
2. Use checked/pure published replay only as an expected-output oracle. It is not a source writer and
   does not replace the write-set conflict rules.
3. Apply the shared ordering, source-mapping, and write-set rules; preserve comments and file organization.
4. Stop the current group on an unexplained mismatch. Do not contaminate later independent groups;
   record the group as deferred and continue only when doing so cannot break a dependency.
5. Pause after each coherent group or bounded set of independent groups and report progress. Do not
   wait until the entire cohort is edited to expose failures.

## Verification

For every applied or represented group, run the shared verification recipe and domain safety
gates, including complete-group reverse verification. Re-query exact IDs for current remote
status and visibility; this consistency check does not authorize a mutation.

Before cutover, also prove full published-domain equality between the original baseline plus the
frozen approved snapshot and the patched baseline plus that snapshot with only cutover rows
excluded. Verification-only dependencies remain in replay.

The supported `npm run verify:game-data-compaction` preflight requires an ignored manifest with
`repository.head` identifying the original baseline, a committed `--patched-ref`, and a
`--production-origin` serving the matching patched deployment and approved snapshot. It checks
concrete-set idempotence, artifact metadata, action patches, published parity, and snapshot stability.
`--write-manifest` binds the resulting replay epoch, action revision, and row digests only after
successful checks. It is not a local-only pre-deployment verifier.

Use the operator runbook's `cutover:game-data-compaction --mode=check` path for target-confirmed
deployment checks. Missing deployment evidence is a pending prerequisite, not proof that tooling
is unavailable. Report specific unsupported cases or failed checks as cutover blockers; do not
weaken equality or invent evidence.

## Status-Cutover Handoff

Local verification is not complete compaction. Before any separately authorized deployment/status
cutover, read the [human operator runbook](../../../docs/operations/game-data-action-compaction.md)
and follow it as the source of truth for target confirmation, deployment order, snapshot/digest
binding, concurrency protection, retained evidence, recovery, and stop conditions.

Keep `cutoverRowIds`, `verificationDependencyRowIds`, and retrospective observations separate.
Only the exact cutover set may reach the RPC; never rewrite the original manifest `rows` or infer
missing evidence. If the supported workflow cannot satisfy the runbook's gates, stop after local
verification and report the blocker.

## Final Report

Reference the manifest for scope and inventory. Report changed files, verification commands/results
and exact verified IDs (including represented rows), deferred IDs with reasons/dependencies, and
cutover readiness. Include remote statuses from the final exact re-query.

Keep `Patched`, `Verified`, `Deferred`, and remotely `Synced` as distinct states.
