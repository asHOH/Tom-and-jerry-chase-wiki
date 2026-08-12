import type { Database } from '@/data/database.generated';
import { readLatestMigrationMatching } from '@/testUtils/latestMigration';

const { sql: migration } = readLatestMigrationMatching(
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.prepared_publish_game_data_actions\b/i
);

type PreparedPublishArgs =
  Database['public']['Functions']['prepared_publish_game_data_actions']['Args'];

describe('game data submit mode expansion migration', () => {
  it('defines a text submit mode on both overloads', () => {
    expect(migration).toContain("p_submit_mode text DEFAULT 'default'");
    expect(
      migration.match(/CREATE OR REPLACE FUNCTION public\.prepared_publish_game_data_actions\(/g)
    ).toHaveLength(2);
  });

  it('exposes the submit mode in the replayed database schema', () => {
    const args: PreparedPublishArgs = {
      p_actor_id: 'actor-id',
      p_entity_type: 'character',
      p_entries: [],
      p_expected_replay_epoch: 1,
      p_message: 'message',
      p_permission_key: 'game_data.character.update',
      p_submit_mode: 'force_pending',
    };

    expect(args.p_submit_mode).toBe('force_pending');
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
