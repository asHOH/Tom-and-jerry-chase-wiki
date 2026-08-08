# Supabase CPU and Disk IO Remediation Plan

## Target problem

The admin game-data-action list repeatedly loads a wide, unpaginated `status=all` result through
row-level security. Each request scans and sorts thousands of rows while performing scoped
permission checks, accounting for approximately 59% of recorded SQL execution time and 90% of
temporary-disk writes.

Before implementation, snapshot `pg_stat_statements` for the existing query ID and record its
measurement window, call count, mean duration, rows, and cumulative temporary blocks written. Add a
structured server-side timing event for each admin list/detail request containing only the query-shape
label, duration, row count, and success status; calculate endpoint p95 from those events. Track the
replacement first-page, cursor-page, status-filtered, status-plus-entity-filtered, entity-filtered
`status=all`, unfiltered `status=all`, exact-ID, and detail shapes separately. Retain statistics and
use snapshots/deltas rather than resetting them. Record that the 200 ms p95 target and seven-day
observation window are operational thresholds rather than values derived from the baseline.

## Phase 1 — Stop unnecessary requests

- [x] Fetch game-data actions only when the admin actions tab is active and the user has moderation
      access.
- [x] Define moderation access consistently in the UI and API as having at least one of
      `game_data_action.approve`, `game_data_action.reject`, `game_data_action.mark_synced`, or
      `game_data_action.revoke`.
- [x] Include the active status and all other server-side filters in the SWR key.
- [x] Disable automatic focus revalidation for this SWR request.
- [x] Keep explicit refreshes after moderation operations.
- [x] Make `pending` the API and UI default status.
- [x] Return `400` for an unknown status instead of silently falling back to `all`.
- [x] Do not issue a separate pending-count request while another admin tab is active. Hide the
      pending badge until the actions tab has been loaded, then reuse its cached page-local result.

**Target:** Opening the admin panel on another tab does not issue an action-list request.

## Phase 2 — Bound the API and UI

- [x] Keep the existing server-side status filter, but wire the selected UI status to it.
- [x] Move the entity-type filter to the server and replace the broad free-text search with an exact
      action-ID lookup. Do not scan submitter nicknames or arbitrary `entry` JSON from the list path.
- [x] Add keyset pagination ordered by `created_at DESC, id DESC`.
- [x] Use a default page size of 50 and enforce a maximum of 100.
- [x] Return `nextCursor: null | string`; validate malformed cursors with `400` and bind cursors to
      the active filter set so they cannot be reused with different filters.
- [x] Select only list-summary fields; do not include the `entry` JSON in list responses.
- [x] Add an authenticated, RLS-scoped detail endpoint that loads the full `entry` for one action.
- [x] Cache details by action ID in the client and fetch them only following an explicit expansion.
- [x] Remove the current “expand all details” behavior so a page cannot fan out into 50–100 detail
      requests.
- [x] Reset the cursor and page-local selection when a server-side filter changes.
- [x] Use page replacement with a client-held cursor stack for previous-page navigation. Keep
      selection page-local. After moderation, remove a successful row only if its new status no
      longer matches the active filter; otherwise patch its summary or wait for current-page
      revalidation.
- [x] Populate the entity-type selector from the canonical entity catalog, not only the current page.
- [x] Label list counts explicitly as loaded/page counts. Derive the badge only from the cached
      `pending` response; display `${loadedPendingCount}+` when it has a `nextCursor` and otherwise
      display the loaded pending count.
- [x] Update moderation refreshes to reload the active page and status without returning to
      `status=all`.

The `status=all` option may remain, but it must use the same deterministic order and hard page limit;
it is bounded rather than selective. Excluding `entry` reduces response size and application JSON
work, but RLS may still read `entry` to evaluate scoped permissions, so database improvement must be
verified rather than assumed.

The list endpoint accepts `status`, `entityType`, `actionId`, `limit`, and `cursor`. `status` defaults
to `pending`; `entityType` must be canonical; `actionId` must be a UUID; `limit` defaults to 50 and
must be between 1 and 100; invalid values return `400`. When `actionId` is present, perform an exact
RLS-scoped lookup independent of status, entity type, cursor, and limit, returning an empty list and
`nextCursor: null` when no visible row matches. The list response is
`{ submissions: ActionSummary[], nextCursor: string | null }`, where `ActionSummary` contains
`action_id`, `created_at`, `created_by`, `created_by_nickname`, `entity_type`, `is_public`, `message`,
`rejection_reason`, `reviewed_at`, `reviewed_by`, `reviewed_by_nickname`, and `status`. The detail
endpoint returns `{ action_id, entry }` for one RLS-visible action.

**Target:** Every list request is filtered where possible, deterministically ordered, and subject to
a hard row limit. Expanding one action performs at most one cached detail request.

## Phase 3 — Optimize the database path

Phase 3 is split at the measurement gate because the linked project is production and the separate
test project is inactive. Phase 3B must remain measurement-gated rather than adding every plausible
index speculatively. See the
[Phase 3A measurement handoff](reports/2026-08-08-admin-game-data-actions-phase-3a.md).

### Phase 3A — Prepare and run representative measurements

