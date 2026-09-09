---
name: game-action-compaction
description: 'Prepare large or dependency-heavy approved game_data_actions cohorts for baseline compaction through manifest-based planning, local source patching, and verification. Use for broad date ranges, more than 25 rows, oversized date inventories, or requests such as syncing a month of approved changes; use game-action-patching for small clear batches.'
metadata:
  argument-hint: 'Date range, actor filter, manifest policy, status policy'
  user-invocable: true
---

# Game Action Compaction

Prepare approved actions as canonical source patches and exact verified row IDs. Reuse the repository
inspector, checked replay, source projection, and reverse verifier; do not build another decoder or writer.

Read [Shared Correctness Rules](../game-action-patching/references/action-correctness.md) before acting.
It owns date interpretation, source mapping, write-set conflicts, relation semantics, dispositions,
and validation. Use [game-action-patching](../game-action-patching/SKILL.md) instead for at most 25 clear,
independent rows unless the user explicitly requests compaction.

## Scope and authorization

- Stay on the current branch. Do not use a browser.
- Remote mutations, repository pushes, and deployments require authorization for the batch and target.
  Existing batch authorization persists across deployment handoffs; ask only for scope changes or new decisions.
  Without remote authorization, complete local preparation and stop there.
- Only an exact remote re-query confirming `status = 'synced'` permits calling a row synced.
- Use the [operator runbook](../../../docs/operations/game-data-action-compaction.md) for production
  commands, deployment order, evidence binding, recovery, and stop conditions.

## Freeze the cohort

1. Run `npm run inspect:game-data-actions` with the requested inclusive Beijing dates and actor scope.
   Bisect date ranges when inventory returns `output_too_large`; do not fetch unbounded full values.
2. Merge by `created_at`, then `id`, then action order. Deduplicate row IDs without splitting multi-action rows.
3. Save the discovery manifest under ignored `.tmp/` before editing. Include:
   - original user scope, UTC bounds, discovery timestamp, and original baseline `repository.head`;
   - ordered row IDs, creation time, entity type, status, visibility, and decoded action count;
   - dependency groups and same-path chain links from the inspector.
4. Fetch exact-ID details in slices of at most 25 using `--values` and `--include-history`. Retain complete
   action content or a supported content digest in ignored companion evidence. Structural summaries alone
   cannot prove equality; defer groups whose content cannot be compared. Date scopes are inventory only.
5. If status, visibility, content, entity type, creation order, or membership changes, preserve the original
   evidence and freeze a new manifest before continuing. Never mix snapshots.

Never commit manifests, payloads, credentials, or user identifiers. Deployment-bound epoch, action revision,
and row digests are bound later by the supported verifier; mark them pending during local preparation.

## Group and classify

Group by dependency and source locality, not the 25-ID inspection limit:

- Keep each database row atomic. Union parent/child, exact-path, containing-array, and old/new-chain overlaps.
- Include semantic relation overlaps, including inverse counters and reversed symmetric endpoints.
- Keep parents with flattened children, array reconstruction chains, and repeated submissions together.
- Prefer one canonical record or relation file per group unless dependencies span files.
- Fetch large groups in bounded slices but classify and verify each whole group. Report a tooling blocker
  if the verifier cannot accept the complete group; never split it to obtain a passing result.

Use the shared Ready, Represented, Review required, and Blocked dispositions. Before editing, give a short
plan: exact scope and row/action counts, disposition counts, group sizes, affected files/order, deferred
rows and reasons, and the next operator handoff. Proceed with authorized Ready and Represented groups
without another approval. Resolve ambiguous content with the user while continuing independent clear groups.

## Exact duplicates

Rows are duplicates only when entity type and complete decoded, ordered actions match. Inspect `created_by`
without recording user identifiers in the manifest or report:

- Prefer a non-anonymous copy over anonymous copies. If all are anonymous, retain the earliest by time/ID.
- For copies from the same non-anonymous user, retain the earliest by time/ID.
- For different non-anonymous contributors, defer for review; do not choose a contributor automatically.

Only with mutation authorization, use the prepared reject RPC for pending/private copies or revoke RPC
for approved/public copies. Require a moderator actor, replay-epoch protection, and exact post-mutation
re-query; never update status directly. Read the actor from `GAME_DATA_COMPACTION_ACTOR_ID` when configured
in ignored local environment files. Do not print or store that UUID in tracked files, manifests, or reports;
its presence is not authorization.

Preserve the discovery manifest and record removals separately. Freeze a new working manifest excluding
removed copies from both cutover and verification dependencies. Recompute groups, chains, counts,
fingerprints, and later overlaps before continuing with the retained rows.

## Patch and verify

1. Immediately before editing, re-query each group's exact IDs and compare all frozen content and metadata.
2. Apply the shared write-set, ordering, and source-mapping rules. Preserve comments and unrelated fields.
   Checked replay is an expected-output oracle, not a source writer or permission to overwrite conflicts.
3. Stop and defer a group on an unexplained mismatch; continue only independent groups. Report coherent
   progress and failures without waiting for acknowledgment.
4. Run the shared checks once per unchanged source/cohort; include represented rows without rewriting them.
   Re-run affected checks after changes or failures; deployment-bound preflight and post-check remain required.

## Commit convention

- Use `docs(game-data): sync until M.DD`, with the inclusive Beijing cutoff date and a two-digit
  day, for example `docs(game-data): sync until 8.02`. Use an explicitly requested commit title verbatim.
- Keep one compaction batch in one commit, including approved content reconciliations needed for that
  batch. Squash local intermediate commits before handoff. Separate commits are appropriate when the
  task also includes non-compaction work.
- A commit title does not prove remote sync. After rewriting commits, preserve the original evidence
  and revalidate commit-bound manifests before cutover.

## Finish an authorized batch

The runbook is the source of truth; do not duplicate its deployment commands here.

- Keep `cutoverRowIds`, `verificationDependencyRowIds`, and retrospective observations separate. Only
  cutover IDs reach the RPC; verification-only dependencies remain in replay.
- Require full published-domain equality, allowing only explicitly user-approved exact before/after
  reconciliations frozen and verified through the runbook; all other differences must fail.
- The supported verifier requires the original `repository.head`, a committed `--patched-ref`, and the
  matching deployed build/approved snapshot. It binds epoch, revision, and row digests only after checks
  pass. Local preparation does not constitute deployment-bound proof.
- After the first deployment, run `sync` directly; use standalone `check` only for inspection or diagnosis.
  Follow the runbook for the forced second build and one final read-only `post-check`; do not repeat sync.
- If evidence or checks fail, report the specific blocker. Do not allow unapproved differences, invent evidence,
  silently change the frozen row set, or repeat a sync whose result is uncertain or already confirmed.

## Report

Link the manifest and report changed files, checks/results, exact verified IDs (including represented
rows), deferred IDs with reasons/dependencies, current remote statuses, and any remaining deployment step.
Keep Patched, Verified, Deferred, and remotely Synced distinct.
