#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

import { fetchGameDataActionRows } from './lib/game-data-action-query.mjs';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(projectDir);

const jiti = createJiti(import.meta.url, {
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
const { createActionInspectionReport, createBeijingDateRange } = jiti(
  '../src/lib/gameData/actionInspection.ts'
);
const { createActionPatchTargetRegistry } = jiti('../src/lib/gameData/actionPatchTargets.ts');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const SELECT_COLUMNS = 'id, entity_type, entry, created_at, status, is_public, message';
const ALL_STATUSES = ['pending', 'approved', 'rejected', 'synced', 'revoked'];
const MAX_IDS = 25;
const MAX_OUTPUT_BYTES = 50_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class InspectionScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'InspectionScriptError';
    this.code = code;
    this.details = details;
  }
}

function parseList(value) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function parseArgs(args) {
  let date;
  let from;
  let to;
  let actor;
  let ids;
  let includeValues = false;
  let includeHistory = false;

  for (const arg of args) {
    if (arg.startsWith('--date=')) date = arg.slice('--date='.length);
    else if (arg.startsWith('--from=')) from = arg.slice('--from='.length);
    else if (arg.startsWith('--to=')) to = arg.slice('--to='.length);
    else if (arg.startsWith('--actor=')) actor = arg.slice('--actor='.length);
    else if (arg.startsWith('--ids=')) ids = parseList(arg.slice('--ids='.length));
    else if (arg === '--values') includeValues = true;
    else if (arg === '--include-history') includeHistory = true;
    else throw new InspectionScriptError('invalid_argument');
  }

  const dateMode = date !== undefined || from !== undefined || to !== undefined;
  const idMode = ids !== undefined;
  if (dateMode === idMode) throw new InspectionScriptError('select_exactly_one_scope');
  if (date !== undefined && (from !== undefined || to !== undefined)) {
    throw new InspectionScriptError('date_range_conflict');
  }
  if ((from === undefined) !== (to === undefined)) {
    throw new InspectionScriptError('incomplete_date_range');
  }
  if (idMode && actor !== undefined) throw new InspectionScriptError('actor_requires_date_scope');
  if (!idMode && (includeValues || includeHistory)) {
    throw new InspectionScriptError('ids_required_for_details');
  }
  if (idMode) {
    if (ids.length === 0 || ids.length > MAX_IDS || ids.some((id) => !UUID_PATTERN.test(id))) {
      throw new InspectionScriptError('invalid_ids', { maximum: MAX_IDS });
    }
  }

  return {
    actor,
    ids,
    includeValues,
    includeHistory,
    dateRange:
      date !== undefined
        ? createBeijingDateRange(date, date)
        : from !== undefined && to !== undefined
          ? createBeijingDateRange(from, to)
          : undefined,
  };
}

function sanitizedError(error) {
  if (error instanceof InspectionScriptError) {
    return { code: error.code, ...error.details };
  }
  if (error && typeof error === 'object' && typeof error.code === 'string') {
    return { code: error.code };
  }
  if (error instanceof RangeError) return { code: 'invalid_date_range' };
  return { code: 'inspection_failed' };
}

function writeOutput(output) {
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > MAX_OUTPUT_BYTES) {
    throw new InspectionScriptError('output_too_large', {
      maximumBytes: MAX_OUTPUT_BYTES,
      hint: 'Use fewer IDs or omit --values',
    });
  }
  process.stdout.write(serialized);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new InspectionScriptError('missing_supabase_credentials');
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const rows = await fetchGameDataActionRows(supabase, {
    select: SELECT_COLUMNS,
    ...(args.ids === undefined
      ? {
          statuses: ['approved'],
          requirePublic: true,
          fromUtc: args.dateRange.fromUtc,
          toUtc: args.dateRange.toUtc,
        }
      : { statuses: ALL_STATUSES, ids: args.ids }),
    scope: args.ids === undefined ? 'date-range' : 'ids',
  });

  if (args.ids !== undefined) {
    const foundIds = new Set(rows.map(({ id }) => id));
    const missingIds = args.ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) throw new InspectionScriptError('actions_not_found', { missingIds });
  }

  const historyRows = args.includeHistory
    ? await fetchGameDataActionRows(supabase, {
        select: SELECT_COLUMNS,
        statuses: ALL_STATUSES,
        entityTypes: [...new Set(rows.map(({ entity_type }) => entity_type))],
        scope: 'history',
      })
    : undefined;
  const report = createActionInspectionReport({
    rows,
    targets: createActionPatchTargetRegistry(),
    ...(args.actor === undefined ? {} : { actor: args.actor }),
    includeValues: args.includeValues,
    ...(historyRows === undefined ? {} : { historyRows }),
  });

  writeOutput({
    scope:
      args.ids === undefined
        ? { kind: 'beijing-date-range', ...args.dateRange, actor: args.actor ?? null }
        : { kind: 'ids', ids: args.ids },
    report,
  });
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: sanitizedError(error) })}\n`);
  process.exitCode = 1;
});
