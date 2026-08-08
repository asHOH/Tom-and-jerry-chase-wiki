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

## Phase 3B continuation audit

Audited at `2026-08-08 16:38:56 UTC`:

- `tjwiki-test` (`zzhaxwwnltctvojcsmaq`, Singapore) was initially `INACTIVE`. It was restored by the
  operator and verified `ACTIVE_HEALTHY` at `2026-08-08 16:55:20 UTC`; production `tjwiki`
  (`gehfogfxgbkwwwcamogj`) remains `ACTIVE_HEALTHY`.
- The restored test database was an October 2025 snapshot whose latest migration was
  `20251004125800_fix_security_definer_functions`; `public.game_data_actions` did not exist. All 54
  missing repository migrations were applied with their original versions before measurement.
- The operator supplied a staging database URL. It was held temporarily in the ignored local
  `.env.staging.local` during measurement and removed afterward; the usable IPv4 session-pooler host
  was `aws-1-ap-southeast-1.pooler.supabase.com`.
- PostgreSQL `psql` was not on `PATH`, so the harness ran with the PostgreSQL 17 client in a
  controlled PostgreSQL 17 container.
- `develop` is three commits ahead of the refreshed `origin/develop`. Commits `7ba79fdb`,
  `d807984f`, and `67077865` are not contained by any tracked remote branch, so none has been pushed
  to `origin`.
- Public version metadata confirms that none of the three commits is deployed. Development
  `https://dev.tjwiki.com/version.json` reports commit `d6590346`, built at
  `2026-07-29T13:53:50.386Z`; production `https://tjwiki.com/version.json` reports commit `88fc81a1`,
  built at `2026-08-07T20:19:48+08:00`. Recheck both endpoints immediately before deployment and
  record the post-deployment commit/timestamp.
- Staging global moderator `508bf2d5-6167-43ce-aa05-da146849f2b6` has global approve, reject,
  mark-synced, and revoke grants.
- Production had no scoped game-data moderator. Staging-only user
  `00000000-0000-4000-8000-00000000b001` and group
  `00000000-0000-4000-8000-00000000b002` were created with those four grants scoped to resource type
  `characters` and no group parent.
- Staging contains all 2,486 production actions with IDs, entity types, entries, statuses,
  visibility, and timestamps preserved. Creator/reviewer IDs, messages, and rejection reasons were
  set to `NULL`. Exact parity was confirmed for row count, status/entity distributions, and entry
  sizes. A private non-character detail row was visible to the global identity and denied to the
  scoped identity.

