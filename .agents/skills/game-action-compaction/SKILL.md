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
- Except for deterministic exact-duplicate resolution within the requested batch (see below), remote
  mutations, repository pushes, and deployments require authorization for the batch and target.
  Existing authorization persists across handoffs; ask only for new content/contributor decisions or expanded
  external scope. The agent owns routine preparation, validation, and whole-group deferral within that scope.
  Without remote authorization, complete local preparation and stop there.
- Only an exact remote re-query confirming `status = 'synced'` permits calling a row synced.
- Use the [operator runbook](../../../docs/operations/game-data-action-compaction.md) for production
  commands, deployment order, evidence binding, recovery, and stop conditions.

## Freeze the cohort

1. Run `npm run inspect:game-data-actions` with the requested inclusive Beijing dates and actor scope.
   For oversized inventory, use `--page-size=25` and follow `nextCursor`, or export the full scope with
   `--output=.tmp/<new-file>.json`. Keep scope fixed across pages; restart if the snapshot changes.
2. Merge by `created_at`, then `id`, then action order. Deduplicate row IDs without splitting multi-action rows.
3. Save the discovery manifest under ignored `.tmp/` before editing. Include:
   - original user scope, UTC bounds, discovery timestamp, and original baseline `repository.head`;
   - ordered row IDs, creation time, entity type, status, visibility, and decoded action count;
   - dependency groups and same-path chain links from the inspector.
4. Fetch exact-ID details in slices of at most 25 using `--values` and `--include-history`. Retain complete
   action content or a supported content digest in ignored companion evidence. Structural summaries alone
   cannot prove equality; defer groups whose content cannot be compared. Date scopes are inventory only.
5. Derive the execution manifest from frozen evidence using the schema and selection checks in
   `src/lib/gameData/compactionVerification.ts`: `rows` contains only chronological cutover rows, with
   `cutoverRowIds` in the same order. Keep discovery/deferred evidence separate; inventory JSON is not an
   execution manifest. Validate its shape locally before deployment, without inventing bound fingerprints.
6. If status, visibility, content, entity type, creation order, or membership changes, preserve the original
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
without another approval. Defer unresolved groups and continue independently verified groups; report reduced
coverage explicitly. Ask about ambiguous content only when a decision is needed to resume those groups.

### Deferred groups with later coupled actions

When a group is deferred because of overlapping history or published-replay interactions, inspect later
history before reconciling it again. Prefer reconciling and compacting the complete coupled group together
to avoid repeating the same work at successive date cutoffs.

- Follow actual write-set and replay dependencies, including whole-array ownership, inverse relations,
  and conflicting relation kinds. Follow newly found dependencies until no more coupled rows remain in
  the frozen snapshot. Sharing a character or file alone does not establish coupling.
- Inspect overlapping history beyond the requested cutoff as evidence. Prepare a combined candidate group
  containing the deferred rows and later approved/public dependencies; keep synced history as evidence,
  not cutover candidates. Preserve whole rows and process them in chronological action order.
- Preserve the original discovery manifest and freeze the proposed expanded group with exact IDs,
  dependency reasons, and date coverage. Beyond-cutoff inspection does not authorize beyond-cutoff sync:
  obtain any missing scope authorization after preparing the concrete proposal. Until then, keep those
  later rows as verification dependencies and defer any group that requires their joint cutover.
- Resolve content and broken-chain issues explicitly; later values do not automatically repair them.
  Require complete-group verification and full published-domain parity under the existing reconciliation
  rules before joint sync. If the snapshot changes, refreeze rather than chasing a moving history.
- Keep independent ready groups separate and moving. This rule does not require syncing all later dates
  or clearing every deferred row before other work can proceed.

## Exact duplicates

Rows are duplicates only when entity type and complete decoded, ordered actions match. Inspect `created_by`
without recording user identifiers in the manifest or report:

- Prefer a non-anonymous copy over anonymous copies. If all are anonymous, retain the earliest by time/ID.
- For copies from the same non-anonymous user, retain the earliest by time/ID.
- For different non-anonymous contributors, defer for review; do not choose a contributor automatically.

Resolving exact duplicates under these rules is part of the requested batch and requires no separate
authorization. Use the prepared reject RPC for pending/private copies or revoke RPC for approved/public
copies. Require a moderator actor, replay-epoch protection, and exact post-mutation
re-query; never update status directly. Read the actor from `GAME_DATA_COMPACTION_ACTOR_ID` when configured
in ignored local environment files. Do not print or store that UUID in tracked files, manifests, or reports;
its presence does not authorize unrelated mutations.

Preserve the discovery manifest and record removals separately. Freeze a new working manifest excluding
removed copies from both cutover and verification dependencies. Recompute groups, chains, counts,
fingerprints, and later overlaps before continuing with the retained rows.

## Patch and verify

1. Immediately before editing, re-query each group's exact IDs and compare all frozen content and metadata.
2. Apply the shared write-set, ordering, and source-mapping rules. Preserve comments and unrelated fields.
   Checked replay is an expected-output oracle, not a source writer or permission to overwrite conflicts.
3. Check full published-domain parity before an expensive build or readiness claim, using the original and
   patched baselines with one approved snapshot. Also check patched replay before/after excluding cutover
   rows. Allow only exact user-approved before/after reconciliations; source reversal alone is insufficient.
4. On unexplained differences, defer the entire affected dependency group, freeze the reduced manifest,
   and recheck the remainder without another approval. Never relax parity or split a group to pass.
5. Carry approved content corrections through source and later replay: prepare narrow correction actions
   from fresh endpoint/old-value checks and submit within existing remote authorization. Refreeze after
   mutations; approval of wording alone does not authorize publication.
6. Run shared checks once per unchanged source/cohort, including represented rows. Reuse passing results;
   rerun affected checks after changes. Deployment-bound preflight and post-check remain required.

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
- The supported verifier requires the original `repository.head`, a committed `--patched-ref`, and the
  matching deployed build/approved snapshot. It binds epoch, revision, and row digests only after checks
  pass. Local preparation does not constitute deployment-bound proof.
- Resume from saved evidence when the user reports deployment: after the first, run authorized `sync`
  directly; after the forced second build, run read-only `post-check`. Use standalone `check` only for
  diagnosis. Report the next operator step; never repeat an uncertain or confirmed sync.
- Diagnose failures through the underlying verifier. Repair format-only errors from frozen evidence and
  retry only when no mutation occurred; apply the runbook's stop/recovery rules to changed state or uncertain
  outcomes. Never invent evidence or silently change membership.

## Report

Link the manifest and report changed files, checks/results, exact verified IDs (including represented
rows), deferred IDs with reasons/dependencies, current remote statuses, and any remaining deployment step.
Keep Patched, Verified, Deferred, and remotely Synced distinct.
