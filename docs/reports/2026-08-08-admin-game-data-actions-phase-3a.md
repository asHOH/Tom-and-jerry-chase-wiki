# Admin game-data actions Phase 3A measurement handoff

## Outcome

Phase 3 is split at its measurement gate:

- **Phase 3A:** prepare and run representative RLS-scoped measurements.
- **Phase 3B:** add only the indexes justified by those measurements, then rerun the same shapes.

The repository is linked to the active production project `tjwiki`. The only separate `tjwiki-test`
project was inactive on 2026-08-08. No `EXPLAIN (ANALYZE, BUFFERS)` query was run against production,
and no production statistics were reset. A catalog-only production check confirmed that
`authenticated` retains table-level `SELECT` and that the live index set matches the six indexes
reported by a locally rebuilt schema. The local backup differed in table grants, so the harness now
fails its preflight if `authenticated` cannot select the table instead of silently measuring as the
owner or service role.

## Measurement command

Run the harness against a restored/reactivated staging database whose action-row volume, status and
entity distribution, JSON entry shapes, and scoped permission grants are representative:

```powershell
psql $env:STAGING_DATABASE_URL `
  -v moderator_user_id='<representative moderator UUID>' `
  -v entity_type='characters' `
  -v historical_status='approved' `
  -f scripts/ops/measure-admin-game-data-actions.sql `
  | Tee-Object docs/reports/2026-08-08-admin-game-data-actions-phase-3a-results.txt
```

Use at least two identities when scoped permissions differ materially: one with global moderation
access and one with realistic resource-scoped access. Do not use a service-role connection as the
query identity. The script changes to PostgreSQL's `authenticated` role and sets
`request.jwt.claim.sub`, ensuring the existing `RBAC game actions select` policy and
`can_access_game_action` checks remain in the measured path.

The script is read-only for application data, sets a 30-second statement timeout and a two-second
lock timeout, measures summary rows without `entry`, and covers first and cursor pages for:

- `pending`;
- a historical status;
- `pending + entityType`;
- `entityType + status=all`;
- unfiltered `status=all`;
- exact-ID summary and detail lookups.

It records existing indexes and pre/post `pg_stat_statements` snapshots without resetting them.

## Results to record

| Identity         | Shape                        | Execution ms | Rows | Shared hit/read blocks | Temp written blocks | Sort | Index/scan | Decision |
| ---------------- | ---------------------------- | -----------: | ---: | ---------------------- | ------------------: | ---- | ---------- | -------- |
| Global moderator | Pending first page           |              |      |                        |                     |      |            |          |
| Global moderator | Pending cursor page          |              |      |                        |                     |      |            |          |
| Global moderator | Historical first/cursor      |              |      |                        |                     |      |            |          |
| Global moderator | Status + entity first/cursor |              |      |                        |                     |      |            |          |
| Global moderator | Entity + all first/cursor    |              |      |                        |                     |      |            |          |
| Global moderator | Unfiltered all first/cursor  |              |      |                        |                     |      |            |          |
| Global moderator | Exact ID                     |              |      |                        |                     |      |            |          |
| Global moderator | Detail                       |              |      |                        |                     |      |            |          |
| Scoped moderator | Repeat all shapes            |              |      |                        |                     |      |            |          |

Also record the measurement window, PostgreSQL project/version, row distribution, query IDs, calls,
mean duration, rows, and cumulative temporary blocks written.

## Phase 3B decision rules

Compare the existing indexes with candidates one at a time on staging. Do not add all candidates by
default.

| Slow shape                   | Candidate                                         |
| ---------------------------- | ------------------------------------------------- |
| Status first/cursor pages    | `(status, created_at DESC, id DESC)`              |
| Status plus entity pages     | `(status, entity_type, created_at DESC, id DESC)` |
| Entity-filtered `status=all` | `(entity_type, created_at DESC, id DESC)`         |
| Unfiltered `status=all`      | `(created_at DESC, id DESC)`                      |

Adopt a candidate only when it removes a material sort/scan cost for representative 50-row pages and
the read benefit justifies its write and storage cost. PostgreSQL does not allow
`CREATE INDEX CONCURRENTLY` inside a transaction, while a regular index build blocks writes; verify
the deployment runner's transaction behavior before choosing between a concurrent controlled step
and a documented low-traffic maintenance window. Keep the resulting schema change represented in
the repository's migration history. See the official
[PostgreSQL `CREATE INDEX` documentation](https://www.postgresql.org/docs/17/sql-createindex.html)
and [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations).

Do not pursue a security-definer pagination RPC unless bounded, indexed, RLS-scoped queries remain
materially expensive. If that gate is crossed, create a separate reviewed design with permission
tests and the security constraints already listed in the remediation plan.

## Production baseline snapshot

This catalog/statistics-only snapshot was captured at `2026-08-08 16:00:58 UTC` on PostgreSQL 17.6.
The retained `pg_stat_statements` window began at `2026-07-20 04:12:08 UTC`; it was not reset.

The pre-remediation wide admin-list statement is identifiable by its selection of `entry` alongside
all summary columns and its unbounded action-table source:

|               Query ID | Calls | Mean execution |  Rows |   Total execution | Temp blocks written | Temp blocks/call |
| ---------------------: | ----: | -------------: | ----: | ----------------: | ------------------: | ---------------: |
| `-6027713654615505397` | 6,169 |   1,634.176 ms | 6,169 | 10,081,234.557 ms |           1,285,000 |            208.3 |

The snapshot confirms the original statement remains the dominant temporary-write source. Phase 4
must compare deltas over equal-duration windows rather than comparing these cumulative totals
directly with a shorter post-deployment period.

Catalog estimates at capture time provide the staging-data target without scanning the live action
table:

- approximately 2,480 rows;
- 3,760 KiB total relation size: 2,640 KiB heap and 616 KiB indexes;
- average `entry` width of 652 bytes;
- status distribution: 51.94% synced, 28.15% rejected, 19.52% approved, 0.20% pending, and 0.20%
  revoked;
- entity distribution dominated by `characters` at 92.66%.

The staging restore should preserve this skew; a uniformly generated dataset would not be a valid
basis for the combined-filter index decision.

## Harness validation

The complete harness was syntax- and execution-validated against a disposable local PostgreSQL
17.6 database with 260 synthetic rows and the real RLS functions/policy. Those timings are not
representative and were not used for index selection. The temporary local database and its synthetic
data were removed after validation.

## Retention and cleanup

- Keep this handoff through Phase 3B and the full Phase 4 observation window. It is the durable
  baseline and decision record; do not delete it after indexes are selected.
- Keep `scripts/ops/measure-admin-game-data-actions.sql` through Phase 4 so pre-index, post-index, and
  post-deployment measurements use identical query shapes. After the full plan is complete, delete
  the harness if it has no continuing operational owner; Git history will retain the exact version
  used for this remediation.
- Summarize representative Phase 3B results and index decisions in this handoff. Do not commit a
  large raw psql transcript if it contains unnecessary query text or operational metadata; remove
  the local transcript after its relevant figures have been recorded.
- After the seven-day observation window and final success review, move this handoff and the main
  remediation plan together to `docs/archive/completed/`. Keep any adopted index migration in
  `supabase/migrations/` permanently.
