# Step 5C Execution Evidence

Status: Steps 5C, 5D, and 5E complete.

## Authorization and ownership

- Production approval: user authorization in this Codex task, including maintenance-window and
  no-concurrent-migration confirmation.
- Operator: Codex agent executing this task.
- Rollback decision-maker: the user in this Codex task.
- Evidence retention: this report; exclude access tokens, submission content, user identity, and raw action values.

## Preflight

- UTC start: `2026-07-23T15:19:22.5598350Z`.
- Canonical migration SHA-256: `CD275FACD1B2990E613261D188C1BCFA1F8B8465AE10303549E30CC89EE6213D`.
- Production version: `f02945c1` (`0.1.0-f02945c1`; build time
  `2026-07-22T19:32:58+08:00`).
- Linked migration list: `20260720000001` was local/remote; `20260722000000` was local-only;
  the previously documented unrelated ledger differences remained unchanged.
- Catalog baseline: all four legacy browser-role execution checks, authenticated direct update,
  authenticated select/reject, and all four prepared service-role execution checks were `true`;
  update-policy count was `1`; relevant migration versions were only `20260720000001`; detected
  active migration sessions were `0`.

## Revoke and post-deployment verification

- Transactional revoke completed at `2026-07-23T15:19:48.0966040Z`.
- Post-revoke catalog verification completed at `2026-07-23T15:20:14.3147724Z`: all four legacy
  browser-role execution checks and authenticated direct update were `false`; update-policy count
  was `0`; all four prepared service-role checks, authenticated select, and authenticated reject
  remained `true`; relevant migration versions were still only `20260720000001`; detected active
  migration sessions were `0`.

## Ledger and Step 5D closure

- `migration repair 20260722000000 --status applied --linked` succeeded, recording only
  `20260722000000`.
- The linked migration list confirms both `20260720000001` and `20260722000000` are local/remote.
- Step 5D non-mutating catalog probes completed at `2026-07-23T15:21:11.2773418Z`: browser-role
  publish/approve execution and authenticated direct update were denied; update-policy count was
  `0`; prepared service-role execution and authenticated read/reject remained available; both
  relevant ledger versions were present exactly once; detected active migration sessions were `0`.

## Rollback, if required

Record the failure condition, explicit rollback approval, compensating rollback result, verification output, and
ledger repair result. A rollback deliberately restores the legacy browser-access bypass.

## Step 5E post-revoke audit

The read-only three-cohort audit completed after Step 5D. It produced fingerprint
`audit-f0429897bfb2022d8095508c61791e487de723ff6b6cd0db72387f5d669db246` with 182 approved,
1,125 synced, and 5 pending rows. Approved replay compatibility passed and pending output was not
provisional. The 27 synced atomic multi-action history rows were already dispositioned as
non-replayed shape information. The cohort counts and fingerprint above are the retained sanitized
Step 5E audit evidence.
