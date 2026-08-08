\set ON_ERROR_STOP on
\pset pager off
\timing on

-- Run only against staging or another safe representative database. This script deliberately
-- refuses to guess the moderator identity because RLS plan cost depends on that user's scopes.
\if :{?moderator_user_id}
\else
  \echo 'ERROR: pass -v moderator_user_id=<uuid>'
  \quit
\endif

\if :{?moderator_identity_type}
\else
  \echo 'ERROR: pass -v moderator_identity_type=global|scoped'
  \quit
\endif

SELECT :'moderator_identity_type' IN ('global', 'scoped') AS moderator_identity_type_valid
\gset
\if :moderator_identity_type_valid
\else
  \echo 'ERROR: moderator_identity_type must be global or scoped'
  \quit
\endif

\if :{?measurement_variant}
\else
  \set measurement_variant existing-indexes
\endif

\if :{?entity_type}
\else
  \set entity_type characters
\endif

\if :{?historical_status}
\else
  \set historical_status approved
\endif

\echo '=== measurement context ==='
SELECT
  current_database() AS database_name,
  current_setting('server_version') AS server_version,
  now() AS measured_at,
  :'moderator_user_id'::uuid AS moderator_user_id,
  :'moderator_identity_type' AS moderator_identity_type,
  :'measurement_variant' AS measurement_variant,
  :'entity_type' AS entity_type,
  :'historical_status' AS historical_status;

\echo '=== staging data parity ==='
SELECT
  count(*) AS total_rows,
  round(avg(pg_column_size(entry))::numeric, 2) AS average_entry_bytes,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY pg_column_size(entry)) AS p50_entry_bytes,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY pg_column_size(entry)) AS p95_entry_bytes,
  max(pg_column_size(entry)) AS maximum_entry_bytes
FROM public.game_data_actions;

SELECT status, count(*) AS rows,
  round(100.0 * count(*) / sum(count(*)) OVER (), 2) AS percentage
FROM public.game_data_actions
GROUP BY status
ORDER BY rows DESC, status;

SELECT entity_type, count(*) AS rows,
  round(100.0 * count(*) / sum(count(*)) OVER (), 2) AS percentage
FROM public.game_data_actions
GROUP BY entity_type
ORDER BY rows DESC, entity_type;

\echo '=== effective moderation grants for representative identity ==='
WITH RECURSIVE effective_groups(group_id) AS (
  SELECT membership.group_id
  FROM public.user_group_memberships membership
  WHERE membership.user_id = :'moderator_user_id'::uuid
  UNION
  SELECT child.parent_group_id
  FROM effective_groups current_group
  JOIN public.user_groups child ON child.id = current_group.group_id
  WHERE child.parent_group_id IS NOT NULL
)
SELECT DISTINCT
  grant_row.permission_key,
  grant_row.scope,
  NULLIF(grant_row.resource_type, '*') AS resource_type,
  NULLIF(grant_row.resource_id, '*') AS resource_id
FROM effective_groups
JOIN public.group_permission_grants grant_row
  ON grant_row.group_id = effective_groups.group_id
WHERE grant_row.permission_key IN (
  'game_data_action.approve',
  'game_data_action.reject',
  'game_data_action.mark_synced',
  'game_data_action.revoke'
)
ORDER BY permission_key, scope, resource_type, resource_id;

\echo '=== existing game_data_actions indexes ==='
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'game_data_actions'
ORDER BY indexname;

SELECT has_table_privilege(
  'authenticated', 'public.game_data_actions', 'SELECT'
) AS authenticated_can_select
\gset
\if :authenticated_can_select
\else
  \echo 'ERROR: authenticated lacks SELECT on public.game_data_actions; RLS cannot be measured'
  \quit
\endif

\echo '=== pg_stat_statements measurement window and pre-run snapshot (never reset) ==='
SELECT stats_reset FROM pg_stat_statements_info;
SELECT
  queryid,
  calls,
  round(mean_exec_time::numeric, 3) AS mean_exec_time_ms,
  rows,
  temp_blks_written,
  left(regexp_replace(query, '\s+', ' ', 'g'), 500) AS query
FROM pg_stat_statements
WHERE query ILIKE '%game_data_actions%'
  AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC;

BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '2s';
SET LOCAL plan_cache_mode = force_custom_plan;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'moderator_user_id', true);

\echo '=== RLS-visible row distribution for the representative moderator ==='
SELECT status, entity_type, count(*) AS visible_rows
FROM public.game_data_actions
GROUP BY status, entity_type
ORDER BY status, visible_rows DESC, entity_type;

-- Capture stable boundary keys separately so each EXPLAIN below measures the application query,
-- not a cursor-producing CTE.
WITH cursor_row AS (
  SELECT created_at, id
  FROM public.game_data_actions
  WHERE status = 'pending'
  ORDER BY created_at DESC, id DESC
  OFFSET 49 LIMIT 1
)
SELECT cursor_row.created_at AS pending_cursor_created_at,
  cursor_row.id AS pending_cursor_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN cursor_row ON true
\gset

WITH cursor_row AS (
  SELECT created_at, id
  FROM public.game_data_actions
  WHERE status = :'historical_status'::public.game_data_action_status
  ORDER BY created_at DESC, id DESC
  OFFSET 49 LIMIT 1
)
SELECT cursor_row.created_at AS historical_cursor_created_at,
  cursor_row.id AS historical_cursor_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN cursor_row ON true
\gset

