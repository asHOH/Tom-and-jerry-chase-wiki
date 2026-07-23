# Game-Data Rollout Handoff

Updated: 2026-07-23

This is the operational handoff for the
[public-action semantic-ordering plan](./2026-07-17-public-action-semantic-ordering-plan.md). The
[direct array-index dependency plan](./2026-07-23-direct-array-index-set-dependency-plan.md) is the
immediate application-only correctness track. The
[editable store-loading plan](./2026-07-16-editable-game-data-store-loading-plan.md) remains the
larger follow-on architecture track; avoid starting it until the rollout gates below are
deliberately closed or reprioritized.

## Current state

- The last independently verified production build is `f02945c1`
  (`2026-07-22T19:32:58+08:00`), confirmed twice through cache-bypassed `/api/version/` requests.
  The health endpoint returned HTTP 200 with `status: ok`.
- Step 5A is deployed: the replay epoch, prepared RPCs, and application route cutovers are live.
- Step 5B is repository-complete but not deployed. Commit `2b2b0792` retimestamped only the unchanged
  revoke migration to
  `20260722000000_revoke_legacy_game_data_action_mutations.sql` and added duplicate-version CI
  coverage.
- Successful normal-route prepared persistence is attributed. Application fix `f02945c1` is
  deployed and version-verified, multiple users confirmed successful normal-website submissions,
  and aggregate database metadata matches the replay-epoch movement exactly.
- Several users reported successful submissions after that deployment. Aggregate metadata shows the
  replay epoch advancing from `23` to `41`, exactly matching 18 new approved public rows; 3
  additional pending rows correctly did not advance it. The deployed route has no legacy
  persistence fallback, so no user-specific time window or returned IDs are required for
  attribution.
- A later `dependent_rows` rejection for two direct assignments beneath distinct numeric array
  siblings is a separate server dependency-classification false positive. Its bounded correction is
  planned in the direct array-index dependency plan and does not invalidate the successful prepared
  persistence evidence or require reverting the earlier squashing fixes.
- The anonymous prepared-publish migration's previously missing history row is reconciled. After a
  complete catalog comparison passed, approved history-only repair recorded `20260720000001` as
  applied; its SQL was not re-executed.
- Browser-role access to legacy publish/approve and direct-update paths was closed in Step 5C on
  2026-07-23. The revoke, its ledger entry, and the post-revoke Step 5E audit are verified.
- The latest tracked audit report was produced on 2026-07-18 from audit implementation commit
  `6ceb4b61`. It covered 65 approved, 1,125 synced, and 8 pending rows and produced fingerprint
  `audit-5f5edd03a58d14551689864053655cb59a945e0c53d1965fa9eb9c9997b370dc`. A later
  97-approved-row result was observed but not retained as reproducible evidence and is not a gate.

## Incident fixes

- The earlier `dependent_rows` repair in `c07b4a14` fixes scalar object-property delete/set
  squashing while retaining conservative array handling. It does not cover a numeric array-child
  write followed by replacement of the whole parent array.
- The post-deployment `dependent_rows` reproduction creates `knowledgeCardGroups.5` and then replaces
  `knowledgeCardGroups`. Scratch replay reused container action payloads, allowing inverse replay to
  mutate history, and structural-array normalization excluded the direct parent assignment. Commit
  `f02945c1` clones scratch-replay payloads and safely normalizes the mixed child/parent history to
  one parent-array set or no action. It passed lint, type-check, 58 focused tests, and the complete
  1,047-test suite and is deployed and version-verified in production.
- `candidate_conflict`: checked replay installed frozen container values into a mutable tree. Commit
  `bf71c68e` clones them before assignment and includes the parent-then-descendant regression test.
- Commits `c07b4a14`, `bf71c68e`, and `f02945c1` are in the verified production build. Multiple
  normal-route submissions have been reported successful and aggregate persistence metadata is
  consistent; the successful-persistence gate is complete.
- Genuine order-dependent submissions must still be rejected; do not weaken the Stage A safety
  check or enable dependency grouping early. The direct-index plan permits only a proven pairwise
  exception for paths entering distinct canonical numeric siblings.

