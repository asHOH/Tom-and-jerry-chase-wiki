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

## Relation replacements split across rows

Submission and approval share the freshness and character validators, but submission checks the
whole proposed request while approval also checks a row at its historical replay position. Replay
orders rows by `created_at, id`; `publish_operation_ordinal` does not override that order. Rows from
one request can share a timestamp, so a mutual-relation addition can sort before its required
one-way-relation removals even after those removals are approved.

Publish preparation keeps dependent character relation edits in one atomic row. Complete
character-relation arrays are grouped by connected source/target characters; non-character
relations are grouped by their owning character and target domain (cards, special skills, maps or
modes). Provably independent groups remain separately reviewable. Root replacements, missing
collection snapshots and other ambiguous dependencies are grouped conservatively. Faction changes
stay together with character-relation edits because existing edges may be absent from the request.
This prevents future split replacements; it does not
regroup stored rows or increase the per-row action limit.

For an existing split replacement, inspect all rows in the original publish operation and replay
both the current state and the historical insertion state. If the removals are already approved
and the remaining addition passes against the current state, recover it as a new pending/private
submission after those removals, preserving attribution and linking the original. Follow the
refetch, validation, idempotency, verification and retirement safeguards above. The text-edit
preparation command does not prepare relation repairs; these require individual review. Never
rewrite timestamps or weaken approval validation to force an old row through.
