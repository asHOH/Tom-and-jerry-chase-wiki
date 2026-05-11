import { readFileSync } from 'fs';
import { relative } from 'path';

const sharedEditConsumers = [
  'src/components/ui/EditModePageShell.tsx',
  'src/components/ui/editableStoreAdapters.ts',
  'src/components/ui/editableFields.tsx',
  'src/components/DynamicFaviconEditBadge.tsx',
];

describe('edit mode import boundaries', () => {
  it('keeps shared edit UI off the EditModeContext compatibility facade', () => {
    const offenders = sharedEditConsumers
      .filter((filePath) => readFileSync(filePath, 'utf8').includes('@/context/EditModeContext'))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
