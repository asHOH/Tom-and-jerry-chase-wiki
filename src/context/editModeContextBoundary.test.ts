import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const sourceRoot = 'src';
const editModeContextPath = 'src/context/EditModeContext.tsx';
const temporaryStateContextPath = 'src/context/EditModeStateContext.tsx';

const forbiddenContextContents = [
  'useLocalAchievement',
  'useLocalBuff',
  'useLocalCard',
  'useLocalCharacter',
  'useLocalEntity',
  'useLocalFixture',
  'useLocalItem',
  'useLocalMap',
  'useLocalMode',
  'useLocalSpecialSkill',
  'usePageEditMode',
  'PUBLISHABLE_ENTITY_TYPES',
  'clearAllEditModeData',
  'entityRegistry',
  'getEntityRegistry',
  '@/hooks/useLocalEditEntity',
  '@/hooks/usePageEditMode',
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
    if (!/\.(ts|tsx)$/.test(fileName) || fileName === 'editModeContextBoundary.test.ts') {
      return [];
    }

    return [filePath];
  });
}

describe('edit mode context boundary', () => {
  it('keeps EditModeContext as the small edit-mode-only context module', () => {
    expect(existsSync(editModeContextPath)).toBe(true);
    expect(existsSync(temporaryStateContextPath)).toBe(false);

    const contextSource = readFileSync(editModeContextPath, 'utf8');
    const forbiddenContents = forbiddenContextContents.filter((content) =>
      contextSource.includes(content)
    );

    const temporaryImports = listSourceFiles(sourceRoot)
      .filter((filePath) => readFileSync(filePath, 'utf8').includes('EditModeStateContext'))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(forbiddenContents).toEqual([]);
    expect(temporaryImports).toEqual([]);
  });
});
