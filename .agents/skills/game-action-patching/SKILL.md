---
name: game-action-patching
description: 'Patch and verify small, clear cohorts of at most 25 approved game_data_actions in canonical character relation/data files. Use game-action-compaction for broad periods, oversized date inventories, or dependency-heavy cohorts.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching

Patch small, clear approved public-action cohorts into canonical source files and verify exact
row IDs. Read [Shared Game Action Correctness Rules](references/action-correctness.md) before
acting; it owns inspection commands, source mapping, conflict rules, dispositions, and safety gates.

## Routing

Use this workflow for at most 25 rows that map clearly, with no dependency crossing the cohort.
For broad periods, more than 25 rows, date-inventory `output_too_large`, dependency-heavy cohorts,
or explicit baseline compaction, continue under [game-action-compaction](../game-action-compaction/SKILL.md).
Do not turn bulk compaction into unrelated 25-row patches. Splitting exact-ID inspection output
does not split the logical group or require switching workflows by itself.

## Operation Boundary

- Treat the normal workflow as read-only remote discovery plus local source edits.
- Stay on the current branch; do not use a browser.
- Without cutover authorization, stop after local verification. If already authorized, continue
  under the handoff below without asking again.
- Local verification does not prove that a remote status transition is safe. Never describe a row
  as `synced` unless an exact re-query confirms that status.

## Workflow

1. **Discover**: Run `npm run inspect:game-data-actions` for the requested date/actor scope using
   the shared Beijing date rules. Select exact IDs and fetch `--values`; use `--include-history`
   when source matches neither old nor new. Keep dependent rows and atomic multi-action rows together.
2. **Classify**: Assign each group **Ready**, **Represented**, **Review required**, or **Blocked**
   using the shared definitions. Resolve review findings through overlapping history or defer
   affected groups and their dependents. Present a concise plan, then continue independent Ready
   and Represented groups within the user's authorized scope without another approval. Ask only
   when resolving ambiguous content requires a user decision; do not block independent work.
3. **Recheck**: Retain the exact selected row IDs, `created_at`, `entity_type`, status, visibility,
   and entry content from inspection. Re-query immediately before editing and compare all of
   them, not just status. If a row is missing or changed, stop and rediscover/reclassify the batch.
   A bounded summary alone cannot prove content equality; if complete content or a supported
   digest is unavailable, report the limitation and defer the affected group. A full compaction
   manifest is unnecessary for this local workflow; keep any saved snapshots in ignored `.tmp/`
   files and never commit payloads, credentials, or user identifiers.
4. **Apply and verify**: Edit Ready groups using the shared write-set rules. Leave Represented
   groups unchanged but include them in verification. Run the shared verification recipe and
   domain safety gates; defer the whole submitted verification batch on unsupported or mismatched
   rows. Report progress between coherent groups without waiting for acknowledgment.
5. **Finalize**: Re-query exact IDs for status and visibility. Report changed files, verification
   results and exact verified IDs (including represented rows), deferred IDs with reasons/dependencies,
   and cutover readiness. Keep Patched, Verified, Deferred, and remotely Synced distinct.

## Status-Cutover Handoff

Small-batch patching alone does not authorize status changes. For an already authorized
cutover, use [game-action-compaction](../game-action-compaction/SKILL.md) and read the
[human operator runbook](../../../docs/operations/game-data-action-compaction.md).
Hand off exact cutover and verification-only row IDs as separate sets. The runbook owns deployment
order, target confirmation, retained evidence, recovery, and historical cohort stop conditions.
Do not add mutation logic to `scripts/verify-game-data-actions.mjs`.