Because the test project was created on `2025-10-04`, it cannot yet have been paused for more than
one year. Restore it through Supabase Dashboard → organization `gjorfiqswkjvpecifzry` → `tjwiki-test`
→ **Resume project**. Supabase documents that a project within the one-year window returns with its
existing data and configuration. If one-click restore is unexpectedly unavailable, download its
database backup, restore it to a new project, and re-create project-level settings following the
[Supabase restore guide](https://supabase.com/docs/guides/platform/clone-project).

## Measurement command

Run the harness against a restored/reactivated staging database whose action-row volume, status and
entity distribution, JSON entry shapes, and scoped permission grants are representative:

```powershell
psql $env:STAGING_DATABASE_URL `
  -v moderator_user_id='<representative moderator UUID>' `
  -v moderator_identity_type='global' `
  -v measurement_variant='existing-indexes' `
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

It records the identity type, measurement variant, staging parity data, effective moderation grants,
existing indexes, and pre/post `pg_stat_statements` snapshots without resetting them. Run it once
with `moderator_identity_type=global` and once with `moderator_identity_type=scoped` for every
baseline or candidate-index variant.

## Application timing observability

The `admin-game-data-actions:*` timing events are JSON emitted with `console.info` by the two Next.js
route handlers. In the linked Vercel project they are collected as Vercel Function Runtime Logs, not
as Supabase logs. Search the project Runtime Logs for `admin-game-data-actions:` and filter by the
target environment, deployment, and exact UTC observation window.

Export the same window as JSON Lines with an authenticated Vercel CLI. Use explicit timestamps and
deployment/environment filters; do not rely on the current branch default:

```powershell
vercel logs --environment production `
  --since '<window-start-UTC>' `
  --until '<window-end-UTC>' `
  --query 'admin-game-data-actions:' `
  --expand --json --no-branch `
  > .tmp/admin-game-data-action-timings.jsonl

npm run report:admin-game-data-action-timings -- `
  .tmp/admin-game-data-action-timings.jsonl
```

The summarizer groups successful samples by the exact `queryShape` label and applies the
nearest-rank definition: sort `n` durations and select element `ceil(0.95 * n)`. It reports failures
separately rather than folding them into latency. Vercel retention depends on the plan; if the
Runtime Logs UI/CLI cannot cover the entire seven-day window, configure a 100%-sampled production
Log Drain before deployment and retain its JSON/NDJSON output through the review.

## Phase 3B execution results

The preparation and measurement window was `2026-08-08 16:55:20–18:45:21 UTC` on PostgreSQL 17.6.
Production/staging contained 2,486 rows: 1,288 synced, 699 rejected, 488 approved, 6 revoked, and 5
pending. Characters accounted for 2,304 rows. Average `entry` size was 812.97 bytes and p95 was 1,748
bytes. All plans below wrote zero temporary blocks and read zero shared blocks; `hit/read` therefore
shows a zero read component. Pending cursor shapes were correctly skipped because only five pending
rows existed.

### Existing-index baseline

| Identity | Shape                   |      ms | Rows | Hit/read | Sort                | Scan/index                    |
| -------- | ----------------------- | ------: | ---: | -------: | ------------------- | ----------------------------- |
| Global   | Pending first           | 843.077 |    5 |   9801/0 | quicksort, 25 KiB   | Sequential scan               |
| Global   | Pending cursor          | skipped |    — |        — | —                   | Fewer than 50 rows            |
| Global   | Historical first        | 855.922 |   50 |   9801/0 | top-N, 38 KiB       | Sequential scan               |
| Global   | Historical cursor       | 849.973 |   50 |   9753/0 | top-N, 38 KiB       | Sequential scan               |
| Global   | Pending + entity first  | 799.810 |    5 |   9519/0 | incremental, 25 KiB | Existing entity/created index |
| Global   | Pending + entity cursor | skipped |    — |        — | —                   | Fewer than 50 rows            |
| Global   | Entity + all first      |   4.972 |   50 |     61/0 | incremental, 28 KiB | Existing entity/created index |
| Global   | Entity + all cursor     |   2.098 |   50 |     45/0 | incremental, 29 KiB | Existing entity/created index |
| Global   | Unfiltered all first    | 846.897 |   50 |   9801/0 | top-N, 38 KiB       | Sequential scan               |
| Global   | Unfiltered all cursor   | 854.380 |   50 |   9753/0 | top-N, 38 KiB       | Sequential scan               |
| Global   | Exact ID                |   0.690 |    1 |      7/0 | none                | Primary key                   |
| Global   | Detail                  |   0.647 |    1 |      7/0 | none                | Primary key                   |
| Scoped   | Pending first           | 963.235 |    5 |   9469/0 | quicksort, 25 KiB   | Sequential scan               |
| Scoped   | Pending cursor          | skipped |    — |        — | —                   | Fewer than 50 rows            |
| Scoped   | Historical first        | 960.805 |   50 |   9469/0 | top-N, 38 KiB       | Sequential scan               |
| Scoped   | Historical cursor       | 936.787 |   50 |   9420/0 | top-N, 38 KiB       | Sequential scan               |
| Scoped   | Pending + entity first  | 774.748 |    5 |   7403/0 | incremental, 25 KiB | Existing entity/created index |
| Scoped   | Pending + entity cursor | skipped |    — |        — | —                   | Fewer than 50 rows            |
| Scoped   | Entity + all first      |   4.772 |   50 |     50/0 | incremental, 28 KiB | Existing entity/created index |
| Scoped   | Entity + all cursor     |   1.952 |   50 |     41/0 | incremental, 29 KiB | Existing entity/created index |
| Scoped   | Unfiltered all first    | 962.393 |   50 |   9469/0 | top-N, 38 KiB       | Sequential scan               |
| Scoped   | Unfiltered all cursor   | 971.573 |   50 |   9420/0 | top-N, 38 KiB       | Sequential scan               |
| Scoped   | Exact ID                |   0.670 |    1 |      6/0 | none                | Primary key                   |
| Scoped   | Detail                  |   0.672 |    1 |      6/0 | none                | Primary key                   |

### Candidate decisions

| Candidate                                             | Representative result                                                                                                          | Decision                                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(status, created_at DESC, id DESC)`                  | Not selected. Global pending/historical first/cursor were 883.998/882.889/883.951 ms; scoped were 953.640/951.822/945.156 ms.  | Reject: no scan, sort, block, or latency improvement over the existing status index.                                                                       |
| `(status, entity_type, created_at DESC, id DESC)`     | Not selected. Pending + entity was 802.558 ms global and 771.452 ms scoped.                                                    | Reject: PostgreSQL retained the existing entity index and RLS-wide filtering cost.                                                                         |
| `(entity_type, created_at DESC, id DESC)`             | Selected and removed the incremental sort, but global first/cursor were 4.752/1.971 ms and scoped were 5.235/2.060 ms.         | Reject: no material benefit over the 4.772–4.972/1.952–2.098 ms baseline; extra write/storage cost is unjustified.                                         |
| `(created_at DESC, id DESC)`                          | Selected. Global all first/cursor fell to 5.218/1.641 ms; scoped fell to 7.233/1.701 ms. It also accelerated historical pages. | Adopt as `game_data_actions_created_at_id_idx`.                                                                                                            |
| `(created_at DESC, id DESC) WHERE status = 'pending'` | Selected. Global pending and pending + entity fell to 2.701/2.434 ms; scoped fell to 2.267/2.329 ms.                           | Adopt as `game_data_actions_pending_created_at_id_idx`; the production skew made this 16 KiB partial index materially better than broad status candidates. |

### Adopted-index result

| Identity | Shape                  |    ms | Rows | Hit/read | Sort | Scan/index            |
| -------- | ---------------------- | ----: | ---: | -------: | ---- | --------------------- |
| Global   | Pending first          | 2.308 |    5 |     24/0 | none | Pending partial index |
| Global   | Historical first       | 5.135 |   50 |     67/0 | none | Created/ID index      |
| Global   | Historical cursor      | 1.937 |   50 |     40/0 | none | Created/ID index      |
| Global   | Pending + entity first | 2.276 |    5 |     24/0 | none | Pending partial index |
| Global   | Entity + all first     | 4.768 |   50 |     63/0 | none | Created/ID index      |
| Global   | Entity + all cursor    | 1.959 |   50 |     40/0 | none | Created/ID index      |
| Global   | Unfiltered all first   | 5.115 |   50 |     64/0 | none | Created/ID index      |
| Global   | Unfiltered all cursor  | 1.555 |   50 |     34/0 | none | Created/ID index      |
| Global   | Exact ID               | 0.693 |    1 |      7/0 | none | Primary key           |
| Global   | Detail                 | 0.693 |    1 |      7/0 | none | Primary key           |
| Scoped   | Pending first          | 2.313 |    5 |     19/0 | none | Pending partial index |
| Scoped   | Historical first       | 6.617 |   50 |     68/0 | none | Created/ID index      |
| Scoped   | Historical cursor      | 1.949 |   50 |     36/0 | none | Created/ID index      |
| Scoped   | Pending + entity first | 2.357 |    5 |     19/0 | none | Pending partial index |
| Scoped   | Entity + all first     | 4.750 |   50 |     52/0 | none | Created/ID index      |
| Scoped   | Entity + all cursor    | 1.946 |   50 |     36/0 | none | Created/ID index      |
| Scoped   | Unfiltered all first   | 6.598 |   50 |     65/0 | none | Created/ID index      |
| Scoped   | Unfiltered all cursor  | 1.519 |   50 |     31/0 | none | Created/ID index      |
| Scoped   | Exact ID               | 0.702 |    1 |      6/0 | none | Primary key           |
| Scoped   | Detail                 | 0.711 |    1 |      6/0 | none | Primary key           |

The adopted indexes are represented by
`20260809000000_add_game_data_action_list_indexes.sql`. On staging the full ordering index was 120
KiB and built in 75.989 ms; the pending partial index was 16 KiB and built in 80.094 ms. Use the
normal transactional migration in a recorded low-traffic production window. Its regular index builds
briefly block writes; the representative table is small enough that a concurrent out-of-band build
is not justified. The production deployment timestamp/window remains a Phase 4 field. The bounded
RLS queries are no longer materially expensive, so the security-definer RPC gate was not crossed.

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

## Phase 4 baseline and completion record

The owner approved a simplified closeout without formal equal-duration production metrics or a
seven-day report. Production served commit `c0daec54`, built at `2026-08-09T04:07:05+08:00`, with a
successful public health check. Migration `20260809000000_add_game_data_action_list_indexes` was
then applied transactionally; its 120 KiB general ordering index and 16 KiB pending partial index
were both verified valid and ready. Existing database statistics were not reset.

Final decision: successful based on the measured staging reduction to 1.5–6.6 ms, zero temporary
blocks in representative list plans, passing API/UI/RLS tests, the production health/version check,
and verified production indexes. The formal production p95, CPU/Disk IO deltas, and observation
window were explicitly waived and are not claimed as measured results. The 60% CPU threshold remains
the trigger for ordinary operational investigation.

### Phase 4A validation record

Phase 4A completed at `2026-08-08 19:08:06 UTC`, before production deployment:

- The existing Phase 2 API/UI suites retain coverage for validation bounds, filter-bound cursors,
  exact-ID behavior, inactive-tab requests, SWR filter keys, pagination reset, the cached pending
  badge, and one detail request per expansion.
- `src/app/api/game-data-actions/admin/route.test.ts` now exercises equal timestamps across a page
  boundary, insertion before the saved boundary, duplicate/omission guarantees for unchanged rows,
  and expected pending-filter membership changes between requests.
- `supabase/tests/database/game_data_action_admin_rls.test.sql` uses transactional global and
  resource-type-scoped moderator grants through the `authenticated` role. All six assertions passed
  on `tjwiki-test`, including denial of a private map detail to the characters-scoped moderator and
  access to the same row by the global moderator. The fixture rollback was verified afterward.
- Oxlint, TypeScript, and all 40 directly relevant Jest tests passed.

## Harness validation

The complete harness was syntax- and execution-validated against a disposable local PostgreSQL
17.6 database with 260 synthetic rows and the real RLS functions/policy. Those timings are not
representative and were not used for index selection. The temporary local database and its synthetic
data were removed after validation.

## Retention and cleanup

This handoff and its plan are archived together under `docs/archive/completed/`. Keep the adopted
index migration permanently. The measurement harness remains because `AGENTS.md` identifies it as
the safe staging-only entry point for future Supabase performance work.
