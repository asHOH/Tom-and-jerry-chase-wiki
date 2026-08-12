import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_PROVIDER_FILES = [
  'src/app/layout.tsx',
  'src/components/ClientProviders.tsx',
  'src/context/EditModeContext.tsx',
] as const;

const CANONICAL_SOURCE_FILES = [
  'src/lib/gameData/published/canonicalSources.ts',
  'src/lib/dataManager.ts',
  'src/data/maps.ts',
  'src/data/traits.ts',
  'src/features/achievements/data/catAchievements.ts',
  'src/features/achievements/data/mouseAchievements.ts',
  'src/features/buffs/data/buffs.ts',
  'src/features/entities/data/entities.ts',
  'src/features/fixtures/data/fixtures.ts',
  'src/features/items/data/items.ts',
  'src/features/modes/data/modes.ts',
  'src/features/special-skills/data/catSpecialSkills.ts',
  'src/features/special-skills/data/mouseSpecialSkills.ts',
] as const;

const STATIC_ROOT_FORBIDDEN_IMPORTS = [
  '@/data/store',
  '@/lib/edit/editStores',
  '@/lib/edit/editModeRegistry',
  '@/components/EditRuntime',
] as const;

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionSourceFiles(path);
    if (!entry.isFile() || !/\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return [path];
  });
}

describe('game-data import and payload boundaries', () => {
  it('keeps mutable stores out of the public data barrel', () => {
    const source = readSource('src/data/index.ts');

    expect(source).not.toMatch(/(?:from\s+|import\()['"]\.\/store['"]/);
    expect(source).not.toContain('@/data/store');
  });

  it('keeps root providers free of static edit-runtime and raw approved-row dependencies', () => {
    const sources = ROOT_PROVIDER_FILES.map((path) => [path, readSource(path)] as const);

    for (const [path, source] of sources) {
      for (const forbiddenImport of STATIC_ROOT_FORBIDDEN_IMPORTS) {
        expect({ path, forbiddenImport, source }).not.toEqual(
          expect.objectContaining({
            source: expect.stringMatching(
              new RegExp(`from\\s+['"]${forbiddenImport.replaceAll('/', '\\/')}['"]`)
            ),
          })
        );
      }
      expect({ path, source }).not.toEqual(
        expect.objectContaining({
          source: expect.stringMatching(
            /\b(?:approvedRows|initialActions|actionRows|usePublicGameDataActions|getPublicGameDataActions)\b/
          ),
        })
      );
    }

    expect(readSource('src/context/EditModeContext.tsx')).toContain(
      "dynamic(() => import('@/components/EditRuntime')"
    );
  });

  it('keeps production modules off the legacy direct-store import path', () => {
    const offenders = productionSourceFiles('src').filter((path) =>
      /['"]@\/data\/store['"]/.test(readSource(path))
    );

    expect(offenders).toEqual([]);
  });

  it('keeps canonical source factories independent from edit and replay code', () => {
    const forbiddenDependency =
      /@\/(?:data\/store|lib\/edit(?:\/|['"])|lib\/gameData\/(?:actionReplay|checkedActionReplay|publicActions)(?:\/|['"]))|\bvaltio\b/;
    const offenders = CANONICAL_SOURCE_FILES.filter((path) =>
      forbiddenDependency.test(readSource(path))
    );

    expect(offenders).toEqual([]);
  });
});
