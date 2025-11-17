#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const validRuntimes = new Set(['edge', 'nodejs']);
const runtimeArg = process.argv[2];

if (!validRuntimes.has(runtimeArg)) {
  console.error('Usage: node scripts/set-api-runtime.mjs <edge|nodejs>');
  process.exit(1);
}

const fileTargets = [
  'src/app/api/health/route.ts',
  'src/app/api/options/route.ts',
  'src/app/api/entities/export/route.ts',
];

const runtimePattern = /export const runtime = '(edge|nodejs)'/;

const ensureRuntimeUpdated = async (filePath) => {
  const absolutePath = resolve(filePath);
  const original = await readFile(absolutePath, 'utf8');

  if (!runtimePattern.test(original)) {
    throw new Error(`Failed to find runtime export in ${filePath}`);
  }

  const updated = original.replace(
    /export const runtime = '(edge|nodejs)'/g,
    `export const runtime = '${runtimeArg}'`
  );

  if (updated === original) {
    console.warn(`No changes in ${filePath}; already set to '${runtimeArg}'.`);
    return;
  }

  await writeFile(absolutePath, updated, 'utf8');
  console.log(`Updated runtime to '${runtimeArg}' in ${filePath}`);
};

const main = async () => {
  for (const target of fileTargets) {
    try {
      await ensureRuntimeUpdated(target);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode) {
    console.error('One or more files could not be updated.');
  }
};

await main();
