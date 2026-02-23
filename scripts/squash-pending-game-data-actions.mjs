#!/usr/bin/env node

/**
 * Squash pending game_data_actions rows to reduce duplicate SET spam.
 *
 * Usage:
 *   node scripts/squash-pending-game-data-actions.mjs [--apply] [--entity-type=characters] [--limit=20]
 *
 * Default: dry-run (no writes).
 */
import process from 'node:process';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------
// Config & helpers
// ---------------------------------------------
const projectDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
nextEnv.loadEnvConfig(projectDir);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const rawArgs = process.argv.slice(2);
const isApply = rawArgs.includes('--apply');

function getArgValue(name) {
  const eqArg = rawArgs.find((a) => a.startsWith(`${name}=`));
  if (eqArg) return eqArg.split('=')[1];
  const idx = rawArgs.indexOf(name);
  if (idx !== -1 && idx + 1 < rawArgs.length && !rawArgs[idx + 1].startsWith('--')) {
    return rawArgs[idx + 1];
  }
  return undefined;
}

const groupLimit = getArgValue('--limit') ? Number(getArgValue('--limit')) : undefined;
const filterEntityType = getArgValue('--entity-type') || undefined;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;
  if (isArrayA) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

const isNoOp = (action) => {
  return deepEqual(action.oldValue, action.newValue);
};

