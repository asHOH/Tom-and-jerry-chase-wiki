import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const featureRoots = [
  'src/features/achievements',
  'src/features/buffs',
  'src/features/character-relations',
  'src/features/characters',
  'src/features/entities',
  'src/features/fixtures',
  'src/features/items',
  'src/features/knowledge-cards',
  'src/features/maps',
  'src/features/mechanics',
  'src/features/modes',
  'src/features/shared',
  'src/features/special-skills',
  'src/features/tools',
];

const appFeatureConsumers = [
  'src/app/(main)/characters/[characterId]/CharacterDetailsClient.tsx',
  'src/app/(main)/characters/user/[characterId]/UserCharacterPageClient.tsx',
];

const productionRoots = ['src/app', 'src/components', 'src/context', 'src/features', 'src/hooks'];

const broadEditModeContextImportPattern =
  /import\s+\{[^}]*\b(?:useLocal[A-Z]\w*|usePageEditMode|PUBLISHABLE_ENTITY_TYPES|clearAllEditModeData|entityRegistry|getEntityRegistry)\b[^}]*\}\s+from ['"]@\/context\/EditModeContext['"]/;

const rawEditRuntimeImportPattern =
  /from ['"]@\/(?:lib\/edit\/(?:activeEditRuntime|editStores|editModeRegistry)|hooks\/useDraftDataRuntime)['"]/;

const rawEditInternalsPattern =
  /import\s+\{[^}]*(?:getActionsStorageKey|readActionHistory|writeActionHistory|replaceActionHistory|appendActionHistoryEntry|subscribers|withRecordingSuppressed)[^}]*\}\s+from ['"]@\/lib\/edit\/diffUtils['"]/s;

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
  it('keeps feature code from importing page-local or registry APIs from EditModeContext', () => {
    const offenders = featureRoots
      .flatMap((root) => listSourceFiles(root))
      .concat(appFeatureConsumers)
      .filter((filePath) => broadEditModeContextImportPattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });

  it('keeps production callers behind the edit-session boundary', () => {
    const consumers = productionRoots
      .flatMap((root) => listSourceFiles(root))
      .filter((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        return rawEditRuntimeImportPattern.test(source) || rawEditInternalsPattern.test(source);
      })
      .map((filePath) => relative(process.cwd(), filePath).replaceAll('\\', '/'))
      .sort();

    expect(consumers).toEqual([]);
  });
});
