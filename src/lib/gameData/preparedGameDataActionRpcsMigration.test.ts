import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260718000001_add_prepared_game_data_action_rpcs.sql';

describe('prepared game data action RPC migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it.each([
    'prepared_publish_game_data_actions',
    'prepared_approve_game_data_action',
    'prepared_mark_game_data_action_synced',
  ])('keeps %s service-role-only', (functionName) => {
    expect(migration).toMatch(
      new RegExp(
        `REVOKE ALL ON FUNCTION public\\.${functionName}\\([\\s\\S]*?\\) FROM PUBLIC, anon, authenticated`
      )
    );
    expect(migration).toMatch(
      new RegExp(
        `GRANT EXECUTE ON FUNCTION public\\.${functionName}\\([\\s\\S]*?\\) TO service_role`
      )
    );
  });

  it('locks and compares the approved replay epoch for every replay-set mutation', () => {
    expect(migration.match(/FOR UPDATE;/g)).toHaveLength(5);
    expect(migration.match(/approved_replay_epoch_conflict/g)).toHaveLength(3);
    expect(migration.match(/p_expected_replay_epoch/g)).toHaveLength(6);
  });

  it('repeats recursive actor permissions and exact raw-row comparisons', () => {
    expect(migration.match(/public\.can_access_game_action\(/g)).toHaveLength(4);
    expect(migration).toContain("p_permission_key = 'game_data_action.publish_relations'");
    expect(migration).toContain("'game_data_action.approve', current_type, current_entry");
    expect(migration).toContain("'game_data_action.mark_synced', current_type, current_entry");
    expect(migration).toContain('current_entry IS DISTINCT FROM p_expected_entry');
    expect(migration).toContain('current_type IS DISTINCT FROM p_expected_entity_type');
  });

  it('does not revoke legacy browser execution before application cutover', () => {
    expect(migration).not.toMatch(
      /REVOKE.+ON FUNCTION public\.(?:publish_game_data_actions|approve_game_data_action)/is
    );
  });
});
