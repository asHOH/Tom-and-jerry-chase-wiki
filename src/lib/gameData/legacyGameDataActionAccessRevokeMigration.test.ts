import { readFileSync } from 'fs';

const migrationPath =
  'supabase/migrations/20260722000000_revoke_legacy_game_data_action_mutations.sql';

describe('legacy game data action access revoke migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it.each([
    'publish_game_data_actions\\(text, jsonb, text\\)',
    'approve_game_data_action\\(uuid\\)',
  ])('revokes browser execution of public.%s', (signature) => {
    expect(migration).toMatch(
      new RegExp(
        `REVOKE ALL ON FUNCTION public\\.${signature}\\s+FROM PUBLIC, anon, authenticated;`
      )
    );
  });

  it('removes the authenticated direct-update path', () => {
    expect(migration).toMatch(
      /REVOKE UPDATE ON TABLE public\.game_data_actions\s+FROM PUBLIC, anon, authenticated;/
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "RBAC game actions update" ON public.game_data_actions;'
    );
  });

  it('does not disturb reads, rejection, or prepared service-role RPCs', () => {
    expect(migration).not.toMatch(/REVOKE\s+SELECT/i);
    expect(migration).not.toMatch(/DROP POLICY[^;]+(?:select|view)/i);
    expect(migration).not.toMatch(/FUNCTION public\.reject_game_data_action/i);
    expect(migration).not.toMatch(/FUNCTION public\.prepared_/i);
  });

  it('contains no data mutation or function replacement', () => {
    expect(migration).not.toMatch(/^\s*(?:INSERT|UPDATE|DELETE)\s/im);
    expect(migration).not.toMatch(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/i);
    expect(migration).not.toMatch(/DROP\s+FUNCTION/i);
  });
});
