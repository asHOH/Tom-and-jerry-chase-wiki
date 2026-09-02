import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('game-data compaction cutover command', () => {
  const script = readFileSync(
    path.join(process.cwd(), 'scripts/cutover-game-data-compaction.mjs'),
    'utf8'
  );
  const verifier = readFileSync(
    path.join(process.cwd(), 'scripts/verify-game-data-compaction.mjs'),
    'utf8'
  );
  const lifecycle = readFileSync(
    path.join(process.cwd(), 'src/lib/gameData/compactionCutoverLifecycle.ts'),
    'utf8'
  );
  const packageJson = JSON.parse(
    readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  ) as { scripts?: Record<string, string> };

  it('is exposed as a dedicated command outside the read-only verifier', () => {
    expect(packageJson.scripts?.['cutover:game-data-compaction']).toBe(
      'node scripts/cutover-game-data-compaction.mjs'
    );
    expect(script).toContain('verify-game-data-compaction.mjs');
    expect(script).toContain("mode = 'check'");
    expect(script).toContain('confirmation !== CONFIRMATION');
    expect(script).toContain('expected_supabase_host_required');
    expect(script).toContain('supabase_host_mismatch');
    expect(script).toContain('target,');
    expect(script).toContain("args.mode === 'post-check'");
    expect(script).toContain("'--mode=post-cutover'");
    expect(script).toContain('post_check_argument_missing');
    expect(script).toContain('readAutomaticRetainedRowsPath(manifest)');
  });

  it('uses the atomic RPC and exact postcondition reads instead of table updates', () => {
    expect(script).toContain("client.rpc('prepared_mark_game_data_actions_synced_batch'");
    expect(script).toContain("client.rpc(\n    'read_game_data_approved_replay_epoch'");
    expect(script).toContain(".select('id,status,is_public,created_at')");
    expect(script).not.toMatch(/\.from\('game_data_actions'\)[\s\S]*?\.update\(/u);
    expect(script).not.toContain('actorId: args.actorId');
    expect(lifecycle).toContain('authorizedActorProvided: true');
    expect(lifecycle).toContain('manifest.retrospectiveObservation = {');
    expect(lifecycle).toContain('additionalObservedSyncedRowIds: []');
  });

  it('persists the idempotence evidence required by the cutover manifest gate', () => {
    expect(verifier).toContain('idempotence: evidence.idempotence');
  });

  it('durably captures and binds exact retained rows before the atomic transition', () => {
    expect(script).toContain('runCompactionCutoverSync({');
    expect(lifecycle.indexOf('await capturePreCutoverRows()')).toBeGreaterThan(-1);
    expect(lifecycle.indexOf('await executeCutover()')).toBeGreaterThan(
      lifecycle.indexOf('await persistManifest(manifest)')
    );
    expect(script).toContain("handle = await open(path, 'wx')");
    expect(script).toContain('await handle.sync()');
    expect(script).toContain("receiptKind: 'preCutoverRetainedRows'");
    expect(script).toContain('fileDigest: retainedRowsDigest(persisted.serialized)');
    expect(verifier).toContain("throw new CompactionScriptError('retained_rows_digest_mismatch')");
  });
});
