import { readFileSync } from 'fs';

const migrationPath =
  'supabase/migrations/20260726000001_add_force_pending_game_data_submit_mode.sql';

describe('game data force-pending submit mode migration', () => {
  const migration = readFileSync(migrationPath, 'utf8').replace(/\r\n/g, '\n');

  it('adds p_force_pending to the prepared publish RPC and wrapper overload', () => {
    expect(migration).toContain('p_force_pending boolean DEFAULT false');
    expect(
      migration.match(/CREATE OR REPLACE FUNCTION public\.prepared_publish_game_data_actions\(/g)
    ).toHaveLength(2);
    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(\n  uuid,\n  text,\n  text,\n  jsonb,\n  text,\n  bigint\n);'
    );
    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(\n  uuid,\n  text,\n  text,\n  jsonb,\n  text,\n  bigint,\n  inet\n);'
    );
  });

  it('forces private pending rows when p_force_pending is true and preserves default auto behavior', () => {
    expect(migration).toContain('WHEN p_force_pending THEN false');
    expect(migration).toContain("WHEN p_force_pending THEN 'pending'");
    expect(migration).toContain(
      'CASE WHEN NOT p_force_pending AND can_auto_publish AND can_self_review THEN p_actor_id END'
    );
    expect(migration).toContain("WHEN can_auto_publish AND can_self_review THEN 'approved'");
  });

  it('keeps the new function signatures service-role-only', () => {
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.prepared_publish_game_data_actions\([\s\S]*?boolean[\s\S]*?\) FROM PUBLIC, anon, authenticated/
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_publish_game_data_actions\([\s\S]*?boolean[\s\S]*?\) TO service_role/
    );
  });
});
