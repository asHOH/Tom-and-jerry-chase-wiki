import { readFileSync } from 'fs';
import { relative } from 'path';

const sharedEditConsumers = [
  'src/components/ui/EditModePageShell.tsx',
  'src/components/ui/editableStoreAdapters.ts',
  'src/components/ui/editableFields.tsx',
  'src/components/DynamicFaviconEditBadge.tsx',
];

const broadEditModeContextImportPattern =
  /import\s+\{[^}]*\b(?:useLocal[A-Z]\w*|usePageEditMode|PUBLISHABLE_ENTITY_TYPES|clearAllEditModeData|entityRegistry|getEntityRegistry)\b[^}]*\}\s+from ['"]@\/context\/EditModeContext['"]/;

describe('edit mode import boundaries', () => {
  it('keeps shared edit UI from importing page-local or registry APIs from EditModeContext', () => {
    const offenders = sharedEditConsumers
      .filter((filePath) => broadEditModeContextImportPattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
