#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { open, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual, promisify } from 'node:util';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

import { resolveSupabaseTarget } from './lib/supabase-target.mjs';

const execFileAsync = promisify(execFile);
const projectDir = fileURLToPath(new URL('..', import.meta.url));
const verifierPath = fileURLToPath(new URL('./verify-game-data-compaction.mjs', import.meta.url));
const serverOnlyStub = fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url));
const CONFIRMATION = 'SYNC_APPROVED_COMPACTION_BATCH';

nextEnv.loadEnvConfig(projectDir);

class CutoverScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'CutoverScriptError';
    this.code = code;
    this.details = details;
  }
}

function parseArgs(args) {
  let manifestPath;
  let patchedRef;
  let productionOrigin;
  let retainedRowsPath;
  let actorId;
  let confirmation;
  let expectedSupabaseHost;
  let mode = 'check';

  for (const arg of args) {
    if (arg.startsWith('--manifest=')) manifestPath = arg.slice('--manifest='.length);
    else if (arg.startsWith('--patched-ref=')) patchedRef = arg.slice('--patched-ref='.length);
    else if (arg.startsWith('--production-origin=')) {
      productionOrigin = arg.slice('--production-origin='.length);
    } else if (arg.startsWith('--actor-id=')) actorId = arg.slice('--actor-id='.length);
    else if (arg.startsWith('--retained-rows=')) {
      retainedRowsPath = arg.slice('--retained-rows='.length);
    } else if (arg.startsWith('--confirm=')) confirmation = arg.slice('--confirm='.length);
    else if (arg.startsWith('--expected-supabase-host=')) {
      expectedSupabaseHost = arg.slice('--expected-supabase-host='.length).trim().toLowerCase();
    } else if (arg.startsWith('--mode=')) mode = arg.slice('--mode='.length);
    else throw new CutoverScriptError('invalid_argument', { argument: arg });
  }
  if (!manifestPath || !patchedRef || !productionOrigin) {
    throw new CutoverScriptError('required_argument_missing');
  }
  if (!['check', 'sync', 'post-check'].includes(mode)) {
    throw new CutoverScriptError('invalid_mode');
  }
  if (mode === 'sync') {
    if (
      !actorId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(actorId)
    ) {
      throw new CutoverScriptError('invalid_actor_id');
    }
    if (confirmation !== CONFIRMATION) {
      throw new CutoverScriptError('confirmation_required', { expected: CONFIRMATION });
    }
    if (!expectedSupabaseHost) {
      throw new CutoverScriptError('expected_supabase_host_required');
    }
  }
  if (mode === 'post-check' && !expectedSupabaseHost) {
    throw new CutoverScriptError('post_check_argument_missing');
  }
  return {
    manifestPath,
    patchedRef,
    productionOrigin,
    retainedRowsPath,
    actorId,
    expectedSupabaseHost,
    mode,
  };
}

function normalizeRelativePath(path) {
  return path.replaceAll('\\', '/');
}

async function resolveIgnoredTmpPath(pathArg, errorPrefix) {
  const path = resolve(projectDir, pathArg);
  const relativePath = relative(projectDir, path);
  if (
    relativePath.startsWith('..') ||
    isAbsolute(relativePath) ||
    !normalizeRelativePath(relativePath).startsWith('.tmp/')
  ) {
    throw new CutoverScriptError(`${errorPrefix}_must_be_under_tmp`);
  }
  try {
    await execFileAsync('git', ['check-ignore', '--quiet', '--', relativePath], {
      cwd: projectDir,
      windowsHide: true,
    });
  } catch {
    throw new CutoverScriptError(`${errorPrefix}_must_be_ignored`);
  }
  return { path, relativePath: normalizeRelativePath(relativePath) };
}

async function readIgnoredManifest(manifestArg) {
  const { path: manifestPath, relativePath: manifestRelativePath } = await resolveIgnoredTmpPath(
    manifestArg,
    'manifest'
  );

  try {
    return {
      manifest: JSON.parse(await readFile(manifestPath, 'utf8')),
      manifestPath,
      manifestRelativePath,
    };
  } catch {
    throw new CutoverScriptError('invalid_manifest');
  }
}

