# Game-Data Step 5C Production Runbook

This runbook applies only
`supabase/migrations/20260722000000_revoke_legacy_game_data_action_mutations.sql` to production while
the local and remote migration histories are divergent. It does not authorize deployment. Every
mutating step requires explicit production approval at execution time.

Project reference: `gehfogfxgbkwwwcamogj`

Expected migration SHA-256:
`CD275FACD1B2990E613261D188C1BCFA1F8B8465AE10303549E30CC89EE6213D`

## Stop conditions

Do not start if any of these conditions is true:

- successful normal-route prepared persistence has not been attributed;
- `20260720000001_add_anonymous_prepared_game_data_publish.sql` has not been compared with the
  complete live function definition and deliberately reconciled;
- `20260722000000` is already present in the remote ledger;
- the migration hash differs from the value above;
- the pre-deployment privilege or policy state differs from the recorded expected baseline;
- explicit production approval, an operator, or an agreed rollback decision-maker is absent; or
- another database migration is running.

Never use `supabase db push`, `supabase migration up --linked`, or `--include-all` for this operation.
Those commands are not single-migration selectors and may consider unrelated repository-only
versions.

## Production SQL helper

The commands below use the Supabase Management API's SQL endpoint. They read the access token from
the environment and do not print it. Define the helper once in the approved operator shell:

