import { readLatestMigrationMatching } from '@/testUtils/latestMigration';

const { filename, sql: migration } = readLatestMigrationMatching(
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.prepared_publish_game_data_actions_request\b/i
);
const { filename: privilegeFilename, sql: privilegeMigration } = readLatestMigrationMatching(
  /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.game_data_action_publish_operations\s+FROM\s+service_role;/i
);

describe('game data publish idempotency migration', () => {
  it('adds a durable operation key and stable row ordinals without content uniqueness', () => {
    expect(filename).toBe('20260903000000_add_game_data_publish_idempotency.sql');
    expect(migration).toContain('operation_id uuid PRIMARY KEY');
    expect(migration).toContain('request_fingerprint text NOT NULL');
    expect(migration).toContain('publish_operation_id uuid');
    expect(migration).toContain('publish_operation_ordinal integer');
    expect(migration).toContain('publish_operation_initial_status');
    expect(migration).toContain('publish_operation_initial_public');
    expect(migration).toContain('UNIQUE INDEX game_data_actions_publish_operation_ordinal_idx');
    expect(migration).toContain(
      'GRANT SELECT ON TABLE public.game_data_action_publish_operations TO service_role;'
    );
    expect(migration).not.toContain('game_data_actions_publish_operation_pair_check');
    expect(migration).not.toContain('game_data_actions_publish_operation_id_idx');
    expect(migration).toMatch(
      /publish_operation_id IS NULL\s+AND publish_operation_ordinal IS NULL\s+AND publish_operation_initial_status IS NULL\s+AND publish_operation_initial_public IS NULL[\s\S]*?publish_operation_id IS NOT NULL\s+AND publish_operation_ordinal IS NOT NULL\s+AND publish_operation_initial_status IS NOT NULL\s+AND publish_operation_initial_public IS NOT NULL/i
    );
    expect(migration).not.toMatch(/UNIQUE\s*\([^)]*entity_type[^)]*entry/is);
  });

  it('replays an existing operation before replay-epoch checks and rejects key reuse', () => {
    expect(migration).toContain('ON CONFLICT (operation_id) DO NOTHING');
    expect(migration).toContain("RAISE EXCEPTION 'idempotency_key_reused'");
    expect(migration).toContain('ORDER BY action.publish_operation_ordinal');
    expect(migration).toContain('FOR UPDATE;');
    expect(migration).toContain('approved_replay_epoch_conflict');
  });

  it('commits all entity groups through one service-role-only RPC', () => {
    expect(migration).toContain('p_actions jsonb');
    expect(migration).toContain('jsonb_array_elements(p_actions)');
    expect(migration).toContain('publish_operation_id, publish_operation_ordinal');
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.prepared_publish_game_data_actions_request\([\s\S]*?FROM PUBLIC, anon, authenticated/
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_publish_game_data_actions_request\([\s\S]*?TO service_role/
    );
  });

  it('limits direct operation-table access to service-role reads', () => {
    expect(privilegeFilename).toBe(
      '20260903000001_restrict_game_data_publish_operation_privileges.sql'
    );
    expect(privilegeMigration).toMatch(
      /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.game_data_action_publish_operations\s+FROM\s+service_role;[\s\S]*GRANT\s+SELECT\s+ON\s+TABLE\s+public\.game_data_action_publish_operations\s+TO\s+service_role;/i
    );
  });
});
