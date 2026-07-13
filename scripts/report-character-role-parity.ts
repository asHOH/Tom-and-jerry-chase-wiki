import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createJiti } from 'jiti';

import type { Character } from '../src/data/types';
import type { CharacterRoleParityReport } from '../src/features/character-roles/parity';

const REPORT_DIRECTORY = resolve(process.cwd(), 'docs/reports');
const REPORT_PATH = resolve(REPORT_DIRECTORY, 'character-role-parity.json');

type ParityModule = {
  createCharacterRoleParityReport: (characters: readonly Character[]) => CharacterRoleParityReport;
};

type CharacterDataModule = {
  catCharactersWithImages?: Readonly<Record<string, Character>>;
  mouseCharactersWithImages?: Readonly<Record<string, Character>>;
};

const jiti = createJiti(import.meta.url, {
  alias: { '@': resolve(process.cwd(), 'src') },
});

const parityModule = await jiti.import<ParityModule>(
  resolve(process.cwd(), 'src/features/character-roles/parity.ts')
);
const catModule = await jiti.import<CharacterDataModule>(
  resolve(process.cwd(), 'src/features/characters/data/catCharacters.ts')
);
const mouseModule = await jiti.import<CharacterDataModule>(
  resolve(process.cwd(), 'src/features/characters/data/mouseCharacters.ts')
);
if (!catModule.catCharactersWithImages || !mouseModule.mouseCharactersWithImages) {
  throw new Error('Could not load playable character data for the parity report');
}

const characters = [
  ...Object.values(catModule.catCharactersWithImages),
  ...Object.values(mouseModule.mouseCharactersWithImages),
];

const report = parityModule.createCharacterRoleParityReport(characters);
if (report.unexplainedDifferences.length > 0) {
  throw new Error(
    `Character-role parity has ${report.unexplainedDifferences.length} unexplained differences`
  );
}

await mkdir(REPORT_DIRECTORY, { recursive: true });
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  `Wrote character-role parity report for ${report.summary.playableCharacterCount} characters`
);
