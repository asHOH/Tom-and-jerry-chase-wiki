// Keep release-date lookups independent of the full game timeline in browser bundles.
import { readFile, writeFile } from 'node:fs/promises';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { historyData } = await jiti.import('../src/data/history.ts');
const dates = new Map();
for (const { year, events } of historyData) {
  for (const { date, details } of events) {
    const content = details.content;
    for (const name of [
      ...(content?.newCharacters ?? []),
      ...(content?.newItems ?? []),
      ...(content?.newKnowledgeCards ?? []),
      ...(content?.newSecondWeapons ?? []),
    ]) {
      if (!dates.has(name)) dates.set(name, `${year}.${date.split('-')[0]}`);
    }
  }
}
const output = new URL('../src/data/generated/historyDates.json', import.meta.url);
const json = JSON.stringify(Object.fromEntries(dates), null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')) !== json) {
    throw new Error('History dates are stale. Run npm run generate:history-dates.');
  }
} else {
  await writeFile(output, json, 'utf8');
}