WITH cursor_row AS (
  SELECT created_at, id
  FROM public.game_data_actions
  WHERE status = 'pending' AND entity_type = :'entity_type'
  ORDER BY created_at DESC, id DESC
  OFFSET 49 LIMIT 1
)
SELECT cursor_row.created_at AS status_entity_cursor_created_at,
  cursor_row.id AS status_entity_cursor_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN cursor_row ON true
\gset

WITH cursor_row AS (
  SELECT created_at, id
  FROM public.game_data_actions
  WHERE entity_type = :'entity_type'
  ORDER BY created_at DESC, id DESC
  OFFSET 49 LIMIT 1
)
SELECT cursor_row.created_at AS entity_all_cursor_created_at,
  cursor_row.id AS entity_all_cursor_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN cursor_row ON true
\gset

WITH cursor_row AS (
  SELECT created_at, id
  FROM public.game_data_actions
  ORDER BY created_at DESC, id DESC
  OFFSET 49 LIMIT 1
)
SELECT cursor_row.created_at AS all_cursor_created_at,
  cursor_row.id AS all_cursor_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN cursor_row ON true
\gset

WITH exact_row AS (
  SELECT id
  FROM public.game_data_actions
  ORDER BY created_at DESC, id DESC
  LIMIT 1
)
SELECT exact_row.id AS exact_action_id
FROM (VALUES (1)) AS singleton(value)
LEFT JOIN exact_row ON true
\gset

\echo '=== pending first page ==='
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
  reviewed_at, reviewed_by, status
FROM public.game_data_actions
WHERE status = 'pending'
ORDER BY created_at DESC, id DESC
LIMIT 50;

\if :{?pending_cursor_id}
  \echo '=== pending cursor page ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE status = 'pending'
    AND (
      created_at < :'pending_cursor_created_at'::timestamptz
      OR (
        created_at = :'pending_cursor_created_at'::timestamptz
        AND id < :'pending_cursor_id'::uuid
      )
    )
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
\else
  \echo 'SKIP pending cursor page: fewer than 50 visible pending rows'
\endif

\echo '=== historical status first page ==='
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
  reviewed_at, reviewed_by, status
FROM public.game_data_actions
WHERE status = :'historical_status'::public.game_data_action_status
ORDER BY created_at DESC, id DESC
LIMIT 50;

\if :{?historical_cursor_id}
  \echo '=== historical status cursor page ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE status = :'historical_status'::public.game_data_action_status
    AND (
      created_at < :'historical_cursor_created_at'::timestamptz
      OR (
        created_at = :'historical_cursor_created_at'::timestamptz
        AND id < :'historical_cursor_id'::uuid
      )
    )
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
\else
  \echo 'SKIP historical cursor page: fewer than 50 visible rows for that status'
\endif

\echo '=== pending plus entity first page ==='
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
  reviewed_at, reviewed_by, status
FROM public.game_data_actions
WHERE status = 'pending' AND entity_type = :'entity_type'
ORDER BY created_at DESC, id DESC
LIMIT 50;

\if :{?status_entity_cursor_id}
  \echo '=== pending plus entity cursor page ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE status = 'pending' AND entity_type = :'entity_type'
    AND (
      created_at < :'status_entity_cursor_created_at'::timestamptz
      OR (
        created_at = :'status_entity_cursor_created_at'::timestamptz
        AND id < :'status_entity_cursor_id'::uuid
      )
    )
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
\else
  \echo 'SKIP pending plus entity cursor page: fewer than 50 visible rows'
\endif

\echo '=== entity-filtered status=all first page ==='
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
  reviewed_at, reviewed_by, status
FROM public.game_data_actions
WHERE entity_type = :'entity_type'
ORDER BY created_at DESC, id DESC
LIMIT 50;

\if :{?entity_all_cursor_id}
  \echo '=== entity-filtered status=all cursor page ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE entity_type = :'entity_type'
    AND (
      created_at < :'entity_all_cursor_created_at'::timestamptz
      OR (
        created_at = :'entity_all_cursor_created_at'::timestamptz
        AND id < :'entity_all_cursor_id'::uuid
      )
    )
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
\else
  \echo 'SKIP entity-filtered status=all cursor page: fewer than 50 visible rows'
\endif

\echo '=== unfiltered status=all first page ==='
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
  reviewed_at, reviewed_by, status
FROM public.game_data_actions
ORDER BY created_at DESC, id DESC
LIMIT 50;

\if :{?all_cursor_id}
  \echo '=== unfiltered status=all cursor page ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE created_at < :'all_cursor_created_at'::timestamptz
    OR (
      created_at = :'all_cursor_created_at'::timestamptz
      AND id < :'all_cursor_id'::uuid
    )
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
\else
  \echo 'SKIP unfiltered status=all cursor page: fewer than 50 visible rows'
\endif

\if :{?exact_action_id}
  \echo '=== exact-ID summary lookup ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, created_at, created_by, entity_type, is_public, message, rejection_reason,
    reviewed_at, reviewed_by, status
  FROM public.game_data_actions
  WHERE id = :'exact_action_id'::uuid
  LIMIT 1;

  \echo '=== exact-ID detail lookup ==='
  EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
  SELECT id, entry
  FROM public.game_data_actions
  WHERE id = :'exact_action_id'::uuid;
\else
  \echo 'SKIP exact-ID and detail: moderator has no visible rows'
\endif

ROLLBACK;

\echo '=== post-run pg_stat_statements snapshot (retain statistics; do not reset) ==='
SELECT
  queryid,
  calls,
  round(mean_exec_time::numeric, 3) AS mean_exec_time_ms,
  rows,
  temp_blks_written,
  left(regexp_replace(query, '\s+', ' ', 'g'), 500) AS query
FROM pg_stat_statements
WHERE query ILIKE '%game_data_actions%'
  AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC;
