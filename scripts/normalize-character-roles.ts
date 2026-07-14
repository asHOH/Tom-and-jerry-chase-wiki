import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  normalizeActorProfiles,
  serializeActorProfiles,
} from '../src/features/character-roles/normalization';
import { getActorProfileReferences, getPlayableCharacterRoles } from './character-role-context';

const OUTPUT_PATH = resolve(process.cwd(), 'src/features/character-roles/data/characterRoles.json');

const main = async () => {
  const inputArguments = process.argv.slice(2);
  if (inputArguments.length !== 1 || !inputArguments[0]) {
    throw new Error('Usage: npm run normalize:character-roles -- <raw-input-path>');
  }

  const inputPath = resolve(process.cwd(), inputArguments[0]);
  const rawInput = JSON.parse(await readFile(inputPath, 'utf8')) as unknown;
  const roles = normalizeActorProfiles(rawInput, {
    playableCharacters: getPlayableCharacterRoles(),
    references: await getActorProfileReferences(),
  });
  const serializedProfiles = serializeActorProfiles(roles);

  // The complete artifact is parsed, normalized, validated, and serialized before replacement.
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, serializedProfiles, 'utf8');
  console.log(`Wrote ${roles.length} canonical character roles to ${OUTPUT_PATH}`);
};

await main();
