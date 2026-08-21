import { readFileSync } from 'node:fs';

const migrationPath =
  'supabase/migrations/20260821000000_add_game_data_character_contributor_source.sql';
const migration = readFileSync(migrationPath, 'utf8');

describe('character contributor source migration', () => {
  it('exposes one hardened no-argument JSON RPC to public read roles', () => {
    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION public.read_game_data_character_contributor_source()'
    );
    expect(migration).toMatch(
      /read_game_data_character_contributor_source\(\)[\s\S]*?RETURNS jsonb[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public/
    );
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.read_game_data_character_contributor_source()'
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.read_game_data_character_contributor_source()'
    );
    expect(migration).toContain('TO anon, authenticated;');
  });

  it('keeps raw-entry normalization internal and ungranted', () => {
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.game_data_character_ids_from_entry(jsonb)'
    );
    expect(migration).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.game_data_character_ids_from_entry/
    );
  });

  it('returns only the derived contributor projection', () => {
    const publicFunction = migration.match(
      /CREATE OR REPLACE FUNCTION public\.read_game_data_character_contributor_source\(\)([\s\S]*?)REVOKE ALL ON FUNCTION public\.read_game_data_character_contributor_source\(\)/
    )?.[1];
    expect(publicFunction).toBeDefined();
    expect(publicFunction).toContain("'sourceActionCount'");
    expect(publicFunction).toContain("'rowCount'");
    expect(publicFunction).toContain("'rows'");
    expect(publicFunction).toContain("'characterId'");
    expect(publicFunction).toContain("'contributorId'");
    expect(publicFunction).toContain("'nickname'");
    expect(publicFunction).toContain("'contributionCount'");
    expect(publicFunction).not.toMatch(/jsonb_build_object\([\s\S]*?'entry'/);
    expect(publicFunction).not.toMatch(/jsonb_build_object\([\s\S]*?'actionId'/);
  });
});
