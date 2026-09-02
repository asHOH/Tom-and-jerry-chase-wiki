#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

import { resolveSupabaseTarget } from './lib/supabase-target.mjs';

const execFileAsync = promisify(execFile);
const projectDir = fileURLToPath(new URL('..', import.meta.url));
const runnerPath = fileURLToPath(
  new URL('./lib/run-game-data-compaction-parity.mjs', import.meta.url)
);
const serverOnlyStub = fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url));
const TEMP_PREFIX = 'tjwiki-game-data-compaction-';

nextEnv.loadEnvConfig(projectDir);

class CompactionScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'CompactionScriptError';
    this.code = code;
    this.details = details;
  }
}

function parseArgs(args) {
  let manifestPath;
  let patchedRef;
  let productionOrigin;
  let retainedRowsPath;
  let expectedSupabaseHost;
  let mode = 'preflight';
  let writeManifest = false;

  for (const arg of args) {
    if (arg.startsWith('--manifest=')) manifestPath = arg.slice('--manifest='.length);
    else if (arg.startsWith('--patched-ref=')) patchedRef = arg.slice('--patched-ref='.length);
    else if (arg.startsWith('--production-origin=')) {
      productionOrigin = arg.slice('--production-origin='.length);
    } else if (arg.startsWith('--retained-rows=')) {
      retainedRowsPath = arg.slice('--retained-rows='.length);
    } else if (arg.startsWith('--expected-supabase-host=')) {
      expectedSupabaseHost = arg.slice('--expected-supabase-host='.length).trim().toLowerCase();
    } else if (arg.startsWith('--mode=')) mode = arg.slice('--mode='.length);
    else if (arg === '--write-manifest') writeManifest = true;
    else throw new CompactionScriptError('invalid_argument', { argument: arg });
  }

  if (!manifestPath || !patchedRef || !productionOrigin) {
    throw new CompactionScriptError('required_argument_missing');
  }
  if (mode !== 'preflight' && mode !== 'post-cutover') {
    throw new CompactionScriptError('invalid_mode');
  }
  if (mode === 'post-cutover' && (!retainedRowsPath || !expectedSupabaseHost)) {
    throw new CompactionScriptError('post_cutover_argument_missing');
  }
  return {
    manifestPath,
    patchedRef,
    productionOrigin,
    retainedRowsPath,
    expectedSupabaseHost,
    mode,
    writeManifest,
  };
}

async function run(command, args, options = {}) {
  try {
    return await execFileAsync(command, args, {
      cwd: projectDir,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
      ...options,
    });
  } catch (error) {
    throw new CompactionScriptError('command_failed', {
      command,
      exitCode: error?.code,
    });
  }
}

async function resolveCommit(ref) {
  const { stdout } = await run('git', ['rev-parse', '--verify', `${ref}^{commit}`]);
  return stdout.trim();
}

async function isAncestor(ancestor, descendant) {
  try {
    await execFileAsync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: projectDir,
      windowsHide: true,
    });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    throw new CompactionScriptError('ancestry_check_failed');
  }
}

async function readIgnoredManifest(manifestArg) {
  const manifestPath = resolve(projectDir, manifestArg);
  const manifestRelativePath = relative(projectDir, manifestPath);
  if (
    manifestRelativePath.startsWith('..') ||
    isAbsolute(manifestRelativePath) ||
    !manifestRelativePath.replaceAll('\\', '/').startsWith('.tmp/')
  ) {
    throw new CompactionScriptError('manifest_must_be_under_tmp');
  }
  await run('git', ['check-ignore', '--quiet', '--', manifestRelativePath]);

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    throw new CompactionScriptError('invalid_manifest');
  }
  if (!Array.isArray(manifest?.rows) || typeof manifest?.repository?.head !== 'string') {
    throw new CompactionScriptError('invalid_manifest');
  }
  return { manifest, manifestPath, manifestRelativePath };
}

