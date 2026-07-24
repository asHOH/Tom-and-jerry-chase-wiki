import { readFileSync } from 'node:fs';

const schemaMigration = readFileSync(
  'supabase/migrations/20260724000001_create_blocks.sql',
  'utf8'
);
const writeBoundaryMigration = readFileSync(
  'supabase/migrations/20260724000002_add_prepared_block_write_rpcs.sql',
  'utf8'
);

describe('block migrations', () => {
  it('stores account, IP and CIDR blocks with restrictions and immutable history', () => {
    expect(schemaMigration).toContain('CREATE TABLE public.blocks');
    expect(schemaMigration).toContain('target_cidr cidr');
    expect(schemaMigration).toContain('CREATE TABLE public.block_restrictions');
    expect(schemaMigration).toContain('UNIQUE NULLS NOT DISTINCT');
    expect(schemaMigration).toContain('CREATE TABLE public.block_log');
    expect(schemaMigration).toContain('block_log_immutable');
    expect(schemaMigration).toContain('p_ip <<= b.target_cidr');
    expect(schemaMigration).toContain('b.expires_at IS NULL OR b.expires_at > now()');
    expect(schemaMigration).toContain('b.is_autoblock DESC');
  });

  it('keeps mutation RPCs behind the service-role write boundary', () => {
    expect(writeBoundaryMigration).toContain(
      'CREATE OR REPLACE FUNCTION public.prepared_create_article'
    );
    expect(writeBoundaryMigration).toContain(
      'CREATE OR REPLACE FUNCTION public.prepared_create_comment'
    );
    expect(writeBoundaryMigration).toContain(
      'CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions'
    );
    expect(writeBoundaryMigration).toMatch(
      /REVOKE INSERT, UPDATE, DELETE[\s\S]+public\.articles, public\.article_versions, public\.comments, public\.categories/
    );
    expect(writeBoundaryMigration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.prepared_create_article[\s\S]+TO service_role/
    );
    expect(writeBoundaryMigration).toMatch(
      /REVOKE ALL ON FUNCTION public\.reject_game_data_action[\s\S]+FROM PUBLIC, anon, authenticated/
    );
  });
});