// Squash logic based on src/lib/edit/diffUtils.ts squashActions().
// Refined: structural protection uses parent-path granularity instead of
// root-level, so a delete on e.g. "X.specialSkills.4" only protects the
// "X.specialSkills" subtree, not the entire "X" root.
function squashActions(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  // Collect parent paths of add/delete ops as structural zones.
  // Any set whose path falls within a structural zone is kept as-is.
  const structuralParents = new Set();
  const recordStructural = (action) => {
    if (!action || typeof action.path !== 'string') return;
    if (action.op === 'add' || action.op === 'delete') {
      const parts = action.path.split('.');
      const parent = parts.slice(0, -1).join('.');
      if (parent) structuralParents.add(parent);
    }
  };

  for (const entry of entries) {
    if (Array.isArray(entry)) entry.forEach(recordStructural);
    else recordStructural(entry);
  }

  function isInStructuralZone(path) {
    for (const parent of structuralParents) {
      if (path === parent || path.startsWith(parent + '.')) return true;
    }
    return false;
  }

  const flat = [];
  let flatIndex = 0;
  entries.forEach((entry, entryIndex) => {
    if (Array.isArray(entry)) {
      entry.forEach((action, actionIndex) => {
        flat.push({ action, entryIndex, actionIndex, flatIndex });
        flatIndex += 1;
      });
    } else {
      flat.push({ action: entry, entryIndex, actionIndex: 0, flatIndex });
      flatIndex += 1;
    }
  });

  const latestByPath = new Map();
  flat.forEach(({ action, flatIndex: idx }) => {
    const path = action?.path;
    if (!path) return;
    if (action.op === 'set' && !isInStructuralZone(path)) {
      latestByPath.set(path, idx);
    }
  });

  const grouped = entries.map(() => []);
  flat.forEach(({ action, entryIndex, flatIndex: idx }) => {
    if (!action) return;
    const path = action.path || '';
    const isStructural = action.op === 'add' || action.op === 'delete' || isInStructuralZone(path);
    const isLatestForPath = !path || latestByPath.get(path) === idx;
    const keep =
      isStructural ||
      (action.op === 'set' && !isInStructuralZone(path) && isLatestForPath && !isNoOp(action));
    if (keep) grouped[entryIndex].push(action);
  });

  const result = [];
  grouped.forEach((actions) => {
    if (actions.length === 1) result.push(actions[0]);
    else if (actions.length > 1) result.push(actions);
  });
  return result;
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function actionRoot(action) {
  if (!action || typeof action.path !== 'string') return 'unknown';
  return action.path.split('.')[0] || 'unknown';
}

function entryRoot(entry) {
  const pick = Array.isArray(entry) ? entry.find((a) => a?.path) : entry;
  return actionRoot(pick);
}

/**
 * Split a row's entries by root key so each group only contains entries
 * for a single root. Returns Map<root, entry[]>.
 */
function splitEntriesByRoot(entries) {
  const byRoot = new Map();
  for (const entry of entries) {
    const root = entryRoot(entry);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(entry);
  }
  return byRoot;
}

// ---------------------------------------------
// Main
// ---------------------------------------------
async function main() {
  const { data: rows, error } = await supabase
    .from('game_data_actions')
    .select('id, entity_type, entry, created_at, created_by, message, status, is_public')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch pending actions:', error);
    process.exit(1);
  }

  // Group by entity_type + author + root so each group is one user editing one root key.
  // A single DB row that touches multiple roots gets split across groups;
  // we track which row IDs contributed to each group so we can supersede them.
  const groups = new Map(); // key => { items: [], rowIds: Set }

  for (const row of rows ?? []) {
    if (filterEntityType && row.entity_type !== filterEntityType) continue;
    const allEntries = toArray(row.entry);
    const author = row.created_by ?? '__anon__';
    const byRoot = splitEntriesByRoot(allEntries);

    for (const [root, entries] of byRoot) {
      const key = `${row.entity_type}::${author}::${root}`;
      if (!groups.has(key)) groups.set(key, { items: [], rowIds: new Set() });
      const group = groups.get(key);
      group.items.push({ row, entries });
      group.rowIds.add(row.id);
    }
  }

  const groupEntries = [...groups.entries()].slice(0, groupLimit ?? groups.size);
  console.log(
    `Found ${groups.size} groups, processing ${groupEntries.length}${
      isApply ? ' (apply mode)' : ' (dry-run)'
    }`
  );

  // Track which row IDs have been superseded across groups (a single row
  // split across multiple root-groups should only be rejected once all its
  // groups have been processed).
  const supersededIds = new Set();

  for (const [key, { items, rowIds }] of groupEntries) {
    const parts = key.split('::');
    const entityType = parts[0];
    const author = parts[1];
    const root = parts.slice(2).join('::'); // root may theoretically contain '::'
    // build history in created order
    const history = items.flatMap(({ entries }) => entries);
    const squashed = squashActions(history);
    const delta = history.length - squashed.length;

    console.log(
      `Group ${entityType}/${root} by ${author}: rows=${items.length}, actions=${history.length} -> ${squashed.length} (saved ${delta})`
    );

    if (!isApply) continue;

    if (squashed.length === 0) {
      console.log('  Skipped insert (empty after squash)');
    } else {
      const first = items[0].row;
      const messages = [...new Set(items.map((i) => i.row.message?.trim()).filter(Boolean))];
      const combinedMessage =
        messages.length > 0
          ? `${messages.join('; ')} (auto-squashed)`
          : 'auto-squashed pending batch';
      const { data: inserted, error: insertError } = await supabase
        .from('game_data_actions')
        .insert([
          {
            entity_type: entityType,
            entry: squashed,
            status: 'pending',
            is_public: false,
            created_by: first.created_by ?? null,
            created_at: first.created_at,
            message: combinedMessage,
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        console.error('  Insert failed:', insertError);
        continue;
      }

      for (const id of rowIds) supersededIds.add(id);
      console.log(`  Inserted ${inserted?.id}, will supersede ${rowIds.size} rows`);
    }
  }

  if (isApply && supersededIds.size > 0) {
    const ids = [...supersededIds];
    // Only reject rows still pending — a reviewer may have approved/rejected
    // some between our initial fetch and now.
    const { data: updated, error: updateError } = await supabase
      .from('game_data_actions')
      .update({
        status: 'rejected',
        rejection_reason: `Superseded by squash ${new Date().toISOString()}`,
        is_public: false,
      })
      .eq('status', 'pending')
      .in('id', ids)
      .select('id');

    if (updateError) {
      console.error('Mark original rows failed:', updateError);
    } else {
      const updatedCount = updated?.length ?? 0;
      console.log(`Superseded ${updatedCount} of ${ids.length} original rows`);
      if (updatedCount < ids.length) {
        console.warn(
          `  ${ids.length - updatedCount} row(s) were already approved/rejected and left untouched`
        );
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
