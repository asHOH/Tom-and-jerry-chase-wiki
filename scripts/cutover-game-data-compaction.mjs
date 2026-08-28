#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

const execFileAsync = promisify(execFile);
const projectDir = fileURLToPath(new URL('..', import.meta.url));
const verifierPath = fileURLToPath(new URL('./verify-game-data-compaction.mjs', import.meta.url));
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
  let actorId;
  let confirmation;
  let mode = 'check';

  for (const arg of args) {
    if (arg.startsWith('--manifest=')) manifestPath = arg.slice('--manifest='.length);
    else if (arg.startsWith('--patched-ref=')) patchedRef = arg.slice('--patched-ref='.length);
    else if (arg.startsWith('--production-origin=')) {
      productionOrigin = arg.slice('--production-origin='.length);
    } else if (arg.startsWith('--actor-id=')) actorId = arg.slice('--actor-id='.length);
    else if (arg.startsWith('--confirm=')) confirmation = arg.slice('--confirm='.length);
    else if (arg.startsWith('--mode=')) mode = arg.slice('--mode='.length);
    else throw new CutoverScriptError('invalid_argument', { argument: arg });
  }
  if (!manifestPath || !patchedRef || !productionOrigin) {
    throw new CutoverScriptError('required_argument_missing');
  }
  if (mode !== 'check' && mode !== 'sync') throw new CutoverScriptError('invalid_mode');
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
  }
  return { manifestPath, patchedRef, productionOrigin, actorId, mode };
}

async function readIgnoredManifest(manifestArg) {
  const manifestPath = resolve(projectDir, manifestArg);
  const manifestRelativePath = relative(projectDir, manifestPath);
  if (
    manifestRelativePath.startsWith('..') ||
    isAbsolute(manifestRelativePath) ||
    !manifestRelativePath.replaceAll('\\', '/').startsWith('.tmp/')
  ) {
    throw new CutoverScriptError('manifest_must_be_under_tmp');
  }
  try {
    await execFileAsync('git', ['check-ignore', '--quiet', '--', manifestRelativePath], {
      cwd: projectDir,
      windowsHide: true,
    });
  } catch {
    throw new CutoverScriptError('manifest_must_be_ignored');
  }

  try {
    return {
      manifest: JSON.parse(await readFile(manifestPath, 'utf8')),
      manifestPath,
      manifestRelativePath: manifestRelativePath.replaceAll('\\', '/'),
    };
  } catch {
    throw new CutoverScriptError('invalid_manifest');
  }
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
  await runPreflight(args);
  const { manifest, manifestPath, manifestRelativePath } = await readIgnoredManifest(
    args.manifestPath
  );
  const jiti = createJiti(import.meta.url, {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  });
  const { prepareCompactionCutoverManifest } = jiti(
    '../src/lib/gameData/compactionCutoverManifest.ts'
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new CutoverScriptError('missing_supabase_credentials');
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const cutover = await executeCutover(client, args.actorId, prepared.value);
  const executedAt = new Date().toISOString();
  manifest.result = {
    ...manifest.result,
    remoteCutover: {
      executedAt,
      actorId: args.actorId,
      replayEpochBefore: prepared.value.replayEpoch,
      ...cutover,
    },
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
        manifest: manifestRelativePath,
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
