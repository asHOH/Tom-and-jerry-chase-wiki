---
name: game-action-compaction
description: 'Prepare large or dependency-heavy approved game_data_actions cohorts for baseline compaction through manifest-based planning, local source patching, and verification. Use for broad date ranges, more than 25 rows, oversized date inventories, or requests such as syncing a month of approved changes; use game-action-patching for small clear batches.'
metadata:
  argument-hint: 'Date range, actor filter, manifest policy, status policy'
  user-invocable: true
---

# Game Action Compaction

Compact approved actions into canonical sources using the inspector, source projection, checked replay, and reverse verifier. Read [Shared Correctness Rules](../game-action-patching/references/action-correctness.md) for data semantics and validation. Use [game-action-patching](../game-action-patching/SKILL.md) for at most 25 clear, independent rows unless compaction is explicitly requested.

## Scope and authorization

- Stay on the current branch. Do not use a browser.
- Except for deterministic exact-duplicate resolution within the requested batch (see below), remote mutations, repository pushes, and deployments require authorization for the batch and target. Existing authorization persists across handoffs; ask only for new content/contributor decisions or expanded external scope. The agent owns routine preparation, validation, and whole-group deferral within that scope. Without remote authorization, complete local preparation and stop there.
- Only an exact remote re-query confirming `status = 'synced'` permits calling a row synced.
- Use the [operator runbook](../../../docs/operations/game-data-action-compaction.md) for production commands, deployment order, evidence binding, recovery, and stop conditions.

## Freeze the cohort

1. Inspect the requested inclusive Beijing dates and actor scope. Prefer one full `--output=.tmp/<new-file>.json` export for bulk work. Paginated inventory requires a fixed scope and snapshot; follow `nextCursor` or restart when it changes.
2. Merge by `created_at`, then `id`, then action order. Deduplicate row IDs without splitting multi-action rows.
3. Save the discovery manifest under ignored `.tmp/` before editing. Include:
   - original user scope, UTC bounds, discovery timestamp, and original baseline `repository.head`;
   - ordered row IDs, creation time, entity type, status, visibility, and decoded action count;
   - dependency groups and same-path chain links from the inspector.
4. Reuse full exported rows for content. Fetch missing details or overlapping history with exact-ID slices of at most 25 and `--include-history`; export oversized values. Structural summaries cannot prove equality. Keep complete evidence in ignored companion files.
5. Derive the execution manifest from frozen evidence using the schema and selection checks in `src/lib/gameData/compactionVerification.ts`: `rows` contains only chronological cutover rows, with `cutoverRowIds` in the same order. Keep discovery/deferred evidence separate; inventory JSON is not an execution manifest. Validate its shape locally before deployment, without inventing bound fingerprints.
6. If status, visibility, content, entity type, creation order, or membership changes, preserve the original evidence and freeze a new manifest before continuing. Never mix snapshots.

Never commit manifests, payloads, credentials, or user identifiers. Bind epoch, revision, and row digests through the verifier; inspector exports omit contributor/review metadata and cannot reproduce these digests.

## Group and classify

Keep rows atomic and union structural, old/new-chain, and semantic relation dependencies, including inverse counters, symmetric endpoints, flattened children, and array reconstruction chains. Prefer source locality only within those constraints. Inspect large groups in slices; classify and verify each whole group.

Use the shared dispositions. Before editing, summarize scope, row/action counts, group sizes, affected files, deferrals, and the next handoff. Proceed with authorized Ready/Represented groups; defer unresolved groups and report reduced coverage. Ask only for content decisions needed to resume affected groups.

### Deferred groups with later coupled actions

Before revisiting a deferred group, follow overlapping history through all write-set and replay dependencies in the frozen snapshot. Sharing a character or file alone is insufficient. Include whole-array ownership, inverse relations, and conflicting kinds; synced history is evidence, never a cutover candidate.

Inspection may extend beyond the cutoff. Preserve discovery evidence and freeze the combined candidate's exact IDs, dependencies, and dates. Obtain missing scope authorization for its cutover; until then, later rows remain verification-only and groups requiring joint cutover stay deferred. Independent groups continue.

