import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260718000000_add_approved_replay_epoch.sql';

describe('approved replay epoch migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('advances the singleton epoch for every approved replay-set mutation', () => {
    expect(migration).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.game_data_actions');
    expect(migration).toContain("OLD.status = 'approved'");
    expect(migration).toContain("NEW.status = 'approved'");
    expect(migration).toContain('OLD.entity_type');
    expect(migration).toContain('OLD.entry');
    expect(migration).toContain('OLD.created_at');
    expect(migration).toContain('SET epoch = epoch + 1');
  });

  it('returns epoch and rows in semantic order from one service-role-only RPC', () => {
    expect(migration).toContain('read_game_data_approved_replay_snapshot()');
    expect(migration).toContain('RETURNS TABLE(replay_epoch bigint, action_rows jsonb)');
    expect(migration).toContain('ORDER BY action.created_at ASC, action.id ASC');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.read_game_data_approved_replay_snapshot() FROM PUBLIC, anon, authenticated'
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.read_game_data_approved_replay_snapshot() TO service_role'
    );
  });

  it('does not revoke legacy RPC access before the application cutover', () => {
    expect(migration).not.toMatch(/REVOKE.+publish_game_data_actions/is);
    expect(migration).not.toMatch(/REVOKE.+approve_game_data_action/is);
  });
});
