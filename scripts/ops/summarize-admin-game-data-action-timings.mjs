import { readFile } from 'node:fs/promises';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error(
    'Usage: node scripts/ops/summarize-admin-game-data-action-timings.mjs <vercel-logs.jsonl>'
  );
  process.exitCode = 1;
} else {
  const input = decodeInput(await readFile(inputPath));
  const groups = new Map();
  let malformedLines = 0;

  for (const line of input.split(/\r?\n/u)) {
    if (line.trim() === '') continue;

    const event = parseTimingEvent(line);
    if (event === null) {
      malformedLines += 1;
      continue;
    }
    if (!event.queryShape.startsWith('admin-game-data-actions:')) continue;

    const group = groups.get(event.queryShape) ?? { durations: [], failures: 0, rows: 0 };
    if (event.success) {
      group.durations.push(event.durationMs);
      group.rows += event.rowCount;
    } else {
      group.failures += 1;
    }
    groups.set(event.queryShape, group);
  }

  console.log('| Query shape | Successful samples | Failures | Rows | p95 (ms) |');
  console.log('| --- | ---: | ---: | ---: | ---: |');

  for (const [shape, group] of [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    const p95 = percentileNearestRank(group.durations, 0.95);
    console.log(
      `| ${shape} | ${group.durations.length} | ${group.failures} | ${group.rows} | ${p95?.toFixed(2) ?? 'n/a'} |`
    );
  }

  if (groups.size === 0) {
    console.error('No admin-game-data-actions timing events were found.');
    process.exitCode = 1;
  }
  if (malformedLines > 0) {
    console.error(`Ignored ${malformedLines} line(s) that were not parseable JSON timing events.`);
  }
}

function parseTimingEvent(line) {
  try {
    const outer = JSON.parse(line);
    const candidate =
      typeof outer?.message === 'string'
        ? JSON.parse(outer.message)
        : outer?.message !== null && typeof outer?.message === 'object'
          ? outer.message
          : typeof outer?.event_message === 'string'
            ? JSON.parse(outer.event_message)
            : outer?.event_message !== null && typeof outer?.event_message === 'object'
              ? outer.event_message
              : outer;

    if (
      typeof candidate?.queryShape !== 'string' ||
      typeof candidate.durationMs !== 'number' ||
      !Number.isFinite(candidate.durationMs) ||
      typeof candidate.rowCount !== 'number' ||
      !Number.isFinite(candidate.rowCount) ||
      typeof candidate.success !== 'boolean'
    ) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

function decodeInput(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le');
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }

  const probeLength = Math.min(buffer.length, 100);
  let oddNullBytes = 0;
  for (let index = 1; index < probeLength; index += 2) {
    if (buffer[index] === 0) oddNullBytes += 1;
  }
  if (oddNullBytes > probeLength / 8) return buffer.toString('utf16le');
  return buffer.toString('utf8');
}

function percentileNearestRank(values, percentile) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(percentile * sorted.length) - 1);
  return sorted[index];
}