Later values do not automatically repair content conflicts or broken chains. Verify the entire combined group and published parity under the shared reconciliation rules. Refreeze when the snapshot changes.

## Exact duplicates

Duplicates require matching entity types and complete decoded, ordered actions. The inspector omits `created_by`: read it for exact IDs through the configured target's server-side client. Keep contributor identifiers out of manifests and reports:

- Prefer a non-anonymous copy over anonymous copies. If all are anonymous, retain the earliest by time/ID.
- For copies from the same non-anonymous user, retain the earliest by time/ID.
- For different non-anonymous contributors, defer for review; do not choose a contributor automatically.

Resolving exact duplicates under these rules is part of the requested batch and requires no separate authorization. Use the prepared reject RPC for pending/private copies or revoke RPC for approved/public copies. Require a moderator actor, replay-epoch protection, and exact post-mutation re-query; never update status directly. Read the actor from `GAME_DATA_COMPACTION_ACTOR_ID` when configured in ignored local environment files. Do not print or store that UUID in tracked files, manifests, or reports; its presence does not authorize unrelated mutations.

Preserve the discovery manifest and record removals separately. Freeze a new working manifest excluding removed copies from both cutover and verification dependencies. Recompute groups, chains, counts, fingerprints, and later overlaps before continuing with the retained rows.

## Patch and verify

1. Immediately before editing, re-query each group's exact IDs and compare all frozen content and metadata.
2. Apply the shared write-set, ordering, and source-mapping rules. Preserve comments and unrelated fields. Checked replay is an expected-output oracle, not a source writer or permission to overwrite conflicts.
3. Before an expensive build or readiness claim, compare original-baseline replay with patched-baseline replay excluding cutover rows, using one approved snapshot and retaining verification dependencies. Allow only exact user-approved reconciliations; source reversal alone is insufficient.
4. On unexplained differences, defer the entire affected dependency group, freeze the reduced manifest, and recheck the remainder without another approval. Never relax parity or split a group to pass.
5. For approved corrections at cutover, freeze exact `sourceChanges` and `publishedChanges` in `approvedReconciliation` per the runbook. Publish narrow correction actions only when the correction must take effect before cutover or remain in later replay; recheck old values and refreeze after mutation. Content approval alone does not authorize publication.
6. Reuse passing checks for unchanged source/cohorts. Refresh snapshot-bound preflight at cutover; verify production after deployment.

## Commit convention

- Use `docs(game-data): sync until M.DD`, with the inclusive Beijing cutoff date and a two-digit day, for example `docs(game-data): sync until 8.02`. Use an explicitly requested commit title verbatim.
- Keep one compaction batch in one commit, including approved content reconciliations needed for that batch. Squash local intermediate commits before handoff. Separate commits are appropriate when the task also includes non-compaction work.
- A commit title does not prove remote sync. After rewriting commits, preserve the original evidence and revalidate commit-bound manifests before cutover.

## Finish an authorized batch

- Keep `cutoverRowIds`, `verificationDependencyRowIds`, and retrospective observations separate. Only cutover IDs reach the RPC; verification-only dependencies remain in replay.
- Order: local verification → authorized `sync` → push and force-build/deploy once → read-only `post-check`. No preliminary deployment is required. Explain that the old site may temporarily regress until deployment; existing batch authorization suffices. Standalone `check` is diagnostic.
- `sync` binds the committed patch and fresh snapshot, retains rows, and verifies the atomic transition. Repeated-playback results are diagnostic, not cutover gates. `post-check` binds the deployed artifact and confirms parity. Reuse their exact status receipts instead of duplicate queries.
- On failure, preserve evidence and follow runbook recovery. A post-RPC failure may follow a committed mutation: recover read-only and never repeat an uncertain or confirmed sync. Retry only proven pre-mutation failures after repair; never invent evidence or silently change membership.

## Report

Link the manifest and report changed files, checks/results, exact verified IDs (including represented rows), deferred IDs with reasons/dependencies, current remote statuses, and any remaining deployment step. Keep Patched, Verified, Deferred, and remotely Synced distinct.