## Migration safety

Do **not** run a normal or unreviewed `supabase db push` against production. The production and local
migration ledgers remain divergent.

Production-only versions:

- `20260404195434`
- `20260404200234`
- `20260615134211`
- `20260615142649`

Repository-only versions at the last read-only check:

- `20260501000000`
- `20260615000000`
- `20260615000001`
- `20260715000001`
- `20260715000002`
- `20260720000000`
- `20260722000000`

Important details:

- The former duplicate `20260720000000` version is resolved locally. Inheritance remains
  `20260720000000`; the later revoke is `20260722000000`. The revoke was applied manually and
  recorded in the production ledger on 2026-07-23; inheritance remains repository-only.
- The live database contains
  `prepared_publish_anonymous_game_data_actions(text,jsonb,bigint,text)`. `service_role` can execute
  it; `anon` and `authenticated` cannot. Its repository migration version `20260720000001` is now
  recorded in the production ledger.
- A catalog-only comparison at `2026-07-22T04:14:13Z` confirmed that the complete live definition,
  normalized function-body hash, attributes, owner, and execution privileges match migration
  `20260720000001`. The evidence is recorded in the
  [live-comparison report](./reports/2026-07-22-anonymous-prepared-publish-live-comparison.md).
  Approved history-only repair then recorded the version as applied at `2026-07-22T04:17:08Z`, and
  the migration list verified it on both sides. Its SQL was not re-executed.
- Reconcile every other ledger difference deliberately before returning to push-based deployment.
- A clean local `supabase db reset --local` is deferred because the pinned Postgres Docker image did
  not finish downloading. No local database container or migration ran. Retrying in CI, on another
  machine, or after the image is available is useful but is not a blocker for the retimestamp-only
  fix.

## Remaining rollout gates

| Gate | State    | Requirement                                                                                                       |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| 5A   | Complete | Replay epoch, prepared RPCs, and route cutovers are live.                                                         |
| 5B   | Complete | Revoke migration is uniquely versioned and tested.                                                                |
| 5C   | Complete | The reviewed revoke was manually deployed after fresh preflight and recorded in the production ledger.            |
| 5D   | Complete | Non-mutating catalog probes confirmed browser-role denial and unchanged intended service-role/read/reject access. |
| 5E   | Complete | The post-revoke approved/synced/pending read-only audit passed and is recorded.                                   |

## Readiness for the security-closure lane

### Successful prepared-persistence attribution

Complete. Multiple users confirmed successful normal-website submissions after `f02945c1` was
deployed. The route calls prepared persistence without a legacy fallback, and post-baseline database
metadata shows 18 approved public rows with an exact `23` to `41` replay-epoch increase plus 3
pending rows that correctly did not advance it. This combination attributes successful prepared
persistence without retaining user identity, payload, a user-specific timestamp, or returned IDs.

### Step 5C execution

Complete. With explicit production approval, the manually applied revoke passed a fresh preflight
at `2026-07-23T15:19:22Z`, transactional deployment at `2026-07-23T15:19:48Z`, post-deployment
catalog verification at `2026-07-23T15:20:14Z`, and migration-ledger repair. Step 5D's frozen,
non-mutating role-context checks passed at `2026-07-23T15:21:11Z`. The full sanitized evidence is
in the [Step 5C execution evidence report](./reports/2026-07-23-game-data-step-5c-execution-evidence.md).

Step 5E is complete. The post-revoke audit retained fingerprint
`audit-f0429897bfb2022d8095508c61791e487de723ff6b6cd0db72387f5d669db246` and sanitized cohorts
of 182 approved, 1,125 synced, and 5 pending rows. Its only nonzero finding was the previously
dispositioned 27 synced atomic multi-action history rows; no detail query or repair was needed.
See the [post-revoke audit report](./reports/2026-07-23-post-revoke-public-action-replay-audit-result.md).

### Why Step 5C requires explicit approval

