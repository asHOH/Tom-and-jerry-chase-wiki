import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260725000000_game_data_auto_publish_review_split.sql';

describe('game data auto-publish review split migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('adds the auto-approve permission and seeds reviewer/coordinator groups', () => {
    expect(migration).toContain(
      "'game_data_action.auto_approve', '游戏数据', '自动公开自己的游戏数据改动'"
    );
    expect(migration).toContain("'00000000-0000-4000-8000-000000000002'::uuid");
    expect(migration).toContain("'00000000-0000-4000-8000-000000000003'::uuid");
  });

  it('backfills synced and other non-approved rows to private visibility', () => {
    expect(migration).toContain("WHERE status = 'synced' AND is_public = true");
    expect(migration).toContain(
      "WHERE status <> 'approved' AND status <> 'synced' AND is_public = true"
    );
  });

  it('splits auto-publish from self-review in both legacy and prepared publish RPCs', () => {
    expect(migration.match(/game_data_action\.auto_approve/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("WHEN can_auto_publish AND can_self_review THEN 'approved'");
    expect(migration).toContain('CASE WHEN can_auto_publish AND can_self_review THEN now() END');
    expect(migration).toContain("ELSE 'pending'");
  });

  it('moves replay membership to is_public and makes synced rows non-public', () => {
    expect(migration).toContain('old_member := OLD.is_public;');
    expect(migration).toContain('new_member := NEW.is_public;');
    expect(migration).toContain('WHERE action.is_public = true');
    expect(migration).toContain("status = 'synced',");
    expect(migration).toContain('is_public = false,');
  });

  it('allows revoking any public row and rejecting only private pending rows', () => {
    expect(migration).toContain(
      "WHERE id = p_action_id AND status = 'pending' AND is_public = false"
    );
    expect(migration).toContain('WHERE id = p_action_id AND is_public = true');
    expect(migration).toContain("'game_data_action.revoke', current_type, current_entry");
  });
});