function defaultRetainedRowsPath(manifestPath, replayEpoch) {
  const extension = extname(manifestPath);
  const stem = basename(manifestPath, extension);
  return resolve(dirname(manifestPath), `${stem}.retained-rows-${replayEpoch}.json`);
}

function readAutomaticRetainedRowsPath(manifest) {
  const binding = manifest?.result?.preCutoverRetainedRows;
  return binding?.receiptKind === 'preCutoverRetainedRows' && typeof binding.path === 'string'
    ? binding.path
    : undefined;
}

function retainedRowsDigest(serialized) {
  return `v1:${createHash('sha256').update(serialized, 'utf8').digest('hex')}`;
}

async function writeRetainedRowsEvidence(path, evidence) {
  let existingRaw;
  try {
    existingRaw = await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw new CutoverScriptError('retained_rows_read_failed');
  }

  if (existingRaw !== undefined) {
    let existing;
    try {
      existing = JSON.parse(existingRaw);
    } catch {
      throw new CutoverScriptError('retained_rows_conflict');
    }
    const { capturedAt: _existingCapturedAt, ...existingStable } = existing;
    const { capturedAt: _nextCapturedAt, ...nextStable } = evidence;
    if (!isDeepStrictEqual(existingStable, nextStable) || typeof existing.capturedAt !== 'string') {
      throw new CutoverScriptError('retained_rows_conflict');
    }
    return { evidence: existing, serialized: existingRaw };
  }

  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  let handle;
  try {
    handle = await open(path, 'wx');
    await handle.writeFile(serialized, 'utf8');
    await handle.sync();
  } catch (error) {
    throw new CutoverScriptError('retained_rows_write_failed', { cause: error?.code });
  } finally {
    await handle?.close();
  }

  const persisted = await readFile(path, 'utf8');
  if (persisted !== serialized)
    throw new CutoverScriptError('retained_rows_write_verification_failed');
  return { evidence, serialized };
}

async function capturePreCutoverRows({
  args,
  client,
  manifest,
  manifestPath,
  prepared,
  target,
  readApprovedReplaySnapshot,
}) {
  const snapshot = await readApprovedReplaySnapshot(client);
  if (
    snapshot.replayEpoch !== prepared.replayEpoch ||
    snapshot.actionSnapshot.actionRevision !== prepared.actionRevision
  ) {
    throw new CutoverScriptError('snapshot_changed_before_retained_capture');
  }

  const selectedIds = new Set(prepared.actionIds);
  const rows = snapshot.rows
    .filter((row) => selectedIds.has(row.id))
    .map((row) => ({ ...row, is_public: true }));
  if (
    rows.length !== prepared.actionIds.length ||
    rows.some((row, index) => row.id !== prepared.actionIds[index])
  ) {
    throw new CutoverScriptError('retained_rows_exact_set_mismatch');
  }

  const requestedPath =
    args.retainedRowsPath ?? defaultRetainedRowsPath(manifestPath, prepared.replayEpoch);
  const retainedPath = await resolveIgnoredTmpPath(requestedPath, 'retained_rows');
  const capturedAt = new Date().toISOString();
  const nextEvidence = {
    schemaVersion: 1,
    receiptKind: 'preCutoverRetainedRows',
    capturedAt,
    target,
    replayEpoch: snapshot.replayEpoch,
    actionRevision: snapshot.actionSnapshot.actionRevision,
    snapshotRowCount: snapshot.rows.length,
    rowCount: rows.length,
    rows,
  };
  const persisted = await writeRetainedRowsEvidence(retainedPath.path, nextEvidence);
  const binding = {
    receiptKind: 'preCutoverRetainedRows',
    path: retainedPath.relativePath,
    fileDigest: retainedRowsDigest(persisted.serialized),
    capturedAt: persisted.evidence.capturedAt,
    target,
    replayEpoch: persisted.evidence.replayEpoch,
    actionRevision: persisted.evidence.actionRevision,
    snapshotRowCount: persisted.evidence.snapshotRowCount,
    rowCount: persisted.evidence.rowCount,
  };
  manifest.result = { ...manifest.result, preCutoverRetainedRows: binding };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return binding;
}