Step 5C is a production authorization-boundary mutation. It immediately revokes browser execution
of the legacy publish and approval functions, revokes authenticated table update, and drops the
legacy update policy. It does not delete or rewrite game-data rows, and the runbook wraps the change
in a transaction with a defined compensating rollback.

The material risk is availability and authorization: an unexpected remaining legacy dependency or
incorrect privilege baseline could prevent legitimate publishing or moderation. Rolling back would
restore service but deliberately reopen the security bypass. Explicit approval confirms acceptance
of that tradeoff, names who may execute and decide rollback, and prevents a security-sensitive
production change from being inferred from code deployment approval.

## Recommended work sequence

### Immediate security-closure lane

1. **Complete: successful prepared-path submission attribution is recorded** in the privacy-safe
   evidence report.
2. **Complete: Step 5C deployed only the reviewed `20260722000000` revoke** and recorded it after
   verification. Do not use normal `db push` while the ledgers diverge.
3. **Complete: Step 5D security probes** confirmed non-mutating browser-role denial and retained
   intended access.
4. **Complete: Step 5E's post-revoke audit passed** and its fingerprint/counts are retained.
5. **Reconcile the remaining migration ledger differences** before restoring normal migration
   deployment.

### Application and architecture lane

1. **Implement the direct array-index dependency plan.** Development and read-only validation may
   proceed while Step 5C approval or execution readiness is pending. It is application-only and
   does not authorize or depend on a database migration.
2. **After Steps 5C-5E close, resume the editable-store plan** at Phase 0 verification and the parent
   Phase 1 implementation.
3. **Complete editable-store Phases 0-4 in order.** Dependency grouping remains disabled until Phase
   4 removes root-client replay and its production exit checks pass.
4. **Implement semantic-ordering Stage B grouping** after the Phase 4 gate is released.
5. **Complete editable-store Phase 5 and final audits**, then close or archive the active plans and
   this rollout handoff.

## Remaining work after rollout closure

- Implement and validate the direct array-index dependency plan without enabling Stage B grouping.
- Retry the optional clean local Supabase reset in CI or where the pinned image is available.
- Continue read-only comparison and disposition planning for the remaining migration-ledger
  differences. Do not repair or apply another production migration without separate review and
  approval.
- Resume the editable-store plan at Phase 0 verification and the parent Phase 1 implementation.

## Useful locations

- `src/lib/gameData/trustedGameDataMutations.ts`: prepared mutation boundary
- `src/lib/gameData/publishPreparation.ts`: dependency detection
- `docs/2026-07-23-direct-array-index-set-dependency-plan.md`: bounded classifier correction for
  distinct canonical numeric siblings
- `src/lib/edit/actionSquash.ts`: scalar-property and mixed array-child/parent squashing fixes
- `src/lib/gameData/checkedActionReplay.ts`: cloned-container replay fix
- `scripts/audit-game-data-actions.mjs`: production-connected read-only audit
- `docs/reports/2026-07-18-public-action-replay-audit-result.md`: latest tracked audit evidence
- `docs/reports/2026-07-22-anonymous-prepared-publish-live-comparison.md`: complete live-definition,
  privilege, and ledger comparison
- `docs/reports/2026-07-22-affected-user-resubmission-verification.md`: privacy-safe baseline and
  completed prepared-persistence attribution
- `docs/reports/2026-07-23-game-data-step-5c-execution-evidence.md`: completed Step 5C and Step 5D
  execution evidence
- `docs/reports/2026-07-23-post-revoke-public-action-replay-audit-result.md`: completed Step 5E
  post-revoke audit evidence
- `docs/2026-07-22-game-data-step-5c-runbook.md`: exact deployment, ledger, verification, and
  rollback procedure
- `src/lib/supabase/migrationVersions.test.ts`: duplicate migration-version guard
- `supabase/migrations/20260720000001_add_anonymous_prepared_game_data_publish.sql`: live object with
  reconciled ledger entry
- `supabase/migrations/20260722000000_revoke_legacy_game_data_action_mutations.sql`: reviewed revoke,
  pending production approval
