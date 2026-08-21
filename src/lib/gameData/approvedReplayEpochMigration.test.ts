import { readFileSync } from 'node:fs';

const triggerMigration = readFileSync(
  'supabase/migrations/20260718000000_add_approved_replay_epoch.sql',
  'utf8'
);
const publicReaderMigration = readFileSync(
  'supabase/migrations/20260821120000_add_public_approved_replay_epoch_reader.sql',
  'utf8'
);

describe('approved replay epoch migration', () => {
  it('advances the singleton epoch for every approved replay-set mutation', () => {
    expect(triggerMigration).toContain(
      'AFTER INSERT OR UPDATE OR DELETE ON public.game_data_actions'
    );
    expect(triggerMigration).toContain("OLD.status = 'approved'");
    expect(triggerMigration).toContain("NEW.status = 'approved'");
    expect(triggerMigration).toContain('OLD.entity_type');
    expect(triggerMigration).toContain('OLD.entry');
    expect(triggerMigration).toContain('OLD.created_at');
    expect(triggerMigration).toContain('SET epoch = epoch + 1');
  });

  it('returns epoch and rows in semantic order from one service-role-only RPC', () => {
    expect(triggerMigration).toContain('read_game_data_approved_replay_snapshot()');
    expect(triggerMigration).toContain('RETURNS TABLE(replay_epoch bigint, action_rows jsonb)');
    expect(triggerMigration).toContain('ORDER BY action.created_at ASC, action.id ASC');
    expect(triggerMigration).toContain(
      'REVOKE ALL ON FUNCTION public.read_game_data_approved_replay_snapshot() FROM PUBLIC, anon, authenticated'
    );
    expect(triggerMigration).toContain(
      'GRANT EXECUTE ON FUNCTION public.read_game_data_approved_replay_snapshot() TO service_role'
    );
  });

  it('does not revoke legacy RPC access before the application cutover', () => {
    expect(triggerMigration).not.toMatch(/REVOKE.+publish_game_data_actions/is);
    expect(triggerMigration).not.toMatch(/REVOKE.+approve_game_data_action/is);
  });
});

describe('public approved replay epoch migration', () => {
  it('exposes only a hardened no-argument scalar RPC', () => {
    expect(publicReaderMigration).toMatch(
      /read_game_data_approved_replay_epoch\(\)[\s\S]*?RETURNS bigint[\s\S]*?LANGUAGE sql[\s\S]*?STABLE[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public/
    );
    expect(publicReaderMigration).toContain(
      'REVOKE ALL ON FUNCTION public.read_game_data_approved_replay_epoch() FROM PUBLIC, anon, authenticated;'
    );
    expect(publicReaderMigration).toContain(
      'GRANT EXECUTE ON FUNCTION public.read_game_data_approved_replay_epoch() TO anon, authenticated;'
    );
  });

  it('returns only the singleton epoch field', () => {
    const body = publicReaderMigration.match(/AS \$\$([\s\S]*?)\$\$;/)?.[1];
    expect(body).toContain('SELECT epoch');
    expect(body).toContain('WHERE singleton = true');
    expect(body).not.toMatch(/game_data_actions|profiles|entry|created_by/);
  });
});
