import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260724000000_add_game_data_action_revoke.sql';

describe('game data action revoke migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('adds the revoked status and scoped permission seed', () => {
    expect(migration).toContain(
      "ALTER TYPE public.game_data_action_status ADD VALUE IF NOT EXISTS 'revoked'"
    );
    expect(migration).toContain("'game_data_action.revoke', '游戏数据', '撤销已批准改动'");
    expect(migration).toContain("'00000000-0000-4000-8000-000000000002'::uuid");
    expect(migration).toContain("'00000000-0000-4000-8000-000000000003'::uuid");
  });

  it('keeps the prepared revoke RPC service-role-only', () => {
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.prepared_revoke_game_data_action\([\s\S]*?\) FROM PUBLIC, anon, authenticated/
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_revoke_game_data_action\([\s\S]*?\) TO service_role/
    );
  });

  it('checks the replay epoch, exact row, scoped permission, and revokes visibility', () => {
    expect(migration).toContain('approved_replay_epoch_conflict');
    expect(migration).toContain("status = 'approved' AND is_public = true");
    expect(migration).toContain('current_entry IS DISTINCT FROM p_expected_entry');
    expect(migration).toContain("'game_data_action.revoke', current_type, current_entry");
    expect(migration).toContain("SET status = 'revoked', is_public = false");
    expect(migration).toContain('reviewed_by = p_actor_id');
  });

  it('adds revoke permission to the authenticated action read policy', () => {
    expect(migration).toContain(
      "public.can_access_game_action((SELECT auth.uid()), 'game_data_action.revoke', entity_type, entry)"
    );
  });
});
