import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const featureRoots = [
  'src/features/achievements',
  'src/features/buffs',
  'src/features/characters',
  'src/features/entities',
  'src/features/fixtures',
  'src/features/items',
  'src/features/knowledge-cards',
  'src/features/maps',
  'src/features/modes',
  'src/features/shared',
  'src/features/special-skills',
  'src/features/tools',
];

const appFeatureConsumers = [
  'src/app/(main)/characters/[characterId]/CharacterDetailsClient.tsx',
  'src/app/(main)/characters/user/[characterId]/UserCharacterPageClient.tsx',
];

function listSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const filePath = join(root, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return listSourceFiles(filePath);
    }

    if (!stats.isFile()) {
      return [];
    }

    const fileName = filePath.split(/[\\/]/).at(-1) ?? '';
    if (!/\.(ts|tsx)$/.test(fileName) || /\.(test|spec)\.(ts|tsx)$/.test(fileName)) {
      return [];
    }

    return [filePath];
  });
}

describe('feature edit mode import boundaries', () => {
  it('keeps feature code off the EditModeContext compatibility facade', () => {
    const offenders = featureRoots
      .flatMap((root) => listSourceFiles(root))
      .concat(appFeatureConsumers)
      .filter((filePath) => readFileSync(filePath, 'utf8').includes('@/context/EditModeContext'))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
