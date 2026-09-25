# Recovering legacy pending text edits

Older indexed edits can lack the original array context required by current approval checks.
Recover a reviewed edit as a **new pending/private submission**, retaining the original contributor
and linking its original row. Do not bypass freshness checks or overwrite the original entry.

For a small cohort, use the read-only preparation command:

```powershell
node scripts/prepare-pending-game-data-recovery.mjs .tmp/recovery-request.json .tmp/recovery-plan.json
```

The ignored request contains `expectedSupabaseHost` and `rows`, each with an `id` and
`reviewedItems`. Supply identifying fields for **every** enclosing array item, for example:

```json
{
  "expectedSupabaseHost": "<project-ref>.supabase.co",
  "rows": [
    {
      "id": "<pending-row-uuid>",
      "reviewedItems": {
        "角色.skills.2": { "id": "角色-passive", "name": "技能名称" },
        "角色.skills.2.skillLevels.0": { "level": 1 }
      }
    }
  ]
}
```

Inspect the original text, intended item and current data before supplying these identities.
They are an operator's reviewed choice, not evidence of the original array order. Preparation
requires unchanged old text and creates whole-list replacements through the existing editor
normalizer. Structural edits and ambiguous targets need individual review.

For an authorized repair, keep the plan and execution receipts under ignored `.tmp/`:

1. Refetch each source and compare its complete entry, entity, contributor and pending/private state.
2. Refresh the approved replay snapshot and rerun freshness and candidate replay on the prepared
   replacements. If data changed, prepare and review a new plan; never substitute a new old value.
3. Submit through `prepared_publish_game_data_actions_request`, using the plan's stable
   `operationId`, the standard publish-operation fingerprint, the original `created_by` as
   `p_actor_id` (including anonymous `null`), and `p_submit_mode = 'force_pending'`. The RPC
   rechecks contributor permissions/blocks and the replay epoch. Preserve the original row/message.
4. Refetch the replacement and verify its exact entry, contributor and pending/private state.
   Only then retire the original using `prepared_reject_game_data_action` with an authorized
   moderator and a reason linking the replacement. Do not directly update the table or approve it.
5. Record original/replacement IDs and exact postconditions. This two-step repair is not atomic:
   after an interrupted publish, inspect the saved operation ID before retrying. Reuse the same
   operation ID and exact request, never create another replacement. If rejection failed, retry
   only that step after verifying both records. If either record was moderated, stop and inspect.

The preparation command never writes to Supabase. Do not commit plans, payloads or contributor IDs.
