#!/usr/bin/env node
// Read-only preparation. See docs/operations/pending-game-data-recovery.md before using the output.
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

import { resolveIgnoredTmpPath } from './lib/game-data-compaction-evidence.mjs';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(projectDir);
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': fileURLToPath(new URL('../src', import.meta.url)),
    'server-only': fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url)),
  },
});

async function main() {
  const [requestPath, outputPath] = process.argv.slice(2);
  if (!requestPath || !outputPath || process.argv.length !== 4) {
    throw new Error(
      'Usage: node scripts/prepare-pending-game-data-recovery.mjs .tmp/request.json .tmp/recovery.json'
    );
  }
  const input = await resolveIgnoredTmpPath(projectDir, requestPath, 'request');
  const output = await resolveIgnoredTmpPath(projectDir, outputPath, 'output');
  const request = JSON.parse(await readFile(input.path, 'utf8'));
  const targetHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
  if (request.expectedSupabaseHost !== targetHost) throw new Error('Supabase target mismatch');
  if (!Array.isArray(request.rows) || request.rows.length === 0)
    throw new Error('No recovery rows');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { readApprovedReplaySnapshot } = jiti(
    '../src/lib/gameData/approvedReplaySnapshotReader.ts'
  );
  const { decodeStoredActionRow } = jiti('../src/lib/gameData/actionRowDecoder.ts');
  const { preparePendingActionRecovery } = jiti('../src/lib/gameData/pendingActionRecovery.ts');
  const { preparePublishActionItems } = jiti('../src/lib/gameData/publishPreparation.ts');
  const { validateActionFreshness } = jiti('../src/lib/gameData/actionFreshness.ts');
  const { validateApprovedCandidateReplay } = jiti(
    '../src/lib/gameData/approvedCandidateReplay.ts'
  );
  const { getCanonicalGameData } = jiti('../src/lib/gameData/published/canonicalSources.ts');
  const { selectPublishedGameData } = jiti(
    '../src/lib/gameData/published/selectPublishedDomain.ts'
  );
  const snapshot = await readApprovedReplaySnapshot(client);
  const recoveries = [];
  const seen = new Set();
  for (const { id, reviewedItems } of request.rows) {
    if (typeof id !== 'string' || seen.has(id)) throw new Error('Invalid or duplicate row ID');
    seen.add(id);
    const { data: source, error } = await client
      .from('game_data_actions')
      .select('id,entity_type,entry,created_at,created_by,message,status,is_public')
      .eq('id', id)
      .single();
    if (error || source.status !== 'pending' || source.is_public)
      throw new Error(`Not pending/private: ${id}`);
    const decoded = decodeStoredActionRow(source);
    if (!decoded.success) throw new Error(`Invalid action: ${id}`);
    const current = selectPublishedGameData(
      source.entity_type,
      getCanonicalGameData(source.entity_type),
      snapshot.actionSnapshot
    );
    const entries = preparePendingActionRecovery(decoded.value.actions, current, reviewedItems);
    const prepared = preparePublishActionItems(
      [{ entityType: source.entity_type, entries }],
      `旧版待审核改动恢复（原记录 ${id}）；保留原提交者，重新提交审核。`
    );
    const proposed = prepared.actions.flatMap((item) =>
      item.rows.map((row, index) => ({
        rowId: `recovery:${id}:${index}`,
        entityType: item.entityType,
        actions: row.actions,
      }))
    );
    validateActionFreshness(snapshot.actionSnapshot.rows, proposed);
    validateApprovedCandidateReplay([...snapshot.actionSnapshot.rows, ...proposed]);
    recoveries.push({ source, reviewedItems, operationId: randomUUID(), prepared });
  }
  await writeFile(
    output.path,
    `${JSON.stringify({ targetHost, replayEpoch: snapshot.replayEpoch, recoveries }, null, 2)}\n`,
    { flag: 'wx' }
  );
  console.log(JSON.stringify({ output: output.relativePath, preparedRows: recoveries.length }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Recovery preparation failed');
  process.exitCode = 1;
});
