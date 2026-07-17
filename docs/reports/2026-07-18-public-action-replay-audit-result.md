# Public-Action Replay Audit Result

## Run Context

- Date: 2026-07-18
- Audit implementation: commit `6ceb4b61` (`feat(game-data): add read-only three-cohort audit`)
- Data source: intended production Supabase project selected by the local production environment
- Summary command: `npm run --silent audit:game-data-actions`
- Detail command shape:
  `npm run --silent audit:game-data-actions -- --details=<cohort>:<category> --limit=25`
- Stable audit-run fingerprint:
  `audit-5f5edd03a58d14551689864053655cb59a945e0c53d1965fa9eb9c9997b370dc`

Two consecutive complete runs produced the same fingerprint before review. The final gate run after
review produced the same fingerprint as well. The audit made ordered `select` queries only; it did
not repair or mutate any row.

## Sanitized Summary

| Cohort   | Rows | Decoded actions | Malformed | Dependent clusters | Atomic multi-action | Replay failures | Unknown types | Known no-op |
| -------- | ---: | --------------: | --------: | -----------------: | ------------------: | --------------: | ------------: | ----------: |
| approved |   65 |              65 |         0 |                  0 |                   0 |               0 |             0 |           0 |
| synced   | 1125 |            1263 |         0 |                n/a |                  27 |             n/a |           n/a |         n/a |
| pending  |    8 |               8 |         0 |                  0 |                   0 |               0 |             0 |           0 |

- Stable decoder and checked-replay error counts were empty for every cohort.
- Approved replay compatibility passed.
- Pending replay output was not provisional.
- Synced rows were decoded for history shape only and never reached target resolution or dry replay.
- The 27 synced atomic multi-action rows were enumerated in two bounded detail pages of 25 and 2.
- Representative synced atomic row IDs from the capped summary were:
  `db88deff-ed1f-43e5-811e-a1ef6a653d25`,
  `b07fe320-0636-4903-be83-6e6d62d9e874`,
  `4cc9c022-7d90-4763-81f8-7b956f9ed5a2`,
  `b05d0f31-b042-410a-85fa-26ae012bfcd5`, and
  `6c97393f-97e9-4d2a-9af9-628f3f09ab1e`.

No action values, raw entries, author fields, timestamps, or unbounded row-ID lists are retained in
this result.

## Finding Review and Dispositions

No row-level disposition was required:

- there were no decode or checked-replay failures in any cohort;
- there were no approved or pending dependent candidate clusters; and
- there were no approved unknown-entity rows.

The only finding category was `synced / atomic_multi_action_row`. This is shape information, not a
failure. The evidence was the stored-row decoder result and the audit's type-enforced synced path.
The decision is to retain those rows as history only, perform no repair, and never replay them over
the checked-in baseline. Existing fixtures continue to prove that synced rows cannot reach target
resolution or checked replay.

## Live-Migration Gate

- [x] Approved malformed-row count is zero.
- [x] Approved checked-replay-failure count is zero.
- [x] There is no unresolved invariant failure.
- [x] There are no approved dependent candidate clusters requiring disposition.
- [x] There are no approved unknown-entity rows requiring compatibility disposition.
- [x] The sanitized command and result are reproducible across consecutive complete runs.

The audit gate passes. Live consumer migration may begin under this gate, but this result does not
perform that migration. The direct publish and approval RPC bypasses remain a separate security
boundary and must be closed before relying on server preparation for future rows or enabling
publish-time dependency grouping.