async function runPreflight(args) {
  try {
    await execFileAsync(
      process.execPath,
      [
        verifierPath,
        `--manifest=${args.manifestPath}`,
        `--patched-ref=${args.patchedRef}`,
        `--production-origin=${args.productionOrigin}`,
        '--write-manifest',
      ],
      {
        cwd: projectDir,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      }
    );
  } catch (error) {
    throw new CutoverScriptError('preflight_failed', { exitCode: error?.code });
  }
}

async function runPostCheck(args) {
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        verifierPath,
        `--manifest=${args.manifestPath}`,
        `--patched-ref=${args.patchedRef}`,
        `--production-origin=${args.productionOrigin}`,
        `--retained-rows=${args.retainedRowsPath}`,
        `--expected-supabase-host=${args.expectedSupabaseHost}`,
        '--mode=post-cutover',
        '--write-manifest',
      ],
      {
        cwd: projectDir,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      }
    );
    process.stdout.write(stdout);
  } catch (error) {
    let verifierError;
    try {
      const parsed = JSON.parse(error?.stderr ?? '');
      if (parsed?.error && typeof parsed.error === 'object') verifierError = parsed.error;
    } catch {
      // Keep the bounded generic failure when the verifier did not emit structured JSON.
    }
    throw new CutoverScriptError('post_check_failed', {
      exitCode: error?.code,
      verifierError,
    });
  }
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function readExactStatuses(client, actionIds) {
  const rows = [];
  for (const actionIdChunk of chunk(actionIds, 100)) {
    const { data, error } = await client
      .from('game_data_actions')
      .select('id,status,is_public,created_at')
      .in('id', actionIdChunk)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw new CutoverScriptError('status_read_failed');
    rows.push(...data);
  }
  const returnedIds = new Set(rows.map((row) => row.id));
  const missing = actionIds.filter((id) => !returnedIds.has(id));
  if (rows.length !== actionIds.length || missing.length > 0) {
    throw new CutoverScriptError('exact_status_set_mismatch', { missing });
  }
  return rows.sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
}

function exactIdsMatch(actual, expected) {
  const actualSet = new Set(actual);
  return actualSet.size === expected.length && expected.every((id) => actualSet.has(id));
}

async function executeCutover(client, actorId, input) {
  const { data, error } = await client.rpc('prepared_mark_game_data_actions_synced_batch', {
    p_actor_id: actorId,
    p_action_ids: input.actionIds,
    p_expected_replay_epoch: input.replayEpoch,
  });
  const statuses = await readExactStatuses(client, input.actionIds);
  const allSynced = statuses.every((row) => row.status === 'synced' && row.is_public === false);
  const allApproved = statuses.every((row) => row.status === 'approved' && row.is_public === true);

  if (error && !allSynced) {
    throw new CutoverScriptError('batch_transition_failed', {
      postcondition: allApproved ? 'unchanged' : 'unexpected_mixed_state',
    });
  }
  if (!allSynced) {
    throw new CutoverScriptError('batch_transition_postcondition_failed');
  }

  const { data: replayEpochAfter, error: replayEpochError } = await client.rpc(
    'read_game_data_approved_replay_epoch'
  );
  const cutoverReplayEpoch = input.replayEpoch + input.actionIds.length;
  if (
    replayEpochError ||
    !Number.isSafeInteger(replayEpochAfter) ||
    replayEpochAfter < cutoverReplayEpoch
  ) {
    throw new CutoverScriptError('batch_transition_epoch_postcondition_failed');
  }

  const result = Array.isArray(data) && data.length === 1 ? data[0] : null;
  if (!error) {
    if (
      !result ||
      !Array.isArray(result.synced_action_ids) ||
      !exactIdsMatch(result.synced_action_ids, input.actionIds) ||
      result.replay_epoch !== cutoverReplayEpoch
    ) {
      throw new CutoverScriptError('invalid_batch_transition_result');
    }
  }

  return {
    outcome: error ? 'confirmed_after_uncertain_response' : 'confirmed',
    replayEpochAfter: cutoverReplayEpoch,
    observedReplayEpoch: replayEpochAfter,
    syncedActionIds: statuses.map((row) => row.id),
  };
}

