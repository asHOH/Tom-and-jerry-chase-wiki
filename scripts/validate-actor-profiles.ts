import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { EXCLUDED_CHARACTER_ROLE_NAMES } from '../src/features/actor-profiles/normalization';
import { assertValidActorProfiles } from '../src/features/actor-profiles/schema';
import {
  getActorProfileReferences,
  getPlayableCharacterRoles,
} from './actor-profile-validation-context';

const CANONICAL_PATH = resolve(
  process.cwd(),
  'src/features/character-roles/data/actorProfiles.json'
);
const RAW_PATH = 'src/data/roles.json';

const main = async () => {
  const canonicalInput = JSON.parse(await readFile(CANONICAL_PATH, 'utf8')) as unknown;
  const roles = assertValidActorProfiles(canonicalInput, {
    playableCharacters: getPlayableCharacterRoles(),
    references: await getActorProfileReferences(),
    excludedNames: EXCLUDED_CHARACTER_ROLE_NAMES,
  });

  const trackedRawPath = execFileSync('git', ['ls-files', '--', RAW_PATH], {
    encoding: 'utf8',
  }).trim();
  if (trackedRawPath.length > 0) throw new Error(`${RAW_PATH} must not be tracked`);

  execFileSync('git', ['check-ignore', '--quiet', '--', RAW_PATH]);
  console.log(`Validated ${roles.length} canonical character roles`);
};

await main();
