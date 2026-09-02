import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('post-cutover compaction verifier script', () => {
  const verifier = readFileSync(
    path.join(process.cwd(), 'scripts/verify-game-data-compaction.mjs'),
    'utf8'
  );
  const runner = readFileSync(
    path.join(process.cwd(), 'scripts/lib/run-game-data-compaction-parity.mjs'),
    'utf8'
  );
  const target = readFileSync(path.join(process.cwd(), 'scripts/lib/supabase-target.mjs'), 'utf8');
  const lifecycle = readFileSync(
    path.join(process.cwd(), 'src/lib/gameData/compactionCutoverLifecycle.ts'),
    'utf8'
  );

  it('uses retained rows and current approved rows without invoking approved-row preflight', () => {
    expect(verifier).toContain("mode !== 'preflight' && mode !== 'post-cutover'");
    expect(verifier).toContain(
      'const reconstructedRows = [...snapshotBefore.rows, ...retained.rows]'
    );
    expect(lifecycle).toContain("status: 'synced'");
    expect(lifecycle).toContain('isPublic: false');
    expect(verifier).toContain('recordCompactionPostCutoverVerification(manifest, evidence)');
    expect(verifier).toContain('idempotence: operationSummary');
    expect(lifecycle).toContain('postCutoverVerification');
    expect(lifecycle).toContain("receiptKind: 'postCutoverVerification'");
    expect(verifier).toContain('readPreCutoverRetainedRowsBinding(manifest)');
    expect(verifier).toContain("throw new CompactionScriptError('retained_rows_path_mismatch')");
  });

  it('binds parity to historical source data while using the current verification engine', () => {
    expect(runner).toContain("'@': join(args.sourceRoot, 'src')");
    expect(runner).toContain("'lodash-es/isEqual': join(projectDir");
    expect(runner).toContain('const { verifyCompactionActionPatch } = helperJiti(');
    expect(runner).toContain("runnerStage = 'verify_action_patch'");
  });

  it('reports both the exact Supabase host and hosted project ref', () => {
    expect(target).toContain("hostname.endsWith('.supabase.co')");
    expect(target).toContain('return { host, projectRef }');
  });
});