async function readIgnoredRetainedRows(retainedRowsArg) {
  const retainedRowsPath = resolve(projectDir, retainedRowsArg);
  const retainedRowsRelativePath = relative(projectDir, retainedRowsPath);
  if (
    retainedRowsRelativePath.startsWith('..') ||
    isAbsolute(retainedRowsRelativePath) ||
    !retainedRowsRelativePath.replaceAll('\\', '/').startsWith('.tmp/')
  ) {
    throw new CompactionScriptError('retained_rows_must_be_under_tmp');
  }
  await run('git', ['check-ignore', '--quiet', '--', retainedRowsRelativePath]);
  let retained;
  try {
    retained = JSON.parse(await readFile(retainedRowsPath, 'utf8'));
  } catch {
    throw new CompactionScriptError('invalid_retained_rows');
  }
  if (!Array.isArray(retained?.rows)) {
    throw new CompactionScriptError('invalid_retained_rows');
  }
  return {
    retained,
    retainedRowsRelativePath: retainedRowsRelativePath.replaceAll('\\', '/'),
  };
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function readExactActionRows(client, actionIds) {
  const rows = [];
  for (const actionIdChunk of chunk(actionIds, 100)) {
    const { data, error } = await client
      .from('game_data_actions')
      .select('id,entity_type,entry,created_at,created_by,status,is_public,message')
      .in('id', actionIdChunk)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw new CompactionScriptError('post_cutover_row_read_failed');
    rows.push(...data);
  }
  return rows.sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
}

async function readProductionProof(
  originArg,
  patchedCommit,
  expectedArtifact,
  verifyArtifactMetadata
) {
  let origin;
  try {
    origin = new URL(originArg);
  } catch {
    throw new CompactionScriptError('invalid_production_origin');
  }
  if (origin.protocol !== 'https:') throw new CompactionScriptError('invalid_production_origin');

  const fetchJson = async (path) => {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new CompactionScriptError('production_check_failed', { path });
    return response.json();
  };
  const [health, version] = await Promise.all([
    fetchJson('/api/health'),
    fetchJson('/api/version'),
  ]);
  if (health?.status !== 'ok' || typeof version?.commitSha !== 'string') {
    throw new CompactionScriptError('production_check_failed');
  }

  const artifact = version.gameDataArtifact;
  const artifactProof = verifyArtifactMetadata(artifact, expectedArtifact);
  if (!artifactProof.proven) {
    throw new CompactionScriptError('production_artifact_mismatch', {
      fields: artifactProof.mismatchedFields,
    });
  }

  const deployedCommit = await resolveCommit(version.commitSha);
  if (!(await isAncestor(patchedCommit, deployedCommit))) {
    throw new CompactionScriptError('patched_commit_not_deployed');
  }
  return {
    origin: origin.origin,
    status: health.status,
    deployedCommit,
    buildTime: typeof version.buildTime === 'string' ? version.buildTime : null,
    gameDataArtifact: {
      deploymentIdentity: artifact.deploymentIdentity,
      replayEpoch: artifact.replayEpoch,
      actionRevision: artifact.actionRevision,
      rowCount: artifact.rowCount,
    },
  };
}

function compareParityReports(before, after) {
  const afterByType = new Map(after.domains.map((domain) => [domain.entityType, domain]));
  const mismatchedDomains = [];
  const domains = before.domains.map((domain) => {
    const candidate = afterByType.get(domain.entityType);
    if (
      !candidate ||
      candidate.digest !== domain.digest ||
      candidate.encodedBytes !== domain.encodedBytes
    ) {
      mismatchedDomains.push(domain.entityType);
    }
    return {
      entityType: domain.entityType,
      digest: domain.digest,
      encodedBytes: domain.encodedBytes,
    };
  });
  if (after.domains.length !== before.domains.length) mismatchedDomains.push('domain_count');
  return { proven: mismatchedDomains.length === 0, mismatchedDomains, domains };
}

function assertTemporaryRoot(tempRoot) {
  const resolvedTemp = resolve(tmpdir());
  const resolvedRoot = resolve(tempRoot);
  if (
    !resolvedRoot.startsWith(`${resolvedTemp}\\`) &&
    !resolvedRoot.startsWith(`${resolvedTemp}/`)
  ) {
    throw new CompactionScriptError('unsafe_temporary_path');
  }
  if (!resolvedRoot.split(/[\\/]/u).at(-1)?.startsWith(TEMP_PREFIX)) {
    throw new CompactionScriptError('unsafe_temporary_path');
  }
}

async function addWorktree(path, commit) {
  await run('git', ['worktree', 'add', '--detach', '--quiet', path, commit]);
}

async function removeWorktree(path) {
  try {
    await execFileAsync('git', ['worktree', 'remove', '--force', path], {
      cwd: projectDir,
      windowsHide: true,
    });
  } catch {
    // The final guarded temp-root removal handles partially created worktrees.
  }
}

async function runParity(path, snapshotFile, excludedIds, dataOutputFile, verification) {
  const args = [
    runnerPath,
    `--source-root=${path}`,
    `--snapshot-file=${snapshotFile}`,
    `--exclude-ids=${excludedIds.join(',')}`,
    `--data-output-file=${dataOutputFile}`,
  ];
  if (verification) {
    args.push(`--verification-cutover-ids=${verification.cutoverRowIds.join(',')}`);
    args.push(
      `--verification-dependency-ids=${verification.verificationDependencyRowIds.join(',')}`
    );
  }
  let stdout;
  try {
    ({ stdout } = await execFileAsync(process.execPath, args, {
      cwd: projectDir,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    }));
  } catch (error) {
    let runnerCode = 'parity_runner_failed';
    let runnerStage;
    let runnerCause;
    try {
      const parsed = JSON.parse(error?.stderr ?? '');
      if (typeof parsed?.error?.code === 'string') runnerCode = parsed.error.code;
      if (typeof parsed?.error?.stage === 'string') runnerStage = parsed.error.stage;
      if (parsed?.error?.cause && typeof parsed.error.cause === 'object') {
        runnerCause = parsed.error.cause;
      }
    } catch {
      // Keep the bounded generic runner code.
    }
    throw new CompactionScriptError('parity_runner_failed', {
      runnerCode,
      runnerStage,
      runnerCause,
    });
  }
  try {
    return JSON.parse(stdout);
  } catch {
    throw new CompactionScriptError('invalid_parity_output');
  }
}

async function createParityProof(
  baselineCommit,
  patchedCommit,
  rows,
  excludedIds,
  findDifferences,
  verification
) {
  const tempRoot = await mkdtemp(join(tmpdir(), TEMP_PREFIX));
  assertTemporaryRoot(tempRoot);
  const baselinePath = join(tempRoot, 'baseline');
  const patchedPath = join(tempRoot, 'patched');
  const snapshotFile = join(tempRoot, 'snapshot.json');
  const beforeDataFile = join(tempRoot, 'before-data.json');
  const afterDataFile = join(tempRoot, 'after-data.json');
  let baselineAdded = false;
  let patchedAdded = false;

  try {
    await writeFile(snapshotFile, JSON.stringify(rows), 'utf8');
    await addWorktree(baselinePath, baselineCommit);
    baselineAdded = true;
    await addWorktree(patchedPath, patchedCommit);
    patchedAdded = true;
    const before = await runParity(baselinePath, snapshotFile, [], beforeDataFile);
    const after = await runParity(
      patchedPath,
      snapshotFile,
      excludedIds,
      afterDataFile,
      verification
    );
    const expectedVerifiedIds = verification.verificationRowIds;
    const verifiedIds = after.patchVerification?.verifiedRowIds;
    const verifiedIdSet = new Set(verifiedIds ?? []);
    const patchFailures = after.patchVerification?.failures ?? [];
    const dependencyReplayFailures = after.patchVerification?.dependencyReplayFailures ?? [];
    if (
      !Array.isArray(verifiedIds) ||
      verifiedIds.length !== expectedVerifiedIds.length ||
      expectedVerifiedIds.some((rowId) => !verifiedIdSet.has(rowId)) ||
      patchFailures.length > 0 ||
      dependencyReplayFailures.length > 0
    ) {
      throw new CompactionScriptError('action_patch_verification_failed', {
        failures: patchFailures,
        dependencyReplayFailures,
        expectedRowCount: expectedVerifiedIds.length,
        verifiedRowCount: Array.isArray(verifiedIds) ? verifiedIds.length : 0,
      });
    }
    const parity = compareParityReports(before, after);
    if (!parity.proven) {
      const beforeData = JSON.parse(await readFile(beforeDataFile, 'utf8'));
      const afterData = JSON.parse(await readFile(afterDataFile, 'utf8'));
      const differences = Object.fromEntries(
        parity.mismatchedDomains
          .filter((entityType) => entityType !== 'domain_count')
          .map((entityType) => [
            entityType,
            findDifferences(beforeData[entityType], afterData[entityType]),
          ])
      );
      throw new CompactionScriptError('published_parity_mismatch', {
        entityTypes: parity.mismatchedDomains,
        differences,
      });
    }
    return { parity, actionPatch: after.patchVerification };
  } finally {
    if (patchedAdded) await removeWorktree(patchedPath);
    if (baselineAdded) await removeWorktree(baselinePath);
    assertTemporaryRoot(tempRoot);
    await rm(tempRoot, { recursive: true, force: true });
    await execFileAsync('git', ['worktree', 'prune'], {
      cwd: projectDir,
      windowsHide: true,
    }).catch(() => undefined);
  }
}

function verifyExistingFingerprint(manifest, snapshot, rowContentDigests) {
  const fingerprint = manifest.fingerprint;
  if (!fingerprint || fingerprint.replayEpoch === null) return;
  if (
    fingerprint.replayEpoch !== snapshot.replayEpoch ||
    fingerprint.actionRevision !== snapshot.actionSnapshot.actionRevision
  ) {
    throw new CompactionScriptError('bound_snapshot_changed');
  }
  for (const [rowId, digest] of Object.entries(rowContentDigests)) {
    if (fingerprint.rowContentDigests?.[rowId] !== digest) {
      throw new CompactionScriptError('bound_row_digest_changed', { rowId });
    }
  }
}

function updateManifest(manifest, evidence) {
  const capturedAt = new Date().toISOString();
  manifest.cutoverRowIds = evidence.selection.cutoverRowIds;
  manifest.verificationDependencyRowIds = evidence.selection.verificationDependencyRowIds;
  manifest.rows = manifest.rows.map((row) => ({
    ...row,
    contentDigest: evidence.rowContentDigests[row.id],
  }));
  manifest.repository = {
    ...manifest.repository,
    patchedHead: evidence.patchedCommit,
    deployedHead: evidence.production.deployedCommit,
  };
  manifest.fingerprint = {
    replayEpoch: evidence.replayEpoch,
    actionRevision: evidence.actionRevision,
    rowContentDigests: evidence.rowContentDigests,
    snapshotRowCount: evidence.snapshotRowCount,
    capturedAt,
  };
  manifest.result = {
    ...manifest.result,
    cutoverVerification: {
      verifiedAt: capturedAt,
      manifestUnchanged: true,
      snapshotStableDuringVerification: true,
      idempotence: evidence.idempotence,
      actionPatch: evidence.actionPatch,
      production: evidence.production,
      publishedParity: evidence.parity,
    },
  };
  manifest.workflowBoundary = {
    ...manifest.workflowBoundary,
    publishedParity: {
      status: 'passed',
      baselineCommit: evidence.baselineCommit,
      patchedCommit: evidence.patchedCommit,
      excludedRowCount: evidence.selection.cutoverRowIds.length,
      domains: evidence.parity.domains,
    },
    batchStatusTransition: {
      status: 'available',
      rpc: 'prepared_mark_game_data_actions_synced_batch',
      replayEpochPolicy: 'existing per-row trigger',
    },
    recoveryPath: {
      status: 'available',
      deploymentFailure: 'status transition is gated on deployed artifact proof',
      transitionFailure: 'database function rolls back the complete batch',
      uncertainResponse: 'cutover command resolves outcome by exact status re-query',
    },
    remainingCutoverBlockers: [],
  };
}

function updatePostCutoverManifest(manifest, evidence) {
  const verifiedAt = new Date().toISOString();
  manifest.result = {
    ...manifest.result,
    postCutoverVerification: {
      receiptKind: 'postCutoverVerification',
      verificationOnly: true,
      verifiedAt,
      target: evidence.target,
      exactRows: {
        rowCount: evidence.selection.actionIds.length,
        originalManifestRowIds: evidence.selection.originalManifestRowIds,
        additionalSyncedRowIds: evidence.selection.additionalSyncedRowIds,
        verifiedRowIds: evidence.selection.actionIds,
        status: 'synced',
        isPublic: false,
        rowContentDigests: evidence.rowEvidence.rowContentDigests,
      },
      retainedRows: evidence.retainedRows,
      currentApprovedSnapshot: {
        replayEpoch: evidence.replayEpoch,
        actionRevision: evidence.actionRevision,
        rowCount: evidence.snapshotRowCount,
        stableDuringVerification: true,
      },
      idempotence: evidence.idempotence,
      actionPatch: evidence.actionPatch,
      production: {
        ...evidence.production,
        stableDuringVerification: true,
      },
      publishedParity: evidence.parity,
      limitations: [
        'verification-only receipt; it does not prove who performed the earlier status transition',
        'verification-only receipt; it does not prove the earlier execution time or atomicity',
        'pre-cutover replay fingerprint was not captured and is not reconstructed',
      ],
    },
  };
  manifest.workflowBoundary = {
    ...manifest.workflowBoundary,
    postCutoverVerification: {
      status: 'passed',
      verificationOnly: true,
      baselineCommit: evidence.baselineCommit,
      patchedCommit: evidence.patchedCommit,
      reconstructedWithRetainedRows: evidence.selection.actionIds.length,
      currentApprovedRows: evidence.snapshotRowCount,
    },
  };
}

async function runPostCutoverVerification({
  args,
  manifest,
  manifestPath,
  manifestRelativePath,
  baselineCommit,
  patchedCommit,
  readApprovedReplaySnapshot,
  createApprovedActionSnapshotFromRows,
  findCompactionValueDifferences,
  verifySetActionIdempotence,
  resolvePostCutoverManifestSelection,
  verifyPostCutoverRowEvidence,
  verifyStablePostCutoverProduction,
  verifyCompactionArtifactMetadata,
}) {
  const selectionResult = resolvePostCutoverManifestSelection(manifest);
  if (!selectionResult.success) {
    throw new CompactionScriptError('invalid_post_cutover_manifest', {
      failures: selectionResult.failures,
    });
  }
  const selection = selectionResult.value;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new CompactionScriptError('missing_supabase_credentials');
  }
  const target = resolveSupabaseTarget(supabaseUrl);
  if (!target) throw new CompactionScriptError('invalid_supabase_url');
  if (
    args.expectedSupabaseHost !== target.host ||
    selection.targetHost.toLowerCase() !== target.host
  ) {
    throw new CompactionScriptError('supabase_host_mismatch', {
      expectedSupabaseHost: args.expectedSupabaseHost,
      retrospectiveSupabaseHost: selection.targetHost,
      actualSupabaseHost: target.host,
    });
  }

  const { retained, retainedRowsRelativePath } = await readIgnoredRetainedRows(
    args.retainedRowsPath
  );
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const snapshotBefore = await readApprovedReplaySnapshot(client);
  const remoteRowsBefore = await readExactActionRows(client, selection.actionIds);
  const rowEvidenceBefore = verifyPostCutoverRowEvidence(
    selection.actionIds,
    retained.rows,
    remoteRowsBefore
  );
  if (!rowEvidenceBefore.proven) {
    throw new CompactionScriptError('post_cutover_row_evidence_failed', {
      failures: rowEvidenceBefore.failures,
    });
  }

  const retainedSnapshot = createApprovedActionSnapshotFromRows(retained.rows);
  const operationSummary = verifySetActionIdempotence(retainedSnapshot.rows);
  const actionOperations = {
    actionCount: operationSummary.actionCount,
    operationCounts: operationSummary.operationCounts,
    setOnly: operationSummary.proven,
    nonSetActions: operationSummary.failures,
  };

  const currentIds = new Set(snapshotBefore.rows.map((row) => row.id));
  const overlap = selection.actionIds.filter((rowId) => currentIds.has(rowId));
  if (overlap.length > 0) {
    throw new CompactionScriptError('synced_rows_still_in_approved_snapshot', { rowIds: overlap });
  }
  const reconstructedRows = [...snapshotBefore.rows, ...retained.rows].sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
  const expectedArtifact = {
    replayEpoch: snapshotBefore.replayEpoch,
    actionRevision: snapshotBefore.actionSnapshot.actionRevision,
    rowCount: snapshotBefore.rows.length,
  };
  const verificationSelection = {
    cutoverRowIds: selection.actionIds,
    verificationDependencyRowIds: [],
    verificationRowIds: selection.actionIds,
  };
  const { parity, actionPatch } = await createParityProof(
    baselineCommit,
    patchedCommit,
    reconstructedRows,
    selection.actionIds,
    findCompactionValueDifferences,
    verificationSelection
  );

  const snapshotAfter = await readApprovedReplaySnapshot(client);
  const remoteRowsAfter = await readExactActionRows(client, selection.actionIds);
  const rowEvidenceAfter = verifyPostCutoverRowEvidence(
    selection.actionIds,
    retained.rows,
    remoteRowsAfter
  );
  if (!rowEvidenceAfter.proven) {
    throw new CompactionScriptError('post_cutover_row_evidence_changed', {
      failures: rowEvidenceAfter.failures,
    });
  }
  if (
    snapshotAfter.replayEpoch !== snapshotBefore.replayEpoch ||
    snapshotAfter.actionSnapshot.actionRevision !== snapshotBefore.actionSnapshot.actionRevision ||
    snapshotAfter.rows.length !== snapshotBefore.rows.length
  ) {
    throw new CompactionScriptError('snapshot_changed_during_verification');
  }
  const productionBefore = await readProductionProof(
    args.productionOrigin,
    patchedCommit,
    expectedArtifact,
    verifyCompactionArtifactMetadata
  );
  const productionAfter = await readProductionProof(
    args.productionOrigin,
    patchedCommit,
    expectedArtifact,
    verifyCompactionArtifactMetadata
  );
  const productionStability = verifyStablePostCutoverProduction(
    productionBefore,
    productionAfter,
    expectedArtifact
  );
  if (!productionStability.proven) {
    throw new CompactionScriptError('production_changed_during_verification', {
      failures: productionStability.failures,
    });
  }

  const evidence = {
    baselineCommit,
    patchedCommit,
    target,
    replayEpoch: snapshotBefore.replayEpoch,
    actionRevision: snapshotBefore.actionSnapshot.actionRevision,
    snapshotRowCount: snapshotBefore.rows.length,
    selection,
    rowEvidence: rowEvidenceAfter,
    retainedRows: {
      path: retainedRowsRelativePath,
      capturedAt: typeof retained.capturedAt === 'string' ? retained.capturedAt : null,
      replayEpochAtCapture: Number.isSafeInteger(retained.replayEpoch)
        ? retained.replayEpoch
        : null,
      rowCount: retained.rows.length,
    },
    actionOperations,
    actionPatch,
    production: productionAfter,
    parity,
  };
  if (args.writeManifest) {
    updatePostCutoverManifest(manifest, evidence);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'post-cutover',
        manifest: manifestRelativePath.replaceAll('\\', '/'),
        wroteManifest: args.writeManifest,
        evidence,
      },
      null,
      2
    )}\n`
  );
}

function sanitizedError(error) {
  return error instanceof CompactionScriptError
    ? { code: error.code, ...error.details }
    : { code: 'compaction_verification_failed' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { manifest, manifestPath, manifestRelativePath } = await readIgnoredManifest(
    args.manifestPath
  );
  const baselineCommit = await resolveCommit(manifest.repository.head);
  const patchedCommit = await resolveCommit(args.patchedRef);

  const jiti = createJiti(import.meta.url, {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      'server-only': serverOnlyStub,
    },
  });
  const { readApprovedReplaySnapshot } = jiti(
    '../src/lib/gameData/approvedReplaySnapshotReader.ts'
  );
  const { createApprovedActionRevision, createApprovedActionSnapshotFromRows } = jiti(
    '../src/lib/gameData/published/approvedActionSnapshot.ts'
  );
  const {
    findCompactionValueDifferences,
    resolveCompactionManifestSelection,
    verifyCompactionArtifactMetadata,
    verifyCompactionManifestRows,
    verifySetActionIdempotence,
  } = jiti('../src/lib/gameData/compactionVerification.ts');
  const {
    resolvePostCutoverManifestSelection,
    verifyPostCutoverRowEvidence,
    verifyStablePostCutoverProduction,
  } = jiti('../src/lib/gameData/compactionPostCutoverVerification.ts');

  if (args.mode === 'post-cutover') {
    await runPostCutoverVerification({
      args,
      manifest,
      manifestPath,
      manifestRelativePath,
      baselineCommit,
      patchedCommit,
      readApprovedReplaySnapshot,
      createApprovedActionSnapshotFromRows,
      findCompactionValueDifferences,
      verifySetActionIdempotence,
      resolvePostCutoverManifestSelection,
      verifyPostCutoverRowEvidence,
      verifyStablePostCutoverProduction,
      verifyCompactionArtifactMetadata,
    });
    return;
  }

  const selectionResult = resolveCompactionManifestSelection(manifest.rows, {
    cutoverRowIds: manifest.cutoverRowIds,
    verificationDependencyRowIds: manifest.verificationDependencyRowIds,
  });
  if (!selectionResult.success) {
    throw new CompactionScriptError('invalid_manifest_selection', {
      failures: selectionResult.failures,
    });
  }
  const selection = selectionResult.value;

  const snapshotBefore = await readApprovedReplaySnapshot();
  const manifestIds = selection.cutoverRowIds;
  const manifestIdSet = new Set(manifestIds);
  const snapshotRowIds = new Set(snapshotBefore.rows.map((row) => row.id));
  const missingVerificationRowIds = selection.verificationRowIds.filter(
    (rowId) => !snapshotRowIds.has(rowId)
  );
  if (missingVerificationRowIds.length > 0) {
    throw new CompactionScriptError('verification_rows_missing', {
      rowIds: missingVerificationRowIds,
    });
  }
  const selectedRows = snapshotBefore.actionSnapshot.rows.filter((row) =>
    manifestIdSet.has(row.rowId)
  );
  const rowContentDigests = Object.fromEntries(
    selectedRows.map((row) => [row.rowId, createApprovedActionRevision([row])])
  );
  verifyExistingFingerprint(manifest, snapshotBefore, rowContentDigests);

  const consistency = verifyCompactionManifestRows(
    manifest.rows,
    snapshotBefore.actionSnapshot.rows,
    rowContentDigests
  );
  if (!consistency.unchanged) {
    throw new CompactionScriptError('manifest_changed', { failures: consistency.failures });
  }
  const idempotence = verifySetActionIdempotence(selectedRows);
  if (!idempotence.proven) {
    throw new CompactionScriptError('non_idempotent_manifest_actions', {
      failures: idempotence.failures,
    });
  }

  const production = await readProductionProof(
    args.productionOrigin,
    patchedCommit,
    {
      replayEpoch: snapshotBefore.replayEpoch,
      actionRevision: snapshotBefore.actionSnapshot.actionRevision,
      rowCount: snapshotBefore.rows.length,
    },
    verifyCompactionArtifactMetadata
  );
  const { parity, actionPatch } = await createParityProof(
    baselineCommit,
    patchedCommit,
    snapshotBefore.rows,
    manifestIds,
    findCompactionValueDifferences,
    selection
  );
  const snapshotAfter = await readApprovedReplaySnapshot();
  if (
    snapshotAfter.replayEpoch !== snapshotBefore.replayEpoch ||
    snapshotAfter.actionSnapshot.actionRevision !== snapshotBefore.actionSnapshot.actionRevision
  ) {
    throw new CompactionScriptError('snapshot_changed_during_verification');
  }

  const evidence = {
    baselineCommit,
    patchedCommit,
    replayEpoch: snapshotBefore.replayEpoch,
    actionRevision: snapshotBefore.actionSnapshot.actionRevision,
    snapshotRowCount: snapshotBefore.rows.length,
    rowContentDigests,
    idempotence,
    selection,
    actionPatch,
    production,
    parity,
  };
  if (args.writeManifest) {
    updateManifest(manifest, evidence);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        manifest: manifestRelativePath.replaceAll('\\', '/'),
        wroteManifest: args.writeManifest,
        evidence,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: sanitizedError(error) })}\n`);
  process.exitCode = 1;
});
