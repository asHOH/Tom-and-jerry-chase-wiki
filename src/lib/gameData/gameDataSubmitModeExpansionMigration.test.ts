import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260726000002_expand_game_data_submit_modes.sql';

describe('game data submit mode expansion migration', () => {
  const migration = readFileSync(migrationPath, 'utf8').replace(/\r\n/g, '\n');

  it('replaces the boolean force_pending RPC argument with a text submit mode on both overloads', () => {
    expect(migration).toContain("p_submit_mode text DEFAULT 'default'");
    expect(
      migration.match(/CREATE OR REPLACE FUNCTION public\.prepared_publish_game_data_actions\(/g)
    ).toHaveLength(2);
    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(\n  uuid,\n  text,\n  text,\n  jsonb,\n  text,\n  bigint,\n  boolean\n);'
    );
    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(\n  uuid,\n  text,\n  text,\n  jsonb,\n  text,\n  bigint,\n  inet,\n  boolean\n);'
    );
  });

  it('adds a public-pending submit branch while preserving default approved behavior', () => {
    expect(migration).toContain("'default', 'force_public_pending', 'force_pending'");
    expect(migration).toContain("WHEN p_submit_mode = 'force_pending' THEN false");
    expect(migration).toContain(
      "WHEN p_submit_mode IN ('force_public_pending', 'force_pending') THEN 'pending'"
    );
    expect(migration).toContain(
      "WHEN p_submit_mode = 'default' AND can_auto_publish AND can_self_review THEN p_actor_id"
    );
  });

  it('keeps the wrapper overload and grants aligned with the text submit mode signature', () => {
    expect(migration).toContain('p_submit_mode\n  );');
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.prepared_publish_game_data_actions\([\s\S]*?bigint,\n  text[\s\S]*?\) FROM PUBLIC, anon, authenticated/
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_publish_game_data_actions\([\s\S]*?bigint,\n  inet,\n  text[\s\S]*?\) TO service_role/
    );
  });
});