function sanitizedError(error) {
  return error instanceof CutoverScriptError
    ? { code: error.code, ...error.details }
    : { code: 'compaction_cutover_failed' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new CutoverScriptError('missing_supabase_credentials');
  const target = resolveSupabaseTarget(supabaseUrl);
  if (!target) throw new CutoverScriptError('invalid_supabase_url');
  if (args.expectedSupabaseHost && args.expectedSupabaseHost !== target.host) {
    throw new CutoverScriptError('supabase_host_mismatch', {
      expectedSupabaseHost: args.expectedSupabaseHost,
      actualSupabaseHost: target.host,
    });
  }
  if (args.mode === 'post-check') {
    const { manifest } = await readIgnoredManifest(args.manifestPath);
    const retainedRowsPath = args.retainedRowsPath ?? readAutomaticRetainedRowsPath(manifest);
    if (!retainedRowsPath) throw new CutoverScriptError('post_check_argument_missing');
    await runPostCheck({ ...args, retainedRowsPath });
    return;
  }
  await runPreflight(args);
  const { manifest, manifestPath, manifestRelativePath } = await readIgnoredManifest(
    args.manifestPath
  );
  const jiti = createJiti(import.meta.url, {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      'server-only': serverOnlyStub,
    },
  });
  const { prepareCompactionCutoverManifest } = jiti(
    '../src/lib/gameData/compactionCutoverManifest.ts'
  );
  const { readApprovedReplaySnapshot } = jiti(
    '../src/lib/gameData/approvedReplaySnapshotReader.ts'
  );
  const prepared = prepareCompactionCutoverManifest(manifest);
  if (!prepared.success) {
    throw new CutoverScriptError('manifest_not_cutover_ready', {
      failures: prepared.failures,
    });
  }

  if (args.mode === 'check') {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: args.mode,
          target,
          manifest: manifestRelativePath,
          cutoverReady: true,
          actionCount: prepared.value.actionIds.length,
          dependencyCount: prepared.value.verificationDependencyRowIds.length,
          replayEpoch: prepared.value.replayEpoch,
          deployedCommit: prepared.value.deployedCommit,
        },
        null,
        2
      )}\n`
    );
    return;
  }

  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new CutoverScriptError('missing_supabase_credentials');
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const retainedRows = await capturePreCutoverRows({
    args,
    client,
    manifest,
    manifestPath,
    prepared: prepared.value,
    target,
    readApprovedReplaySnapshot,
  });
  const cutover = await executeCutover(client, args.actorId, prepared.value);
  const executedAt = new Date().toISOString();
  manifest.result = {
    ...manifest.result,
    remoteCutover: {
      executedAt,
      authorizedActorProvided: true,
      target,
      replayEpochBefore: prepared.value.replayEpoch,
      ...cutover,
    },
  };
  manifest.retrospectiveObservation = {
    target,
    originalPlan: {
      plannedCutoverRowCount: prepared.value.actionIds.length,
      deferredRowCount: 0,
    },
    observedRemoteState: {
      rowCount: cutover.syncedActionIds.length,
      status: 'synced',
      isPublic: false,
    },
    additionalObservedSyncedRowIds: [],
  };
  manifest.workflowBoundary = {
    ...manifest.workflowBoundary,
    remoteMutation: true,
    cutover: true,
    remainingCutoverBlockers: [],
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: args.mode,
        target,
        manifest: manifestRelativePath,
        retainedRows,
        rowCount: cutover.syncedActionIds.length,
        status: 'synced',
        isPublic: false,
        ...cutover,
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