- [x] Preserve the authenticated client and existing row-level, resource-scoped authorization for
      both list and detail requests.
- [x] Add a read-only, timeout-bounded measurement harness covering the representative list/detail
      shapes through a supplied moderator identity and the authenticated RLS path. Snapshot
      `pg_stat_statements` before and after without resetting it.
- [x] Record the retained production `pg_stat_statements` baseline for the legacy wide list query,
      plus catalog-only table size, distribution, grants, and index metadata without executing an
      action query or resetting statistics.
- [ ] Reactivate or restore a safe representative environment and measure first-page and cursor-page
      queries for `pending`, historical statuses,
      `status + entityType`, `entityType + status=all`, unfiltered `status=all`, exact-ID, and detail
      shapes with `EXPLAIN (ANALYZE, BUFFERS)` using both global and realistically scoped moderator
      identities. Record the results in the Phase 3A handoff.

### Phase 3B — Apply measurement-selected optimization

- [ ] Compare the existing `(status, created_at)` index with
      `(status, created_at DESC, id DESC)` and add the latter in a new migration only if the measured
      plan needs it.
- [ ] For combined filters, consider `(status, entity_type, created_at DESC, id DESC)`; for an
      entity-filtered `status=all` query, compare the existing entity index with
      `(entity_type, created_at DESC, id DESC)`. Add either only when its measured read benefit
      justifies its write and storage cost.
- [ ] Add `(created_at DESC, id DESC)` for `status=all` only if the measured all-history query needs
      it.
- [ ] Choose an index creation/deployment method that avoids an unacceptable write lock; use a
      low-traffic maintenance window if the migration workflow cannot create it concurrently.
- [ ] Investigate a paginated security-definer RPC only if bounded queries remain materially
      expensive after filtering and indexing.

Any security-definer RPC must preserve the current scoped `can_access_game_action` behavior, use a
fixed safe `search_path`, derive or verify the acting user rather than trusting a caller-supplied
identity, revoke execution from `PUBLIC`, `anon`, and `authenticated`, and remain callable only from
the trusted server path. Add permission tests before adopting it.

**Target:** List queries avoid full-table sorts and write zero temporary blocks for representative
50-row pages.

## Phase 4 — Validate and deploy

- [ ] Add API tests for the `pending` default, invalid statuses, page-limit bounds, malformed and
      filter-mismatched cursors, entity-type and action-ID validation, exact-ID filter independence,
      detail permissions, and scoped row visibility.
- [ ] Test cursor boundaries where multiple rows share `created_at`, including an insertion between
      consecutive page requests. Guarantee no duplicates or omissions for rows whose sort key and
      filter membership remain unchanged; separately test concurrent status transitions as expected
      membership changes.
- [ ] Add UI tests confirming inactive tabs do not fetch actions, status changes use a new SWR key,
      the pending badge does not trigger an eager count, entity/status/action-ID filter changes reset
      pagination, and one expansion performs no more than one detail request.
- [ ] Run lint, type-check, and relevant Jest tests.
- [ ] Deploy any additive index first, then the compatible API/UI change during a low-traffic period.
      If rollback is needed, revert the application and leave harmless indexes in place until the
      observation window ends.
- [ ] Retain the existing statistics baseline rather than resetting it.
- [ ] Snapshot/delta every replacement query shape in `pg_stat_statements` and compare call count,
      mean duration, rows, and temporary blocks per call against the same-duration baseline window.
      Calculate p95 from the structured endpoint timing events. Compare instance CPU and Disk IO
      separately as supporting signals normalized by total request volume.
- [ ] Observe production for seven days, including at least one normal moderation period, before
      declaring the remediation complete.
- [ ] After the observation window, summarize Phase 3B/4 results in the handoff, archive this plan
      and its handoff under `docs/archive/completed/`, and delete the measurement harness only if it
      has no continuing operational owner.

### Success criteria

- Structured endpoint-timing p95 below 200 ms for each representative 50-row list shape.
- Zero temporary blocks written by representative action-list queries.
- No action-list or detail requests while the actions tab is inactive.
- No duplicate or omitted rows with unchanged sort keys and filter membership across cursor
  boundaries, including equal timestamps; concurrent status changes behave according to the active
  filter.
- CPU remains below the numeric alert threshold recorded with the baseline throughout the
  observation window.
- Instance Disk IO does not exceed the baseline by more than 10% after normalization for total
  request volume; use query-level temporary blocks, not instance Disk IO, for direct attribution to
  the action list.

## Deferred, measurement-gated follow-ups

These items do not block the action-list remediation and should receive separate plans only if
post-rollout measurements show that they materially contribute to CPU or Disk IO:

- Batch recipient lookup for multiple game-data actions. The current per-action RPC fan-out is a
  plausible optimization target, but it needs a set-based recipient contract and equivalent scoped
  permission behavior.
- Reduce per-recipient notification database work. Any batching design must preserve deduplication,
  automatic-notification suppression, block checks, email preferences, and email delivery behavior;
  batching notification inserts alone is not equivalent.
- Review article view-count aggregation or throttling independently, with its own baseline and
  success criteria.
