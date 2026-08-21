import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20260821130000_add_game_data_synced_history_source.sql',
  'utf8'
);

describe('synced-history source migration', () => {
  it('exposes one hardened public JSON RPC while keeping normalization private', () => {
    expect(migration).toMatch(
      /read_game_data_synced_history_source\(\)[\s\S]*?RETURNS jsonb[\s\S]*?STABLE[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public/
    );
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.read_game_data_synced_history_source()'
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.read_game_data_synced_history_source()'
    );
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.game_data_history_actions_from_entry(jsonb)'
    );
    expect(migration).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.game_data_history_actions_from_entry/
    );
  });

  it('returns only synced op/path history metadata', () => {
    const body = migration.match(
      /CREATE OR REPLACE FUNCTION public\.read_game_data_synced_history_source\(\)([\s\S]*?)REVOKE ALL ON FUNCTION public\.read_game_data_synced_history_source\(\)/
    )?.[1];
    expect(body).toBeDefined();
    expect(body).toContain("action.status = 'synced'");
    expect(body).toContain("'entityType'");
    expect(body).toContain("'createdAt'");
    expect(body).toContain("'actions'");
    expect(body).toContain("'op'");
    expect(body).toContain("'path'");
    expect(body).not.toMatch(/jsonb_build_object\([\s\S]*?'entry'/);
    expect(body).not.toMatch(/jsonb_build_object\([\s\S]*?'actionId'/);
    expect(body).not.toMatch(/jsonb_build_object\([\s\S]*?'createdBy'/);
    expect(body).not.toMatch(/jsonb_build_object\([\s\S]*?'newValue'/);
  });
});
