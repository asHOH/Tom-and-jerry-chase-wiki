import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  normalizeActorProfiles,
  serializeActorProfiles,
} from '../src/features/actor-profiles/normalization';
import {
  getActorProfileReferences,
  getPlayableCharacterRefs,
} from './actor-profile-validation-context';

const OUTPUT_PATH = resolve(process.cwd(), 'src/features/actor-profiles/data/actorProfiles.json');

const main = async () => {
  const inputArguments = process.argv.slice(2);
  if (inputArguments.length !== 1 || !inputArguments[0]) {
    throw new Error('Usage: npm run normalize:actor-profiles -- <raw-input-path>');
  }

  const inputPath = resolve(process.cwd(), inputArguments[0]);
  const rawInput = JSON.parse(await readFile(inputPath, 'utf8')) as unknown;
  const profiles = normalizeActorProfiles(rawInput, {
    playableCharacters: getPlayableCharacterRefs(),
    references: await getActorProfileReferences(),
  });
  const serializedProfiles = serializeActorProfiles(profiles);

  // The complete artifact is parsed, normalized, validated, and serialized before replacement.
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, serializedProfiles, 'utf8');
  console.log(`Wrote ${profiles.length} canonical actor profiles to ${OUTPUT_PATH}`);
};

await main();
