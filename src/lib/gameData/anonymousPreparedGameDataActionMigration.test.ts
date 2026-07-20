import { readFileSync } from 'fs';

const migrationPath =
  'supabase/migrations/20260720000001_add_anonymous_prepared_game_data_publish.sql';

describe('anonymous game data action publish migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('keeps anonymous publishing service-role-only and pending-only', () => {
    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION public.prepared_publish_anonymous_game_data_actions('
    );
    expect(migration).toContain("'pending', false, NULL");
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.prepared_publish_anonymous_game_data_actions('
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.prepared_publish_anonymous_game_data_actions('
    );
    expect(migration).toContain('TO service_role');
  });

  it('locks the replay epoch before inserting anonymous rows', () => {
    expect(migration).toContain('WHERE singleton = true\n  FOR UPDATE;');
    expect(migration).toContain('p_expected_replay_epoch');
    expect(migration).toContain('approved_replay_epoch_conflict');
  });
});
