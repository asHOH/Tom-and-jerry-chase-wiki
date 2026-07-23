# Anonymous Prepared-Publish Live Comparison

## Run context

- Checked at: `2026-07-22T04:14:13Z`
- Production project: `gehfogfxgbkwwwcamogj`
- Repository migration:
  `supabase/migrations/20260720000001_add_anonymous_prepared_game_data_publish.sql`
- Migration SHA-256: `62F46FB4B76B3487A53BD61B6DF8C39208591E3E0D4B958C38C12B222571B080`
- Query scope: PostgreSQL function catalogs, role privileges, and the Supabase migration ledger only

The function was not invoked. No migration SQL, data mutation, privilege change, or migration repair
was executed.

## Comparison

| Contract                        | Live result                                                                                              | Outcome                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Identity                        | `prepared_publish_anonymous_game_data_actions(text,jsonb,bigint,text)`                                   | Match                                                             |
| Arguments                       | `p_entity_type text, p_entries jsonb, p_expected_replay_epoch bigint, p_message text DEFAULT NULL::text` | Match; PostgreSQL canonicalizes the default cast                  |
| Result                          | `TABLE(id uuid, is_public boolean, status game_data_action_status)`                                      | Match; `search_path=public` permits the unqualified rendered type |
| Function body                   | SHA-256 `441EBA4311021834914F5A8EFBD3AC6C22385035846F524629B0444EC77617EC`                               | Exact after line-ending normalization                             |
| Language                        | `plpgsql`                                                                                                | Match                                                             |
| Security                        | `SECURITY DEFINER`                                                                                       | Match                                                             |
| Configuration                   | `search_path=public`                                                                                     | Match                                                             |
| Owner                           | `postgres`                                                                                               | Expected production migration owner                               |
| Defaults                        | volatile, parallel unsafe, non-strict, non-leakproof, set-returning, one default argument                | Match                                                             |
| `PUBLIC` execute                | false                                                                                                    | Match                                                             |
| `anon` execute                  | false                                                                                                    | Match                                                             |
| `authenticated` execute         | false                                                                                                    | Match                                                             |
| `service_role` execute          | true                                                                                                     | Match                                                             |
| Ledger version `20260720000001` | absent                                                                                                   | Divergence confirmed                                              |

## Conclusion

The complete live function definition and execution privileges match the repository migration. The
schema object was already deployed and did not require re-execution.

## History reconciliation

With explicit operator approval, migration history was reconciled at `2026-07-22T04:17:08Z`:

```powershell
npx --yes supabase@2.109.1 migration repair 20260720000001 --status applied --linked
npx --yes supabase@2.109.1 migration list --linked
```

The repair reported version `20260720000001` as applied, and the subsequent list showed the version
on both the local and remote sides. `migration repair` changed history only; the migration SQL was
not executed. The catalog comparison above remains the evidence that the live schema matches the
repository migration.
