# Supabase Migration Reconciliation

Status: production `tjwiki`, staging `tjwiki-test`, and the repository migration history are aligned.

## Scope and authorization

- Date: `2026-08-28` (`Asia/Shanghai`).
- Repository commit containing the adopted history and archive retirement migration: `22d811c9`.
- Supabase CLI: repository-pinned `2.115.0`.
- Production project: `tjwiki` (`gehfogfxgbkwwwcamogj`), accessed through the existing repository link.
- Staging project: `tjwiki-test` (`zzhaxwwnltctvojcsmaq`), accessed through `STAGING_DATABASE_URL` and the IPv4 session pooler.
- User authorization covered staging migration validation, production ledger repair, production migration application, and deletion of the unused production-only article-version archive subsystem.
- No credentials, access tokens, database passwords, or archived row contents are retained in this report.

## Diagnosed divergence

Production had six migrations whose SQL was represented locally under different timestamps:

| Production version | Canonical repository version |
| ------------------ | ---------------------------- |
| `20260615134211`   | `20260615000000`             |
| `20260615142649`   | `20260615000001`             |
| `20260806213926`   | `20260807000000`             |
| `20260821062911`   | `20260821000000`             |
| `20260821092025`   | `20260821120000`             |
| `20260821092034`   | `20260821130000`             |

Five remote statements matched their local counterpart apart from the migration-fetch statement separator. The two June migrations split the final function privileges differently but produced the same final definition and grants as the corresponding local pair.

Two production-only operational migrations were adopted into the repository under their original versions:

- `20260404195434_sync_20260330_game_data_actions.sql`
- `20260404200234_reject_single_action_74c170ff.sql`

Their four targeted production actions were already in the intended final states: three `synced` and one `rejected`.

## Ledger repair

The six noncanonical production timestamps above were marked `reverted` in migration history. The following 19 canonical repository versions were marked `applied` only after their material schema and data effects were confirmed live:

```text
20260501000000
20260615000000
20260615000001
20260715000001
20260720000000
20260724000000
20260724000001
20260724000002
20260725000000
20260726000000
20260726000001
20260726000002
20260730000000
20260802000000
20260805000000
20260807000000
20260821000000
20260821120000
20260821130000
```

`20260715000002_rename_permission_groups_to_user_groups.sql` was not repaired as already applied. A live probe showed its two display-metadata updates were missing, so it remained pending and was executed normally.

## Staging application and verification

The staging dry run listed exactly ten expected migrations. They were applied with the one-time `--include-all` option because the two adopted April versions precede staging's latest recorded migration:

```text
20260404195434
20260404200234
20260813000000
20260821000000
20260821073251
20260821073808
20260821120000
20260821130000
20260828000000
20260828201000
```

Post-application verification confirmed:

- the standard staging dry run returned `upToDate: true` with no pending migrations;
- the contributor, replay-epoch, synced-history, and atomic batch RPCs exist;
- `traits` is accepted by game-data permission resource validation;
- the retired article-version archive table, function, and trigger are absent.

## Production application and verification

After ledger repair, the production dry run with the one-time `--include-all` option listed exactly four genuinely pending migrations:

```text
20260715000002_rename_permission_groups_to_user_groups.sql
20260813000000_add_traits_game_data_resource.sql
20260828000000_add_atomic_game_data_compaction_cutover.sql
20260828201000_retire_article_versions_archive.sql
```

All four applied successfully. Post-application verification confirmed:

- the standard production dry run returned `upToDate: true` with no pending migrations;
- `group.manage` and `group.assign` now use the `用户组` category and corresponding `管理用户组` / `分配用户组` labels;
- `permission_resource_type_allowed('game_data_action.approve', 'traits')` returns `true`;
- `prepared_mark_game_data_actions_synced_batch` exists as a `SECURITY DEFINER` function and execution is restricted to `service_role`;
- `article_versions_archive`, `archive_article_versions_before_article_delete`, and `trg_archive_article_versions_before_delete` are absent.

The retired archive contained 11 rows. They were intentionally deleted with the table after confirming no current source reference or external schema dependency. Recovery would require a Supabase database backup; the audit did not retain row contents.

## Ongoing migration workflow

Production uses the repository link and the normal guarded sequence:

```bash
npm exec -- supabase migration list --linked
npm exec -- supabase db push --linked --dry-run
npm exec -- supabase db push --linked
```

Staging uses `STAGING_DATABASE_URL` and `--db-url`; do not relink the checkout. `--include-all` is no longer required for either target. If an operator or tool applies a remote migration, commit the same version and SQL locally immediately. Stop on any future local-only/remote-only divergence and reconcile it before another push.
