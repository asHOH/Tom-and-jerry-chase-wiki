#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(projectDir);

const jiti = createJiti(import.meta.url, {
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
const { verifyActionPatch } = jiti('../src/lib/gameData/actionPatchVerification.ts');
const { createActionPatchTargetRegistry } = jiti('../src/lib/gameData/actionPatchTargets.ts');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_COLUMNS = 'id, entity_type, entry, created_at, status, is_public';

class VerificationScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'VerificationScriptError';
    this.code = code;
    this.details = details;
  }
}

function usage() {
  return [
    'Usage:',
    '  npm run verify:game-data-actions -- --ids=<uuid,...>',
    '',
    'Verifies that selected approved actions are represented in the current source.',
  ].join('\n');
}

function parseArgs(args) {
  let ids;
  let help = false;

  for (const arg of args) {
    if (arg.startsWith('--ids=')) ids = arg.slice('--ids='.length).split(',').filter(Boolean);
    else if (arg === '--help' || arg === '-h') help = true;
    else throw new VerificationScriptError('invalid_argument', { argument: arg });
  }

  if (help) return { help: true };
  if (!ids || ids.length === 0) throw new VerificationScriptError('ids_required');
  if (ids.length > 25) throw new VerificationScriptError('too_many_ids', { maximum: 25 });
  if (new Set(ids).size !== ids.length) throw new VerificationScriptError('duplicate_ids');
  if (ids.some((id) => !UUID_PATTERN.test(id))) {
    throw new VerificationScriptError('invalid_id');
  }
  return { help: false, ids };
}

function compareRows(left, right) {
  return left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id);
}

async function fetchRows(supabase, ids) {
  const { data, error } = await supabase
    .from('game_data_actions')
    .select(SELECT_COLUMNS)
    .in('id', ids);
  if (error) throw new VerificationScriptError('query_failed');
  const rows = data ?? [];
  const found = new Set(rows.map((row) => row.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) throw new VerificationScriptError('rows_missing', { ids: missing });
  return rows.sort(compareRows);
}

function sanitizedError(error) {
  return error instanceof VerificationScriptError
    ? { code: error.code, ...error.details }
    : { code: 'unexpected_error' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new VerificationScriptError('missing_supabase_credentials');
  }

  const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const rows = await fetchRows(supabase, args.ids);
  const verification = verifyActionPatch(rows, createActionPatchTargetRegistry());
  process.stdout.write(
    `${JSON.stringify({ target: new URL(SUPABASE_URL).host, verification }, null, 2)}\n`
  );
  if (verification.failures.length > 0) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: sanitizedError(error) })}\n`);
  process.exitCode = 1;
});
