import { readFileSync } from 'fs';

const migrationPath = 'supabase/migrations/20260720000000_add_user_group_inheritance.sql';

describe('user group inheritance migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('links the built-in hierarchy by stable group IDs', () => {
    expect(migration).toContain("SET parent_group_id = '00000000-0000-4000-8000-000000000001'");
    expect(migration).toContain("SET parent_group_id = '00000000-0000-4000-8000-000000000002'");
    expect(migration).not.toContain('legacy_role');
    expect(migration).not.toContain('role_type');
    expect(migration).not.toContain('get_user_role');
  });

  it('resolves transitive groups in both established permission RPCs', () => {
    expect(migration.match(/WITH RECURSIVE effective_groups/g)).toHaveLength(2);
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.user_has_permission(');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_my_permission_grants()');
  });

  it('keeps old mutations and exposes separate inheritance-aware mutations', () => {
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION public.create_permission_group(');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION public.save_permission_group(');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.create_permission_group_v2(');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.save_permission_group_v2(');
  });

  it('serializes parent changes and rejects cycles and referenced-parent deletion', () => {
    expect(
      migration.match(/LOCK TABLE public\.user_groups IN SHARE ROW EXCLUSIVE MODE/g)
    ).toHaveLength(3);
    expect(migration).toContain('user_groups_parent_not_self');
    expect(migration).toContain("RAISE EXCEPTION 'group_inheritance_cycle'");
    expect(migration).toContain("RAISE EXCEPTION 'group_has_children'");
    expect(migration).toContain("RAISE EXCEPTION 'protected_group'");
  });
});