```powershell
$Step5cProjectRef = 'gehfogfxgbkwwwcamogj'

function Invoke-Step5cProductionSql {
  param([Parameter(Mandatory = $true)][string]$Query)

  if ([string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
    throw 'SUPABASE_ACCESS_TOKEN is required.'
  }

  $Step5cHeaders = @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
  $Step5cBody = @{ query = $Query } | ConvertTo-Json -Compress
  Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.supabase.com/v1/projects/$Step5cProjectRef/database/query" `
    -Headers $Step5cHeaders `
    -ContentType 'application/json' `
    -Body $Step5cBody
}
```

For every read-only preflight and verification query, use the dedicated read-only endpoint. Its
response represents one query result, so every query below is deliberately a single `SELECT`.

```powershell
function Invoke-Step5cReadOnlySql {
  param([Parameter(Mandatory = $true)][string]$Query)

  if ([string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
    throw 'SUPABASE_ACCESS_TOKEN is required.'
  }

  $Step5cHeaders = @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
  $Step5cBody = @{ query = $Query } | ConvertTo-Json -Compress
  Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.supabase.com/v1/projects/$Step5cProjectRef/database/query/read-only" `
    -Headers $Step5cHeaders `
    -ContentType 'application/json' `
    -Body $Step5cBody
}
```

## 1. Preflight and evidence capture

Confirm the file hash locally:

```powershell
$Step5cMigrationPath = Resolve-Path `
  'supabase/migrations/20260722000000_revoke_legacy_game_data_action_mutations.sql'
$Step5cExpectedHash = 'CD275FACD1B2990E613261D188C1BCFA1F8B8465AE10303549E30CC89EE6213D'
$Step5cActualHash = (Get-FileHash -Algorithm SHA256 $Step5cMigrationPath).Hash
if ($Step5cActualHash -ne $Step5cExpectedHash) {
  throw "Migration hash mismatch: $Step5cActualHash"
}
```

Run and retain the output of this single-statement, catalog-only query:

```powershell
$Step5cVerificationSql = @'
SELECT
  pg_catalog.has_function_privilege(
    'anon',
    'public.publish_game_data_actions(text,jsonb,text)',
    'EXECUTE'
  ) AS anon_legacy_publish,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.publish_game_data_actions(text,jsonb,text)',
    'EXECUTE'
  ) AS authenticated_legacy_publish,
  pg_catalog.has_function_privilege(
    'anon',
    'public.approve_game_data_action(uuid)',
    'EXECUTE'
  ) AS anon_legacy_approve,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.approve_game_data_action(uuid)',
    'EXECUTE'
  ) AS authenticated_legacy_approve,
  pg_catalog.has_table_privilege(
    'authenticated',
    'public.game_data_actions',
    'UPDATE'
  ) AS authenticated_table_update,
  pg_catalog.has_table_privilege(
    'authenticated',
    'public.game_data_actions',
    'SELECT'
  ) AS authenticated_table_select,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.reject_game_data_action(uuid,text)',
    'EXECUTE'
  ) AS authenticated_reject,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.prepared_publish_game_data_actions(uuid,text,text,jsonb,text,bigint)',
    'EXECUTE'
  ) AS service_prepared_publish,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.prepared_publish_anonymous_game_data_actions(text,jsonb,bigint,text)',
    'EXECUTE'
  ) AS service_prepared_anonymous_publish,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.prepared_approve_game_data_action(uuid,uuid,text,jsonb,bigint)',
    'EXECUTE'
  ) AS service_prepared_approve,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.prepared_mark_game_data_action_synced(uuid,uuid,text,jsonb,bigint)',
    'EXECUTE'
  ) AS service_prepared_mark_synced,
  (
    SELECT count(*)
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_data_actions'
      AND policyname = 'RBAC game actions update'
  ) AS update_policy_count,
  (
    SELECT pg_catalog.json_agg(version ORDER BY version)
    FROM supabase_migrations.schema_migrations
    WHERE version IN ('20260720000001', '20260722000000')
  ) AS relevant_migration_versions,
  (
    SELECT count(*)
    FROM pg_catalog.pg_stat_activity
    WHERE pid <> pg_catalog.pg_backend_pid()
      AND state <> 'idle'
      AND (
        query ILIKE '%supabase_migrations%'
        OR query ILIKE '%migration repair%'
      )
  ) AS detected_active_migration_sessions;
'@
$Step5cPreflight = Invoke-Step5cReadOnlySql -Query $Step5cVerificationSql
```

Before deployment, the four legacy function checks, authenticated table update, and update-policy
count must show the access that the revoke is intended to remove. The four prepared service-role
checks must be true. Record the authenticated select and rejection values so the post-deployment
check can prove they did not change. Require `relevant_migration_versions` to contain only
`20260720000001`, and require `detected_active_migration_sessions` to be `0`.

`detected_active_migration_sessions` is supporting evidence, not a complete concurrency guarantee.
Before deployment, the named operator must also confirm the scheduled maintenance window and that
no other operator or automation is running a database migration.

Also retain:

- the approval record and operator;
- UTC start time;
- `/api/version/` response; and
- `npx --yes supabase@2.109.1 migration list --linked` output.

## 2. Deploy only the revoke SQL

This step mutates production. Run it only after the stop conditions pass and approval is recorded:

```powershell
$Step5cMigrationSql = Get-Content -Raw -Encoding UTF8 $Step5cMigrationPath
$Step5cDeploymentSql = @"
BEGIN;
SET LOCAL lock_timeout = '5s';
$Step5cMigrationSql
COMMIT;
"@
Invoke-Step5cProductionSql -Query $Step5cDeploymentSql
```

The explicit transaction prevents a statement failure from leaving a partially applied revoke. Do
not append any other migration or ledger statement.

## 3. Verify before recording the ledger

Run `$Step5cVerificationSql` again through `Invoke-Step5cReadOnlySql`. Require:

- all four legacy function checks are false;
- `authenticated_table_update` is false;
- `update_policy_count` is `0`;
- all four prepared service-role checks remain true; and
- authenticated select and rejection values exactly match the preflight result;
- `relevant_migration_versions` still contains only `20260720000001`; and
- `detected_active_migration_sessions` is `0`.

These are catalog-only checks; do not invoke a mutation RPC as a probe. If verification fails, stop
without recording the migration as applied and use the approved rollback procedure below.

## 4. Record and verify migration history

Only after schema verification succeeds:

```powershell
npx --yes supabase@2.109.1 migration repair 20260722000000 --status applied --linked
npx --yes supabase@2.109.1 migration list --linked
```

Require exactly one remote `20260722000000` entry. `migration repair` changes migration history only;
it does not execute the migration SQL. If repair fails after the revoke was verified, do not rerun
the revoke. Preserve the deployed schema state and retry or investigate only the history-recording
step.

Record the UTC completion time, verification output, migration-list output, and operator. Then run
the separately approved Step 5D probes and Step 5E read-only audit.

## Step 5D probe contract

Freeze these non-mutating checks and retain their sanitized output in
`docs/reports/2026-07-23-game-data-step-5c-execution-evidence.md` before beginning Step 5C:

- browser-role denial: `anon` and `authenticated` have no execute privilege for the two legacy
  publish/approve functions, and `authenticated` has no direct `UPDATE` privilege;
- policy closure: `RBAC game actions update` has count `0`;
- intended access retained: all four prepared service-role functions remain executable, and the
  authenticated `SELECT` and `reject_game_data_action` privilege values match the preflight; and
- ledger closure: after history repair, both `20260720000001` and `20260722000000` appear exactly
  once in `supabase_migrations.schema_migrations` and in the linked migration list.

Use the same single-statement catalog query above for the first three checks. Do not invoke a
publish, approve, reject, or direct-update RPC as a probe: a catalog privilege result is sufficient
to establish denial without creating a production action.

## 5. Approved compensating rollback

Rollback restores browser mutation access and reopens the known bypass. Use it only for a material
production failure with explicit approval. It is a compensating rollback to the required browser
roles, not a point-in-time database restore.

Execute this SQL through `Invoke-Step5cProductionSql`:

```powershell
$Step5cRollbackSql = @'
BEGIN;
SET LOCAL lock_timeout = '5s';

GRANT EXECUTE ON FUNCTION public.publish_game_data_actions(text, jsonb, text)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.approve_game_data_action(uuid)
TO anon, authenticated;

GRANT UPDATE ON TABLE public.game_data_actions
TO authenticated;

DROP POLICY IF EXISTS "RBAC game actions update" ON public.game_data_actions;
CREATE POLICY "RBAC game actions update"
ON public.game_data_actions
FOR UPDATE
TO authenticated
USING (
  public.can_access_game_action(
    (SELECT auth.uid()),
    'game_data_action.approve',
    entity_type,
    entry
  ) OR
  public.can_access_game_action(
    (SELECT auth.uid()),
    'game_data_action.reject',
    entity_type,
    entry
  ) OR
  public.can_access_game_action(
    (SELECT auth.uid()),
    'game_data_action.mark_synced',
    entity_type,
    entry
  )
);

COMMIT;
'@
Invoke-Step5cProductionSql -Query $Step5cRollbackSql
```

Run `$Step5cVerificationSql` again. Require the legacy browser-role checks, authenticated update
grant, and single update policy to be restored; prepared checks must remain true; and read/rejection
values must still match the preflight result.

Only after rollback verification succeeds, remove the applied ledger record:

```powershell
npx --yes supabase@2.109.1 migration repair 20260722000000 --status reverted --linked
npx --yes supabase@2.109.1 migration list --linked
```

If the rollback SQL succeeds but history repair fails, do not rerun the rollback SQL. Repair only the
ledger. Do not use point-in-time recovery for this privilege-only change because it can discard
unrelated production writes.

## Evidence to retain

- approval, operator, and UTC start/completion times;
- migration file hash;
- `/api/version/` response;
- preflight and post-deployment catalog results;
- preflight and post-deployment migration lists;
- Management API success or sanitized error response; and
- rollback approval and verification, if rollback was required.

Do not retain access tokens, action values, submission bodies, messages, or user identity.
