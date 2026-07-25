#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
nextEnv.loadEnvConfig(projectDir);

const jiti = createJiti(import.meta.url, {
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
const {
  MAX_ACTION_AUDIT_DETAIL_LIMIT,
  createActionAuditDetailPage,
  createSanitizedActionAuditSummary,
  isActionAuditDetailSelector,
  runActionAudit,
} = jiti('../src/lib/gameData/actionAudit.ts');
const { createSanitizedPublishLimitMeasurement } = jiti(
  '../src/lib/gameData/publishLimitsMeasurement.ts'
);
const { ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES, createActionAuditTargetRegistry } = jiti(
  '../src/lib/gameData/actionAuditTargets.ts'
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUERY_PAGE_SIZE = 500;
const SELECT_COLUMNS = 'id, entity_type, entry, created_at, created_by, status, is_public, message';

class AuditScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'AuditScriptError';
    this.code = code;
    this.details = details;
  }
}

function parseArgs(args) {
  let selector;
  let limit;
  let cursor;
  let measurePublishLimits = false;

  for (const arg of args) {
    if (arg.startsWith('--details=')) {
      selector = arg.slice('--details='.length);
    } else if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
    } else if (arg.startsWith('--cursor=')) {
      cursor = arg.slice('--cursor='.length);
    } else if (arg === '--measure-publish-limits') {
      measurePublishLimits = true;
    } else {
      throw new AuditScriptError('invalid_argument');
    }
  }

  if (selector !== undefined && !isActionAuditDetailSelector(selector)) {
    throw new AuditScriptError('invalid_detail_selector');
  }
  if ((limit !== undefined || cursor !== undefined) && selector === undefined) {
    throw new AuditScriptError('details_required');
  }
  if (measurePublishLimits && selector !== undefined) {
    throw new AuditScriptError('measurement_details_conflict');
  }
  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1 || limit > MAX_ACTION_AUDIT_DETAIL_LIMIT)
  ) {
    throw new AuditScriptError('invalid_detail_limit');
  }
  if (cursor !== undefined && cursor.length === 0) {
    throw new AuditScriptError('invalid_cursor');
  }

  return { selector, limit, cursor, measurePublishLimits };
}

function quotePostgrestValue(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function keysetFilter(cursor) {
  const createdAt = quotePostgrestValue(cursor.created_at);
  const id = quotePostgrestValue(cursor.id);
  return `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`;
}

async function fetchCohort(supabase, statuses, requirePublic = null) {
  const rows = [];
  let cursor;

  while (true) {
    let query = supabase.from('game_data_actions').select(SELECT_COLUMNS);

    query = statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', statuses);

    if (requirePublic !== null) query = query.eq('is_public', requirePublic);
    if (cursor !== undefined) query = query.or(keysetFilter(cursor));

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(QUERY_PAGE_SIZE);

    if (error) throw new AuditScriptError('query_failed', { cohort: statuses.join(',') });
    const page = data ?? [];
    rows.push(...page);
    if (page.length < QUERY_PAGE_SIZE) break;

    const last = page.at(-1);
    if (!last?.created_at || !last.id) {
      throw new AuditScriptError('invalid_query_page', { cohort: statuses.join(',') });
    }
    cursor = { created_at: last.created_at, id: last.id };
  }

  return rows;
}

function updateFingerprint(hash, cohort, rows) {
  hash.update(cohort);
  hash.update('\u0000');
  for (const row of rows) {
    hash.update(
      JSON.stringify([
        row.id,
        row.entity_type,
        row.entry,
        row.created_at,
        row.created_by,
        row.status,
        row.is_public,
        row.message,
      ])
    );
    hash.update('\u0000');
  }
}

function createRunFingerprint(cohorts) {
  const hash = createHash('sha256');
  updateFingerprint(hash, 'approved', cohorts.approvedRows);
  updateFingerprint(hash, 'synced', cohorts.syncedRows);
  updateFingerprint(hash, 'pending', cohorts.pendingRows);
  return `audit-${hash.digest('hex')}`;
}

function sanitizedError(error) {
  if (error instanceof AuditScriptError) {
    return { code: error.code, ...error.details };
  }
  if (error && typeof error === 'object') {
    const detail = error.detail;
    if (detail && typeof detail === 'object' && typeof detail.code === 'string') {
      return {
        code: detail.code,
        ...(typeof detail.rowId === 'string' ? { rowId: detail.rowId } : {}),
        ...(typeof detail.stage === 'string' ? { stage: detail.stage } : {}),
        ...(typeof detail.entityType === 'string' ? { entityType: detail.entityType } : {}),
        ...(Number.isInteger(detail.targetIndex) ? { targetIndex: detail.targetIndex } : {}),
      };
    }
    if (typeof error.code === 'string') return { code: error.code };
  }
  return { code: 'audit_failed' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!SUPABASE_URL || !SERVICE_KEY) throw new AuditScriptError('missing_supabase_credentials');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [approvedRows, syncedRows, pendingRows] = await Promise.all([
    fetchCohort(supabase, ['approved', 'pending'], true),
    fetchCohort(supabase, ['synced'], false),
    fetchCohort(supabase, ['pending'], false),
  ]);
  const cohorts = { approvedRows, syncedRows, pendingRows };
  const runFingerprint = createRunFingerprint(cohorts);
  if (args.measurePublishLimits) {
    const measurement = createSanitizedPublishLimitMeasurement(
      [...approvedRows, ...syncedRows, ...pendingRows],
      runFingerprint
    );
    process.stdout.write(`${JSON.stringify(measurement, null, 2)}\n`);
    return;
  }
  const targets = createActionAuditTargetRegistry();
  const report = runActionAudit({
    ...cohorts,
    runFingerprint,
    targets,
    knownNoopEntityTypes: ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES,
  });

  const output =
    args.selector === undefined
      ? createSanitizedActionAuditSummary(report)
      : createActionAuditDetailPage(report, {
          selector: args.selector,
          ...(args.limit === undefined ? {} : { limit: args.limit }),
          ...(args.cursor === undefined ? {} : { cursor: args.cursor }),
        });

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: sanitizedError(error) })}\n`);
  process.exitCode = 1;
});
