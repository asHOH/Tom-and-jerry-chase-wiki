#!/usr/bin/env node

/**
 * Squash pending game_data_actions rows to reduce duplicate SET spam.
 *
 * Usage:
 *   node scripts/squash-pending-game-data-actions.mjs [--apply] [--entity-type characters] [--limit 20]
 *
 * Default: dry-run (no writes).
 */
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------
// Config & helpers
// ---------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const argv = new Set(process.argv.slice(2));
const isApply = argv.has('--apply');
const limitArg = [...argv].find((a) => a.startsWith('--limit='));
const entityTypeArg = [...argv].find((a) => a.startsWith('--entity-type='));
const groupLimit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
const filterEntityType = entityTypeArg ? entityTypeArg.split('=')[1] : undefined;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const isNoOp = (action) => {
  // Shallow equality is fine for our storage size; mirrors client logic.
  return JSON.stringify(action.oldValue) === JSON.stringify(action.newValue);
};

// Squash logic aligned with client (structural-safe)
function squashActions(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const structuralRoots = new Set();
  const recordStructuralRoots = (action) => {
    if (!action || typeof action.path !== 'string') return;
    if (action.op === 'add' || action.op === 'delete') {
      const root = action.path.split('.')[0] ?? '';
      if (root) structuralRoots.add(root);
    }
  };

  for (const entry of entries) {
    if (Array.isArray(entry)) entry.forEach(recordStructuralRoots);
    else recordStructuralRoots(entry);
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
    const root = path.split('.')[0] ?? '';
    if (action.op === 'set' && !structuralRoots.has(root)) {
      latestByPath.set(path, idx);
    }
  });

  const grouped = entries.map(() => []);
  flat.forEach(({ action, entryIndex, flatIndex: idx }) => {
    if (!action) return;
    const path = action.path || '';
    const root = path ? (path.split('.')[0] ?? '') : '';
    const isStructural = action.op === 'add' || action.op === 'delete' || structuralRoots.has(root);
    const isLatestForPath = !path || latestByPath.get(path) === idx;
    const keep =
      isStructural ||
      (action.op === 'set' && !structuralRoots.has(root) && isLatestForPath && !isNoOp(action));
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

function extractRoot(entry) {
  const pick = Array.isArray(entry) ? entry.find((a) => a?.path) : entry;
  const path = pick?.path;
  if (typeof path !== 'string') return 'unknown';
  return path.split('.')[0] || 'unknown';
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

  const groups = new Map(); // key => { rows: [] }

  for (const row of rows ?? []) {
    if (filterEntityType && row.entity_type !== filterEntityType) continue;
    const entries = toArray(row.entry);
    const root = extractRoot(entries[0]);
    const key = `${row.entity_type}::${root}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, entries });
  }

  const groupEntries = [...groups.entries()].slice(0, groupLimit ?? groups.size);
  console.log(
    `Found ${groups.size} groups, processing ${groupEntries.length}${
      isApply ? ' (apply mode)' : ' (dry-run)'
    }`
  );

  for (const [key, items] of groupEntries) {
    const [entityType, root] = key.split('::');
    // build history in created order
    const history = items.flatMap(({ entries }) => entries);
    const squashed = squashActions(history);
    const delta = history.length - squashed.length;

    console.log(
      `Group ${entityType}/${root}: rows=${items.length}, actions=${history.length} -> ${squashed.length} (saved ${delta})`
    );

    if (!isApply) continue;

    if (squashed.length === 0) {
      console.log('  Skipped insert (empty after squash)');
    } else {
      const first = items[0].row;
      const { data: inserted, error: insertError } = await supabase
        .from('game_data_actions')
        .insert([
          {
            entity_type: entityType,
            entry: squashed,
            status: 'pending',
            is_public: false,
            created_by: first.created_by ?? null,
            message: `${first.message ?? ''}`.trim()
              ? `${first.message} (auto-squashed)`
              : 'auto-squashed pending batch',
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        console.error('  Insert failed:', insertError);
        continue;
      }

      const ids = items.map((item) => item.row.id);
      const { error: updateError } = await supabase
        .from('game_data_actions')
        .update({
          status: 'rejected',
          rejection_reason: `Superseded by squash ${new Date().toISOString()}`,
          is_public: false,
        })
        .in('id', ids);

      if (updateError) {
        console.error('  Mark original rows failed:', updateError);
      } else {
        console.log(`  Inserted ${inserted?.id}, superseded ${ids.length} rows`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
