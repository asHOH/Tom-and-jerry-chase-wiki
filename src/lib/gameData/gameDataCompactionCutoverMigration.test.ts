import { readFileSync } from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260828000000_add_atomic_game_data_compaction_cutover.sql'
);

describe('atomic game-data compaction cutover migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('locks and compares the approved replay epoch before touching exact rows', () => {
    expect(migration).toContain('prepared_mark_game_data_actions_synced_batch');
    expect(migration).toMatch(
      /game_data_approved_replay_epoch[\s\S]*?FOR UPDATE[\s\S]*?approved_replay_epoch_conflict/u
    );
    expect(migration).toContain("RAISE EXCEPTION 'approved_action_batch_changed'");
  });

  it('uses one set-based update and preserves per-row trigger advancement', () => {
    expect(migration.match(/UPDATE public\.game_data_actions AS action/gu)).toHaveLength(1);
    expect(migration).toContain('p_expected_replay_epoch + requested_count');
    expect(migration).not.toContain('CREATE TRIGGER');
    expect(migration).not.toContain('DISABLE TRIGGER');
  });

  it('keeps the batch RPC service-role-only and checks actor permission per row', () => {
    expect(migration).toContain("'game_data_action.mark_synced'");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.prepared_mark_game_data_actions_synced_batch\([\s\S]*?FROM PUBLIC, anon, authenticated/u
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_mark_game_data_actions_synced_batch\([\s\S]*?TO service_role/u
    );
  });
});
