#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import nextEnv from '@next/env';
import { createJiti } from 'jiti';

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
  let writeManifest = false;

  for (const arg of args) {
    if (arg.startsWith('--manifest=')) manifestPath = arg.slice('--manifest='.length);
    else if (arg.startsWith('--patched-ref=')) patchedRef = arg.slice('--patched-ref='.length);
    else if (arg.startsWith('--production-origin=')) {
      productionOrigin = arg.slice('--production-origin='.length);
    } else if (arg === '--write-manifest') writeManifest = true;
    else throw new CompactionScriptError('invalid_argument', { argument: arg });
  }

  if (!manifestPath || !patchedRef || !productionOrigin) {
    throw new CompactionScriptError('required_argument_missing');
  }
  return { manifestPath, patchedRef, productionOrigin, writeManifest };
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
  const { stdout } = await run(process.execPath, args);
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
  const { createApprovedActionRevision } = jiti(
    '../src/lib/gameData/published/approvedActionSnapshot.ts'
  );
  const {
    findCompactionValueDifferences,
    resolveCompactionManifestSelection,
    verifyCompactionArtifactMetadata,
    verifyCompactionManifestRows,
    verifySetActionIdempotence,
  } = jiti('../src/lib/gameData/compactionVerification.ts');

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
