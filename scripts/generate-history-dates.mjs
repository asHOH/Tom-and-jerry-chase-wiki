// Keep release-date lookups and the on-this-day index independent of the full
// game timeline in browser bundles.
import { readFile, writeFile } from 'node:fs/promises';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { historyData } = await jiti.import('../src/data/history.ts');
const dates = new Map();
const onThisDay = [];
for (const { year, events } of historyData) {
  for (const { date, description, details } of events) {
    onThisDay.push({
      year,
      date,
      description,
      ...(details.milestone ? { milestone: details.milestone } : {}),
    });

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

const outputs = [
  {
    file: new URL('../src/data/generated/historyDates.json', import.meta.url),
    json: JSON.stringify(Object.fromEntries(dates), null, 2) + '\n',
    staleMessage: 'History dates are stale. Run npm run generate:history-dates.',
  },
  {
    file: new URL('../src/data/generated/historyOnThisDay.json', import.meta.url),
    json: JSON.stringify(onThisDay, null, 2) + '\n',
    staleMessage: 'On-this-day history index is stale. Run npm run generate:history-dates.',
  },
];

if (process.argv.includes('--check')) {
  for (const { file, json, staleMessage } of outputs) {
    if ((await readFile(file, 'utf8')) !== json) {
      throw new Error(staleMessage);
    }
  }
} else {
  for (const { file, json } of outputs) {
    await writeFile(file, json, 'utf8');
  }
}
